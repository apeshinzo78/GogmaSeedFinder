# Skill seed search

Status: known-counter proof of concept implemented.

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

- `skillCounter` and `counterGate` must be known.
- Observations are numeric table indices, not localized skill names.
- The search does not yet accept screenshots or OCR output.
- Unknown-counter PS5 searches are not implemented.
- Base reinforcement and Gogma amendment streams are not included.
