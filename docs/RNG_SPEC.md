# RNG specification

Status: the skill stream and both Gogma amendment modes are implemented. Skills and Keep Bonuses are verified against GARP v0.9.3 formula vectors; Reset Bonuses is additionally verified against six consecutive live-game observations. Known-counter skill base-seed inversion is implemented in `seed-search-cli`.

## Skill-search scope

The first proof of concept covers only Gogma set/group skill rolls.

## Effective seed

All values use unsigned 32-bit wrapping arithmetic:

```text
effectiveSeed = (baseSeed + weaponType * 1000 + attributeForce) XOR 0x00AC9365
```

`weaponType` is zero-based. `attributeForce` is the game's scrambled attribute value, not the user-facing attribute selector index.

Live-game comparisons confirmed that both fields are part of the observable
roll identity: changing either the weapon type or the attribute can change the
sequence. Conversely, different weapon instances produce the same sequence
when `weaponType` and `attributeForce` are both equal. The prediction key is
therefore the save-specific `baseSeed`, the relevant saved stream position,
`weaponType`, and `attributeForce`; no weapon-instance identifier is required.

## Initialization

The generator begins with:

```text
x = 0x159A55E5
y = 0x1F123BB5
z = 0x05491333
w = 0x05491333
```

The effective seed is mixed for exactly 100 rounds using the same wrapping shifts and XOR operations as upstream `initialize_rng`/`initializeRng`.

## State transition

```text
t     = x XOR (x << 15)
nextW = w XOR (w >> 21) XOR t XOR (t >> 4)
state = (y, z, w, nextW)
```

Every intermediate value is treated as unsigned 32-bit.

## Skill stream position

When `counterGate < 0x36`, the saved skill counter is ignored. Otherwise, the initialized state advances by `skillCounter * 10` transitions. One additional transition produces the current skill result.

Each subsequent Reset Skills result is ten transitions after the preceding result.

## Skill table

The lottery index is:

```text
tableIndex = w % 294
setIndex   = tableIndex / 14
groupIndex = tableIndex % 14
```

Set and group names use the upstream Artian table order, which differs from the alphabetical order displayed by some selectors. Internal `artianSkillType` values contain deliberate gaps and are preserved by `SkillRoll`.

## Verification

`tests/fixtures/skill_stream_v0.9.3.json` contains four cases and forty rolls generated from the upstream web implementation. It covers:

- the upstream sample values;
- zero seed and counter;
- base seed `99,999,999` with a nontrivial counter;
- the counter-gate path below `0x36`.

The supplied v0.9.3 Lua and the referenced GitHub commit's Lua are content-identical after normalizing line endings. Rust tests also verify table boundary gaps and unsigned wrapping.

## Gogma Reset Bonuses stream

### User-facing input mappings

The Web UI converts the 14 weapon names to the zero-based order used by GARP:

```text
0 Great Sword, 1 Sword & Shield, 2 Dual Blades, 3 Long Sword,
4 Hammer, 5 Hunting Horn, 6 Lance, 7 Gunlance,
8 Switch Axe, 9 Charge Blade, 10 Insect Glaive, 11 Bow,
12 Heavy Bowgun, 13 Light Bowgun
```

GARP's displayed attribute order does not exactly match `attributeForce`.
The verified conversion is:

```text
None=0, Fire=1, Water=2, Thunder=4, Ice=3,
Dragon=5, Poison=6, Paralysis=7, Sleep=8, Blast=9
```

Reset Bonuses uses the same effective-seed formula and RNG initializer as the skill stream, but it has an independent `gogmaCounter` and an independent gate threshold.

The save data therefore contains one save-specific `baseSeed` and two
independently saved stream positions: `skillCounter` and `gogmaCounter`. A live
cross-stream check from the same save produced `Skill A -> Skill B` both with
and without a preceding `Reset Bonuses A`. This confirms that a Reset Bonuses
operation does not advance the skill stream. The reciprocal direction (whether
a skill reset advances the Gogma stream) has not been live-tested, although the
separate saved fields and upstream planner both model it as independent.

When `counterGate < 0x23`, the Gogma counter is ignored. Otherwise, the initialized state advances by `gogmaCounter * 10` transitions. Unlike the skill stream, there is no additional transition before positioning the stream cursor.

One roll selects five bonuses in slot order. Each slot advances a local copy of the RNG once and uses the resulting word in a weighted lottery. Moving to the next Reset Bonuses result advances the persistent stream cursor by ten transitions.

For melee weapons, candidate IDs are evaluated in this order:

```text
8, 12, 15, 9, 13, 16, 11, 14, 6, 10
```

Live Thunder Bow observations established a weapon-specific eight-candidate
pool. Bow (`weaponType=11`) evaluates:

```text
8, 12, 15, 9, 13, 16, 11, 14
```

IDs 6 and 10 are absent from the weighted pool. They are not drawn and then
converted or discarded, because removing them before the modulo operation
reproduces all 30 observed slots exactly at the known seed/counter.

Heavy and Light Bowgun (`weaponType=12` and `13`) evaluate:

```text
8, 12, 15, 9, 13, 16, 6, 10
```

Element IDs 11 and 14 are absent. IDs 6 and 10 are displayed as magazine
capacity bonuses and retain the shared Sharpness/Ammo category maximum of two.
Removing the Element candidates before the weighted modulo operation
reproduces all 30 slots of the live Ice Heavy Bowgun sequence. Light Bowgun
uses the same candidate rule.

Every candidate begins with weight 100. A repeated exact ID subtracts 80 for IDs 10, 14, 15, and 16, or 50 for every other ID. Candidates whose resulting weight is zero are removed.

### Runtime category limits

The read-only runtime metadata probe exported the following `BonusCategory` and `_Em0078_GrindingMaxNum` values:

| Category | IDs | Data maximum | Effective maximum |
| --- | --- | ---: | ---: |
| Attack | 8, 12, 15 | 5 | 5 |
| Affinity | 9, 13, 16 | 5 | 5 |
| Element | 11, 14 | 5 | 4 |
| Sharpness/ammo | 6, 10 | 2 | 2 |

The element category cannot reach its data maximum of five. It has only two exact bonus IDs, and each exact ID reaches zero weight after its second occurrence, so the effective maximum is `2 + 2 = 4`.

GARP v0.9.3 applies the exact-ID repetition rule but not the category maximum. In the third live observation, GARP predicts IDs `[6, 13, 10, 14, 11]`, while the game produced `[6, 13, 10, 11, 8]`. IDs 6 and 10 both belong to category 3, whose runtime maximum is two. Removing that category immediately after the third slot reproduces both remaining live slots exactly.

`tests/fixtures/gogma_reset_stream_v0.9.3_live.json` records the pre-roll RNG inputs, initialized and counter-positioned states, and all six observed results. The test verifies every bonus ID and English name.

`tests/fixtures/gogma_bow_reset_stream_live_2026-08-23.json` records six
consecutive Thunder Bow results from Steam screenshots. With
`baseSeed=86315169`, `weaponType=11`, `attributeForce=4`, and
`gogmaCounter=480`, the Bow pool reproduces all six five-slot rolls. The
fixture also preserves the source screenshot hashes.

`tests/fixtures/gogma_heavy_bowgun_reset_stream_live_2026-08-23.json` records
six consecutive Ice Heavy Bowgun results. With `weaponType=12`,
`attributeForce=3`, and the same known base seed/counter, removing Element IDs
11 and 14 reproduces all 30 slots. The unique local match remains
`baseSeed=86315169` and `gogmaCounter=480`.

### Future prediction

`GogmaStream::future_reset_rolls` begins at the supplied save snapshot. Item 1
is the next Reset Bonuses result shown after loading that save; each later item
advances one Gogma counter and ten RNG transitions. The Web UI regenerates up
to 1,000 results through WASM. When prediction uses the same weapon and
attribute as the search, it verifies the complete observed prefix before
showing the future table.

The five desired-bonus selectors form an unordered multiset. Repeated choices
therefore require repeated occurrences in the same result. Changing the
prediction weapon or attribute retains the recovered base seed/counter but
recomposes the effective seed and applies that weapon's candidate pool.

The Web comparison view evaluates up to sixteen weapon profiles from
the same recovered save position. A single row therefore represents one shared
number of Reset Bonuses operations but can contain different five-slot results
for every pair. This supports a route such as accepting Fire Long Sword at
result 5, saving, reopening that row as the new origin, and then evaluating
Dragon Long Sword result 23 from the new save position.

The Web UI calls the pre-observation save snapshot relative position `0` and
labels the next generated item as result 1. This is presentation-level
normalization only. The initialized state after an absolute Gogma counter jump
is not generally another state produced by `RngState::initialize` from a
documented eight-digit base seed. The recovered absolute counter must therefore
remain part of the internal candidate and cross-weapon prediction inputs.

### Keep Bonuses / same composition

`GogmaRoll::keep_from_state` models the game menu action "Keep Bonuses"
(`ボーナスを同じ構成で再復元`). It uses the same save-specific `baseSeed`,
weapon type, attribute, `gogmaCounter`, gate threshold, and ten-transition row
stride as Reset Bonuses. The two menu actions therefore advance the same
復元ボーナスカウンター; they are not separate streams.

The difference is the candidate pool. Each of the current five slots is first
classified as Attack, Affinity, Element, or Sharpness/Ammo. A Keep Bonuses roll
restricts that slot to the tiers in the same category:

```text
Attack:          8, 12, 15
Affinity:        9, 13, 16
Element:         11, 14
Sharpness/Ammo:  6, 10
```

The exact-ID repetition weights are recalculated within each five-slot roll.
The previous II/III/EX tier is not an input; only the left-to-right category
layout matters. Every successful result preserves that layout, so consecutive
Keep Bonuses rows can reuse it while advancing the shared Gogma counter once
per row. Bow rejects Sharpness/Ammo layouts and Bowguns reject Element layouts.

The Web UI stores this category layout per registered weapon profile. This is
necessary because a player can own several EX-unoptimized weapons at once,
including multiple weapons with the same weapon type and attribute but
different current layouts. Reset results provide a shortcut that advances to
the selected row and copies its five categories into that weapon profile before
switching to the EX-optimization view.

The implementation is fixed by a six-roll vector derived independently from
the GARP v0.9.3 Lua formula. An independent live-game Keep Bonuses observation
sequence is still required before calling this path live-verified.

### Continuation state

The browser uses versioned continuation codes as a portable representation of
the recovered state. These are tool codes, not literal single seed fields read
from the game save:

```text
GSF1-<baseSeed>-<nextGogmaCounter>
GSF2-B<baseSeed>-G<nextGogmaCounter>-S<nextSkillCounter>
```

`GSF1` is retained for a bonus-only state whose skill position has not been
identified. Once `skillCounter` is known, both bonus and skill prediction rows
emit `GSF2`. Accepting a Reset Bonuses row advances only `G`; accepting a skill
row advances only `S`. Opening either code makes the represented saved position
the new relative origin `0` without discarding the other known stream position.

`tests/fixtures/gogma_bonus_metadata_2026-08-23.json` is a reduced, address-free snapshot of the runtime metadata export. Tests verify the candidate order, categories, initial and subtraction weights, rare flags, and category maxima used by Rust.

## Next scope

1. Define the PS5 observation format
2. Determine how to handle an unknown current counter
3. Add localized skill-name to table-index conversion
4. Extend the implemented bounded Gogma counter search to very wide ranges
5. Verify Keep Bonuses with an independent live-game sequence
6. Add a guided PS5 observation and counter-range workflow

Base Artian reinforcements remain deferred. Keep Bonuses intentionally uses its own category-preserving calculation and is never treated as Reset Bonuses.
