use gogma_rng_core::{RngState, SkillStream, SkillStreamParams};
use serde::Deserialize;

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
struct Fixture {
    cases: Vec<Case>,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
struct Case {
    name: String,
    base_seed: u32,
    weapon_type: u32,
    attribute_force: u32,
    skill_counter: u32,
    counter_gate: u32,
    effective_seed: u32,
    initialized_state: ExpectedState,
    rolls: Vec<ExpectedRoll>,
}

#[derive(Debug, Deserialize)]
struct ExpectedState {
    x: u32,
    y: u32,
    z: u32,
    w: u32,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
struct ExpectedRoll {
    table_index: u16,
    set_name: String,
    group_name: String,
}

#[test]
fn matches_upstream_v0_9_3_golden_vectors() {
    let fixture: Fixture = serde_json::from_str(include_str!(
        "../../../tests/fixtures/skill_stream_v0.9.3.json"
    ))
    .expect("golden vector fixture must be valid JSON");

    for case in fixture.cases {
        let params = SkillStreamParams {
            base_seed: case.base_seed,
            weapon_type: case.weapon_type,
            attribute_force: case.attribute_force,
            skill_counter: case.skill_counter,
            counter_gate: case.counter_gate,
        };

        assert_eq!(
            params.effective_seed(),
            case.effective_seed,
            "effective seed differs for {}",
            case.name
        );
        assert_eq!(
            RngState::initialize(case.effective_seed),
            RngState {
                x: case.initialized_state.x,
                y: case.initialized_state.y,
                z: case.initialized_state.z,
                w: case.initialized_state.w,
            },
            "initialized state differs for {}",
            case.name
        );

        let mut stream = SkillStream::new(params);
        for (index, expected) in case.rolls.iter().enumerate() {
            let actual = if index == 0 {
                stream.current_roll()
            } else {
                stream.advance_roll()
            };

            assert_eq!(
                actual.table_index(),
                expected.table_index,
                "table index differs for {} roll {}",
                case.name,
                index
            );
            assert_eq!(
                actual.set_name(),
                expected.set_name,
                "set name differs for {} roll {}",
                case.name,
                index
            );
            assert_eq!(
                actual.group_name(),
                expected.group_name,
                "group name differs for {} roll {}",
                case.name,
                index
            );
        }
    }
}
