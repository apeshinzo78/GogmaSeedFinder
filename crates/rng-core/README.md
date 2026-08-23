# rng-core

Dependency-free Rust library reproducing the deterministic skill and Gogma amendment RNG used by Gogma Artian Roll Planner v0.9.3, with a documented live-game compatibility correction.

Current scope:

- 32-bit seed composition
- 100-round RNG initialization
- Four-word xorshift transition
- Linear jump-ahead for fixed counter positions
- Skill counter and counter-gate behavior
- 294-entry set/group skill mapping
- Ten-transition spacing between consecutive skill rolls
- Gogma amendment counter and counter-gate behavior
- Five-slot weighted Reset Bonuses lottery
- Runtime category limits, including sharpness/ammo at two slots
- Derived four-slot effective maximum for element bonuses
- Live-verified eight-candidate Bow pool without sharpness/ammo bonuses
- Eight-candidate Heavy/Light Bowgun pool without element bonuses
- Consecutive future Reset Bonuses generation from a recovered seed/counter
- Category-preserving Keep Bonuses generation for an individual weapon layout

Run its tests from the repository root:

```powershell
cargo test -p gogma-rng-core
```

The Reset Bonuses path is covered by six-roll Switch Axe, Bow, and Heavy
Bowgun live-game golden vectors. Light Bowgun shares the Heavy Bowgun pool.
Keep Bonuses is covered by a six-roll GARP v0.9.3 formula vector and weapon-pool
rejection tests; an independent live-game sequence is still pending. Base
Artian reinforcement remains out of scope.
