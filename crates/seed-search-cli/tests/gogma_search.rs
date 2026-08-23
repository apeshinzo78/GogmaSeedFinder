use seed_search_cli::{
    CompiledGogmaCounterSearch, CompiledGogmaSearch, GogmaCounterRange, GogmaCounterSearchCriteria,
    GogmaSearchCriteria, GogmaSeedCounterCandidate, SearchError, SeedRange,
};
use serde::Deserialize;

#[derive(Debug, Deserialize)]
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
    rolls: Vec<Roll>,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
struct Roll {
    bonus_ids: [u8; 5],
}

fn load_fixture() -> Fixture {
    serde_json::from_str(include_str!(
        "../../../tests/fixtures/gogma_reset_stream_v0.9.3_live.json"
    ))
    .expect("Gogma golden vector fixture must be valid JSON")
}

fn load_bow_fixture() -> Fixture {
    serde_json::from_str(include_str!(
        "../../../tests/fixtures/gogma_bow_reset_stream_live_2026-08-23.json"
    ))
    .expect("Bow Gogma golden vector fixture must be valid JSON")
}

fn load_heavy_bowgun_fixture() -> Fixture {
    serde_json::from_str(include_str!(
        "../../../tests/fixtures/gogma_heavy_bowgun_reset_stream_live_2026-08-23.json"
    ))
    .expect("Heavy Bowgun Gogma golden vector fixture must be valid JSON")
}

fn compile_case(case: &Case, observation_count: usize) -> CompiledGogmaSearch {
    CompiledGogmaSearch::new(GogmaSearchCriteria {
        weapon_type: case.weapon_type,
        attribute_force: case.attribute_force,
        gogma_counter: case.gogma_counter,
        counter_gate: case.counter_gate,
        observations: case
            .rolls
            .iter()
            .take(observation_count)
            .map(|roll| roll.bonus_ids)
            .collect(),
    })
    .expect("Gogma golden criteria must be valid")
}

fn compile_counter_range_case(
    case: &Case,
    counter_range: GogmaCounterRange,
) -> CompiledGogmaCounterSearch {
    CompiledGogmaCounterSearch::new(GogmaCounterSearchCriteria {
        weapon_type: case.weapon_type,
        attribute_force: case.attribute_force,
        counter_gate: case.counter_gate,
        counter_range,
        observations: case.rolls.iter().map(|roll| roll.bonus_ids).collect(),
    })
    .expect("Gogma counter-range criteria must be valid")
}

#[test]
fn every_live_gogma_case_matches_its_known_base_seed() {
    for case in load_fixture()
        .cases
        .into_iter()
        .chain(load_bow_fixture().cases)
        .chain(load_heavy_bowgun_fixture().cases)
    {
        let compiled = compile_case(&case, case.rolls.len());
        assert!(
            compiled.matches_base_seed(case.base_seed),
            "known seed did not match {}",
            case.name
        );
    }
}

#[test]
fn displayed_save_origin_zero_is_not_raw_gogma_counter_zero() {
    let fixture = load_heavy_bowgun_fixture();
    let case = &fixture.cases[0];
    let compiled = CompiledGogmaSearch::new(GogmaSearchCriteria {
        weapon_type: case.weapon_type,
        attribute_force: case.attribute_force,
        gogma_counter: 0,
        counter_gate: case.counter_gate,
        observations: case.rolls.iter().map(|roll| roll.bonus_ids).collect(),
    })
    .expect("relative-origin regression criteria must be valid");

    assert!(
        !compiled.matches_base_seed(case.base_seed),
        "UI-relative position zero must not overwrite the saved internal Gogma counter"
    );
}

#[test]
fn six_heavy_bowgun_rolls_rediscover_live_seed_and_counter() {
    let fixture = load_heavy_bowgun_fixture();
    let case = &fixture.cases[0];
    let compiled = compile_counter_range_case(
        case,
        GogmaCounterRange {
            start: 475,
            end: 485,
        },
    );

    assert_eq!(
        compiled.matching_counters_for_base_seed(case.base_seed),
        vec![case.gogma_counter]
    );

    assert_eq!(
        compiled
            .search(
                SeedRange {
                    start: 86_315_000,
                    end: 86_315_300,
                },
                4,
            )
            .expect("local Heavy Bowgun seed/counter search must succeed"),
        vec![GogmaSeedCounterCandidate {
            base_seed: case.base_seed,
            gogma_counter: case.gogma_counter,
        }]
    );
}

#[test]
fn six_bow_rolls_rediscover_live_seed_and_counter() {
    let fixture = load_bow_fixture();
    let case = &fixture.cases[0];
    let compiled = compile_counter_range_case(
        case,
        GogmaCounterRange {
            start: 475,
            end: 485,
        },
    );

    assert_eq!(
        compiled.matching_counters_for_base_seed(case.base_seed),
        vec![case.gogma_counter]
    );

    assert_eq!(
        compiled
            .search(
                SeedRange {
                    start: 86_315_000,
                    end: 86_315_300,
                },
                4,
            )
            .expect("local Bow seed/counter search must succeed"),
        vec![GogmaSeedCounterCandidate {
            base_seed: case.base_seed,
            gogma_counter: case.gogma_counter,
        }]
    );
}

#[test]
fn six_rolls_rediscover_live_seed_in_a_local_range() {
    let fixture = load_fixture();
    let case = &fixture.cases[0];
    let compiled = compile_case(case, 6);

    let candidates = compiled
        .search(
            SeedRange {
                start: 86_300_000,
                end: 86_330_000,
            },
            4,
        )
        .expect("local Gogma golden search must succeed");

    assert_eq!(candidates, vec![case.base_seed]);
}

#[test]
fn unsupported_bonus_id_is_rejected_with_its_location() {
    let error = CompiledGogmaSearch::new(GogmaSearchCriteria {
        weapon_type: 8,
        attribute_force: 1,
        gogma_counter: 480,
        counter_gate: 200,
        observations: vec![[11, 12, 7, 14, 11]],
    })
    .expect_err("bonus ID 7 must not be accepted");

    assert_eq!(
        error,
        SearchError::InvalidGogmaObservation {
            roll_index: 0,
            slot_index: 2,
            value: 7,
        }
    );
}

#[test]
fn impossible_observation_is_rejected_before_searching() {
    let error = CompiledGogmaSearch::new(GogmaSearchCriteria {
        weapon_type: 8,
        attribute_force: 1,
        gogma_counter: 480,
        counter_gate: 200,
        observations: vec![[6, 10, 6, 8, 9]],
    })
    .expect_err("a third sharpness/ammo slot must be impossible");

    assert_eq!(
        error,
        SearchError::ImpossibleGogmaObservation { roll_index: 0 }
    );
}

#[test]
fn bow_rejects_a_sharpness_ammo_observation() {
    let error = CompiledGogmaSearch::new(GogmaSearchCriteria {
        weapon_type: 11,
        attribute_force: 4,
        gogma_counter: 480,
        counter_gate: 200,
        observations: vec![[6, 12, 15, 9, 11]],
    })
    .expect_err("Bow must not accept a Sharpness/Ammo bonus");

    assert_eq!(
        error,
        SearchError::ImpossibleGogmaObservation { roll_index: 0 }
    );
}

#[test]
fn bowguns_reject_an_element_observation() {
    for weapon_type in [12, 13] {
        let error = CompiledGogmaSearch::new(GogmaSearchCriteria {
            weapon_type,
            attribute_force: 3,
            gogma_counter: 480,
            counter_gate: 200,
            observations: vec![[11, 12, 15, 9, 6]],
        })
        .expect_err("Bowguns must not accept an Element bonus");

        assert_eq!(
            error,
            SearchError::ImpossibleGogmaObservation { roll_index: 0 }
        );
    }
}

#[test]
fn unknown_counter_search_rediscovers_the_live_seed_and_counter() {
    let fixture = load_fixture();
    let case = &fixture.cases[0];
    let compiled = compile_counter_range_case(
        case,
        GogmaCounterRange {
            start: 475,
            end: 485,
        },
    );

    assert_eq!(
        compiled.matching_counters_for_base_seed(case.base_seed),
        vec![case.gogma_counter]
    );

    let candidates = compiled
        .search(
            SeedRange {
                start: 86_315_000,
                end: 86_315_300,
            },
            4,
        )
        .expect("local unknown-counter search must succeed");
    let expected = vec![GogmaSeedCounterCandidate {
        base_seed: case.base_seed,
        gogma_counter: case.gogma_counter,
    }];
    assert_eq!(candidates, expected);

    let sequential_candidates = compiled
        .search_sequential(SeedRange {
            start: 86_315_000,
            end: 86_315_300,
        })
        .expect("sequential chunk search must succeed");
    assert_eq!(sequential_candidates, expected);
}

#[test]
fn unknown_counter_search_rejects_a_gate_that_ignores_the_counter() {
    let error = CompiledGogmaCounterSearch::new(GogmaCounterSearchCriteria {
        weapon_type: 8,
        attribute_force: 1,
        counter_gate: 34,
        counter_range: GogmaCounterRange { start: 0, end: 10 },
        observations: vec![[11, 12, 15, 14, 11]],
    })
    .expect_err("a counter below the Gogma gate cannot be identified");

    assert_eq!(
        error,
        SearchError::GogmaCounterIgnoredByGate { counter_gate: 34 }
    );
}

#[test]
fn descending_unknown_counter_range_is_rejected() {
    let error = CompiledGogmaCounterSearch::new(GogmaCounterSearchCriteria {
        weapon_type: 8,
        attribute_force: 1,
        counter_gate: 200,
        counter_range: GogmaCounterRange {
            start: 481,
            end: 480,
        },
        observations: vec![[11, 12, 15, 14, 11]],
    })
    .expect_err("descending counter ranges must be rejected");

    assert_eq!(
        error,
        SearchError::InvalidGogmaCounterRange(GogmaCounterRange {
            start: 481,
            end: 480,
        })
    );
}
