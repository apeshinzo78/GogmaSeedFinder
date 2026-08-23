# RNG specification

Status: draft placeholder. No implementation should be considered verified until it matches golden vectors produced from the upstream Lua implementation.

## Initial scope

The first proof of concept covers only Gogma set/group skill rolls.

Items to specify and test:

1. Unsigned 32-bit wrapping and shift semantics
2. Seed initialization and its 100 mixing rounds
3. Four-word xorshift state transition
4. Effective seed composition from base seed, weapon type, and attribute force
5. Counter gate behavior and ten RNG steps per counter position
6. Mapping from `w % 294` to set/group skills
7. Observation encoding and candidate matching

Base Artian reinforcements and Gogma amendment bonuses are intentionally deferred until the skill-stream proof of concept succeeds.
