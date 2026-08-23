use seed_search_cli::{CompiledSkillSearch, SeedRange, SkillSearchCriteria};
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
    skill_counter: u32,
    counter_gate: u32,
    rolls: Vec<Roll>,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
struct Roll {
    table_index: u16,
}

fn load_fixture() -> Fixture {
    serde_json::from_str(include_str!(
        "../../../tests/fixtures/skill_stream_v0.9.3.json"
    ))
    .expect("golden vector fixture must be valid JSON")
}

fn compile_case(case: &Case, observation_count: usize) -> CompiledSkillSearch {
    CompiledSkillSearch::new(SkillSearchCriteria {
        weapon_type: case.weapon_type,
        attribute_force: case.attribute_force,
        skill_counter: case.skill_counter,
        counter_gate: case.counter_gate,
        observations: case
            .rolls
            .iter()
            .take(observation_count)
            .map(|roll| roll.table_index)
            .collect(),
    })
    .expect("golden criteria must be valid")
}

#[test]
fn every_golden_case_matches_its_known_base_seed() {
    for case in load_fixture().cases {
        let compiled = compile_case(&case, 6);
        assert!(
            compiled.matches_base_seed(case.base_seed),
            "known seed did not match {}",
            case.name
        );
    }
}

#[test]
fn four_rolls_rediscover_upstream_sample_in_a_local_range() {
    let fixture = load_fixture();
    let sample = fixture
        .cases
        .iter()
        .find(|case| case.name == "upstream_sample")
        .expect("fixture must contain upstream_sample");
    let compiled = compile_case(sample, 4);

    let candidates = compiled
        .search(
            SeedRange {
                start: 8_500_000,
                end: 8_550_000,
            },
            4,
        )
        .expect("local golden search must succeed");

    assert_eq!(candidates, vec![sample.base_seed]);
}
