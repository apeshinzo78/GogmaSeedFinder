//! WebAssembly wrapper for chunked Gogma seed/counter searches.

use gogma_rng_core::{
    GOGMA_BONUS_COUNT, GogmaBonusCategory, GogmaStream, GogmaStreamParams, SkillStream,
    SkillStreamParams,
};
use seed_search_cli::{
    CompiledGogmaCounterSearch, CompiledSkillCounterSearch, GogmaCounterRange,
    GogmaCounterSearchCriteria, SeedRange, SkillCounterRange, SkillCounterSearchCriteria,
};
use wasm_bindgen::prelude::*;

const MAX_PREDICTION_ROLLS: u32 = 1_000;

/// Generates flattened five-slot Reset Bonuses predictions beginning at the
/// supplied saved counter.
///
/// # Errors
///
/// Returns a JavaScript error when `count` is zero or exceeds the bounded Web
/// UI limit.
#[wasm_bindgen]
pub fn predict_gogma_rolls(
    base_seed: u32,
    weapon_type: u32,
    attribute_force: u32,
    gogma_counter: u32,
    counter_gate: u32,
    count: u32,
) -> Result<Box<[u8]>, JsValue> {
    let count = validate_prediction_count(count).map_err(JsValue::from_str)?;
    let stream = GogmaStream::new(GogmaStreamParams {
        base_seed,
        weapon_type,
        attribute_force,
        gogma_counter,
        counter_gate,
    });
    let rolls = stream.future_reset_rolls(count);
    let mut flattened = Vec::with_capacity(count * GOGMA_BONUS_COUNT);
    for roll in rolls {
        flattened.extend_from_slice(&roll.bonus_ids());
    }
    Ok(flattened.into_boxed_slice())
}

/// Generates flattened five-slot Keep Bonuses predictions beginning at the
/// supplied saved counter.
///
/// `slot_categories` contains five category IDs in in-game slot order:
/// Attack=0, Affinity=1, Element=2, Sharpness/Ammo=3.
///
/// # Errors
///
/// Returns a JavaScript error when the category layout is malformed,
/// impossible for the weapon type, or the count is outside the Web UI limit.
#[wasm_bindgen]
pub fn predict_gogma_keep_rolls(
    base_seed: u32,
    weapon_type: u32,
    attribute_force: u32,
    gogma_counter: u32,
    counter_gate: u32,
    count: u32,
    slot_categories: &[u8],
) -> Result<Box<[u8]>, JsValue> {
    let count = validate_prediction_count(count).map_err(JsValue::from_str)?;
    if slot_categories.len() != GOGMA_BONUS_COUNT {
        return Err(JsValue::from_str(
            "Keep Bonuses requires exactly five slot categories",
        ));
    }
    let mut categories = [GogmaBonusCategory::Attack; GOGMA_BONUS_COUNT];
    for (index, &category_id) in slot_categories.iter().enumerate() {
        categories[index] = GogmaBonusCategory::from_id(category_id)
            .ok_or_else(|| JsValue::from_str("unsupported Keep Bonuses category"))?;
    }

    let stream = GogmaStream::new(GogmaStreamParams {
        base_seed,
        weapon_type,
        attribute_force,
        gogma_counter,
        counter_gate,
    });
    let rolls = stream.future_keep_rolls(categories, count).ok_or_else(|| {
        JsValue::from_str("the Keep Bonuses category layout is impossible for this weapon type")
    })?;
    let mut flattened = Vec::with_capacity(count * GOGMA_BONUS_COUNT);
    for roll in rolls {
        flattened.extend_from_slice(&roll.bonus_ids());
    }
    Ok(flattened.into_boxed_slice())
}

fn validate_prediction_count(count: u32) -> Result<usize, &'static str> {
    if count == 0 {
        return Err("prediction count must be at least one");
    }
    if count > MAX_PREDICTION_ROLLS {
        return Err("prediction count must not exceed 1000");
    }

    usize::try_from(count).map_err(|_| "prediction count is outside the usize range")
}

/// Generates consecutive series/group skill table indices beginning at the
/// supplied saved skill counter.
///
/// # Errors
///
/// Returns a JavaScript error when `count` is zero or exceeds the bounded Web
/// UI limit.
#[wasm_bindgen]
pub fn predict_skill_rolls(
    base_seed: u32,
    weapon_type: u32,
    attribute_force: u32,
    skill_counter: u32,
    counter_gate: u32,
    count: u32,
) -> Result<Box<[u16]>, JsValue> {
    let count = validate_prediction_count(count).map_err(JsValue::from_str)?;
    let stream = SkillStream::new(SkillStreamParams {
        base_seed,
        weapon_type,
        attribute_force,
        skill_counter,
        counter_gate,
    });
    Ok(stream
        .future_rolls(count)
        .into_iter()
        .map(gogma_rng_core::SkillRoll::table_index)
        .collect::<Vec<_>>()
        .into_boxed_slice())
}

/// Finds saved skill counters that reproduce consecutive observed table
/// indices for a known base seed.
///
/// # Errors
///
/// Returns a JavaScript error for an invalid range, empty observations, an
/// invalid table index, or a gate value that ignores the skill counter.
#[wasm_bindgen]
pub fn find_skill_counters(
    base_seed: u32,
    weapon_type: u32,
    attribute_force: u32,
    counter_gate: u32,
    counter_start: u32,
    counter_end: u32,
    observations: &[u16],
) -> Result<Box<[u32]>, JsValue> {
    let search = CompiledSkillCounterSearch::new(SkillCounterSearchCriteria {
        base_seed,
        weapon_type,
        attribute_force,
        counter_gate,
        counter_range: SkillCounterRange {
            start: counter_start,
            end: counter_end,
        },
        observations: observations.to_vec(),
    })
    .map_err(|error| JsValue::from_str(&error.to_string()))?;
    Ok(search.matching_counters().into_boxed_slice())
}

/// Stateful, single-threaded search cursor intended to run inside a Web Worker.
#[wasm_bindgen]
pub struct GogmaCounterSearchSession {
    compiled: CompiledGogmaCounterSearch,
    seed_start: u32,
    seed_end: u32,
    next_seed: u64,
    checked_seeds: u64,
}

#[wasm_bindgen]
impl GogmaCounterSearchSession {
    /// Creates a bounded seed/counter search.
    ///
    /// `flat_observations` contains five game bonus IDs per consecutive
    /// amendment, with no separators.
    ///
    /// # Errors
    ///
    /// Returns a JavaScript error when a range is descending, observation data
    /// is malformed, a bonus ID is unsupported, or the counter gate makes the
    /// counter unidentifiable.
    #[wasm_bindgen(constructor)]
    #[allow(clippy::too_many_arguments)]
    pub fn new(
        weapon_type: u32,
        attribute_force: u32,
        counter_gate: u32,
        counter_start: u32,
        counter_end: u32,
        flat_observations: &[u8],
        seed_start: u32,
        seed_end: u32,
    ) -> Result<Self, JsValue> {
        if seed_start > seed_end {
            return Err(JsValue::from_str("seed start must not exceed seed end"));
        }
        let observations = parse_flat_observations(flat_observations)?;
        let compiled = CompiledGogmaCounterSearch::new(GogmaCounterSearchCriteria {
            weapon_type,
            attribute_force,
            counter_gate,
            counter_range: GogmaCounterRange {
                start: counter_start,
                end: counter_end,
            },
            observations,
        })
        .map_err(|error| JsValue::from_str(&error.to_string()))?;

        Ok(Self {
            compiled,
            seed_start,
            seed_end,
            next_seed: u64::from(seed_start),
            checked_seeds: 0,
        })
    }

    /// Searches at most `max_seeds` candidates and returns flattened
    /// `[seed, counter, seed, counter, ...]` pairs as a `Uint32Array`.
    ///
    /// # Errors
    ///
    /// Returns a JavaScript error when `max_seeds` is zero or the next chunk
    /// cannot be represented as a valid Rust seed range.
    pub fn search_next(&mut self, max_seeds: u32) -> Result<Box<[u32]>, JsValue> {
        if max_seeds == 0 {
            return Err(JsValue::from_str("max_seeds must be at least one"));
        }
        if self.done() {
            return Ok(Vec::new().into_boxed_slice());
        }

        let remaining = u64::from(self.seed_end) - self.next_seed + 1;
        let chunk_len = remaining.min(u64::from(max_seeds));
        let chunk_start = u32::try_from(self.next_seed)
            .map_err(|_| JsValue::from_str("next seed is outside the u32 range"))?;
        let chunk_end = u32::try_from(self.next_seed + chunk_len - 1)
            .map_err(|_| JsValue::from_str("chunk end is outside the u32 range"))?;

        let candidates = self
            .compiled
            .search_sequential(SeedRange {
                start: chunk_start,
                end: chunk_end,
            })
            .map_err(|error| JsValue::from_str(&error.to_string()))?;

        self.next_seed += chunk_len;
        self.checked_seeds += chunk_len;

        let mut flattened = Vec::with_capacity(candidates.len() * 2);
        for candidate in candidates {
            flattened.push(candidate.base_seed);
            flattened.push(candidate.gogma_counter);
        }
        Ok(flattened.into_boxed_slice())
    }

    #[must_use]
    pub fn done(&self) -> bool {
        self.next_seed > u64::from(self.seed_end)
    }

    #[must_use]
    pub fn checked_seeds(&self) -> u64 {
        self.checked_seeds
    }

    #[must_use]
    pub fn total_seeds(&self) -> u64 {
        u64::from(self.seed_end) - u64::from(self.seed_start) + 1
    }
}

fn parse_flat_observations(values: &[u8]) -> Result<Vec<[u8; GOGMA_BONUS_COUNT]>, JsValue> {
    if values.is_empty() {
        return Err(JsValue::from_str(
            "at least one five-slot observation is required",
        ));
    }
    if !values.len().is_multiple_of(GOGMA_BONUS_COUNT) {
        return Err(JsValue::from_str(
            "observation data length must be a multiple of five",
        ));
    }

    let (observations, remainder) = values.as_chunks::<GOGMA_BONUS_COUNT>();
    debug_assert!(remainder.is_empty());
    Ok(observations.to_vec())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn chunked_session_finds_the_live_pair() {
        let mut session = GogmaCounterSearchSession::new(
            8,
            1,
            200,
            475,
            485,
            &[11, 12, 15, 14, 11, 9, 14, 8, 16, 11, 6, 13, 10, 11, 8],
            86_315_000,
            86_315_300,
        )
        .expect("session criteria must be valid");

        let mut flattened = Vec::new();
        while !session.done() {
            flattened
                .extend_from_slice(&session.search_next(37).expect("chunk search must succeed"));
        }

        assert_eq!(flattened, vec![86_315_169, 480]);
        assert_eq!(session.checked_seeds(), 301);
        assert_eq!(session.total_seeds(), 301);
    }

    #[test]
    fn chunked_session_finds_the_live_bow_pair() {
        let mut session = GogmaCounterSearchSession::new(
            11,
            4,
            200,
            475,
            485,
            &[
                13, 14, 15, 12, 15, 9, 13, 14, 16, 15, 11, 13, 12, 14, 14, 11, 13, 15, 14, 9, 11,
                15, 13, 13, 12, 12, 16, 12, 15, 9,
            ],
            86_315_000,
            86_315_300,
        )
        .expect("Bow session criteria must be valid");

        let mut flattened = Vec::new();
        while !session.done() {
            flattened
                .extend_from_slice(&session.search_next(37).expect("chunk search must succeed"));
        }

        assert_eq!(flattened, vec![86_315_169, 480]);
        assert_eq!(session.checked_seeds(), 301);
    }

    #[test]
    fn chunked_session_finds_the_live_heavy_bowgun_pair() {
        let mut session = GogmaCounterSearchSession::new(
            12,
            3,
            200,
            475,
            485,
            &[
                13, 6, 8, 12, 6, 13, 10, 12, 15, 6, 9, 15, 9, 16, 6, 12, 16, 6, 8, 9, 12, 13, 15,
                6, 9, 15, 9, 6, 16, 12,
            ],
            86_315_000,
            86_315_300,
        )
        .expect("Heavy Bowgun session criteria must be valid");

        let mut flattened = Vec::new();
        while !session.done() {
            flattened
                .extend_from_slice(&session.search_next(37).expect("chunk search must succeed"));
        }

        assert_eq!(flattened, vec![86_315_169, 480]);
        assert_eq!(session.checked_seeds(), 301);
    }

    #[test]
    fn prediction_api_reproduces_the_live_heavy_bowgun_observations() {
        let flattened = predict_gogma_rolls(86_315_169, 12, 3, 480, 200, 6)
            .expect("Heavy Bowgun prediction must succeed");

        assert_eq!(
            flattened.as_ref(),
            [
                13, 6, 8, 12, 6, 13, 10, 12, 15, 6, 9, 15, 9, 16, 6, 12, 16, 6, 8, 9, 12, 13, 15,
                6, 9, 15, 9, 6, 16, 12,
            ]
        );
    }

    #[test]
    fn keep_prediction_api_preserves_each_registered_weapon_layout() {
        let flattened = predict_gogma_keep_rolls(86_315_169, 8, 1, 480, 200, 6, &[0, 1, 2, 3, 0])
            .expect("Switch Axe Keep Bonuses prediction must succeed");

        assert_eq!(
            flattened.as_ref(),
            [
                8, 9, 11, 10, 12, 12, 9, 14, 6, 8, 15, 13, 11, 6, 15, 15, 13, 14, 10, 12, 8, 16,
                11, 10, 8, 15, 16, 11, 6, 8,
            ]
        );
    }

    #[test]
    fn skill_prediction_and_counter_search_reproduce_the_upstream_sample() {
        let observations = [275, 255, 245, 243];
        assert_eq!(
            find_skill_counters(8_524_433, 10, 4, 200, 180, 190, &observations)
                .expect("skill counter search must succeed")
                .as_ref(),
            [186]
        );

        assert_eq!(
            predict_skill_rolls(8_524_433, 10, 4, 186, 200, 10)
                .expect("skill prediction must succeed")
                .as_ref(),
            [275, 255, 245, 243, 37, 58, 9, 191, 218, 88]
        );
    }

    #[test]
    fn prediction_api_rejects_an_unbounded_request() {
        assert_eq!(
            validate_prediction_count(0),
            Err("prediction count must be at least one")
        );
        assert_eq!(
            validate_prediction_count(1_001),
            Err("prediction count must not exceed 1000")
        );
    }
}
