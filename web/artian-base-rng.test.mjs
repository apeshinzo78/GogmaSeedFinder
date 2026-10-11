import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import {
  artianBasePool,
  artianBaseProfileName,
  findArtianCreateCounters,
  predictArtianBaseRolls,
} from "./artian-base-rng.js";

const lanceFixture = JSON.parse(readFileSync(
  new URL("../tests/fixtures/artian_base_lance_live_2026-10-11.json", import.meta.url),
  "utf8",
));
const multitypeFixture = JSON.parse(readFileSync(
  new URL("../tests/fixtures/artian_base_multitype_live_2026-10-11.json", import.meta.url),
  "utf8",
));

test("R8 elemental Lance live observation matches at create counter 2", () => {
  const [roll] = predictArtianBaseRolls(
    lanceFixture.baseSeed,
    lanceFixture.weaponType,
    lanceFixture.rarityEnum,
    1,
    lanceFixture.createCounter,
    1,
  );
  assert.equal(roll.counter, lanceFixture.createCounter);
  assert.deepEqual(roll.bonusIds, lanceFixture.actualBonusIds);
});

test("all 28 R8 live observations match the selected weapon profile", () => {
  for (const observation of multitypeFixture.observations) {
    assert.equal(
      artianBaseProfileName(observation.weaponType, observation.attributeForce),
      observation.profile,
    );
    const [roll] = predictArtianBaseRolls(
      multitypeFixture.baseSeed,
      observation.weaponType,
      multitypeFixture.rarityEnum,
      observation.attributeForce,
      observation.createCounter,
      1,
    );
    assert.deepEqual(
      roll.bonusIds,
      observation.bonusIds,
      `${observation.weaponTypeName} counter ${observation.createCounter}`,
    );
  }
});

test("counter search rediscovers a consecutive sequence", () => {
  const expected = predictArtianBaseRolls(86_315_169, 6, 7, 1, 2, 3)
    .map((roll) => roll.bonusIds);
  const matches = findArtianCreateCounters(86_315_169, 6, 7, 1, 0, 100, expected);
  assert.deepEqual(matches, [2]);
});

test("weapon and element choice select the expected candidate profile", () => {
  assert.deepEqual(artianBasePool(0, 1).ids, [4, 6, 7, 8]);
  assert.deepEqual(artianBasePool(0, 0).ids, [4, 7, 8]);
  assert.deepEqual(artianBasePool(11, 1).ids, [4, 6, 8]);
  assert.deepEqual(artianBasePool(11, 0).ids, [4, 8]);
  assert.deepEqual(artianBasePool(12, 1).ids, [4, 7, 8]);
  assert.deepEqual(artianBasePool(13, 0).ids, [4, 7, 8]);
});

test("category caps are respected for every supported profile", () => {
  const cases = [
    [3, 1],
    [3, 0],
    [11, 1],
    [11, 0],
    [12, 0],
    [13, 0],
  ];
  for (const [weaponType, attributeForce] of cases) {
    const profile = artianBasePool(weaponType, attributeForce);
    for (const roll of predictArtianBaseRolls(
      99_999_999,
      weaponType,
      7,
      attributeForce,
      0,
      1000,
    )) {
      const counts = new Map();
      for (const id of roll.bonusIds) counts.set(id, (counts.get(id) ?? 0) + 1);
      for (const [id, count] of counts) assert.ok(count <= profile.caps.get(id));
    }
  }
});
