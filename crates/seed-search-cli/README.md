# seed-search-cli

Native command-line tool for base-seed and bounded Gogma-counter searches.

Run the upstream v0.9.3 skill golden sample across the full documented seed range:

```powershell
cargo run --release -p seed-search-cli -- skill --golden-sample
```

Run the six-roll live Reset Bonuses golden sample:

```powershell
cargo run --release -p seed-search-cli -- gogma --golden-sample
```

Run the same sample while treating counters `475..=485` as unknown:

```powershell
cargo run --release -p seed-search-cli -- gogma --golden-counter-range
```

Run with explicit values:

```powershell
cargo run --release -p seed-search-cli -- `
  skill `
  --weapon-type 10 `
  --attribute-force 4 `
  --skill-counter 186 `
  --counter-gate 200 `
  --observations 275,255,245,243
```

Reset Bonuses observations use game bonus IDs. Separate the five slots with
commas and consecutive amendments with semicolons:

`--weapon-type 11` selects the live-verified Bow pool, which excludes bonus
IDs 6 and 10. Supplying either ID for Bow is rejected as an impossible
observation. `--weapon-type 12` or `13` selects the Heavy/Light Bowgun pool,
which excludes Element bonus IDs 11 and 14 and retains Ammo IDs 6 and 10.
Supplying an Element ID for either Bowgun is rejected before searching.

```powershell
cargo run --release -p seed-search-cli -- `
  gogma `
  --weapon-type 8 `
  --attribute-force 1 `
  --gogma-counter 480 `
  --counter-gate 200 `
  --observations "11,12,15,14,11;9,14,8,16,11"
```

Replace the exact counter with an inclusive range when it is unknown:

```powershell
cargo run --release -p seed-search-cli -- `
  gogma `
  --weapon-type 8 `
  --attribute-force 1 `
  --gogma-counter-start 430 `
  --gogma-counter-end 530 `
  --counter-gate 200 `
  --observations "11,12,15,14,11;9,14,8,16,11"
```

Skill observations are zero-based indices in the 294-entry set/group table.
Screenshot/name input and unbounded-counter searching are not implemented yet.

## Golden sample result

On the initial 16-thread development machine, a release build searched all `100,000,000` documented base seeds in approximately 4.5 seconds:

```text
observations 275,255,245     -> 7 candidates
observations 275,255,245,243 -> 1 candidate: 8524433
```

This is a local benchmark, not a performance guarantee. Debug builds are not intended for full-range searches.

The current skill command requires known `skillCounter` and `counterGate`
values. The Gogma command accepts an exact counter or an inclusive counter
range, but still requires `counterGate`.

The live six-roll Gogma sample searches `0..=99,999,999` in approximately 3.3
seconds on the initial 16-thread development machine and returns one candidate:
`86315169`.

For an unknown Gogma counter, the 100-round initializer runs once per seed and
adjacent counter candidates use ten direct RNG steps. Weighted observations are
compiled into modulo intervals before the search. On the development machine,
the full seed range across 101 counters took approximately 23.0 seconds. A very
wide or unbounded counter range still needs a stronger strategy for Web use.
