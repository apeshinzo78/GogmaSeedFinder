# Seed and bounded-counter search

Status: skill and Gogma Reset Bonuses searches implemented.

## Gogma Reset Bonuses

The `gogma` command accepts:

- zero-based weapon type;
- scrambled attribute-force value;
- saved Gogma counter;
- saved counter gate;
- one or more consecutive five-bonus observations;
- inclusive base-seed range.

The Reset Bonuses candidate pool is weapon-aware. Bow (`weaponType=11`) uses
the live-verified Attack/Affinity/Element pool and rejects Sharpness/Ammo IDs 6
and 10 before searching. Heavy and Light Bowgun (`weaponType=12` and `13`)
use an Attack/Affinity/Ammo pool and reject Element IDs 11 and 14. The Heavy
Bowgun path is covered by a live six-roll golden vector.

For each candidate, it initializes the RNG once and applies a precomputed jump
to `gogmaCounter * 10`. It simulates the weighted slots in order and rejects the
candidate immediately on the first mismatching slot. Later observed amendments
are ten transitions apart.

```powershell
cargo run --release -p seed-search-cli -- gogma --golden-sample
```

The live sample uses `gogmaCounter=480`, six observed amendments, and expected
base seed `86315169`. A 16-thread release run searched all 100,000,000 seeds in
3.257 seconds and returned only that seed. This is a local benchmark, not a
performance guarantee.

### Unknown counter range

Use `--gogma-counter-start` and `--gogma-counter-end` instead of
`--gogma-counter` to search an inclusive range. The initializer and jump to the
range start are shared by every counter tested for the same seed. Adjacent
counters need only ten direct transitions.

Each observed weighted roll is compiled once into five modulo intervals. During
the search, the candidate is rejected as soon as one RNG word lies outside its
expected interval.

```powershell
cargo run --release -p seed-search-cli -- gogma `
  --weapon-type 8 --attribute-force 1 `
  --gogma-counter-start 430 --gogma-counter-end 530 `
  --counter-gate 200 `
  --observations "11,12,15,14,11;9,14,8,16,11"
```

Release benchmarks on the 16-thread development machine:

```text
11 counters  (475..=485): 1 candidate in 5-7 seconds
101 counters (430..=530): 1 candidate in 22.974 seconds
```

The counter gate must still be known. When it is below `0x23`, the game ignores
`gogmaCounter`, so the counter cannot be inferred from output observations.

The same bounded search is exposed through a chunked WebAssembly session. See
`docs/WEB_POC.md` for the Web Worker architecture and browser benchmark.

## Skill stream

## Inputs

- zero-based weapon type;
- scrambled attribute-force value;
- saved skill counter;
- saved counter gate;
- consecutive skill lottery table indices;
- inclusive base-seed range.

The observations begin with the first newly generated Reset Skills result. A skill already stored on an older weapon is not assumed to represent the current stream position.

## Search method

For each base-seed candidate, the CLI:

1. composes the effective skill seed;
2. runs the verified 100-round initializer;
3. applies a precomputed xorshift jump to `skillCounter * 10 + 1`;
4. compares `w % 294` with the first observation;
5. advances ten transitions for each additional observation;
6. retains only candidates matching every observation.

The xorshift transition is linear over `GF(2)`. `RngJump` represents a fixed transition count as a 128-by-128 binary transform, so a large saved counter does not have to be replayed for every one of the 100 million seeds.

The inclusive seed interval is divided into small chunks and distributed across the available hardware threads. Results are sorted before being returned.

## Golden command

```powershell
cargo run --release -p seed-search-cli -- --golden-sample
```

The v0.9.3 upstream sample uses:

```text
weaponType     = 10
attributeForce = 4
skillCounter   = 186
counterGate    = 200
observations   = 275,255,245,243
expected seed  = 8524433
```

## Initial benchmark

Measured on the initial 16-thread Windows development machine:

```text
Range:        0..=99,999,999
Three rolls:  7 candidates in 4.717 seconds
Four rolls:   1 candidate in 4.449 seconds
```

Times vary by CPU, power state, compiler version, and thread count. Full-range searches must use a release build.

## Current limitations

- `skillCounter` is still required; `gogmaCounter` may be an inclusive range.
- `counterGate` must be known.
- Observations are numeric table indices, not localized skill names.
- Gogma observations are numeric bonus IDs, not localized bonus names.
- The search does not yet accept screenshots or OCR output.
- Very wide or unbounded Gogma counter searches are not yet practical for Web use.
- Base Artian reinforcement and Keep Bonuses streams are not included.
