//! Parallel base-seed searches for observed Gogma skill and amendment rolls.

use gogma_rng_core::{
    GOGMA_BONUS_COUNT, GOGMA_COUNTER_GATE_THRESHOLD, GOGMA_ROLL_STRIDE, GogmaBonus,
    GogmaRollConstraint, RngJump, RngState, SKILL_COUNTER_GATE_THRESHOLD, SKILL_ROLL_STRIDE,
    SKILL_TABLE_SIZE, effective_gogma_seed, effective_skill_seed,
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

/// Inclusive range of possible saved skill-stream counters.
#[derive(Clone, Copy, Debug, Eq, PartialEq)]
pub struct SkillCounterRange {
    pub start: u32,
    pub end: u32,
}

impl SkillCounterRange {
    #[must_use]
    pub fn is_empty(self) -> bool {
        self.start > self.end
    }
}

/// Known base seed plus observed series/group results used to locate the
/// independent skill-stream counter.
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct SkillCounterSearchCriteria {
    pub base_seed: u32,
    pub weapon_type: u32,
    pub attribute_force: u32,
    pub counter_gate: u32,
    pub counter_range: SkillCounterRange,
    pub observations: Vec<u16>,
}

/// Validated skill-counter search with a jump to the range start.
#[derive(Clone, Debug)]
pub struct CompiledSkillCounterSearch {
    criteria: SkillCounterSearchCriteria,
    range_start_jump: RngJump,
}

/// Fixed weapon and stream metadata for observed Reset Bonuses amendments.
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct GogmaSearchCriteria {
    pub weapon_type: u32,
    pub attribute_force: u32,
    pub gogma_counter: u32,
    pub counter_gate: u32,
    pub observations: Vec<[u8; GOGMA_BONUS_COUNT]>,
}

/// Inclusive range of possible saved Gogma amendment counters.
#[derive(Clone, Copy, Debug, Eq, PartialEq)]
pub struct GogmaCounterRange {
    pub start: u32,
    pub end: u32,
}

impl GogmaCounterRange {
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

/// Fixed metadata for a search in which the Gogma counter is not known.
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct GogmaCounterSearchCriteria {
    pub weapon_type: u32,
    pub attribute_force: u32,
    pub counter_gate: u32,
    pub counter_range: GogmaCounterRange,
    pub observations: Vec<[u8; GOGMA_BONUS_COUNT]>,
}

/// One matching base seed and Gogma counter pair.
#[derive(Clone, Copy, Debug, Eq, Ord, PartialEq, PartialOrd)]
pub struct GogmaSeedCounterCandidate {
    pub base_seed: u32,
    pub gogma_counter: u32,
}

/// Validated Reset Bonuses search with a precomputed counter jump.
#[derive(Clone, Debug)]
pub struct CompiledGogmaSearch {
    criteria: GogmaSearchCriteria,
    observations: Vec<GogmaRollConstraint>,
    position_jump: RngJump,
}

/// Validated unknown-counter search with a jump to the range start.
#[derive(Clone, Debug)]
pub struct CompiledGogmaCounterSearch {
    criteria: GogmaCounterSearchCriteria,
    observations: Vec<GogmaRollConstraint>,
    range_start_jump: RngJump,
}

impl CompiledGogmaSearch {
    /// Validates bonus IDs and precomputes the saved-counter transition.
    ///
    /// # Errors
    ///
    /// Returns [`SearchError::EmptyObservations`] when no amendment was
    /// supplied, or [`SearchError::InvalidGogmaObservation`] for an unsupported
    /// game bonus ID.
    pub fn new(criteria: GogmaSearchCriteria) -> Result<Self, SearchError> {
        let observations =
            validate_gogma_observations(criteria.weapon_type, &criteria.observations)?;

        let counter_steps = if criteria.counter_gate < GOGMA_COUNTER_GATE_THRESHOLD {
            0
        } else {
            u64::from(criteria.gogma_counter) * GOGMA_ROLL_STRIDE
        };

        Ok(Self {
            criteria,
            observations,
            position_jump: RngJump::new(counter_steps),
        })
    }

    #[must_use]
    pub fn criteria(&self) -> &GogmaSearchCriteria {
        &self.criteria
    }

    /// Checks one base seed against every observed five-slot amendment.
    #[must_use]
    pub fn matches_base_seed(&self, base_seed: u32) -> bool {
        let seed = effective_gogma_seed(
            base_seed,
            self.criteria.weapon_type,
            self.criteria.attribute_force,
        );
        let initialized = RngState::initialize(seed);
        let state = self.position_jump.apply(initialized);

        gogma_observations_match(state, &self.observations)
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
        search_parallel(range, thread_count, |seed| self.matches_base_seed(seed))
    }
}

impl CompiledGogmaCounterSearch {
    /// Validates observations and precomputes a jump to the first possible
    /// counter.
    ///
    /// # Errors
    ///
    /// Returns an error for an empty/descending counter range, invalid bonus
    /// IDs, or a gate value for which the game ignores the Gogma counter.
    pub fn new(criteria: GogmaCounterSearchCriteria) -> Result<Self, SearchError> {
        if criteria.counter_range.is_empty() {
            return Err(SearchError::InvalidGogmaCounterRange(
                criteria.counter_range,
            ));
        }
        if criteria.counter_gate < GOGMA_COUNTER_GATE_THRESHOLD {
            return Err(SearchError::GogmaCounterIgnoredByGate {
                counter_gate: criteria.counter_gate,
            });
        }

        let observations =
            validate_gogma_observations(criteria.weapon_type, &criteria.observations)?;
        let range_start_steps = u64::from(criteria.counter_range.start) * GOGMA_ROLL_STRIDE;

        Ok(Self {
            criteria,
            observations,
            range_start_jump: RngJump::new(range_start_steps),
        })
    }

    #[must_use]
    pub fn criteria(&self) -> &GogmaCounterSearchCriteria {
        &self.criteria
    }

    /// Returns every matching counter in the configured range for one seed.
    #[must_use]
    pub fn matching_counters_for_base_seed(&self, base_seed: u32) -> Vec<u32> {
        let mut counters = Vec::new();
        self.visit_matching_counters(base_seed, |counter| counters.push(counter));
        counters
    }

    /// Searches an inclusive seed range for matching seed/counter pairs.
    ///
    /// The 100-round initializer and jump to the range start run once per seed.
    /// Adjacent counter candidates are then reached with ten direct RNG steps.
    /// Returned candidates are sorted by seed and then counter.
    ///
    /// # Errors
    ///
    /// Returns [`SearchError::InvalidRange`] for a descending seed interval or
    /// [`SearchError::ZeroThreads`] when `thread_count` is zero.
    pub fn search(
        &self,
        seed_range: SeedRange,
        thread_count: usize,
    ) -> Result<Vec<GogmaSeedCounterCandidate>, SearchError> {
        if seed_range.is_empty() {
            return Err(SearchError::InvalidRange(seed_range));
        }
        if thread_count == 0 {
            return Err(SearchError::ZeroThreads);
        }

        let worker_count =
            thread_count.min(usize::try_from(seed_range.len()).unwrap_or(thread_count));
        let next_chunk = AtomicU64::new(u64::from(seed_range.start));
        let candidates = Mutex::new(Vec::new());
        let end = u64::from(seed_range.end);

        std::thread::scope(|scope| {
            for _ in 0..worker_count {
                let next_chunk = &next_chunk;
                let candidates = &candidates;
                scope.spawn(move || {
                    let mut local_candidates = Vec::new();
                    loop {
                        let chunk_start =
                            next_chunk.fetch_add(SEARCH_CHUNK_SIZE, Ordering::Relaxed);
                        if chunk_start > end {
                            break;
                        }
                        let chunk_end = chunk_start.saturating_add(SEARCH_CHUNK_SIZE - 1).min(end);

                        for raw_seed in chunk_start..=chunk_end {
                            let base_seed = u32::try_from(raw_seed).unwrap_or(seed_range.end);
                            self.visit_matching_counters(base_seed, |gogma_counter| {
                                local_candidates.push(GogmaSeedCounterCandidate {
                                    base_seed,
                                    gogma_counter,
                                });
                            });
                        }
                    }

                    if !local_candidates.is_empty() {
                        candidates
                            .lock()
                            .unwrap_or_else(std::sync::PoisonError::into_inner)
                            .extend(local_candidates);
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

    /// Searches a seed range on the current thread.
    ///
    /// This is intended for small chunks scheduled by a Web Worker. Native
    /// full-range callers should normally use [`Self::search`].
    ///
    /// # Errors
    ///
    /// Returns [`SearchError::InvalidRange`] for a descending seed interval.
    pub fn search_sequential(
        &self,
        seed_range: SeedRange,
    ) -> Result<Vec<GogmaSeedCounterCandidate>, SearchError> {
        if seed_range.is_empty() {
            return Err(SearchError::InvalidRange(seed_range));
        }

        let mut candidates = Vec::new();
        for base_seed in seed_range.start..=seed_range.end {
            self.visit_matching_counters(base_seed, |gogma_counter| {
                candidates.push(GogmaSeedCounterCandidate {
                    base_seed,
                    gogma_counter,
                });
            });
        }
        Ok(candidates)
    }

    fn visit_matching_counters(&self, base_seed: u32, mut visit: impl FnMut(u32)) {
        let seed = effective_gogma_seed(
            base_seed,
            self.criteria.weapon_type,
            self.criteria.attribute_force,
        );
        let initialized = RngState::initialize(seed);
        let mut state = self.range_start_jump.apply(initialized);

        for counter in self.criteria.counter_range.start..=self.criteria.counter_range.end {
            if gogma_observations_match(state, &self.observations) {
                visit(counter);
            }
            if counter != self.criteria.counter_range.end {
                state.advance(GOGMA_ROLL_STRIDE);
            }
        }
    }
}

fn validate_gogma_observations(
    weapon_type: u32,
    observations: &[[u8; GOGMA_BONUS_COUNT]],
) -> Result<Vec<GogmaRollConstraint>, SearchError> {
    if observations.is_empty() {
        return Err(SearchError::EmptyObservations);
    }

    observations
        .iter()
        .enumerate()
        .map(|(roll_index, roll)| {
            let mut parsed = [GogmaBonus::AttackBoostIi; GOGMA_BONUS_COUNT];
            for (slot_index, &value) in roll.iter().enumerate() {
                parsed[slot_index] =
                    GogmaBonus::from_id(value).ok_or(SearchError::InvalidGogmaObservation {
                        roll_index,
                        slot_index,
                        value,
                    })?;
            }
            GogmaRollConstraint::new(weapon_type, &parsed)
                .ok_or(SearchError::ImpossibleGogmaObservation { roll_index })
        })
        .collect()
}

fn gogma_observations_match(mut state: RngState, observations: &[GogmaRollConstraint]) -> bool {
    for (index, observation) in observations.iter().enumerate() {
        if !observation.matches_state(state) {
            return false;
        }
        if index + 1 < observations.len() {
            state.advance(GOGMA_ROLL_STRIDE);
        }
    }

    true
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
        search_parallel(range, thread_count, |seed| self.matches_base_seed(seed))
    }
}

impl CompiledSkillCounterSearch {
    /// Validates observations and precomputes a jump to the first possible
    /// skill counter.
    ///
    /// # Errors
    ///
    /// Returns an error for an empty range, invalid table index, or a gate
    /// value for which the game ignores the saved skill counter.
    pub fn new(criteria: SkillCounterSearchCriteria) -> Result<Self, SearchError> {
        if criteria.counter_range.is_empty() {
            return Err(SearchError::InvalidSkillCounterRange(
                criteria.counter_range,
            ));
        }
        if criteria.counter_gate < SKILL_COUNTER_GATE_THRESHOLD {
            return Err(SearchError::SkillCounterIgnoredByGate {
                counter_gate: criteria.counter_gate,
            });
        }
        validate_skill_observations(&criteria.observations)?;

        let range_start_steps = u64::from(criteria.counter_range.start) * SKILL_ROLL_STRIDE + 1;
        Ok(Self {
            criteria,
            range_start_jump: RngJump::new(range_start_steps),
        })
    }

    #[must_use]
    pub fn criteria(&self) -> &SkillCounterSearchCriteria {
        &self.criteria
    }

    /// Returns every matching saved skill counter in the configured range.
    #[must_use]
    pub fn matching_counters(&self) -> Vec<u32> {
        let seed = effective_skill_seed(
            self.criteria.base_seed,
            self.criteria.weapon_type,
            self.criteria.attribute_force,
        );
        let initialized = RngState::initialize(seed);
        let mut state = self.range_start_jump.apply(initialized);
        let mut counters = Vec::new();

        for counter in self.criteria.counter_range.start..=self.criteria.counter_range.end {
            if skill_observations_match(state, &self.criteria.observations) {
                counters.push(counter);
            }
            if counter != self.criteria.counter_range.end {
                state.advance(SKILL_ROLL_STRIDE);
            }
        }

        counters
    }
}

fn validate_skill_observations(observations: &[u16]) -> Result<(), SearchError> {
    if observations.is_empty() {
        return Err(SearchError::EmptyObservations);
    }
    for (index, &value) in observations.iter().enumerate() {
        if u32::from(value) >= SKILL_TABLE_SIZE {
            return Err(SearchError::InvalidObservation { index, value });
        }
    }
    Ok(())
}

fn skill_observations_match(mut state: RngState, observations: &[u16]) -> bool {
    for (index, &observation) in observations.iter().enumerate() {
        if state.w % SKILL_TABLE_SIZE != u32::from(observation) {
            return false;
        }
        if index + 1 < observations.len() {
            state.advance(SKILL_ROLL_STRIDE);
        }
    }
    true
}

fn search_parallel(
    range: SeedRange,
    thread_count: usize,
    matches: impl Fn(u32) -> bool + Sync,
) -> Result<Vec<u32>, SearchError> {
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
            let matches = &matches;
            scope.spawn(move || {
                loop {
                    let chunk_start = next_chunk.fetch_add(SEARCH_CHUNK_SIZE, Ordering::Relaxed);
                    if chunk_start > end {
                        break;
                    }
                    let chunk_end = chunk_start.saturating_add(SEARCH_CHUNK_SIZE - 1).min(end);

                    for raw_seed in chunk_start..=chunk_end {
                        let seed = u32::try_from(raw_seed).unwrap_or(range.end);
                        if matches(seed) {
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

/// Number of hardware threads available to this process, falling back to one.
#[must_use]
pub fn default_thread_count() -> usize {
    std::thread::available_parallelism().map_or(1, std::num::NonZeroUsize::get)
}

#[derive(Clone, Debug, Eq, PartialEq)]
pub enum SearchError {
    EmptyObservations,
    InvalidObservation {
        index: usize,
        value: u16,
    },
    InvalidGogmaObservation {
        roll_index: usize,
        slot_index: usize,
        value: u8,
    },
    ImpossibleGogmaObservation {
        roll_index: usize,
    },
    InvalidGogmaCounterRange(GogmaCounterRange),
    InvalidSkillCounterRange(SkillCounterRange),
    GogmaCounterIgnoredByGate {
        counter_gate: u32,
    },
    SkillCounterIgnoredByGate {
        counter_gate: u32,
    },
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
            Self::InvalidGogmaObservation {
                roll_index,
                slot_index,
                value,
            } => write!(
                formatter,
                "Gogma observation at roll {}, slot {} has unsupported bonus ID {value}",
                roll_index + 1,
                slot_index + 1
            ),
            Self::ImpossibleGogmaObservation { roll_index } => write!(
                formatter,
                "Gogma observation {} violates the game's bonus limits",
                roll_index + 1
            ),
            Self::InvalidGogmaCounterRange(range) => write!(
                formatter,
                "Gogma counter range starts at {} but ends at {}",
                range.start, range.end
            ),
            Self::InvalidSkillCounterRange(range) => write!(
                formatter,
                "skill counter range starts at {} but ends at {}",
                range.start, range.end
            ),
            Self::GogmaCounterIgnoredByGate { counter_gate } => write!(
                formatter,
                "counter gate {counter_gate} is below {GOGMA_COUNTER_GATE_THRESHOLD}; the game ignores gogmaCounter, so it cannot be identified"
            ),
            Self::SkillCounterIgnoredByGate { counter_gate } => write!(
                formatter,
                "counter gate {counter_gate} is below {SKILL_COUNTER_GATE_THRESHOLD}; the game ignores skillCounter, so it cannot be identified"
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
