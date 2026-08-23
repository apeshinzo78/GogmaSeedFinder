//! Deterministic RNG primitives used by Gogma Artian rolls.
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

/// Gogma amendment counters are applied only when the game's gate reaches this value.
pub const GOGMA_COUNTER_GATE_THRESHOLD: u32 = 0x23;

/// Consecutive Gogma amendment rolls are ten state transitions apart.
pub const GOGMA_ROLL_STRIDE: u64 = 10;

/// Number of reinforcement bonuses produced by one Gogma amendment.
pub const GOGMA_BONUS_COUNT: usize = 5;

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

/// Category shared by different tiers of a Gogma reinforcement bonus.
#[derive(Clone, Copy, Debug, Eq, Hash, PartialEq)]
#[repr(u8)]
pub enum GogmaBonusCategory {
    Attack = 0,
    Affinity = 1,
    Element = 2,
    SharpnessAmmo = 3,
}

impl GogmaBonusCategory {
    /// Converts the runtime category identifier to a supported category.
    #[must_use]
    pub const fn from_id(id: u8) -> Option<Self> {
        match id {
            0 => Some(Self::Attack),
            1 => Some(Self::Affinity),
            2 => Some(Self::Element),
            3 => Some(Self::SharpnessAmmo),
            _ => None,
        }
    }

    /// Returns the runtime category identifier exported from the game.
    #[must_use]
    pub const fn id(self) -> u8 {
        self as u8
    }

    /// Maximum number of this category in one Gogma amendment result.
    #[must_use]
    pub const fn max_count(self) -> u8 {
        match self {
            Self::Attack | Self::Affinity | Self::Element => 5,
            Self::SharpnessAmmo => 2,
        }
    }
}

/// One reinforcement bonus available to a Gogma Artian weapon.
#[derive(Clone, Copy, Debug, Eq, Hash, PartialEq)]
#[repr(u8)]
pub enum GogmaBonus {
    SharpnessBoost = 6,
    AttackBoostIi = 8,
    AffinityBoostIi = 9,
    SharpnessAmmoBoostEx = 10,
    ElementBoostIi = 11,
    AttackBoostIii = 12,
    AffinityBoostIii = 13,
    ElementBoostEx = 14,
    AttackBoostEx = 15,
    AffinityBoostEx = 16,
}

impl GogmaBonus {
    /// Converts the game's bonus identifier to a supported Gogma bonus.
    #[must_use]
    pub const fn from_id(id: u8) -> Option<Self> {
        match id {
            6 => Some(Self::SharpnessBoost),
            8 => Some(Self::AttackBoostIi),
            9 => Some(Self::AffinityBoostIi),
            10 => Some(Self::SharpnessAmmoBoostEx),
            11 => Some(Self::ElementBoostIi),
            12 => Some(Self::AttackBoostIii),
            13 => Some(Self::AffinityBoostIii),
            14 => Some(Self::ElementBoostEx),
            15 => Some(Self::AttackBoostEx),
            16 => Some(Self::AffinityBoostEx),
            _ => None,
        }
    }

    /// Returns the game identifier used by the upstream lottery pool.
    #[must_use]
    pub const fn id(self) -> u8 {
        self as u8
    }

    /// Returns the English name used by Gogma Artian Roll Planner v0.9.3.
    #[must_use]
    pub const fn name(self) -> &'static str {
        match self {
            Self::SharpnessBoost => "Sharpness Boost",
            Self::AttackBoostIi => "Attack Boost II",
            Self::AffinityBoostIi => "Affinity Boost II",
            Self::SharpnessAmmoBoostEx => "Sharpness/Ammo Boost EX",
            Self::ElementBoostIi => "Element Boost II",
            Self::AttackBoostIii => "Attack Boost III",
            Self::AffinityBoostIii => "Affinity Boost III",
            Self::ElementBoostEx => "Element Boost EX",
            Self::AttackBoostEx => "Attack Boost EX",
            Self::AffinityBoostEx => "Affinity Boost EX",
        }
    }

    /// Returns the runtime category shared by this bonus's other tiers.
    #[must_use]
    pub const fn category(self) -> GogmaBonusCategory {
        match self {
            Self::AttackBoostIi | Self::AttackBoostIii | Self::AttackBoostEx => {
                GogmaBonusCategory::Attack
            }
            Self::AffinityBoostIi | Self::AffinityBoostIii | Self::AffinityBoostEx => {
                GogmaBonusCategory::Affinity
            }
            Self::ElementBoostIi | Self::ElementBoostEx => GogmaBonusCategory::Element,
            Self::SharpnessBoost | Self::SharpnessAmmoBoostEx => GogmaBonusCategory::SharpnessAmmo,
        }
    }

    /// Returns the order index stored in the game's Artian bonus data.
    #[must_use]
    pub const fn lottery_index(self) -> u8 {
        match self {
            Self::AttackBoostIi => 4,
            Self::AttackBoostIii => 5,
            Self::AttackBoostEx => 6,
            Self::AffinityBoostIi => 8,
            Self::AffinityBoostIii => 9,
            Self::AffinityBoostEx => 10,
            Self::ElementBoostIi => 12,
            Self::ElementBoostEx => 13,
            Self::SharpnessBoost => 15,
            Self::SharpnessAmmoBoostEx => 16,
        }
    }

    /// Initial lottery weight exported from the game.
    #[must_use]
    pub const fn probability(self) -> u32 {
        100
    }

    /// Weight subtracted for each previous occurrence of this exact bonus ID.
    #[must_use]
    pub const fn sub_probability(self) -> u32 {
        match self {
            Self::SharpnessAmmoBoostEx
            | Self::ElementBoostEx
            | Self::AttackBoostEx
            | Self::AffinityBoostEx => 80,
            _ => 50,
        }
    }

    /// Whether the runtime bonus data marks this tier as rare.
    #[must_use]
    pub const fn is_rare(self) -> bool {
        matches!(
            self,
            Self::SharpnessAmmoBoostEx
                | Self::ElementBoostEx
                | Self::AttackBoostEx
                | Self::AffinityBoostEx
        )
    }
}

/// Candidate order used by a Reset Bonuses amendment.
pub const GOGMA_RESET_BONUS_ORDER: [GogmaBonus; 10] = [
    GogmaBonus::AttackBoostIi,
    GogmaBonus::AttackBoostIii,
    GogmaBonus::AttackBoostEx,
    GogmaBonus::AffinityBoostIi,
    GogmaBonus::AffinityBoostIii,
    GogmaBonus::AffinityBoostEx,
    GogmaBonus::ElementBoostIi,
    GogmaBonus::ElementBoostEx,
    GogmaBonus::SharpnessBoost,
    GogmaBonus::SharpnessAmmoBoostEx,
];

/// Reset Bonuses candidates observed for Bow (`weapon_type == 11`).
///
/// Bow has neither sharpness nor bowgun magazine capacity, so the two
/// Sharpness/Ammo candidates are absent from the weighted pool rather than
/// selected and converted to another effect.
pub const GOGMA_BOW_RESET_BONUS_ORDER: [GogmaBonus; 8] = [
    GogmaBonus::AttackBoostIi,
    GogmaBonus::AttackBoostIii,
    GogmaBonus::AttackBoostEx,
    GogmaBonus::AffinityBoostIi,
    GogmaBonus::AffinityBoostIii,
    GogmaBonus::AffinityBoostEx,
    GogmaBonus::ElementBoostIi,
    GogmaBonus::ElementBoostEx,
];

/// Reset Bonuses candidates used by Heavy and Light Bowgun
/// (`weapon_type == 12 || weapon_type == 13`).
///
/// Bowguns use magazine-capacity bonuses in place of sharpness bonuses, but
/// their weighted pool has no Element candidates.
pub const GOGMA_BOWGUN_RESET_BONUS_ORDER: [GogmaBonus; 8] = [
    GogmaBonus::AttackBoostIi,
    GogmaBonus::AttackBoostIii,
    GogmaBonus::AttackBoostEx,
    GogmaBonus::AffinityBoostIi,
    GogmaBonus::AffinityBoostIii,
    GogmaBonus::AffinityBoostEx,
    GogmaBonus::SharpnessBoost,
    GogmaBonus::SharpnessAmmoBoostEx,
];

/// Returns the weighted Reset Bonuses candidate order for one weapon type.
///
/// The zero-based weapon type order is the game's fixed order. Bow is `11`,
/// Heavy Bowgun is `12`, and Light Bowgun is `13`.
#[must_use]
pub const fn gogma_reset_bonus_order(weapon_type: u32) -> &'static [GogmaBonus] {
    match weapon_type {
        11 => &GOGMA_BOW_RESET_BONUS_ORDER,
        12 | 13 => &GOGMA_BOWGUN_RESET_BONUS_ORDER,
        _ => &GOGMA_RESET_BONUS_ORDER,
    }
}

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

    /// Generates consecutive series/group skill results beginning at the
    /// current saved skill-counter position.
    #[must_use]
    pub fn future_rolls(self, count: usize) -> Vec<SkillRoll> {
        let mut stream = self;
        let mut rolls = Vec::with_capacity(count);

        for index in 0..count {
            let roll = if index == 0 {
                stream.current_roll()
            } else {
                stream.advance_roll()
            };
            rolls.push(roll);
        }

        rolls
    }
}

/// Saved values required to locate the current Gogma amendment result.
#[derive(Clone, Copy, Debug, Eq, PartialEq)]
pub struct GogmaStreamParams {
    pub base_seed: u32,
    pub weapon_type: u32,
    pub attribute_force: u32,
    pub gogma_counter: u32,
    pub counter_gate: u32,
}

impl GogmaStreamParams {
    /// Produces the seed passed to the 100-round initializer.
    #[must_use]
    pub fn effective_seed(self) -> u32 {
        effective_gogma_seed(self.base_seed, self.weapon_type, self.attribute_force)
    }

    /// Number of transitions applied before the current amendment is simulated.
    #[must_use]
    pub fn counter_steps(self) -> u64 {
        if self.counter_gate < GOGMA_COUNTER_GATE_THRESHOLD {
            0
        } else {
            u64::from(self.gogma_counter) * GOGMA_ROLL_STRIDE
        }
    }
}

/// Five reinforcement bonuses produced by one Gogma amendment.
#[derive(Clone, Copy, Debug, Eq, PartialEq)]
pub struct GogmaRoll {
    bonuses: [GogmaBonus; GOGMA_BONUS_COUNT],
}

#[derive(Clone, Copy, Debug, Eq, PartialEq)]
struct GogmaSlotConstraint {
    modulus: u32,
    start: u32,
    end: u32,
}

/// Precomputed weighted intervals for one observed five-slot amendment.
#[derive(Clone, Copy, Debug, Eq, PartialEq)]
pub struct GogmaRollConstraint {
    slots: [GogmaSlotConstraint; GOGMA_BONUS_COUNT],
}

impl GogmaRollConstraint {
    /// Compiles an expected result into the exact modulo interval used by each
    /// weighted slot.
    ///
    /// Returns `None` if the sequence violates an exact-ID or category maximum
    /// and therefore cannot be produced by the game.
    #[must_use]
    pub fn new(weapon_type: u32, expected: &[GogmaBonus; GOGMA_BONUS_COUNT]) -> Option<Self> {
        let bonus_order = gogma_reset_bonus_order(weapon_type);
        let mut slots = [GogmaSlotConstraint {
            modulus: 1,
            start: 0,
            end: 1,
        }; GOGMA_BONUS_COUNT];

        for slot in 0..GOGMA_BONUS_COUNT {
            let selected = &expected[..slot];
            let modulus = bonus_order
                .iter()
                .copied()
                .map(|candidate| reset_bonus_weight(candidate, selected))
                .sum::<u32>();
            let mut start = 0;
            let mut expected_weight = None;

            for &candidate in bonus_order {
                let weight = reset_bonus_weight(candidate, selected);
                if candidate == expected[slot] {
                    expected_weight = Some(weight);
                    break;
                }
                start += weight;
            }

            let weight = expected_weight?;
            if weight == 0 {
                return None;
            }
            slots[slot] = GogmaSlotConstraint {
                modulus,
                start,
                end: start + weight,
            };
        }

        Some(Self { slots })
    }

    /// Checks the observed intervals and stops after the first mismatch.
    #[must_use]
    pub fn matches_state(&self, mut state: RngState) -> bool {
        for &slot in &self.slots {
            let roll = state.step() % slot.modulus;
            if roll < slot.start || roll >= slot.end {
                return false;
            }
        }
        true
    }
}

impl GogmaRoll {
    /// Returns the five bonuses in their in-game slot order.
    #[must_use]
    pub const fn bonuses(self) -> [GogmaBonus; GOGMA_BONUS_COUNT] {
        self.bonuses
    }

    /// Returns the five upstream bonus identifiers in slot order.
    #[must_use]
    pub fn bonus_ids(self) -> [u8; GOGMA_BONUS_COUNT] {
        self.bonuses.map(GogmaBonus::id)
    }

    /// Simulates Reset Bonuses from a state positioned at an amendment counter.
    ///
    /// The supplied state is copied, so callers can retain it and advance by
    /// [`GOGMA_ROLL_STRIDE`] to inspect a later amendment.
    #[must_use]
    pub fn reset_from_state(mut state: RngState, weapon_type: u32) -> Self {
        let bonus_order = gogma_reset_bonus_order(weapon_type);
        let mut bonuses = [GogmaBonus::AttackBoostIi; GOGMA_BONUS_COUNT];

        for slot in 0..GOGMA_BONUS_COUNT {
            bonuses[slot] = select_weighted_reset_bonus(&mut state, &bonuses[..slot], bonus_order);
        }

        Self { bonuses }
    }

    /// Simulates Keep Bonuses from a state positioned at an amendment counter.
    ///
    /// The five categories are the current slot layout. Each slot keeps that
    /// category while its II/III/EX tier is redrawn. Returns `None` when the
    /// layout cannot exist for the selected weapon type or violates a runtime
    /// category maximum.
    #[must_use]
    pub fn keep_from_state(
        mut state: RngState,
        weapon_type: u32,
        categories: &[GogmaBonusCategory; GOGMA_BONUS_COUNT],
    ) -> Option<Self> {
        let bonus_order = gogma_reset_bonus_order(weapon_type);
        let mut bonuses = [GogmaBonus::AttackBoostIi; GOGMA_BONUS_COUNT];

        for slot in 0..GOGMA_BONUS_COUNT {
            bonuses[slot] = select_weighted_keep_bonus(
                &mut state,
                &bonuses[..slot],
                bonus_order,
                categories[slot],
            )?;
        }

        Some(Self { bonuses })
    }

    /// Checks an expected Reset Bonuses result and stops at the first
    /// mismatching slot.
    ///
    /// This avoids simulating the remaining slots for the overwhelming
    /// majority of seeds rejected by a search.
    #[must_use]
    pub fn reset_from_state_matches(
        state: RngState,
        weapon_type: u32,
        expected: &[GogmaBonus; GOGMA_BONUS_COUNT],
    ) -> bool {
        GogmaRollConstraint::new(weapon_type, expected)
            .is_some_and(|constraint| constraint.matches_state(state))
    }
}

/// Cursor positioned at the current Gogma amendment counter for a save snapshot.
#[derive(Clone, Copy, Debug, Eq, PartialEq)]
pub struct GogmaStream {
    state: RngState,
    weapon_type: u32,
}

impl GogmaStream {
    #[must_use]
    pub fn new(params: GogmaStreamParams) -> Self {
        let mut state = RngState::initialize(params.effective_seed());
        state.advance(params.counter_steps());
        Self {
            state,
            weapon_type: params.weapon_type,
        }
    }

    #[must_use]
    pub fn state(self) -> RngState {
        self.state
    }

    /// Simulates Reset Bonuses at the current amendment counter.
    #[must_use]
    pub fn current_reset_roll(self) -> GogmaRoll {
        GogmaRoll::reset_from_state(self.state, self.weapon_type)
    }

    /// Advances to and simulates the next Reset Bonuses amendment.
    pub fn advance_reset_roll(&mut self) -> GogmaRoll {
        self.state.advance(GOGMA_ROLL_STRIDE);
        self.current_reset_roll()
    }

    /// Generates consecutive Reset Bonuses results beginning at the current
    /// saved counter position.
    ///
    /// The first returned item is the result of the next Reset Bonuses preview
    /// from the save snapshot. Later items are spaced by
    /// [`GOGMA_ROLL_STRIDE`] transitions.
    #[must_use]
    pub fn future_reset_rolls(self, count: usize) -> Vec<GogmaRoll> {
        let mut stream = self;
        let mut rolls = Vec::with_capacity(count);

        for index in 0..count {
            let roll = if index == 0 {
                stream.current_reset_roll()
            } else {
                stream.advance_reset_roll()
            };
            rolls.push(roll);
        }

        rolls
    }

    /// Generates consecutive Keep Bonuses results for a fixed five-slot
    /// category layout beginning at the current saved counter position.
    ///
    /// Every successful Keep Bonuses amendment preserves the same category in
    /// each slot, so the layout remains valid for all later counters.
    #[must_use]
    pub fn future_keep_rolls(
        self,
        categories: [GogmaBonusCategory; GOGMA_BONUS_COUNT],
        count: usize,
    ) -> Option<Vec<GogmaRoll>> {
        let mut stream = self;
        let mut rolls = Vec::with_capacity(count);

        for index in 0..count {
            if index > 0 {
                stream.state.advance(GOGMA_ROLL_STRIDE);
            }
            rolls.push(GogmaRoll::keep_from_state(
                stream.state,
                stream.weapon_type,
                &categories,
            )?);
        }

        Some(rolls)
    }
}

/// Combines save seed, zero-based weapon type, and attribute-force value.
#[must_use]
#[inline]
pub fn effective_skill_seed(base_seed: u32, weapon_type: u32, attribute_force: u32) -> u32 {
    effective_stream_seed(base_seed, weapon_type, attribute_force)
}

/// Combines the saved seed and weapon inputs for the Gogma amendment stream.
#[must_use]
#[inline]
pub fn effective_gogma_seed(base_seed: u32, weapon_type: u32, attribute_force: u32) -> u32 {
    effective_stream_seed(base_seed, weapon_type, attribute_force)
}

#[inline]
fn effective_stream_seed(base_seed: u32, weapon_type: u32, attribute_force: u32) -> u32 {
    base_seed
        .wrapping_add(weapon_type.wrapping_mul(1000))
        .wrapping_add(attribute_force)
        ^ SEED_XOR_MASK
}

fn select_weighted_reset_bonus(
    state: &mut RngState,
    selected: &[GogmaBonus],
    bonus_order: &[GogmaBonus],
) -> GogmaBonus {
    let word = state.step();
    let total = bonus_order
        .iter()
        .copied()
        .map(|candidate| reset_bonus_weight(candidate, selected))
        .sum::<u32>();
    debug_assert_ne!(total, 0);

    let mut roll = word % total;
    for &candidate in bonus_order {
        let weight = reset_bonus_weight(candidate, selected);
        if roll < weight {
            return candidate;
        }
        roll -= weight;
    }

    unreachable!("a positive weighted pool must select one Gogma bonus")
}

fn select_weighted_keep_bonus(
    state: &mut RngState,
    selected: &[GogmaBonus],
    bonus_order: &[GogmaBonus],
    category: GogmaBonusCategory,
) -> Option<GogmaBonus> {
    let word = state.step();
    let total = bonus_order
        .iter()
        .copied()
        .filter(|candidate| candidate.category() == category)
        .map(|candidate| reset_bonus_weight(candidate, selected))
        .sum::<u32>();
    if total == 0 {
        return None;
    }

    let mut roll = word % total;
    for &candidate in bonus_order {
        if candidate.category() != category {
            continue;
        }
        let weight = reset_bonus_weight(candidate, selected);
        if roll < weight {
            return Some(candidate);
        }
        roll -= weight;
    }

    None
}

fn reset_bonus_weight(candidate: GogmaBonus, selected: &[GogmaBonus]) -> u32 {
    let category_count = selected
        .iter()
        .filter(|selected_bonus| selected_bonus.category() == candidate.category())
        .count();
    if category_count >= usize::from(candidate.category().max_count()) {
        return 0;
    }

    let repeats = selected
        .iter()
        .filter(|&&selected_bonus| selected_bonus == candidate)
        .fold(0_u32, |count, _| count + 1);
    candidate
        .probability()
        .saturating_sub(repeats * candidate.sub_probability())
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
        assert_eq!(
            effective_gogma_seed(u32::MAX, u32::MAX, u32::MAX),
            0xff53_6f73
        );
    }

    #[test]
    fn gogma_gate_below_threshold_ignores_saved_counter() {
        let base = GogmaStreamParams {
            base_seed: 42_424_242,
            weapon_type: 6,
            attribute_force: 5,
            gogma_counter: 0,
            counter_gate: 0x22,
        };
        let with_large_counter = GogmaStreamParams {
            gogma_counter: 999_999,
            ..base
        };

        assert_eq!(GogmaStream::new(base), GogmaStream::new(with_large_counter));
    }

    #[test]
    fn reset_roll_never_selects_the_same_bonus_more_than_twice() {
        let params = GogmaStreamParams {
            base_seed: 86_315_169,
            weapon_type: 8,
            attribute_force: 1,
            gogma_counter: 480,
            counter_gate: 200,
        };
        let mut stream = GogmaStream::new(params);

        for roll_index in 0..1_000 {
            let roll = if roll_index == 0 {
                stream.current_reset_roll()
            } else {
                stream.advance_reset_roll()
            };
            for candidate in GOGMA_RESET_BONUS_ORDER {
                let count = roll
                    .bonuses()
                    .iter()
                    .filter(|&&bonus| bonus == candidate)
                    .count();
                assert!(count <= 2, "bonus {candidate:?} appeared {count} times");
            }

            let bonuses = roll.bonuses();
            let category_count = |category| {
                bonuses
                    .iter()
                    .filter(|bonus| bonus.category() == category)
                    .count()
            };
            assert!(category_count(GogmaBonusCategory::Attack) <= 5);
            assert!(category_count(GogmaBonusCategory::Affinity) <= 5);
            assert!(category_count(GogmaBonusCategory::Element) <= 4);
            assert!(category_count(GogmaBonusCategory::SharpnessAmmo) <= 2);
        }
    }

    #[test]
    fn reset_roll_applies_the_runtime_category_maximum() {
        let params = GogmaStreamParams {
            base_seed: 86_315_169,
            weapon_type: 8,
            attribute_force: 1,
            gogma_counter: 480,
            counter_gate: 200,
        };
        let mut stream = GogmaStream::new(params);

        stream.advance_reset_roll();
        let observed_third_roll = stream.advance_reset_roll();

        assert_eq!(observed_third_roll.bonus_ids(), [6, 13, 10, 11, 8]);
        assert_eq!(
            observed_third_roll
                .bonuses()
                .iter()
                .filter(|bonus| bonus.category() == GogmaBonusCategory::SharpnessAmmo)
                .count(),
            2
        );
    }

    #[test]
    fn keep_rolls_preserve_each_slot_category_and_match_the_upstream_formula() {
        let stream = GogmaStream::new(GogmaStreamParams {
            base_seed: 86_315_169,
            weapon_type: 8,
            attribute_force: 1,
            gogma_counter: 480,
            counter_gate: 200,
        });
        let categories = [
            GogmaBonusCategory::Attack,
            GogmaBonusCategory::Affinity,
            GogmaBonusCategory::Element,
            GogmaBonusCategory::SharpnessAmmo,
            GogmaBonusCategory::Attack,
        ];
        let rolls = stream
            .future_keep_rolls(categories, 6)
            .expect("the melee category layout must be valid");

        assert_eq!(
            rolls
                .iter()
                .copied()
                .map(GogmaRoll::bonus_ids)
                .collect::<Vec<_>>(),
            [
                [8, 9, 11, 10, 12],
                [12, 9, 14, 6, 8],
                [15, 13, 11, 6, 15],
                [15, 13, 14, 10, 12],
                [8, 16, 11, 10, 8],
                [15, 16, 11, 6, 8],
            ]
        );
        for roll in rolls {
            assert_eq!(roll.bonuses().map(GogmaBonus::category), categories);
        }
    }

    #[test]
    fn keep_rolls_reject_a_category_missing_from_the_weapon_pool() {
        let params = GogmaStreamParams {
            base_seed: 86_315_169,
            weapon_type: 11,
            attribute_force: 4,
            gogma_counter: 480,
            counter_gate: 200,
        };
        let impossible_for_bow = [
            GogmaBonusCategory::Attack,
            GogmaBonusCategory::Affinity,
            GogmaBonusCategory::Element,
            GogmaBonusCategory::SharpnessAmmo,
            GogmaBonusCategory::Attack,
        ];
        assert!(
            GogmaStream::new(params)
                .future_keep_rolls(impossible_for_bow, 1)
                .is_none()
        );
    }

    #[test]
    fn element_category_has_a_derived_effective_maximum_of_four() {
        let selected = [
            GogmaBonus::ElementBoostIi,
            GogmaBonus::ElementBoostIi,
            GogmaBonus::ElementBoostEx,
            GogmaBonus::ElementBoostEx,
        ];

        assert_eq!(
            GogmaBonusCategory::Element.max_count(),
            5,
            "runtime metadata keeps the category maximum at five"
        );
        assert_eq!(reset_bonus_weight(GogmaBonus::ElementBoostIi, &selected), 0);
        assert_eq!(reset_bonus_weight(GogmaBonus::ElementBoostEx, &selected), 0);
    }

    #[test]
    fn bow_pool_excludes_sharpness_ammo_candidates() {
        assert_eq!(gogma_reset_bonus_order(11), &GOGMA_BOW_RESET_BONUS_ORDER);
        assert_eq!(gogma_reset_bonus_order(8), &GOGMA_RESET_BONUS_ORDER);

        let params = GogmaStreamParams {
            base_seed: 86_315_169,
            weapon_type: 11,
            attribute_force: 4,
            gogma_counter: 480,
            counter_gate: 200,
        };
        let mut stream = GogmaStream::new(params);
        for roll_index in 0..1_000 {
            let roll = if roll_index == 0 {
                stream.current_reset_roll()
            } else {
                stream.advance_reset_roll()
            };
            assert!(
                roll.bonuses()
                    .iter()
                    .all(|bonus| { bonus.category() != GogmaBonusCategory::SharpnessAmmo })
            );
        }

        let impossible = [
            GogmaBonus::SharpnessBoost,
            GogmaBonus::AttackBoostIii,
            GogmaBonus::AttackBoostEx,
            GogmaBonus::AffinityBoostIi,
            GogmaBonus::ElementBoostIi,
        ];
        assert!(GogmaRollConstraint::new(11, &impossible).is_none());
    }

    #[test]
    fn bowgun_pool_excludes_element_candidates() {
        assert_eq!(gogma_reset_bonus_order(12), &GOGMA_BOWGUN_RESET_BONUS_ORDER);
        assert_eq!(gogma_reset_bonus_order(13), &GOGMA_BOWGUN_RESET_BONUS_ORDER);

        for weapon_type in [12, 13] {
            let params = GogmaStreamParams {
                base_seed: 86_315_169,
                weapon_type,
                attribute_force: 3,
                gogma_counter: 480,
                counter_gate: 200,
            };
            let mut stream = GogmaStream::new(params);
            for roll_index in 0..1_000 {
                let roll = if roll_index == 0 {
                    stream.current_reset_roll()
                } else {
                    stream.advance_reset_roll()
                };
                assert!(
                    roll.bonuses()
                        .iter()
                        .all(|bonus| bonus.category() != GogmaBonusCategory::Element)
                );
            }

            let impossible = [
                GogmaBonus::ElementBoostIi,
                GogmaBonus::AttackBoostIii,
                GogmaBonus::AttackBoostEx,
                GogmaBonus::AffinityBoostIi,
                GogmaBonus::SharpnessBoost,
            ];
            assert!(GogmaRollConstraint::new(weapon_type, &impossible).is_none());
        }
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
