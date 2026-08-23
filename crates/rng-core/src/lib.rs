//! Deterministic RNG primitives used by Gogma Artian skill rolls.
//!
//! The implementation mirrors Gogma Artian Roll Planner v0.9.3. It does not
//! read game memory and has no `REFramework` or platform-specific dependency.

/// Value XOR-ed with the save-derived seed before RNG initialization.
pub const SEED_XOR_MASK: u32 = 0x00ac_9365;

/// Number of set/group combinations in the skill lottery table.
pub const SKILL_TABLE_SIZE: u32 = 294;

/// Counters are applied only when the game's gate reaches this value.
pub const SKILL_COUNTER_GATE_THRESHOLD: u32 = 0x36;

/// Consecutive skill rolls are ten state transitions apart.
pub const SKILL_ROLL_STRIDE: u64 = 10;

const INITIAL_X: u32 = 0x159a_55e5;
const INITIAL_Y: u32 = 0x1f12_3bb5;
const INITIAL_Z: u32 = 0x0549_1333;

/// Skill set order used by the game's 294-entry lottery table.
pub const ARTIAN_SET_ORDER: [&str; 21] = [
    "Doshaguma's Might",
    "Rathalos's Flare",
    "Xu Wu's Vigor",
    "Gravios's Protection",
    "Blangonga's Spirit",
    "Ebony Odogaron's Power",
    "Fulgur Anjanath's Will",
    "Uth Duna's Cover",
    "Rey Dau's Voltage",
    "Nu Udra's Mutiny",
    "Jin Dahaad's Revolt",
    "Gore Magala's Tyranny",
    "Arkveld's Hunger",
    "Guardian Arkveld's Vitality",
    "Mizutsune's Prowess",
    "Zoh Shia's Pulse",
    "Leviathan's Fury",
    "Seregios's Tenacity",
    "Gogmapocalypse",
    "Soul of the Dark Knight",
    "Omega Resonance",
];

/// Skill group order used by the game's 294-entry lottery table.
pub const ARTIAN_GROUP_ORDER: [&str; 14] = [
    "Neopteron Alert",
    "Neopteron Camouflage",
    "Flexible Leathercraft",
    "Buttery Leathercraft",
    "Scaling Prowess",
    "Scale Layering",
    "Fortifying Pelt",
    "Alluring Pelt",
    "Lord's Favor",
    "Lord's Fury",
    "Guardian's Pulse",
    "Guardian's Protection",
    "Imparted Wisdom",
    "Lord's Soul",
];

/// Four-word state used by the game's 32-bit xorshift generator.
#[derive(Clone, Copy, Debug, Eq, PartialEq)]
pub struct RngState {
    pub x: u32,
    pub y: u32,
    pub z: u32,
    pub w: u32,
}

impl RngState {
    const ZERO: Self = Self {
        x: 0,
        y: 0,
        z: 0,
        w: 0,
    };

    /// Builds the four-word state using the game's 100-round initializer.
    #[must_use]
    #[inline]
    pub fn initialize(seed: u32) -> Self {
        let mut seed_state = seed;
        let mut state = Self {
            x: INITIAL_X,
            y: INITIAL_Y,
            z: INITIAL_Z,
            w: INITIAL_Z,
        };

        for iteration in 1..=100 {
            let mixed = (0x65ac_9365_u32 >> (seed_state & 3)) ^ seed_state;
            seed_state =
                mixed.wrapping_shl(4) ^ mixed.wrapping_shl(3) ^ (mixed >> 3) ^ (mixed >> 4) ^ mixed;

            let t = seed_state ^ seed_state.wrapping_shl(15);
            let next_w = state.z ^ (state.z >> 21) ^ t ^ (t >> 4);
            state.w = next_w;

            if iteration < 100 {
                state = Self {
                    x: state.y,
                    y: state.z,
                    z: state.w,
                    w: state.w,
                };
            }
        }

        state
    }

    /// Advances the generator once and returns the new `w` word.
    #[inline]
    pub fn step(&mut self) -> u32 {
        let t = self.x ^ self.x.wrapping_shl(15);
        let next_w = self.w ^ (self.w >> 21) ^ t ^ (t >> 4);
        *self = Self {
            x: self.y,
            y: self.z,
            z: self.w,
            w: next_w,
        };
        next_w
    }

    /// Advances the generator by an exact number of state transitions.
    #[inline]
    pub fn advance(&mut self, steps: u64) {
        for _ in 0..steps {
            self.step();
        }
    }
}

/// Precomputed linear transform that advances [`RngState`] by a fixed number
/// of transitions.
///
/// The xorshift transition is linear over `GF(2)`. Building this transform is
/// more expensive than a few direct calls to [`RngState::step`], but applying
/// it avoids replaying a potentially large saved counter for every seed in a
/// brute-force search.
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct RngJump {
    columns: [RngState; 128],
}

impl RngJump {
    /// Precomputes the transform for exactly `steps` state transitions.
    #[must_use]
    pub fn new(mut steps: u64) -> Self {
        let mut result = Self::identity();
        let mut power = Self::one_step();

        while steps != 0 {
            if steps & 1 != 0 {
                result = Self::compose(&power, &result);
            }
            steps >>= 1;
            if steps != 0 {
                power = Self::compose(&power, &power);
            }
        }

        result
    }

    /// Applies the precomputed transition count to one RNG state.
    #[must_use]
    #[inline]
    pub fn apply(&self, state: RngState) -> RngState {
        let words = [state.x, state.y, state.z, state.w];
        let mut output = RngState::ZERO;

        for (word_index, mut bits) in words.into_iter().enumerate() {
            while bits != 0 {
                let bit_index = usize::try_from(bits.trailing_zeros()).unwrap_or_default();
                let column = self.columns[word_index * 32 + bit_index];
                output.x ^= column.x;
                output.y ^= column.y;
                output.z ^= column.z;
                output.w ^= column.w;
                bits &= bits - 1;
            }
        }

        output
    }

    fn identity() -> Self {
        Self {
            columns: std::array::from_fn(Self::basis_state),
        }
    }

    fn one_step() -> Self {
        let identity = Self::identity();
        Self {
            columns: std::array::from_fn(|index| {
                let mut state = identity.columns[index];
                state.step();
                state
            }),
        }
    }

    fn basis_state(column: usize) -> RngState {
        let word_index = column / 32;
        let bit_index = column % 32;
        let bit = 1_u32 << bit_index;
        let mut state = RngState::ZERO;

        match word_index {
            0 => state.x = bit,
            1 => state.y = bit,
            2 => state.z = bit,
            3 => state.w = bit,
            _ => unreachable!("a 128-column transform has exactly four words"),
        }

        state
    }

    /// Returns `after(before(state))`.
    fn compose(after: &Self, before: &Self) -> Self {
        Self {
            columns: std::array::from_fn(|index| after.apply(before.columns[index])),
        }
    }
}

/// Saved values required to locate the current skill-stream result.
#[derive(Clone, Copy, Debug, Eq, PartialEq)]
pub struct SkillStreamParams {
    pub base_seed: u32,
    pub weapon_type: u32,
    pub attribute_force: u32,
    pub skill_counter: u32,
    pub counter_gate: u32,
}

impl SkillStreamParams {
    /// Produces the seed passed to the 100-round initializer.
    #[must_use]
    pub fn effective_seed(self) -> u32 {
        effective_skill_seed(self.base_seed, self.weapon_type, self.attribute_force)
    }

    /// Number of transitions applied before the current result is read.
    #[must_use]
    pub fn counter_steps(self) -> u64 {
        if self.counter_gate < SKILL_COUNTER_GATE_THRESHOLD {
            0
        } else {
            u64::from(self.skill_counter) * SKILL_ROLL_STRIDE
        }
    }
}

/// A decoded entry from the 294-entry skill lottery table.
#[derive(Clone, Copy, Debug, Eq, PartialEq)]
pub struct SkillRoll {
    table_index: u16,
    set_index: u16,
    group_index: u16,
    artian_skill_type: u16,
}

impl SkillRoll {
    /// Decodes a table index in the inclusive range `0..=293`.
    #[must_use]
    pub fn from_table_index(table_index: u16) -> Option<Self> {
        if u32::from(table_index) >= SKILL_TABLE_SIZE {
            return None;
        }

        Some(Self::decode_valid_table_index(table_index))
    }

    /// Decodes a roll directly from an RNG output word.
    #[must_use]
    pub fn from_rng_word(word: u32) -> Self {
        let table_index = u16::try_from(word % SKILL_TABLE_SIZE).unwrap_or_default();
        Self::decode_valid_table_index(table_index)
    }

    #[must_use]
    pub fn table_index(self) -> u16 {
        self.table_index
    }

    #[must_use]
    pub fn set_index(self) -> u16 {
        self.set_index
    }

    #[must_use]
    pub fn group_index(self) -> u16 {
        self.group_index
    }

    #[must_use]
    pub fn artian_skill_type(self) -> u16 {
        self.artian_skill_type
    }

    #[must_use]
    pub fn set_name(self) -> &'static str {
        ARTIAN_SET_ORDER
            .get(usize::from(self.set_index))
            .copied()
            .unwrap_or("Unknown")
    }

    #[must_use]
    pub fn group_name(self) -> &'static str {
        ARTIAN_GROUP_ORDER
            .get(usize::from(self.group_index))
            .copied()
            .unwrap_or("Unknown")
    }

    fn decode_valid_table_index(table_index: u16) -> Self {
        const GROUP_COUNT: u16 = 14;
        let set_index = table_index / GROUP_COUNT;
        let group_index = table_index % GROUP_COUNT;

        Self {
            table_index,
            set_index,
            group_index,
            artian_skill_type: artian_skill_type(set_index, group_index),
        }
    }
}

/// Cursor positioned at the current skill result for a save snapshot.
#[derive(Clone, Copy, Debug, Eq, PartialEq)]
pub struct SkillStream {
    state: RngState,
}

impl SkillStream {
    #[must_use]
    pub fn new(params: SkillStreamParams) -> Self {
        let mut state = RngState::initialize(params.effective_seed());
        state.advance(params.counter_steps());
        state.step();
        Self { state }
    }

    #[must_use]
    pub fn state(self) -> RngState {
        self.state
    }

    #[must_use]
    pub fn current_roll(self) -> SkillRoll {
        SkillRoll::from_rng_word(self.state.w)
    }

    /// Advances to the result produced by the next Reset Skills action.
    pub fn advance_roll(&mut self) -> SkillRoll {
        self.state.advance(SKILL_ROLL_STRIDE);
        self.current_roll()
    }
}

/// Combines save seed, zero-based weapon type, and attribute-force value.
#[must_use]
#[inline]
pub fn effective_skill_seed(base_seed: u32, weapon_type: u32, attribute_force: u32) -> u32 {
    base_seed
        .wrapping_add(weapon_type.wrapping_mul(1000))
        .wrapping_add(attribute_force)
        ^ SEED_XOR_MASK
}

/// Returns the exact internal skill type used by the upstream Lua mapping.
fn artian_skill_type(set_index: u16, group_index: u16) -> u16 {
    if set_index == 0 {
        const FIRST_BLOCK: [u16; 14] = [1, 2, 3, 4, 5, 7, 8, 9, 10, 11, 12, 13, 14, 15];
        FIRST_BLOCK[usize::from(group_index)]
    } else {
        let block_start = 16 + (set_index - 1) * 15;
        if group_index == 13 {
            block_start + 14
        } else {
            block_start + group_index
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn table_boundaries_preserve_upstream_gaps() {
        let first = SkillRoll::from_table_index(0).unwrap();
        assert_eq!(first.set_name(), "Doshaguma's Might");
        assert_eq!(first.group_name(), "Neopteron Alert");
        assert_eq!(first.artian_skill_type(), 1);

        let first_block_last = SkillRoll::from_table_index(13).unwrap();
        assert_eq!(first_block_last.artian_skill_type(), 15);

        let second_block_first = SkillRoll::from_table_index(14).unwrap();
        assert_eq!(second_block_first.set_name(), "Rathalos's Flare");
        assert_eq!(second_block_first.artian_skill_type(), 16);

        let second_block_last = SkillRoll::from_table_index(27).unwrap();
        assert_eq!(second_block_last.artian_skill_type(), 30);

        let last = SkillRoll::from_table_index(293).unwrap();
        assert_eq!(last.set_name(), "Omega Resonance");
        assert_eq!(last.group_name(), "Lord's Soul");
        assert_eq!(last.artian_skill_type(), 315);

        assert!(SkillRoll::from_table_index(294).is_none());
    }

    #[test]
    fn gate_below_threshold_ignores_saved_counter() {
        let base = SkillStreamParams {
            base_seed: 42_424_242,
            weapon_type: 6,
            attribute_force: 5,
            skill_counter: 0,
            counter_gate: 0x35,
        };
        let with_large_counter = SkillStreamParams {
            skill_counter: 999_999,
            ..base
        };

        assert_eq!(SkillStream::new(base), SkillStream::new(with_large_counter));
    }

    #[test]
    fn effective_seed_uses_wrapping_u32_arithmetic() {
        assert_eq!(
            effective_skill_seed(u32::MAX, u32::MAX, u32::MAX),
            0xff53_6f73
        );
    }

    #[test]
    fn jump_ahead_matches_repeated_steps() {
        let seeds = [0, 1, 0x00ac_9365, 3_058_368, u32::MAX];
        let step_counts = [0, 1, 2, 10, 100, 1_861, 123_451];

        for steps in step_counts {
            let jump = RngJump::new(steps);
            for seed in seeds {
                let initial = RngState::initialize(seed);
                let mut repeated = initial;
                repeated.advance(steps);
                assert_eq!(
                    jump.apply(initial),
                    repeated,
                    "jump differs for seed {seed} after {steps} steps"
                );
            }
        }
    }
}
