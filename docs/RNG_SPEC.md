# RNG specification

Status: skill-stream core implemented and verified against v0.9.3 golden vectors. Seed inversion is not implemented yet.

## Initial scope

The first proof of concept covers only Gogma set/group skill rolls.

## Effective seed

All values use unsigned 32-bit wrapping arithmetic:

```text
effectiveSeed = (baseSeed + weaponType * 1000 + attributeForce) XOR 0x00AC9365
```

`weaponType` is zero-based. `attributeForce` is the game's scrambled attribute value, not the user-facing attribute selector index.

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

## Next scope

1. Define the PS5 observation format
2. Implement candidate matching for a known counter
3. Benchmark a `0..=99,999,999` base-seed scan
4. Determine how to handle an unknown current counter

Base Artian reinforcements and Gogma amendment bonuses are intentionally deferred until the skill-stream proof of concept succeeds.
