//! Parallel base-seed search for observed Gogma skill rolls.

use gogma_rng_core::{
    RngJump, RngState, SKILL_COUNTER_GATE_THRESHOLD, SKILL_ROLL_STRIDE, SKILL_TABLE_SIZE,
    effective_skill_seed,
};
use std::error::Error;
use std::fmt;
use std::sync::Mutex;
use std::sync::atomic::{AtomicU64, Ordering};

const SEARCH_CHUNK_SIZE: u64 = 16_384;

/// Fixed weapon and stream metadata shared by every candidate seed.
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct SkillSearchCriteria {
    pub weapon_type: u32,
    pub attribute_force: u32,
    pub skill_counter: u32,
    pub counter_gate: u32,
    pub observations: Vec<u16>,
}

/// Inclusive base-seed interval.
#[derive(Clone, Copy, Debug, Eq, PartialEq)]
pub struct SeedRange {
    pub start: u32,
    pub end: u32,
}

impl SeedRange {
    #[must_use]
    pub fn len(self) -> u64 {
        u64::from(self.end)
            .checked_sub(u64::from(self.start))
            .map_or(0, |difference| difference + 1)
    }

    #[must_use]
    pub fn is_empty(self) -> bool {
        self.start > self.end
    }
}

/// Validated search criteria with a precomputed jump to the current counter.
#[derive(Clone, Debug)]
pub struct CompiledSkillSearch {
    criteria: SkillSearchCriteria,
    position_jump: RngJump,
}

impl CompiledSkillSearch {
    /// Validates observations and precomputes the saved-counter transition.
    ///
    /// # Errors
    ///
    /// Returns [`SearchError::EmptyObservations`] when no result was supplied,
    /// or [`SearchError::InvalidObservation`] when a table index is outside
    /// `0..=293`.
    pub fn new(criteria: SkillSearchCriteria) -> Result<Self, SearchError> {
        if criteria.observations.is_empty() {
            return Err(SearchError::EmptyObservations);
        }
        for (index, &value) in criteria.observations.iter().enumerate() {
            if u32::from(value) >= SKILL_TABLE_SIZE {
                return Err(SearchError::InvalidObservation { index, value });
            }
        }

        let counter_steps = if criteria.counter_gate < SKILL_COUNTER_GATE_THRESHOLD {
            0
        } else {
            u64::from(criteria.skill_counter) * SKILL_ROLL_STRIDE
        };
        let position_jump = RngJump::new(counter_steps + 1);

        Ok(Self {
            criteria,
            position_jump,
        })
    }

    #[must_use]
    pub fn criteria(&self) -> &SkillSearchCriteria {
        &self.criteria
    }

    /// Checks one base seed against every observation.
    #[must_use]
    pub fn matches_base_seed(&self, base_seed: u32) -> bool {
        let seed = effective_skill_seed(
            base_seed,
            self.criteria.weapon_type,
            self.criteria.attribute_force,
        );
        let initialized = RngState::initialize(seed);
        let mut state = self.position_jump.apply(initialized);

        if state.w % SKILL_TABLE_SIZE != u32::from(self.criteria.observations[0]) {
            return false;
        }

        for &observation in &self.criteria.observations[1..] {
            state.advance(SKILL_ROLL_STRIDE);
            if state.w % SKILL_TABLE_SIZE != u32::from(observation) {
                return false;
            }
        }

        true
    }

    /// Searches an inclusive seed interval using independent worker threads.
    ///
    /// Returned candidates are sorted in ascending order.
    ///
    /// # Errors
    ///
    /// Returns [`SearchError::InvalidRange`] for a descending interval or
    /// [`SearchError::ZeroThreads`] when `thread_count` is zero.
    pub fn search(&self, range: SeedRange, thread_count: usize) -> Result<Vec<u32>, SearchError> {
        if range.is_empty() {
            return Err(SearchError::InvalidRange(range));
        }
        if thread_count == 0 {
            return Err(SearchError::ZeroThreads);
        }

        let worker_count = thread_count.min(usize::try_from(range.len()).unwrap_or(thread_count));
        let next_chunk = AtomicU64::new(u64::from(range.start));
        let candidates = Mutex::new(Vec::new());
        let end = u64::from(range.end);

        std::thread::scope(|scope| {
            for _ in 0..worker_count {
                let next_chunk = &next_chunk;
                let candidates = &candidates;
                scope.spawn(move || {
                    loop {
                        let chunk_start =
                            next_chunk.fetch_add(SEARCH_CHUNK_SIZE, Ordering::Relaxed);
                        if chunk_start > end {
                            break;
                        }
                        let chunk_end = chunk_start.saturating_add(SEARCH_CHUNK_SIZE - 1).min(end);

                        for raw_seed in chunk_start..=chunk_end {
                            let seed = u32::try_from(raw_seed).unwrap_or(range.end);
                            if self.matches_base_seed(seed) {
                                candidates
                                    .lock()
                                    .unwrap_or_else(std::sync::PoisonError::into_inner)
                                    .push(seed);
                            }
                        }
                    }
                });
            }
        });

        let mut candidates = candidates
            .into_inner()
            .unwrap_or_else(std::sync::PoisonError::into_inner);
        candidates.sort_unstable();
        Ok(candidates)
    }
}

/// Number of hardware threads available to this process, falling back to one.
#[must_use]
pub fn default_thread_count() -> usize {
    std::thread::available_parallelism().map_or(1, std::num::NonZeroUsize::get)
}

#[derive(Clone, Debug, Eq, PartialEq)]
pub enum SearchError {
    EmptyObservations,
    InvalidObservation { index: usize, value: u16 },
    InvalidRange(SeedRange),
    ZeroThreads,
}

impl fmt::Display for SearchError {
    fn fmt(&self, formatter: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            Self::EmptyObservations => formatter.write_str("at least one observation is required"),
            Self::InvalidObservation { index, value } => write!(
                formatter,
                "observation {index} has table index {value}; expected 0..=293"
            ),
            Self::InvalidRange(range) => write!(
                formatter,
                "seed range starts at {} but ends at {}",
                range.start, range.end
            ),
            Self::ZeroThreads => formatter.write_str("thread count must be at least one"),
        }
    }
}

impl Error for SearchError {}
