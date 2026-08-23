use gogma_rng_core::{GogmaStream, GogmaStreamParams, RngState};
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
    gogma_counter: u32,
    counter_gate: u32,
    effective_seed: u32,
    initialized_state: ExpectedState,
    counter_state: ExpectedState,
    rolls: Vec<ExpectedRoll>,
}

#[derive(Debug, Deserialize)]
struct ExpectedState {
    x: u32,
    y: u32,
    z: u32,
    w: u32,
}

impl ExpectedState {
    const fn as_rng_state(&self) -> RngState {
        RngState {
            x: self.x,
            y: self.y,
            z: self.z,
            w: self.w,
        }
    }
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
struct ExpectedRoll {
    bonus_ids: [u8; 5],
    bonus_names: [String; 5],
}

fn assert_fixture(fixture_json: &str) {
    let fixture: Fixture =
        serde_json::from_str(fixture_json).expect("golden vector fixture must be valid JSON");
    for case in fixture.cases {
        let params = GogmaStreamParams {
            base_seed: case.base_seed,
            weapon_type: case.weapon_type,
            attribute_force: case.attribute_force,
            gogma_counter: case.gogma_counter,
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
            case.initialized_state.as_rng_state(),
            "initialized state differs for {}",
            case.name
        );

        let stream = GogmaStream::new(params);
        assert_eq!(
            stream.state(),
            case.counter_state.as_rng_state(),
            "counter state differs for {}",
            case.name
        );

        let future = stream.future_reset_rolls(case.rolls.len());
        for (index, (actual, expected)) in future.iter().zip(&case.rolls).enumerate() {
            assert_eq!(
                actual.bonus_ids(),
                expected.bonus_ids,
                "bonus IDs differ for {} roll {}",
                case.name,
                index + 1
            );
            assert_eq!(
                actual.bonuses().map(gogma_rng_core::GogmaBonus::name),
                expected.bonus_names,
                "bonus names differ for {} roll {}",
                case.name,
                index + 1
            );
        }
    }
}

#[test]
fn matches_live_reset_bonuses_golden_vectors() {
    assert_fixture(include_str!(
        "../../../tests/fixtures/gogma_reset_stream_v0.9.3_live.json"
    ));
    assert_fixture(include_str!(
        "../../../tests/fixtures/gogma_bow_reset_stream_live_2026-08-23.json"
    ));
    assert_fixture(include_str!(
        "../../../tests/fixtures/gogma_heavy_bowgun_reset_stream_live_2026-08-23.json"
    ));
}
