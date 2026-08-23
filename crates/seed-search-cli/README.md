# seed-search-cli

Native command-line tool for known-counter base-seed searches.

Run the upstream v0.9.3 golden sample across the full documented seed range:

```powershell
cargo run --release -p seed-search-cli -- --golden-sample
```

Run with explicit values:

```powershell
cargo run --release -p seed-search-cli -- `
  --weapon-type 10 `
  --attribute-force 4 `
  --skill-counter 186 `
  --counter-gate 200 `
  --observations 275,255,245,243
```

Observations are zero-based indices in the 294-entry set/group table. Screenshot-name input and unknown-counter searching are not implemented yet.

## Golden sample result

On the initial 16-thread development machine, a release build searched all `100,000,000` documented base seeds in approximately 4.5 seconds:

```text
observations 275,255,245     -> 7 candidates
observations 275,255,245,243 -> 1 candidate: 8524433
```

This is a local benchmark, not a performance guarantee. Debug builds are not intended for full-range searches.

The current CLI requires known `skillCounter` and `counterGate` values. A PS5-only workflow will require an additional unknown-counter strategy.
