# rng-core

Dependency-free Rust library reproducing the deterministic skill RNG used by Gogma Artian Roll Planner v0.9.3.

Current scope:

- 32-bit seed composition
- 100-round RNG initialization
- Four-word xorshift transition
- Skill counter and counter-gate behavior
- 294-entry set/group skill mapping
- Ten-transition spacing between consecutive skill rolls

Run its tests from the repository root:

```powershell
cargo test -p gogma-rng-core
```

Base Artian reinforcement and Gogma amendment lotteries remain out of scope until the skill-stream seed-search proof of concept succeeds.
