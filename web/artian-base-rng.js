export const ARTIAN_BASE_BONUSES = [
  [4, "基礎攻撃力強化"],
  [6, "属性強化"],
  [7, "斬れ味・装填数強化"],
  [8, "会心率強化"],
];

const PROFILE_DEFINITIONS = {
  element_melee: {
    ids: [4, 6, 7, 8],
    caps: new Map([[4, 5], [6, 4], [7, 2], [8, 3]]),
  },
  raw_melee: {
    ids: [4, 7, 8],
    caps: new Map([[4, 5], [7, 2], [8, 3]]),
  },
  element_bow: {
    ids: [4, 6, 8],
    caps: new Map([[4, 5], [6, 4], [8, 3]]),
  },
  raw_bow: {
    ids: [4, 8],
    caps: new Map([[4, 5], [8, 3]]),
  },
  bowgun: {
    ids: [4, 7, 8],
    caps: new Map([[4, 5], [7, 2], [8, 3]]),
  },
};

function u32(value) {
  return value >>> 0;
}

function validateWeaponType(weaponType) {
  if (!Number.isSafeInteger(weaponType) || weaponType < 0 || weaponType > 13) {
    throw new RangeError("weaponType must be an integer from 0 to 13");
  }
}

function validateAttributeForce(attributeForce) {
  if (!Number.isSafeInteger(attributeForce) || attributeForce < 0 || attributeForce > 9) {
    throw new RangeError("attributeForce must be an integer from 0 to 9");
  }
}

export function artianBaseProfileName(weaponType, attributeForce) {
  validateWeaponType(weaponType);
  validateAttributeForce(attributeForce);
  if (weaponType === 11) return attributeForce === 0 ? "raw_bow" : "element_bow";
  if (weaponType === 12 || weaponType === 13) return "bowgun";
  return attributeForce === 0 ? "raw_melee" : "element_melee";
}

export function artianBasePool(weaponType, attributeForce) {
  const name = artianBaseProfileName(weaponType, attributeForce);
  const profile = PROFILE_DEFINITIONS[name];
  return {
    name,
    ids: [...profile.ids],
    caps: new Map(profile.caps),
  };
}

export function artianBonusMultisetContains(bonusIds, requirements) {
  const remaining = new Map();
  for (const bonusId of bonusIds) {
    remaining.set(bonusId, (remaining.get(bonusId) ?? 0) + 1);
  }
  for (const requiredId of requirements) {
    const count = remaining.get(requiredId) ?? 0;
    if (count === 0) return false;
    remaining.set(requiredId, count - 1);
  }
  return true;
}

export function initializeArtianRng(seed) {
  let seedWord = u32(seed);
  const words = [0x159a55e5, 0x1f123bb5, 0x05491333, 0x05491333];
  for (let round = 1; round <= 100; round += 1) {
    const mixed = u32((0x65ac9365 >>> (seedWord & 3)) ^ seedWord);
    seedWord = u32(
      u32(mixed << 4) ^
      u32(mixed << 3) ^
      (mixed >>> 3) ^
      (mixed >>> 4) ^
      mixed,
    );
    const temporary = u32(seedWord ^ u32(seedWord << 15));
    words[3] = u32(words[2] ^ (words[2] >>> 21) ^ temporary ^ (temporary >>> 4));
    if (round < 100) {
      words[0] = words[1];
      words[1] = words[2];
      words[2] = words[3];
    }
  }
  return words;
}

export function nextArtianRng(words) {
  const temporary = u32(words[0] ^ u32(words[0] << 15));
  const nextWord = u32(words[3] ^ (words[3] >>> 21) ^ temporary ^ (temporary >>> 4));
  words[0] = words[1];
  words[1] = words[2];
  words[2] = words[3];
  words[3] = nextWord;
  return nextWord;
}

function advanceArtianRng(words, steps) {
  for (let index = 0; index < steps; index += 1) nextArtianRng(words);
}

function drawArtianBonuses(words, weaponType, attributeForce) {
  const local = [...words];
  const profile = artianBasePool(weaponType, attributeForce);
  const pool = profile.ids.map((id) => ({
    id,
    count: 0,
    maximum: profile.caps.get(id),
  }));
  const bonusIds = [];
  for (let slot = 0; slot < 5; slot += 1) {
    const selectedIndex = nextArtianRng(local) % pool.length;
    const selected = pool[selectedIndex];
    bonusIds.push(selected.id);
    selected.count += 1;
    if (selected.count >= selected.maximum) pool.splice(selectedIndex, 1);
  }
  return bonusIds;
}

function artianDerivedSeed(baseSeed, weaponType, rarityEnum) {
  return u32(u32(baseSeed + weaponType * 1000 + rarityEnum) ^ 0x00ac9365);
}

export function createArtianBaseStream(
  baseSeed,
  weaponType,
  rarityEnum,
  attributeForce,
  createCounter,
) {
  if (!Number.isSafeInteger(baseSeed) || baseSeed < 0 || baseSeed > 99_999_999) {
    throw new RangeError("baseSeed must be an integer from 0 to 99,999,999");
  }
  validateWeaponType(weaponType);
  if (!Number.isSafeInteger(rarityEnum) || rarityEnum < 0 || rarityEnum > 0xff) {
    throw new RangeError("rarityEnum must be an integer from 0 to 255");
  }
  validateAttributeForce(attributeForce);
  if (!Number.isSafeInteger(createCounter) || createCounter < 0 || createCounter > 1_000_000) {
    throw new RangeError("createCounter must be an integer from 0 to 1,000,000");
  }

  const words = initializeArtianRng(artianDerivedSeed(baseSeed, weaponType, rarityEnum));
  advanceArtianRng(words, createCounter * 10);
  let counter = createCounter;
  return {
    next() {
      const result = {
        counter,
        bonusIds: drawArtianBonuses(words, weaponType, attributeForce),
      };
      advanceArtianRng(words, 10);
      counter += 1;
      return result;
    },
  };
}

export function predictArtianBaseRolls(
  baseSeed,
  weaponType,
  rarityEnum,
  attributeForce,
  createCounter,
  count,
) {
  if (!Number.isSafeInteger(count) || count < 0 || count > 10000) {
    throw new RangeError("count must be an integer from 0 to 10,000");
  }
  const stream = createArtianBaseStream(
    baseSeed,
    weaponType,
    rarityEnum,
    attributeForce,
    createCounter,
  );
  return Array.from({ length: count }, () => stream.next());
}

export function findArtianCreateCounters(
  baseSeed,
  weaponType,
  rarityEnum,
  attributeForce,
  counterStart,
  counterEnd,
  observations,
  maximumMatches = 100,
) {
  if (!Number.isSafeInteger(counterStart) || !Number.isSafeInteger(counterEnd) ||
      counterStart < 0 || counterEnd < counterStart || counterEnd > 1_000_000) {
    throw new RangeError("invalid counter range");
  }
  if (!Array.isArray(observations) || observations.length === 0 ||
      observations.some((roll) => !Array.isArray(roll) || roll.length !== 5)) {
    throw new TypeError("observations must contain one or more five-slot rolls");
  }

  const stream = createArtianBaseStream(
    baseSeed,
    weaponType,
    rarityEnum,
    attributeForce,
    counterStart,
  );
  const matches = [];
  const pending = [];
  const finalGeneratedCounter = Math.min(1_000_000, counterEnd + observations.length - 1);
  for (let counter = counterStart; counter <= finalGeneratedCounter; counter += 1) {
    pending.push(stream.next().bonusIds);
    if (pending.length > observations.length) pending.shift();
    if (pending.length !== observations.length) continue;
    const candidateCounter = counter - observations.length + 1;
    if (candidateCounter > counterEnd) break;
    const matchesAll = observations.every((expected, rollIndex) =>
      expected.every((bonusId, slotIndex) => bonusId === pending[rollIndex][slotIndex])
    );
    if (matchesAll) {
      matches.push(candidateCounter);
      if (matches.length >= maximumMatches) break;
    }
  }
  return matches;
}
