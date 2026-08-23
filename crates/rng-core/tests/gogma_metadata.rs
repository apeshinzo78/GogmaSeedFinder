use gogma_rng_core::{GOGMA_RESET_BONUS_ORDER, GogmaBonus};
use serde::Deserialize;

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
struct Fixture {
    bonuses: Vec<BonusMetadata>,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
struct BonusMetadata {
    id: u8,
    index: u8,
    category: u8,
    lot_type: u8,
    rare: bool,
    probability: u32,
    sub_probability: u32,
    gogma_max: u8,
}

#[test]
fn matches_live_runtime_bonus_metadata() {
    let fixture: Fixture = serde_json::from_str(include_str!(
        "../../../tests/fixtures/gogma_bonus_metadata_2026-08-23.json"
    ))
    .expect("runtime metadata fixture must be valid JSON");

    assert_eq!(fixture.bonuses.len(), GOGMA_RESET_BONUS_ORDER.len());
    for (expected, actual) in fixture
        .bonuses
        .iter()
        .zip(GOGMA_RESET_BONUS_ORDER.iter().copied())
    {
        assert_eq!(actual, GogmaBonus::from_id(expected.id).unwrap());
        assert_eq!(actual.lottery_index(), expected.index);
        assert_eq!(actual.category().id(), expected.category);
        assert_eq!(actual.category().max_count(), expected.gogma_max);
        assert_eq!(actual.is_rare(), expected.rare);
        assert_eq!(actual.probability(), expected.probability);
        assert_eq!(actual.sub_probability(), expected.sub_probability);
        assert_eq!(expected.lot_type, 1);
    }
}
