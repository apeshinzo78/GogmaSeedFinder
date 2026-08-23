import initWasm, {
  find_skill_counters,
  predict_gogma_keep_rolls,
  predict_gogma_rolls,
  predict_skill_rolls,
} from "./pkg/gogma_wasm_search.js";

const WEAPON_TYPES = [
  [0, "大剣"],
  [1, "片手剣"],
  [2, "双剣"],
  [3, "太刀"],
  [4, "ハンマー"],
  [5, "狩猟笛"],
  [6, "ランス"],
  [7, "ガンランス"],
  [8, "スラッシュアックス"],
  [9, "チャージアックス"],
  [10, "操虫棍"],
  [11, "弓"],
  [12, "ヘビィボウガン"],
  [13, "ライトボウガン"],
];

// The displayed element order differs from the RNG's attribute-force enum:
// Thunder uses 4 and Ice uses 3.
const ATTRIBUTES = [
  [0, "無属性"],
  [1, "火属性"],
  [2, "水属性"],
  [4, "雷属性"],
  [3, "氷属性"],
  [5, "龍属性"],
  [6, "毒属性"],
  [7, "麻痺属性"],
  [8, "睡眠属性"],
  [9, "爆破属性"],
];

const GOGMA_BONUSES = [
  [8, "基礎攻撃力強化Ⅱ"],
  [12, "基礎攻撃力強化Ⅲ"],
  [15, "基礎攻撃力強化ＥＸ"],
  [9, "会心率強化Ⅱ"],
  [13, "会心率強化Ⅲ"],
  [16, "会心率強化ＥＸ"],
  [11, "属性強化Ⅱ"],
  [14, "属性強化ＥＸ"],
  [6, "斬れ味・装填強化Ⅰ"],
  [10, "斬れ味・装填強化ＥＸ"],
];

const GOGMA_BONUS_CATEGORIES = [
  [0, "攻撃"],
  [1, "会心"],
  [2, "属性"],
  [3, "斬れ味・装填数"],
];

const SERIES_SKILLS = [
  "闢獣の力",
  "火竜の力",
  "暗器蛸の力",
  "鎧竜の守護",
  "雪獅子の闘志",
  "兇爪竜の力",
  "雷顎竜の闘志",
  "波衣竜の守護",
  "煌雷竜の力",
  "獄焔蛸の反逆",
  "凍峰竜の反逆",
  "黒蝕竜の力",
  "鎖刃竜の飢餓",
  "護鎖刃竜の命脈",
  "泡狐竜の力",
  "白熾龍の脈動",
  "海竜の渦雷",
  "千刃竜の闘志",
  "巨戟龍の黙示録",
  "暗黒騎士の証",
  "オメガレゾナンス",
];

const GROUP_SKILLS = [
  "甲虫の知らせ",
  "甲虫の擬態",
  "革細工の柔性",
  "革細工の滑性",
  "鱗張りの技法",
  "鱗重ねの工夫",
  "毛皮の昂揚",
  "毛皮の誘惑",
  "ヌシの誇り",
  "ヌシの憤激",
  "護竜の脈動",
  "護竜の守り",
  "先達の導き",
  "ヌシの魂",
];

const BOW_WEAPON_TYPE = 11;
const HEAVY_BOWGUN_WEAPON_TYPE = 12;
const BOWGUN_WEAPON_TYPES = new Set([12, 13]);
const SHARPNESS_AMMO_BONUS_IDS = new Set([6, 10]);
const ELEMENT_BONUS_IDS = new Set([11, 14]);
const EX_BONUS_IDS = new Set([10, 14, 15, 16]);
const LORDS_SOUL_GROUP_INDEX = 13;
const PRIORITY_GROUP_SKILL_INDICES = [LORDS_SOUL_GROUP_INDEX];
const PRIORITY_SERIES_SKILL_INDICES = [11, 6, 5, 18];
const SKILL_COUNTER_GATE = 54;
const MAX_REGISTERED_TARGETS = 16;
const STORAGE_KEY = "gogma-seed-finder-state-v1";

const SAMPLE_OBSERVATIONS = [
  [11, 12, 15, 14, 11],
  [9, 14, 8, 16, 11],
  [6, 13, 10, 11, 8],
  [8, 12, 6, 15, 10],
  [15, 8, 8, 6, 16],
  [14, 8, 11, 15, 10],
];

const BOW_SAMPLE_OBSERVATIONS = [
  [13, 14, 15, 12, 15],
  [9, 13, 14, 16, 15],
  [11, 13, 12, 14, 14],
  [11, 13, 15, 14, 9],
  [11, 15, 13, 13, 12],
  [12, 16, 12, 15, 9],
];

const HEAVY_BOWGUN_SAMPLE_OBSERVATIONS = [
  [13, 6, 8, 12, 6],
  [13, 10, 12, 15, 6],
  [9, 15, 9, 16, 6],
  [12, 16, 6, 8, 9],
  [12, 13, 15, 6, 9],
  [15, 9, 6, 16, 12],
];

const form = document.querySelector("#search-form");
const errorBox = document.querySelector("#form-error");
const startButton = document.querySelector("#start-button");
const cancelButton = document.querySelector("#cancel-button");
const statusText = document.querySelector("#status-text");
const progressBar = document.querySelector("#progress-bar");
const progressValue = document.querySelector("#progress-value");
const checkedValue = document.querySelector("#checked-value");
const elapsedValue = document.querySelector("#elapsed-value");
const candidateValue = document.querySelector("#candidate-value");
const emptyResult = document.querySelector("#empty-result");
const candidateList = document.querySelector("#candidate-list");
const workerInput = document.querySelector("#worker-count");
const observationRows = document.querySelector("#observation-rows");
const removeObservationButton = document.querySelector("#remove-observation");
const weaponSelect = document.querySelector("#weapon-type");
const attributeSelect = document.querySelector("#attribute-force");
const bonusPoolNote = document.querySelector("#bonus-pool-note");
const predictionPanel = document.querySelector("#prediction-panel");
const predictionStatus = document.querySelector("#prediction-status");
const predictionSeed = document.querySelector("#prediction-seed");
const predictionOrigin = document.querySelector("#prediction-origin");
const predictionWeaponSelect = document.querySelector("#prediction-weapon-type");
const predictionAttributeSelect = document.querySelector("#prediction-attribute-force");
const predictionCountInput = document.querySelector("#prediction-count");
const predictionPoolNote = document.querySelector("#prediction-pool-note");
const predictionFilters = document.querySelector("#prediction-filters");
const predictionMatchesOnly = document.querySelector("#prediction-matches-only");
const predictionError = document.querySelector("#prediction-error");
const predictionRows = document.querySelector("#prediction-rows");
const comparisonStatus = document.querySelector("#comparison-status");
const comparisonWeaponSelect = document.querySelector("#comparison-weapon-type");
const comparisonAttributeSelect = document.querySelector("#comparison-attribute-force");
const comparisonCountInput = document.querySelector("#comparison-count");
const bonusExFilterEnabled = document.querySelector("#bonus-ex-filter-enabled");
const bonusExFilterCountSelect = document.querySelector("#bonus-ex-filter-count");
const addComparisonTargetButton = document.querySelector("#add-comparison-target");
const clearComparisonTargetsButton = document.querySelector("#clear-comparison-targets");
const comparisonTargetList = document.querySelector("#comparison-target-list");
const comparisonError = document.querySelector("#comparison-error");
const comparisonTableWrap = document.querySelector("#comparison-table-wrap");
const comparisonHeaderRow = document.querySelector("#comparison-header-row");
const comparisonRows = document.querySelector("#comparison-rows");
const continuationCodeInput = document.querySelector("#continuation-code");
const openContinuationButton = document.querySelector("#open-continuation");
const continuationMessage = document.querySelector("#continuation-message");
const continuationError = document.querySelector("#continuation-error");
const skillStatus = document.querySelector("#skill-status");
const skillWeaponSelect = document.querySelector("#skill-weapon-type");
const skillAttributeSelect = document.querySelector("#skill-attribute-force");
const skillPredictionCountInput = document.querySelector("#skill-prediction-count");
const skillFilterEnabled = document.querySelector("#skill-filter-enabled");
const skillFilterGroupSelect = document.querySelector("#skill-filter-group");
const skillFilterOperatorSelect = document.querySelector("#skill-filter-operator");
const skillFilterSeriesSelect = document.querySelector("#skill-filter-series");
const skillObservationRows = document.querySelector("#skill-observation-rows");
const addSkillObservationButton = document.querySelector("#add-skill-observation");
const removeSkillObservationButton = document.querySelector("#remove-skill-observation");
const findSkillPositionButton = document.querySelector("#find-skill-position");
const skillError = document.querySelector("#skill-error");
const skillTableWrap = document.querySelector("#skill-table-wrap");
const skillPredictionRows = document.querySelector("#skill-prediction-rows");
const skillPredictionHeaderRow = document.querySelector("#skill-prediction-header-row");
const skillFutureStatus = document.querySelector("#skill-future-status");
const stateBaseSeed = document.querySelector("#state-base-seed");
const stateBonusCounter = document.querySelector("#state-bonus-counter");
const stateSkillCounter = document.querySelector("#state-skill-counter");
const stateBaseSeedStatus = document.querySelector("#state-base-seed-status");
const stateBonusCounterStatus = document.querySelector("#state-bonus-counter-status");
const stateSkillCounterStatus = document.querySelector("#state-skill-counter-status");
const saveStateSummary = document.querySelector("#save-state-summary");
const skillSearchBaseSeed = document.querySelector("#skill-search-base-seed");
const bonusStateBaseSeedInput = document.querySelector("#bonus-state-base-seed");
const bonusStateCounterInput = document.querySelector("#bonus-state-counter");
const bonusStateSkillCounterInput = document.querySelector("#bonus-state-skill-counter");
const applyBonusStateButton = document.querySelector("#apply-bonus-state");
const bonusStateMessage = document.querySelector("#bonus-state-message");
const bonusStateError = document.querySelector("#bonus-state-error");
const skillStateBaseSeedInput = document.querySelector("#skill-state-base-seed");
const skillStateCounterInput = document.querySelector("#skill-state-counter");
const skillStateBonusCounterInput = document.querySelector("#skill-state-bonus-counter");
const applySkillStateButton = document.querySelector("#apply-skill-state");
const skillStateMessage = document.querySelector("#skill-state-message");
const skillStateError = document.querySelector("#skill-state-error");
const comparisonTargetLabelInput = document.querySelector("#comparison-target-label");
const skillTargetLabelInput = document.querySelector("#skill-target-label");
const skillTargetWeaponSelect = document.querySelector("#skill-target-weapon-type");
const skillTargetAttributeSelect = document.querySelector("#skill-target-attribute-force");
const addSkillTargetButton = document.querySelector("#add-skill-target");
const clearSkillTargetsButton = document.querySelector("#clear-skill-targets");
const skillTargetList = document.querySelector("#skill-target-list");
const skillTargetError = document.querySelector("#skill-target-error");
const bonusFutureKicker = document.querySelector("#bonus-future-kicker");
const bonusOperationReset = document.querySelector("#bonus-operation-reset");
const bonusOperationKeep = document.querySelector("#bonus-operation-keep");
const keepLayoutPanel = document.querySelector("#keep-layout-panel");
const keepLayoutInputs = document.querySelector("#keep-layout-inputs");
const keepLayoutSource = document.querySelector("#keep-layout-source");
const keepLayoutError = document.querySelector("#keep-layout-error");
const detailPredictionSection = document.querySelector(".detail-prediction-section");
const tabButtons = [...document.querySelectorAll("[data-tab]")];
const tabViews = [...document.querySelectorAll("[data-tab-view]")];

const suggestedWorkers = Math.min(8, Math.max(1, navigator.hardwareConcurrency ?? 4));
workerInput.value = String(suggestedWorkers);
populateSelect(weaponSelect, WEAPON_TYPES, 8);
populateSelect(attributeSelect, ATTRIBUTES, 1);
populateSelect(predictionWeaponSelect, WEAPON_TYPES, 8);
populateSelect(predictionAttributeSelect, ATTRIBUTES, 1);
populateSelect(comparisonWeaponSelect, WEAPON_TYPES, 3);
populateSelect(comparisonAttributeSelect, ATTRIBUTES, 1);
populateSelect(skillWeaponSelect, WEAPON_TYPES, 8);
populateSelect(skillAttributeSelect, ATTRIBUTES, 1);
populateSelect(skillTargetWeaponSelect, WEAPON_TYPES, 3);
populateSelect(skillTargetAttributeSelect, ATTRIBUTES, 1);
populateSelect(
  skillFilterGroupSelect,
  [[-1, "指定しない"], ...prioritizedSkillOptions(GROUP_SKILLS, PRIORITY_GROUP_SKILL_INDICES)],
  LORDS_SOUL_GROUP_INDEX,
);
populateSelect(
  skillFilterSeriesSelect,
  [[-1, "指定しない"], ...prioritizedSkillOptions(SERIES_SKILLS, PRIORITY_SERIES_SKILL_INDICES)],
  11,
);
const persistedAppState = loadPersistedAppState();
let saveState = persistedAppState.saveState;
let comparisonTargets = persistedAppState.targets;
let bonusPrediction = persistedAppState.bonusPrediction;
renderObservationRows(SAMPLE_OBSERVATIONS);
renderSkillObservationRows(Array.from({ length: 4 }, () => null));
updateBonusPoolNote();
renderPredictionFilters();
updatePredictionPoolNote();

let activeWorkers = [];
let workerProgress = [];
let completedWorkers = 0;
let foundCandidates = new Map();
let startedAt = 0;
let elapsedTimer = null;
let cancelled = false;
let lastSearchConfig = null;
let selectedCandidate = null;
let predictionRolls = [];
let predictionWasmReady = null;
let predictionRequestId = 0;
let comparisonRollSets = [];
let comparisonRequestId = 0;
let skillPredictionRollSets = [];
let selectedSkillCounter = null;
let skillObservedCount = 0;
let currentSkillObservations = [];

renderComparisonTargets();
renderBonusOperation();
syncRuntimeFromSaveState();
renderSaveState();
setActiveTab(location.hash.slice(1) || "guide", false);
if (selectedCandidate) {
  void Promise.all([refreshPredictions(), refreshComparisonPredictions()]);
}
if (selectedSkillCounter !== null) void refreshSkillPredictions();

document.querySelector("#load-sample").addEventListener("click", () => {
  weaponSelect.value = "8";
  attributeSelect.value = "1";
  document.querySelector("#counter-start").value = "475";
  document.querySelector("#counter-end").value = "485";
  document.querySelector("#seed-start").value = "0";
  document.querySelector("#seed-end").value = "99999999";
  renderObservationRows(SAMPLE_OBSERVATIONS);
  updateBonusPoolNote();
  hideError();
});

document.querySelector("#load-bow-sample").addEventListener("click", () => {
  weaponSelect.value = String(BOW_WEAPON_TYPE);
  attributeSelect.value = "4";
  document.querySelector("#counter-start").value = "475";
  document.querySelector("#counter-end").value = "485";
  document.querySelector("#seed-start").value = "0";
  document.querySelector("#seed-end").value = "99999999";
  renderObservationRows(BOW_SAMPLE_OBSERVATIONS);
  updateBonusPoolNote();
  hideError();
});

document.querySelector("#load-heavy-bowgun-sample").addEventListener("click", () => {
  weaponSelect.value = String(HEAVY_BOWGUN_WEAPON_TYPE);
  attributeSelect.value = "3";
  document.querySelector("#counter-start").value = "475";
  document.querySelector("#counter-end").value = "485";
  document.querySelector("#seed-start").value = "0";
  document.querySelector("#seed-end").value = "99999999";
  renderObservationRows(HEAVY_BOWGUN_SAMPLE_OBSERVATIONS);
  updateBonusPoolNote();
  hideError();
});

weaponSelect.addEventListener("change", () => {
  const currentValues = snapshotObservationValues();
  renderObservationRows(currentValues);
  updateBonusPoolNote();
  hideError();
});

document.querySelector("#add-observation").addEventListener("click", () => {
  observationRows.append(createObservationRow());
  renumberObservationRows();
});

removeObservationButton.addEventListener("click", () => {
  const rows = observationRows.querySelectorAll(".observation-row");
  if (rows.length > 1) rows[rows.length - 1].remove();
  renumberObservationRows();
});

form.addEventListener("submit", (event) => {
  event.preventDefault();
  try {
    beginSearch(readConfig());
  } catch (error) {
    showError(error instanceof Error ? error.message : String(error));
  }
});

cancelButton.addEventListener("click", () => finishCancelled());

tabButtons.forEach((button) => {
  button.addEventListener("click", () => setActiveTab(button.dataset.tab));
});

predictionWeaponSelect.addEventListener("change", () => {
  const currentFilters = snapshotPredictionFilters();
  renderPredictionFilters(currentFilters);
  updatePredictionPoolNote();
  void refreshPredictions();
});

predictionAttributeSelect.addEventListener("change", () => void refreshPredictions());
predictionCountInput.addEventListener("change", () => void refreshPredictions());
predictionMatchesOnly.addEventListener("change", () => renderPredictionTable());
predictionFilters.addEventListener("change", () => renderPredictionTable());

addComparisonTargetButton.addEventListener("click", () => void addComparisonTarget());
clearComparisonTargetsButton.addEventListener("click", () => {
  comparisonTargets = [];
  comparisonRollSets = [];
  renderComparisonTargets();
  renderComparisonTable();
  clearSkillPredictionResults();
  persistAppState();
});
comparisonCountInput.addEventListener("change", () => void refreshComparisonPredictions());
[bonusExFilterEnabled, bonusExFilterCountSelect]
  .forEach((control) => control.addEventListener("change", () => renderComparisonTable()));

addSkillTargetButton.addEventListener("click", () => void addSkillTarget());
clearSkillTargetsButton.addEventListener("click", () => {
  comparisonTargets = [];
  comparisonRollSets = [];
  renderComparisonTargets();
  renderComparisonTable();
  clearSkillPredictionResults();
  persistAppState();
});

applyBonusStateButton.addEventListener("click", () => void applyBonusPredictionState());
applySkillStateButton.addEventListener("click", () => void applySkillPredictionState());

document.querySelector("#bonus-operation-selector").addEventListener("change", () => {
  bonusPrediction.mode = bonusOperationKeep.checked ? "keep" : "reset";
  renderBonusOperation();
  persistAppState();
  const currentFilters = snapshotPredictionFilters();
  renderPredictionFilters(currentFilters);
  updatePredictionPoolNote();
  void Promise.all([refreshPredictions(), refreshComparisonPredictions()]);
});

openContinuationButton.addEventListener("click", () => void openContinuationCode());
continuationCodeInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    event.preventDefault();
    void openContinuationCode();
  }
});

addSkillObservationButton.addEventListener("click", () => {
  skillObservationRows.append(createSkillObservationRow());
  renumberSkillObservationRows();
  resetSkillSearchFeedback();
});

removeSkillObservationButton.addEventListener("click", () => {
  const rows = skillObservationRows.querySelectorAll(".skill-observation-row");
  if (rows.length > 1) rows[rows.length - 1].remove();
  renumberSkillObservationRows();
  resetSkillSearchFeedback();
});

skillObservationRows.addEventListener("change", () => resetSkillSearchFeedback());
skillWeaponSelect.addEventListener("change", () => resetSkillSearchFeedback());
skillAttributeSelect.addEventListener("change", () => resetSkillSearchFeedback());
skillPredictionCountInput.addEventListener("change", () => {
  if (selectedSkillCounter !== null) void refreshSkillPredictions();
});
[skillFilterEnabled, skillFilterGroupSelect, skillFilterOperatorSelect, skillFilterSeriesSelect]
  .forEach((control) => control.addEventListener("change", () => renderSkillPredictionTable()));
document.querySelectorAll('input[name="desired-series"]').forEach((checkbox) => {
  checkbox.addEventListener("change", () => renderSkillPredictionTable());
});
findSkillPositionButton.addEventListener("click", () => void findSkillPosition());

function readConfig() {
  const weaponType = readInteger("weapon-type", "武器種", 0, 13);
  const attributeForce = readInteger("attribute-force", "武器の属性", 0, 9);
  const counterStart = readInteger("counter-start", "内部位置の開始", 0, 0xffffffff);
  const counterEnd = readInteger("counter-end", "内部位置の終了", 0, 0xffffffff);
  const seedStart = readInteger("seed-start", "seed開始", 0, 99_999_999);
  const seedEnd = readInteger("seed-end", "seed終了", 0, 99_999_999);
  const requestedWorkers = readInteger("worker-count", "並列Worker数", 1, 16);

  if (counterStart > counterEnd) throw new Error("内部位置の開始は終了以下にしてください。");
  if (seedStart > seedEnd) throw new Error("seed開始は終了以下にしてください。");

  const observations = readObservations();
  const totalSeeds = seedEnd - seedStart + 1;
  return {
    weaponType,
    attributeForce,
    counterStart,
    counterEnd,
    counterGate: 35,
    seedStart,
    seedEnd,
    observations,
    workerCount: Math.min(requestedWorkers, totalSeeds),
    chunkSize: 50_000,
  };
}

function readInteger(id, label, minimum, maximum) {
  const raw = document.querySelector(`#${id}`).value.trim();
  const value = Number(raw);
  if (!Number.isSafeInteger(value) || value < minimum || value > maximum) {
    throw new Error(`${label}は${minimum}〜${maximum.toLocaleString("ja-JP")}の整数で入力してください。`);
  }
  return value;
}

function populateSelect(select, options, selectedValue) {
  select.replaceChildren(
    ...options.map(([value, label]) => {
      const option = document.createElement("option");
      option.value = String(value);
      option.textContent = label;
      option.selected = value === selectedValue;
      return option;
    }),
  );
}

function prioritizedSkillOptions(labels, priorityIndices) {
  const priority = new Set(priorityIndices);
  return [
    ...priorityIndices.map((index) => [index, labels[index]]),
    ...labels.flatMap((label, index) => priority.has(index) ? [] : [[index, label]]),
  ];
}

function loadPersistedAppState() {
  const emptyState = {
    baseSeed: null,
    bonusCounter: null,
    skillCounter: null,
    baseSource: null,
    bonusSource: null,
    skillSource: null,
  };
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "null");
    const candidateState = saved?.saveState ?? {};
    const baseSeed = candidateState.baseSeed === null || candidateState.baseSeed === undefined
      ? Number.NaN
      : Number(candidateState.baseSeed);
    const bonusCounter = candidateState.bonusCounter === null || candidateState.bonusCounter === undefined
      ? Number.NaN
      : Number(candidateState.bonusCounter);
    const skillCounter = candidateState.skillCounter === null || candidateState.skillCounter === undefined
      ? Number.NaN
      : Number(candidateState.skillCounter);
    const normalizedState = {
      ...emptyState,
      baseSeed: Number.isSafeInteger(baseSeed) && baseSeed >= 0 && baseSeed <= 99_999_999
        ? baseSeed
        : null,
      bonusCounter: isValidCounter(bonusCounter) ? bonusCounter : null,
      skillCounter: isValidCounter(skillCounter) ? skillCounter : null,
      baseSource: typeof candidateState.baseSource === "string" ? candidateState.baseSource : null,
      bonusSource: typeof candidateState.bonusSource === "string" ? candidateState.bonusSource : null,
      skillSource: typeof candidateState.skillSource === "string" ? candidateState.skillSource : null,
    };
    const targets = Array.isArray(saved?.targets)
      ? saved.targets
          .filter((target) =>
            Number.isSafeInteger(target?.weaponType) &&
            target.weaponType >= 0 &&
            target.weaponType <= 13 &&
            Number.isSafeInteger(target?.attributeForce) &&
            target.attributeForce >= 0 &&
            target.attributeForce <= 9,
          )
          .slice(0, MAX_REGISTERED_TARGETS)
          .map((target, index) => ({
            id: typeof target.id === "string" && target.id ? target.id : `legacy-${index}`,
            weaponType: target.weaponType,
            attributeForce: target.attributeForce,
            label: typeof target.label === "string" ? target.label.slice(0, 24) : "",
            keepCategories: normalizeKeepCategories(target.keepCategories),
            keepSource: typeof target.keepSource === "string" ? target.keepSource : null,
          }))
      : [];
    const bonusPrediction = {
      mode: saved?.bonusPrediction?.mode === "keep" ? "keep" : "reset",
    };
    return { saveState: normalizedState, targets, bonusPrediction };
  } catch {
    return { saveState: emptyState, targets: [], bonusPrediction: { mode: "reset" } };
  }
}

function persistAppState() {
  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ saveState, targets: comparisonTargets, bonusPrediction }),
    );
  } catch {
    // The app remains usable when storage is unavailable.
  }
}

function normalizeKeepCategories(categories) {
  if (!Array.isArray(categories) || categories.length !== 5) return [null, null, null, null, null];
  return categories.map((category) =>
    Number.isSafeInteger(category) && category >= 0 && category <= 3 ? category : null,
  );
}

function createTargetId() {
  if (typeof crypto.randomUUID === "function") return crypto.randomUUID();
  return `target-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function setActiveTab(tabName, updateHash = true) {
  const validTab = tabViews.some((view) => view.dataset.tabView === tabName)
    ? tabName
    : "guide";
  for (const button of tabButtons) {
    const active = button.dataset.tab === validTab;
    button.classList.toggle("active", active);
    button.setAttribute("aria-selected", String(active));
  }
  for (const view of tabViews) {
    const active = view.dataset.tabView === validTab;
    view.classList.toggle("active", active);
    view.hidden = !active;
  }
  if (updateHash && location.hash !== `#${validTab}`) history.replaceState(null, "", `#${validTab}`);
}

function syncRuntimeFromSaveState() {
  selectedCandidate = saveState.baseSeed !== null && saveState.bonusCounter !== null
    ? { seed: saveState.baseSeed, counter: saveState.bonusCounter }
    : null;
  selectedSkillCounter = saveState.baseSeed !== null ? saveState.skillCounter : null;
  if (selectedCandidate && !lastSearchConfig) {
    lastSearchConfig = {
      weaponType: Number(weaponSelect.value),
      attributeForce: Number(attributeSelect.value),
      counterGate: 35,
      observations: [],
    };
  }
}

function stateSourceText(source, fallback) {
  return source ? `${source}から設定` : fallback;
}

function renderSaveState() {
  const knownCount = [saveState.baseSeed, saveState.bonusCounter, saveState.skillCounter]
    .filter((value) => value !== null).length;
  stateBaseSeed.textContent = saveState.baseSeed === null
    ? "未特定"
    : saveState.baseSeed.toLocaleString("ja-JP");
  stateBonusCounter.textContent = saveState.bonusCounter === null
    ? "未特定"
    : saveState.bonusCounter.toLocaleString("ja-JP");
  stateSkillCounter.textContent = saveState.skillCounter === null
    ? "未特定"
    : saveState.skillCounter.toLocaleString("ja-JP");
  stateBaseSeedStatus.textContent = stateSourceText(saveState.baseSource, "検索または手入力が必要");
  stateBonusCounterStatus.textContent = stateSourceText(saveState.bonusSource, "検索または手入力が必要");
  stateSkillCounterStatus.textContent = stateSourceText(saveState.skillSource, "スキル結果から特定");
  saveStateSummary.textContent = knownCount === 3 ? "3値を特定済み" : `${knownCount}/3 特定済み`;
  saveStateSummary.className = `status-pill${knownCount === 3 ? " complete" : ""}`;
  skillSearchBaseSeed.textContent = saveState.baseSeed === null
    ? "未特定"
    : saveState.baseSeed.toLocaleString("ja-JP");

  bonusStateBaseSeedInput.value = saveState.baseSeed ?? "";
  bonusStateCounterInput.value = saveState.bonusCounter ?? "";
  bonusStateSkillCounterInput.value = saveState.skillCounter ?? "未特定";
  skillStateBaseSeedInput.value = saveState.baseSeed ?? "";
  skillStateCounterInput.value = saveState.skillCounter ?? "";
  skillStateBonusCounterInput.value = saveState.bonusCounter ?? "未特定";
  predictionSeed.textContent = saveState.baseSeed === null
    ? "—"
    : saveState.baseSeed.toLocaleString("ja-JP");

  const stateCode = currentStateCode();
  if (stateCode) continuationCodeInput.value = stateCode;
  syncRuntimeFromSaveState();
  updateComparisonStatus();
  resetSkillSearchFeedback();
  persistAppState();
}

function renderBonusOperation() {
  const keepMode = bonusPrediction.mode === "keep";
  bonusOperationReset.checked = !keepMode;
  bonusOperationKeep.checked = keepMode;
  keepLayoutPanel.hidden = !keepMode;
  detailPredictionSection.hidden = keepMode;
  bonusFutureKicker.textContent = keepMode ? "KEEP BONUSES FUTURE" : "RESET BONUSES FUTURE";
  renderKeepLayoutInputs();
  updateComparisonStatus();
}

function renderKeepLayoutInputs() {
  keepLayoutError.hidden = true;
  if (comparisonTargets.length === 0) {
    const empty = document.createElement("p");
    empty.className = "prediction-empty";
    empty.textContent = "先にEX厳選する武器を登録してください。";
    keepLayoutInputs.replaceChildren(empty);
    keepLayoutSource.textContent = "武器登録待ち";
    keepLayoutSource.className = "status-pill";
    return;
  }

  let readyCount = 0;
  const cards = comparisonTargets.map((target) => {
    const card = document.createElement("section");
    const heading = document.createElement("div");
    const name = document.createElement("strong");
    const source = document.createElement("span");
    const slots = document.createElement("div");
    const categories = normalizeKeepCategories(target.keepCategories);
    target.keepCategories = categories;
    card.className = "keep-layout-card";
    heading.className = "keep-layout-card-heading";
    slots.className = "keep-layout-slots";
    name.textContent = comparisonTargetName(target);
    source.textContent = target.keepSource ? `${target.keepSource}から設定` : "現在構成を入力";
    heading.append(name, source);

    const options = keepCategoriesForWeapon(target.weaponType);
    for (let slotIndex = 0; slotIndex < 5; slotIndex += 1) {
      const label = document.createElement("label");
      const text = document.createElement("span");
      const select = document.createElement("select");
      const placeholder = document.createElement("option");
      text.textContent = `${slotIndex + 1}枠目`;
      placeholder.value = "";
      placeholder.textContent = "系統を選択";
      placeholder.selected = categories[slotIndex] === null;
      select.append(placeholder);
      for (const [category, categoryName] of options) {
        const option = document.createElement("option");
        option.value = String(category);
        option.textContent = categoryName;
        option.selected = categories[slotIndex] === category;
        select.append(option);
      }
      select.addEventListener("change", () => {
        target.keepCategories[slotIndex] = select.value === "" ? null : Number(select.value);
        target.keepSource = "手入力";
        persistAppState();
        renderKeepLayoutInputs();
        void Promise.all([refreshPredictions(), refreshComparisonPredictions()]);
      });
      label.append(text, select);
      slots.append(label);
    }
    if (keepLayoutProblem(target) === null) readyCount += 1;
    card.append(heading, slots);
    return card;
  });
  keepLayoutInputs.replaceChildren(...cards);
  keepLayoutSource.textContent = `${readyCount}/${comparisonTargets.length} 構成入力済み`;
  keepLayoutSource.className = `status-pill${readyCount === comparisonTargets.length ? " complete" : ""}`;
}

function keepCategoriesForWeapon(weaponType) {
  if (weaponType === BOW_WEAPON_TYPE) {
    return GOGMA_BONUS_CATEGORIES.filter(([category]) => category !== 3);
  }
  if (BOWGUN_WEAPON_TYPES.has(weaponType)) {
    return GOGMA_BONUS_CATEGORIES
      .filter(([category]) => category !== 2)
      .map(([category, name]) => [category, category === 3 ? "装填数" : name]);
  }
  return GOGMA_BONUS_CATEGORIES.map(([category, name]) =>
    [category, category === 3 ? "斬れ味" : name],
  );
}

function keepLayoutProblem(target) {
  const categories = normalizeKeepCategories(target.keepCategories);
  if (categories.some((category) => category === null)) return "5枠の現在構成を入力してください。";
  if (target.weaponType === BOW_WEAPON_TYPE && categories.includes(3)) {
    return "弓には斬れ味・装填系を設定できません。";
  }
  if (BOWGUN_WEAPON_TYPES.has(target.weaponType) && categories.includes(2)) {
    return "ボウガンには属性系を設定できません。";
  }
  const count = (category) => categories.filter((value) => value === category).length;
  if (count(2) > 4) return "属性系は合計4枠までです。";
  if (count(3) > 2) return "斬れ味・装填系は合計2枠までです。";
  return null;
}

function requireTargetKeepCategories(target) {
  const problem = keepLayoutProblem(target);
  if (problem) throw new Error(`${comparisonTargetName(target)}: ${problem}`);
  return target.keepCategories;
}

function currentStateCode() {
  if (saveState.baseSeed === null || saveState.bonusCounter === null) return null;
  return formatStateContinuationCode(
    saveState.baseSeed,
    saveState.bonusCounter,
    saveState.skillCounter,
  );
}

function setStateFromBonus(baseSeed, bonusCounter, source, clearSkill = false) {
  const baseChanged = saveState.baseSeed !== null && saveState.baseSeed !== baseSeed;
  saveState = {
    ...saveState,
    baseSeed,
    bonusCounter,
    skillCounter: baseChanged || clearSkill ? null : saveState.skillCounter,
    baseSource: source,
    bonusSource: source,
    skillSource: baseChanged || clearSkill ? null : saveState.skillSource,
  };
  renderSaveState();
}

function setStateFromSkill(baseSeed, skillCounter, source) {
  const baseChanged = saveState.baseSeed !== null && saveState.baseSeed !== baseSeed;
  saveState = {
    ...saveState,
    baseSeed,
    bonusCounter: baseChanged ? null : saveState.bonusCounter,
    skillCounter,
    baseSource: source,
    bonusSource: baseChanged ? null : saveState.bonusSource,
    skillSource: source,
  };
  renderSaveState();
}

function readStateNumber(input, label, maximum) {
  const value = Number(input.value.trim());
  if (!Number.isSafeInteger(value) || value < 0 || value > maximum) {
    throw new Error(`${label}は0〜${maximum.toLocaleString("ja-JP")}の整数で入力してください。`);
  }
  return value;
}

async function applyBonusPredictionState() {
  bonusStateError.hidden = true;
  bonusStateMessage.textContent = "";
  try {
    const baseSeed = readStateNumber(bonusStateBaseSeedInput, "基準seed", 99_999_999);
    const bonusCounter = readStateNumber(
      bonusStateCounterInput,
      "復元ボーナスカウンター",
      0xffffffff,
    );
    setStateFromBonus(baseSeed, bonusCounter, "手入力");
    predictionPanel.hidden = false;
    await Promise.all([refreshPredictions(), refreshComparisonPredictions()]);
    bonusStateMessage.textContent = "入力した基準seedと復元ボーナスカウンターを0地点として予測しました。";
  } catch (error) {
    bonusStateError.textContent = error instanceof Error ? error.message : String(error);
    bonusStateError.hidden = false;
  }
}

async function applySkillPredictionState() {
  skillStateError.hidden = true;
  skillStateMessage.textContent = "";
  try {
    const baseSeed = readStateNumber(skillStateBaseSeedInput, "基準seed", 99_999_999);
    const skillCounter = readStateNumber(skillStateCounterInput, "スキルカウンター", 0xffffffff);
    setStateFromSkill(baseSeed, skillCounter, "手入力");
    await refreshSkillPredictions();
    skillStateMessage.textContent = "入力した基準seedとスキルカウンターを0地点として予測しました。";
  } catch (error) {
    skillStateError.textContent = error instanceof Error ? error.message : String(error);
    skillStateError.hidden = false;
  }
}

function formatGogmaContinuationCode(candidate, completedRolls) {
  const nextGogmaCounter = candidate.counter + completedRolls;
  if (!isValidCounter(nextGogmaCounter)) {
    throw new Error("保存後の内部位置が対応範囲を超えました。");
  }
  return formatStateContinuationCode(candidate.seed, nextGogmaCounter, saveState.skillCounter);
}

function formatSkillContinuationCode(completedRolls) {
  if (saveState.baseSeed === null || saveState.skillCounter === null) {
    throw new Error("基準seedまたはスキルカウンターが特定されていません。");
  }
  if (saveState.bonusCounter === null) return null;
  const nextSkillCounter = saveState.skillCounter + completedRolls;
  if (!isValidCounter(nextSkillCounter)) {
    throw new Error("保存後のスキルカウンターが対応範囲を超えました。");
  }
  return formatStateContinuationCode(
    saveState.baseSeed,
    saveState.bonusCounter,
    nextSkillCounter,
  );
}

function formatStateContinuationCode(seed, gogmaCounter, skillCounter = null) {
  if (skillCounter === null) return `GSF1-${seed}-${gogmaCounter}`;
  return `GSF2-B${seed}-G${gogmaCounter}-S${skillCounter}`;
}

function isValidCounter(value) {
  return Number.isSafeInteger(value) && value >= 0 && value <= 0xffffffff;
}

function parseContinuationCode(rawCode) {
  const code = rawCode.trim();
  const fullMatch = code.match(/^GSF2-B(\d{1,8})-G(\d{1,10})-S(\d{1,10})$/i);
  const bonusOnlyMatch = code.match(/^GSF1-(\d{1,8})-(\d{1,10})$/i);
  if (!fullMatch && !bonusOnlyMatch) {
    throw new Error(
      "セーブ状態コードは GSF2-B基準seed-G復元カウンター-Sスキルカウンター、またはGSF1形式で入力してください。",
    );
  }

  const match = fullMatch ?? bonusOnlyMatch;
  const seed = Number(match[1]);
  const gogmaCounter = Number(match[2]);
  const skillCounter = fullMatch ? Number(match[3]) : null;
  if (!Number.isSafeInteger(seed) || seed < 0 || seed > 99_999_999) {
    throw new Error("状態コード内の基準seedが範囲外です。");
  }
  if (!isValidCounter(gogmaCounter)) {
    throw new Error("状態コード内の復元ボーナスカウンターが範囲外です。");
  }
  if (skillCounter !== null && !isValidCounter(skillCounter)) {
    throw new Error("状態コード内のスキルカウンターが範囲外です。");
  }
  return { seed, counter: gogmaCounter, skillCounter };
}

async function openContinuationCode() {
  hideContinuationError();
  continuationMessage.textContent = "";

  try {
    const parsedState = parseContinuationCode(continuationCodeInput.value);
    const candidate = { seed: parsedState.seed, counter: parsedState.counter };
    stopWorkers();
    resetResults();
    lastSearchConfig = {
      weaponType: Number(weaponSelect.value),
      attributeForce: Number(attributeSelect.value),
      counterGate: 35,
      observations: [],
    };
    saveState = {
      baseSeed: parsedState.seed,
      bonusCounter: parsedState.counter,
      skillCounter: parsedState.skillCounter,
      baseSource: "状態コード",
      bonusSource: "状態コード",
      skillSource: parsedState.skillCounter === null ? null : "状態コード",
    };
    renderSaveState();
    foundCandidates.set(candidateKey(candidate), candidate);
    statusText.textContent = "状態コード読込";
    statusText.className = "status-pill complete";
    renderCandidates();
    if (comparisonTargets.length === 0) {
      comparisonTargets.push({
        id: createTargetId(),
        weaponType: Number(weaponSelect.value),
        attributeForce: Number(attributeSelect.value),
        label: "",
        keepCategories: [null, null, null, null, null],
        keepSource: null,
      });
    }
    renderComparisonTargets();
    renderPredictionFilters();
    predictionPanel.hidden = false;
    await Promise.all([
      refreshPredictions(),
      refreshComparisonPredictions(),
      parsedState.skillCounter === null ? Promise.resolve() : refreshSkillPredictions(),
    ]);
    continuationMessage.textContent = parsedState.skillCounter === null
      ? "状態を読み込みました。基準seedと復元ボーナスカウンターを引き継いでいます。"
      : "状態を読み込みました。基準seedと2つのカウンターを引き継いでいます。";
    setActiveTab("bonus-future");
  } catch (error) {
    showContinuationError(error instanceof Error ? error.message : String(error));
  }
}

async function useContinuationCode(code) {
  if (!code) return;
  continuationCodeInput.value = code;
  hideContinuationError();
  continuationMessage.textContent = `セーブ状態コードを入力欄へコピーしました: ${code}`;
  try {
    await navigator.clipboard.writeText(code);
    continuationMessage.textContent = `セーブ状態コードをクリップボードへコピーしました: ${code}`;
  } catch {
    // Clipboard permission is not available in every browser context. The input is still populated.
  }
}

function showContinuationError(message) {
  continuationError.textContent = message;
  continuationError.hidden = false;
}

function hideContinuationError() {
  continuationError.textContent = "";
  continuationError.hidden = true;
}

function renderObservationRows(rolls) {
  observationRows.replaceChildren(...rolls.map((roll) => createObservationRow(roll)));
  renumberObservationRows();
}

function renderSkillObservationRows(rolls) {
  skillObservationRows.replaceChildren(
    ...rolls.map((roll) => createSkillObservationRow(roll)),
  );
  renumberSkillObservationRows();
}

function createSkillObservationRow(value = null) {
  const row = document.createElement("div");
  row.className = "skill-observation-row";

  const rollNumber = document.createElement("span");
  rollNumber.className = "roll-number";
  row.append(rollNumber);

  row.append(
    createIndexedSkillSelect("series", SERIES_SKILLS, value?.seriesIndex ?? null),
    createIndexedSkillSelect("group", GROUP_SKILLS, value?.groupIndex ?? null),
  );
  return row;
}

function createIndexedSkillSelect(kind, skills, selectedIndex) {
  const label = document.createElement("label");
  const accessibleLabel = document.createElement("span");
  const select = document.createElement("select");
  const placeholder = document.createElement("option");

  accessibleLabel.className = `sr-only ${kind}-skill-label`;
  select.dataset.skillKind = kind;
  placeholder.value = "";
  placeholder.textContent = kind === "series" ? "シリーズを選択" : "グループを選択";
  placeholder.disabled = true;
  placeholder.selected = selectedIndex === null;
  select.append(placeholder);

  skills.forEach((skill, index) => {
    const option = document.createElement("option");
    option.value = String(index);
    option.textContent = skill;
    option.selected = selectedIndex === index;
    select.append(option);
  });

  label.append(accessibleLabel, select);
  return label;
}

function renumberSkillObservationRows() {
  const rows = [...skillObservationRows.querySelectorAll(".skill-observation-row")];
  rows.forEach((row, rollIndex) => {
    row.querySelector(".roll-number").textContent = `再付与 ${rollIndex + 1}`;
    row.querySelector(".series-skill-label").textContent =
      `再付与${rollIndex + 1}のシリーズスキル`;
    row.querySelector(".group-skill-label").textContent =
      `再付与${rollIndex + 1}のグループスキル`;
  });
  removeSkillObservationButton.disabled = rows.length <= 1;
}

function readSkillObservations() {
  const rows = [...skillObservationRows.querySelectorAll(".skill-observation-row")];
  if (rows.length === 0) throw new Error("スキル再付与結果を1回以上入力してください。");

  return rows.map((row, rollIndex) => {
    const seriesSelect = row.querySelector('[data-skill-kind="series"]');
    const groupSelect = row.querySelector('[data-skill-kind="group"]');
    if (seriesSelect.value === "" || groupSelect.value === "") {
      throw new Error(`再付与${rollIndex + 1}のシリーズとグループを選択してください。`);
    }
    return Number(seriesSelect.value) * GROUP_SKILLS.length + Number(groupSelect.value);
  });
}

function availableGogmaBonuses() {
  return gogmaBonusesForWeapon(Number(weaponSelect.value));
}

function gogmaBonusesForWeapon(weaponType) {
  if (weaponType === BOW_WEAPON_TYPE) {
    return GOGMA_BONUSES.filter(([id]) => !SHARPNESS_AMMO_BONUS_IDS.has(id));
  }
  if (BOWGUN_WEAPON_TYPES.has(weaponType)) {
    return GOGMA_BONUSES.filter(([id]) => !ELEMENT_BONUS_IDS.has(id)).map(([id, name]) => {
      if (id === 6) return [id, "装填数強化 +1"];
      if (id === 10) return [id, "斬れ味・装填強化ＥＸ +2"];
      return [id, name];
    });
  }
  return GOGMA_BONUSES;
}

function gogmaBonusName(weaponType, bonusId) {
  return gogmaBonusesForWeapon(weaponType).find(([id]) => id === bonusId)?.[1] ?? `ID ${bonusId}`;
}

function compactGogmaBonusName(weaponType, bonusId) {
  const sharpnessAmmoPrefix = BOWGUN_WEAPON_TYPES.has(weaponType) ? "装" : "斬";
  const labels = new Map([
    [6, `${sharpnessAmmoPrefix}I`],
    [8, "攻II"],
    [9, "会II"],
    [10, `${sharpnessAmmoPrefix}EX`],
    [11, "属II"],
    [12, "攻III"],
    [13, "会III"],
    [14, "属EX"],
    [15, "攻EX"],
    [16, "会EX"],
  ]);
  return labels.get(bonusId) ?? `ID ${bonusId}`;
}

function updateBonusPoolNote() {
  const weaponType = Number(weaponSelect.value);
  if (weaponType === BOW_WEAPON_TYPE) {
    bonusPoolNote.textContent =
      "弓は攻撃・会心・属性の8候補です。斬れ味・装填系は抽選されません。";
    return;
  }
  if (BOWGUN_WEAPON_TYPES.has(weaponType)) {
    bonusPoolNote.textContent =
      "ボウガンは攻撃・会心・装填の8候補です。属性強化は抽選されず、装填系は合計2枠までです。";
    return;
  }
  bonusPoolNote.textContent = "近接武器は攻撃・会心・属性・斬れ味の10候補です。";
}

function updatePredictionPoolNote() {
  const weaponType = Number(predictionWeaponSelect.value);
  if (bonusPrediction.mode === "keep") {
    predictionPoolNote.textContent =
      "同じ構成で再復元は、登録武器ごとの5枠系統を維持したままII・III・EX等だけを再抽選します。";
    return;
  }
  if (weaponType === BOW_WEAPON_TYPE) {
    predictionPoolNote.textContent =
      "弓の未来は攻撃・会心・属性の8候補で計算します。斬れ味・装填系は出ません。";
    return;
  }
  if (BOWGUN_WEAPON_TYPES.has(weaponType)) {
    predictionPoolNote.textContent =
      "ボウガンの未来は攻撃・会心・装填の8候補で計算します。属性強化は出ません。";
    return;
  }
  predictionPoolNote.textContent =
    "近接武器の未来は攻撃・会心・属性・斬れ味の10候補で計算します。";
}

function snapshotObservationValues() {
  return [...observationRows.querySelectorAll(".observation-row")].map((row) =>
    [...row.querySelectorAll("select")].map((select) =>
      select.value === "" ? null : Number(select.value),
    ),
  );
}

function createObservationRow(values = null) {
  const row = document.createElement("div");
  row.className = "observation-row";

  const rollNumber = document.createElement("span");
  rollNumber.className = "roll-number";
  row.append(rollNumber);

  for (let slotIndex = 0; slotIndex < 5; slotIndex += 1) {
    const label = document.createElement("label");
    const accessibleLabel = document.createElement("span");
    accessibleLabel.className = "sr-only slot-label";
    const select = document.createElement("select");
    select.required = true;

    const placeholder = document.createElement("option");
    placeholder.value = "";
    placeholder.textContent = "選択してください";
    placeholder.disabled = true;
    const bonuses = availableGogmaBonuses();
    const selectedId = values?.[slotIndex] ?? null;
    const selectedIdIsAvailable = bonuses.some(([id]) => id === selectedId);
    placeholder.selected = selectedId === null || !selectedIdIsAvailable;
    select.append(placeholder);

    for (const [id, name] of bonuses) {
      const option = document.createElement("option");
      option.value = String(id);
      option.textContent = name;
      option.selected = selectedId === id;
      select.append(option);
    }

    label.append(accessibleLabel, select);
    row.append(label);
  }
  return row;
}

function renumberObservationRows() {
  const rows = [...observationRows.querySelectorAll(".observation-row")];
  rows.forEach((row, rollIndex) => {
    row.querySelector(".roll-number").textContent = `抽選 ${rollIndex + 1}`;
    row.querySelectorAll(".slot-label").forEach((label, slotIndex) => {
      label.textContent = `抽選${rollIndex + 1}の${slotIndex + 1}枠目`;
    });
  });
  removeObservationButton.disabled = rows.length <= 1;
}

function readObservations() {
  const rows = [...observationRows.querySelectorAll(".observation-row")];
  if (rows.length === 0) throw new Error("抽選結果を1回以上入力してください。");

  return rows.flatMap((row, rollIndex) =>
    [...row.querySelectorAll("select")].map((select, slotIndex) => {
      if (select.value === "") {
        throw new Error(`抽選${rollIndex + 1}の${slotIndex + 1}枠目を選択してください。`);
      }
      return Number(select.value);
    }),
  );
}

function beginSearch(config) {
  stopWorkers();
  hideError();
  resetResults();
  lastSearchConfig = config;
  cancelled = false;
  startedAt = performance.now();
  completedWorkers = 0;
  workerProgress = Array(config.workerCount).fill(null).map(() => ({ checked: 0, total: 0 }));

  setRunning(true);
  statusText.textContent = "探索中";
  statusText.className = "status-pill running";
  emptyResult.textContent = "候補を探索しています…";
  elapsedTimer = window.setInterval(updateElapsed, 100);

  const totalSeeds = config.seedEnd - config.seedStart + 1;
  const baseSize = Math.floor(totalSeeds / config.workerCount);
  const remainder = totalSeeds % config.workerCount;
  let cursor = config.seedStart;

  for (let workerId = 0; workerId < config.workerCount; workerId += 1) {
    const partitionSize = baseSize + (workerId < remainder ? 1 : 0);
    const partitionStart = cursor;
    const partitionEnd = cursor + partitionSize - 1;
    cursor = partitionEnd + 1;

    const worker = new Worker(new URL("./search-worker.js", import.meta.url), { type: "module" });
    worker.addEventListener("message", handleWorkerMessage);
    worker.addEventListener("error", (event) => finishWithError(event.message));
    activeWorkers.push(worker);
    worker.postMessage({
      type: "start",
      workerId,
      config: {
        ...config,
        seedStart: partitionStart,
        seedEnd: partitionEnd,
      },
    });
  }
}

function handleWorkerMessage({ data }) {
  if (cancelled) return;
  if (data.type === "progress") {
    workerProgress[data.workerId] = { checked: data.checked, total: data.total };
    recordCandidates(data.pairs);
    updateProgress();
    return;
  }
  if (data.type === "error") {
    finishWithError(data.message);
    return;
  }
  if (data.type === "done") {
    completedWorkers += 1;
    if (completedWorkers === activeWorkers.length) finishComplete();
  }
}

function recordCandidates(flatPairs) {
  for (let index = 0; index < flatPairs.length; index += 2) {
    const seed = flatPairs[index];
    const counter = flatPairs[index + 1];
    foundCandidates.set(`${seed}:${counter}`, { seed, counter });
  }
  renderCandidates();
}

function renderCandidates() {
  const candidates = [...foundCandidates.values()].sort(
    (left, right) => left.seed - right.seed || left.counter - right.counter,
  );
  candidateValue.textContent = candidates.length.toLocaleString("ja-JP");
  candidateList.replaceChildren(
    ...candidates.map((candidate, index) => {
      const { seed, counter } = candidate;
      const item = document.createElement("li");
      const button = document.createElement("button");
      const selected = candidateKey(candidate) === candidateKey(selectedCandidate);
      button.type = "button";
      button.className = "candidate-button";
      button.setAttribute("aria-pressed", String(selected));
      button.innerHTML = `<div><span>セーブ状態</span><strong>候補 ${index + 1}</strong></div><div><span>基準seed</span><strong>${seed.toLocaleString("ja-JP")}</strong></div><div><span>復元ボーナスカウンター</span><strong>${counter.toLocaleString("ja-JP")}</strong></div><span class="candidate-action">${selected ? "現在の状態" : "この状態を使用"}</span>`;
      button.addEventListener("click", () => void selectCandidate(candidate));
      item.classList.toggle("selected", selected);
      item.append(button);
      return item;
    }),
  );
  emptyResult.hidden = candidates.length > 0;
}

function candidateKey(candidate) {
  return candidate ? `${candidate.seed}:${candidate.counter}` : "";
}

function updateProgress() {
  const checked = workerProgress.reduce((sum, worker) => sum + worker.checked, 0);
  const total = workerProgress.reduce((sum, worker) => sum + worker.total, 0);
  const percent = total === 0 ? 0 : (checked / total) * 100;
  progressBar.style.width = `${percent}%`;
  progressValue.textContent = `${percent.toFixed(2)}%`;
  checkedValue.textContent = checked.toLocaleString("ja-JP");
  updateElapsed();
}

function updateElapsed() {
  if (!startedAt) return;
  elapsedValue.textContent = `${((performance.now() - startedAt) / 1000).toFixed(1)}秒`;
}

function finishComplete() {
  updateProgress();
  progressBar.style.width = "100%";
  progressValue.textContent = "100.00%";
  statusText.textContent = "完了";
  statusText.className = "status-pill complete";
  if (foundCandidates.size === 0) emptyResult.textContent = "一致する候補はありませんでした。";
  if (foundCandidates.size === 1) {
    const [candidate] = foundCandidates.values();
    void selectCandidate(candidate);
  }
  cleanupAfterRun();
}

function finishCancelled() {
  if (activeWorkers.length === 0) return;
  cancelled = true;
  activeWorkers.forEach((worker) => worker.postMessage({ type: "cancel" }));
  statusText.textContent = "中止";
  statusText.className = "status-pill";
  cleanupAfterRun();
}

function finishWithError(message) {
  cancelled = true;
  showError(`探索を開始できませんでした: ${message}`);
  statusText.textContent = "エラー";
  statusText.className = "status-pill";
  cleanupAfterRun();
}

function cleanupAfterRun() {
  window.clearInterval(elapsedTimer);
  elapsedTimer = null;
  updateElapsed();
  setRunning(false);
  stopWorkers();
}

function stopWorkers() {
  activeWorkers.forEach((worker) => worker.terminate());
  activeWorkers = [];
}

function resetResults() {
  foundCandidates = new Map();
  candidateList.replaceChildren();
  emptyResult.hidden = false;
  candidateValue.textContent = "0";
  checkedValue.textContent = "0";
  progressValue.textContent = "0.00%";
  elapsedValue.textContent = "0.0秒";
  progressBar.style.width = "0%";
}

async function selectCandidate(candidate) {
  if (!lastSearchConfig) return;

  setStateFromBonus(candidate.seed, candidate.counter, "検索結果", true);
  predictionOrigin.textContent = "0";
  predictionWeaponSelect.value = String(lastSearchConfig.weaponType);
  predictionAttributeSelect.value = String(lastSearchConfig.attributeForce);
  comparisonWeaponSelect.value = String(lastSearchConfig.weaponType);
  comparisonAttributeSelect.value = String(lastSearchConfig.attributeForce);
  skillWeaponSelect.value = String(lastSearchConfig.weaponType);
  skillAttributeSelect.value = String(lastSearchConfig.attributeForce);
  const searchTarget = {
    weaponType: lastSearchConfig.weaponType,
    attributeForce: lastSearchConfig.attributeForce,
    label: "",
  };
  if (
    comparisonTargets.length < MAX_REGISTERED_TARGETS &&
    !comparisonTargets.some(
      (target) => comparisonCombinationKey(target) === comparisonCombinationKey(searchTarget),
    )
  ) {
    comparisonTargets.push({
      ...searchTarget,
      id: createTargetId(),
      keepCategories: [null, null, null, null, null],
      keepSource: null,
    });
  }
  renderComparisonTargets();
  persistAppState();
  renderPredictionFilters();
  updatePredictionPoolNote();
  predictionPanel.hidden = false;
  renderCandidates();
  await Promise.all([refreshPredictions(), refreshComparisonPredictions()]);
  setActiveTab("bonus-future");
}

function renderPredictionFilters(values = []) {
  const weaponType = Number(predictionWeaponSelect.value);
  const bonuses = gogmaBonusesForWeapon(weaponType);

  predictionFilters.replaceChildren(
    ...Array.from({ length: 5 }, (_, index) => {
      const label = document.createElement("label");
      const text = document.createElement("span");
      const select = document.createElement("select");
      const placeholder = document.createElement("option");
      const selectedId = values[index] ?? null;

      text.textContent = `希望 ${index + 1}`;
      placeholder.value = "";
      placeholder.textContent = "指定なし";
      placeholder.selected = selectedId === null;
      select.append(placeholder);

      for (const [id, name] of bonuses) {
        const option = document.createElement("option");
        option.value = String(id);
        option.textContent = name;
        option.selected = selectedId === id;
        select.append(option);
      }

      label.append(text, select);
      return label;
    }),
  );
}

function snapshotPredictionFilters() {
  return [...predictionFilters.querySelectorAll("select")].map((select) =>
    select.value === "" ? null : Number(select.value),
  );
}

async function refreshPredictions() {
  if (!selectedCandidate || !lastSearchConfig) return;
  if (bonusPrediction.mode === "keep") {
    predictionRolls = [];
    predictionRows.replaceChildren();
    predictionStatus.textContent = "同じ構成の未来は武器一覧で比較します";
    predictionStatus.className = "status-pill";
    return;
  }

  const requestId = ++predictionRequestId;
  hidePredictionError();
  predictionStatus.textContent = "未来を計算中";
  predictionStatus.className = "status-pill running";

  try {
    const predictionCount = readPredictionCount();
    const weaponType = Number(predictionWeaponSelect.value);
    const attributeForce = Number(predictionAttributeSelect.value);
    const matchesSearchWeapon =
      bonusPrediction.mode === "reset" &&
      weaponType === lastSearchConfig.weaponType &&
      attributeForce === lastSearchConfig.attributeForce;
    const observationCount = lastSearchConfig.observations.length / 5;
    const generatedCount = matchesSearchWeapon
      ? Math.max(predictionCount, observationCount)
      : predictionCount;

    await ensurePredictionWasm();
    const detailTarget = { weaponType, attributeForce, label: "" };
    const flattened = predictBonusRollsForTarget(detailTarget, generatedCount);
    if (requestId !== predictionRequestId) return;

    if (
      matchesSearchWeapon &&
      !flattenedPrefixMatches(flattened, lastSearchConfig.observations)
    ) {
      throw new Error(
        "観測結果と予測の先頭が一致しません。武器種・属性・候補を確認してください。",
      );
    }

    predictionRolls = Array.from({ length: predictionCount }, (_, index) => ({
      index,
      bonusIds: Array.from(flattened.slice(index * 5, index * 5 + 5)),
      observed: matchesSearchWeapon && index < observationCount,
    }));
    renderPredictionTable();
  } catch (error) {
    if (requestId !== predictionRequestId) return;
    predictionRolls = [];
    predictionRows.replaceChildren();
    predictionStatus.textContent = "予測エラー";
    predictionStatus.className = "status-pill";
    showPredictionError(error instanceof Error ? error.message : String(error));
  }
}

function readPredictionCount() {
  const value = Number(predictionCountInput.value);
  if (!Number.isSafeInteger(value) || value < 1 || value > 1_000) {
    throw new Error("表示する回数は1〜1,000の整数で入力してください。");
  }
  return value;
}

async function ensurePredictionWasm() {
  predictionWasmReady ??= initWasm();
  await predictionWasmReady;
}

function predictBonusRollsForTarget(target, count) {
  const common = [
    selectedCandidate.seed,
    target.weaponType,
    target.attributeForce,
    selectedCandidate.counter,
    lastSearchConfig?.counterGate ?? 35,
    count,
  ];
  if (bonusPrediction.mode === "reset") return predict_gogma_rolls(...common);
  return predict_gogma_keep_rolls(
    ...common,
    new Uint8Array(requireTargetKeepCategories(target)),
  );
}

function bonusCategoryId(bonusId) {
  if ([8, 12, 15].includes(bonusId)) return 0;
  if ([9, 13, 16].includes(bonusId)) return 1;
  if ([11, 14].includes(bonusId)) return 2;
  if ([6, 10].includes(bonusId)) return 3;
  throw new Error(`未対応の復元ボーナスIDです: ${bonusId}`);
}

async function beginKeepOptimization(target, bonusIds, completedRolls) {
  if (saveState.baseSeed === null || saveState.bonusCounter === null) return;
  let profile = target.id
    ? comparisonTargets.find((candidate) => candidate.id === target.id)
    : comparisonTargets.find(
        (candidate) => comparisonCombinationKey(candidate) === comparisonCombinationKey(target),
      );
  if (!profile) {
    if (comparisonTargets.length >= MAX_REGISTERED_TARGETS) {
      showComparisonError(`EX厳選へ引き継ぐには、登録武器を${MAX_REGISTERED_TARGETS}件未満にしてください。`);
      return;
    }
    profile = {
      ...target,
      id: createTargetId(),
      label: target.label ?? "",
      keepCategories: [null, null, null, null, null],
      keepSource: null,
    };
    comparisonTargets.push(profile);
  }
  profile.keepCategories = bonusIds.map(bonusCategoryId);
  profile.keepSource = `${completedRolls}回先のリセット結果`;
  bonusPrediction.mode = "keep";

  const nextCounter = saveState.bonusCounter + completedRolls;
  if (!isValidCounter(nextCounter)) return;
  setStateFromBonus(saveState.baseSeed, nextCounter, "予測結果");
  lastSearchConfig = {
    weaponType: profile.weaponType,
    attributeForce: profile.attributeForce,
    counterGate: 35,
    observations: [],
  };
  predictionWeaponSelect.value = String(profile.weaponType);
  predictionAttributeSelect.value = String(profile.attributeForce);
  predictionOrigin.textContent = "0";
  renderComparisonTargets();
  renderBonusOperation();
  renderPredictionFilters();
  updatePredictionPoolNote();
  bonusStateMessage.textContent = `${comparisonTargetName(profile)}の${completedRolls}回先を採用した状態へ進み、同じ構成でのEX厳選に切り替えました。`;
  await Promise.all([refreshPredictions(), refreshComparisonPredictions()]);
  setActiveTab("bonus-future");
}

function flattenedPrefixMatches(actual, expected) {
  if (actual.length < expected.length) return false;
  return expected.every((value, index) => actual[index] === value);
}

function renderPredictionTable() {
  if (!selectedCandidate) return;

  const requirements = snapshotPredictionFilters().filter((value) => value !== null);
  const matchedRolls = predictionRolls.filter((roll) =>
    rollContainsRequirements(roll.bonusIds, requirements),
  );
  const visibleRolls =
    requirements.length > 0 && predictionMatchesOnly.checked ? matchedRolls : predictionRolls;

  if (requirements.length === 0) {
    predictionStatus.textContent = `${predictionRolls.length.toLocaleString("ja-JP")}回を表示`;
  } else {
    predictionStatus.textContent = `${predictionRolls.length.toLocaleString("ja-JP")}回中 ${matchedRolls.length.toLocaleString("ja-JP")}回一致`;
  }
  predictionStatus.className = "status-pill complete";

  if (visibleRolls.length === 0) {
    const row = document.createElement("tr");
    const cell = document.createElement("td");
    cell.colSpan = 7;
    cell.className = "prediction-empty";
    cell.textContent = "指定した構成は表示範囲内にありません。表示回数を増やしてください。";
    row.append(cell);
    predictionRows.replaceChildren(row);
    return;
  }

  predictionRows.replaceChildren(
    ...visibleRolls.map((roll) => createPredictionRow(roll, requirements)),
  );
}

function rollContainsRequirements(bonusIds, requirements) {
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

function createPredictionRow(roll, requirements) {
  const weaponType = Number(predictionWeaponSelect.value);
  const row = document.createElement("tr");
  const offsetCell = document.createElement("th");
  const matches = requirements.length > 0 && rollContainsRequirements(roll.bonusIds, requirements);

  row.classList.toggle("prediction-match", matches);
  row.classList.toggle("prediction-observed", roll.observed);
  offsetCell.scope = "row";
  offsetCell.textContent = `${roll.index + 1}回先`;
  if (roll.observed) {
    const badge = document.createElement("span");
    badge.className = "observed-badge";
    badge.textContent = "実測一致";
    offsetCell.append(badge);
  }
  row.append(offsetCell);

  row.append(createSavedStateCell(
    "bonus",
    roll.index + 1,
    bonusPrediction.mode === "reset"
      ? {
          target: {
            weaponType,
            attributeForce: Number(predictionAttributeSelect.value),
            label: "",
          },
          bonusIds: roll.bonusIds,
        }
      : null,
  ));

  for (const bonusId of roll.bonusIds) {
    const cell = document.createElement("td");
    const tag = document.createElement("span");
    tag.className = `bonus-tag ${bonusClassName(bonusId)}${EX_BONUS_IDS.has(bonusId) ? " ex" : ""}`;
    tag.textContent = gogmaBonusName(weaponType, bonusId);
    cell.append(tag);
    row.append(cell);
  }

  return row;
}

function createSavedStateCell(kind, completedRolls, keepTransition = null, compact = false) {
  const cell = document.createElement("td");
  const counterLabel = document.createElement("span");
  const counterValue = document.createElement("strong");
  const actions = document.createElement("div");
  const adoptButton = document.createElement("button");
  const isBonus = kind === "bonus";
  const currentCounter = isBonus ? saveState.bonusCounter : saveState.skillCounter;
  const nextCounter = currentCounter === null ? null : currentCounter + completedRolls;
  const code = isBonus
    ? selectedCandidate ? formatGogmaContinuationCode(selectedCandidate, completedRolls) : null
    : formatSkillContinuationCode(completedRolls);

  cell.className = `continuation-code-cell saved-state-cell${compact ? " compact-state" : ""}`;
  counterLabel.textContent = compact
    ? isBonus ? "復元" : "スキル"
    : isBonus ? "保存後の復元ボーナスカウンター" : "保存後のスキルカウンター";
  counterValue.textContent = nextCounter === null ? "未特定" : nextCounter.toLocaleString("ja-JP");
  actions.className = "saved-state-actions";

  if (code) {
    const codeButton = document.createElement("button");
    codeButton.type = "button";
    codeButton.className = "continuation-code-button";
    codeButton.textContent = compact ? "コード" : code;
    codeButton.title = `セーブ状態コードをコピー: ${code}`;
    codeButton.addEventListener("click", () => void useContinuationCode(code));
    actions.append(codeButton);
  }

  adoptButton.type = "button";
  adoptButton.className = "adopt-position-button";
  adoptButton.textContent = compact ? "ここを0にする" : "この位置を新しい0にする";
  adoptButton.addEventListener("click", () => {
    if (isBonus) void adoptBonusPosition(completedRolls);
    else void adoptSkillPosition(completedRolls);
  });
  actions.append(adoptButton);
  if (isBonus && keepTransition) {
    const keepButton = document.createElement("button");
    keepButton.type = "button";
    keepButton.className = "keep-transition-button";
    keepButton.textContent = "この構成でEX厳選へ";
    keepButton.addEventListener("click", () => void beginKeepOptimization(
      keepTransition.target,
      keepTransition.bonusIds,
      completedRolls,
    ));
    actions.append(keepButton);
  }
  cell.append(counterLabel, counterValue, actions);
  return cell;
}

async function adoptBonusPosition(completedRolls) {
  if (saveState.baseSeed === null || saveState.bonusCounter === null) return;
  const nextCounter = saveState.bonusCounter + completedRolls;
  if (!isValidCounter(nextCounter)) return;
  setStateFromBonus(saveState.baseSeed, nextCounter, "予測結果");
  lastSearchConfig = {
    weaponType: Number(predictionWeaponSelect.value),
    attributeForce: Number(predictionAttributeSelect.value),
    counterGate: 35,
    observations: [],
  };
  predictionOrigin.textContent = "0";
  bonusStateMessage.textContent = `復元ボーナスカウンター${nextCounter.toLocaleString("ja-JP")}を新しい0地点にしました。`;
  await Promise.all([
    refreshPredictions(),
    refreshComparisonPredictions(),
    saveState.skillCounter === null ? Promise.resolve() : refreshSkillPredictions(),
  ]);
  setActiveTab("bonus-future");
}

async function adoptSkillPosition(completedRolls) {
  if (saveState.baseSeed === null || saveState.skillCounter === null) return;
  const nextCounter = saveState.skillCounter + completedRolls;
  if (!isValidCounter(nextCounter)) return;
  setStateFromSkill(saveState.baseSeed, nextCounter, "予測結果");
  currentSkillObservations = [];
  skillObservedCount = 0;
  skillStateMessage.textContent = `スキルカウンター${nextCounter.toLocaleString("ja-JP")}を新しい0地点にしました。`;
  await Promise.all([
    refreshSkillPredictions(),
    selectedCandidate ? refreshPredictions() : Promise.resolve(),
    selectedCandidate ? refreshComparisonPredictions() : Promise.resolve(),
  ]);
  setActiveTab("skill-future");
}

function bonusClassName(bonusId) {
  if ([8, 12, 15].includes(bonusId)) return "attack";
  if ([9, 13, 16].includes(bonusId)) return "affinity";
  if ([11, 14].includes(bonusId)) return "element";
  return "sharpness-ammo";
}

async function addComparisonTarget() {
  hideComparisonError();
  const target = {
    weaponType: Number(comparisonWeaponSelect.value),
    attributeForce: Number(comparisonAttributeSelect.value),
    label: comparisonTargetLabelInput.value.trim(),
  };
  if (!registerTarget(target, showComparisonError, bonusPrediction.mode === "keep")) return;
  comparisonTargetLabelInput.value = "";
  await Promise.all([refreshComparisonPredictions(), refreshSkillPredictions()]);
}

async function addSkillTarget() {
  hideSkillTargetError();
  const target = {
    weaponType: Number(skillTargetWeaponSelect.value),
    attributeForce: Number(skillTargetAttributeSelect.value),
    label: skillTargetLabelInput.value.trim(),
  };
  if (!registerTarget(target, showSkillTargetError, false)) return;
  skillTargetLabelInput.value = "";
  await Promise.all([refreshComparisonPredictions(), refreshSkillPredictions()]);
}

function registerTarget(target, showError, allowDuplicateCombination) {
  const duplicateCombination = comparisonTargets.filter(
    (existing) => comparisonCombinationKey(existing) === comparisonCombinationKey(target),
  );
  if (duplicateCombination.length > 0 && !allowDuplicateCombination) {
    showError("この武器種・属性は登録済みです。EX未厳選の別武器は『同じ構成で再復元』を選んでから登録してください。");
    return false;
  }
  if (duplicateCombination.length > 0 && !target.label) {
    showError("同じ武器種・属性の別武器には、区別できる表示名を入力してください。");
    return false;
  }
  if (
    target.label &&
    comparisonTargets.some((existing) => existing.label && existing.label === target.label)
  ) {
    showError("同じ表示名が登録済みです。別の名前を入力してください。");
    return false;
  }
  if (comparisonTargets.length >= MAX_REGISTERED_TARGETS) {
    showError(`予測対象は最大${MAX_REGISTERED_TARGETS}件です。不要な武器を削除してください。`);
    return false;
  }
  comparisonTargets.push({
    ...target,
    id: createTargetId(),
    keepCategories: [null, null, null, null, null],
    keepSource: null,
  });
  renderComparisonTargets();
  persistAppState();
  return true;
}

function comparisonTargetKey(target) {
  return target.id;
}

function comparisonCombinationKey(target) {
  return `${target.weaponType}:${target.attributeForce}`;
}

function uniqueTargetsByCombination(targets = comparisonTargets) {
  const unique = new Map();
  for (const target of targets) {
    const key = comparisonCombinationKey(target);
    if (!unique.has(key)) unique.set(key, target);
  }
  return [...unique.values()];
}

function optionName(options, value) {
  return options.find(([optionValue]) => optionValue === value)?.[1] ?? String(value);
}

function comparisonTargetName(target) {
  if (target.label) return target.label;
  const weapon = optionName(WEAPON_TYPES, target.weaponType);
  const attributeName = optionName(ATTRIBUTES, target.attributeForce);
  const attribute = attributeName === "無属性" ? attributeName : attributeName.replace("属性", "");
  return `${attribute}${weapon}`;
}

function renderComparisonTargets() {
  const createItems = (targets) => targets.map((target) => {
      const item = document.createElement("span");
      const text = document.createElement("span");
      const removeButton = document.createElement("button");
      item.className = "comparison-target";
      text.textContent = comparisonTargetName(target);
      removeButton.type = "button";
      removeButton.textContent = "×";
      removeButton.setAttribute("aria-label", `${comparisonTargetName(target)}を比較対象から削除`);
      removeButton.addEventListener("click", () => {
        comparisonTargets = comparisonTargets.filter(
          (candidate) => comparisonTargetKey(candidate) !== comparisonTargetKey(target),
        );
        renderComparisonTargets();
        persistAppState();
        void Promise.all([refreshComparisonPredictions(), refreshSkillPredictions()]);
      });
      item.append(text, removeButton);
      return item;
    });
  comparisonTargetList.replaceChildren(...createItems(comparisonTargets));
  skillTargetList.replaceChildren(...createItems(uniqueTargetsByCombination()));
  clearComparisonTargetsButton.disabled = comparisonTargets.length === 0;
  clearSkillTargetsButton.disabled = comparisonTargets.length === 0;
  renderKeepLayoutInputs();
  updateComparisonStatus();
}

function readComparisonCount() {
  const value = Number(comparisonCountInput.value);
  if (!Number.isSafeInteger(value) || value < 1 || value > 500) {
    throw new Error("比較表の表示回数は1〜500の整数で入力してください。");
  }
  return value;
}

async function refreshComparisonPredictions() {
  const requestId = ++comparisonRequestId;
  hideComparisonError();

  if (!selectedCandidate || comparisonTargets.length === 0) {
    comparisonRollSets = [];
    renderComparisonTable();
    return;
  }

  comparisonStatus.textContent = "比較表を計算中";
  comparisonStatus.className = "status-pill running";

  try {
    const count = readComparisonCount();
    await ensurePredictionWasm();
    const predictionTargets = bonusPrediction.mode === "keep"
      ? comparisonTargets.filter((target) => keepLayoutProblem(target) === null)
      : uniqueTargetsByCombination();
    if (predictionTargets.length === 0) {
      throw new Error("EX厳選する武器の現在5枠構成を入力してください。");
    }
    const nextRollSets = predictionTargets.map((target) => {
      const flattened = predictBonusRollsForTarget(target, count);
      return {
        ...target,
        rolls: Array.from({ length: count }, (_, index) =>
          Array.from(flattened.slice(index * 5, index * 5 + 5)),
        ),
      };
    });
    if (requestId !== comparisonRequestId) return;
    comparisonRollSets = nextRollSets;
    renderComparisonTable();
  } catch (error) {
    if (requestId !== comparisonRequestId) return;
    comparisonRollSets = [];
    renderComparisonTable();
    showComparisonError(error instanceof Error ? error.message : String(error));
  }
}

function renderComparisonTable() {
  if (!selectedCandidate || comparisonRollSets.length === 0) {
    comparisonHeaderRow.replaceChildren();
    comparisonRows.replaceChildren();
    comparisonTableWrap.hidden = true;
    updateComparisonStatus();
    return;
  }

  const offsetHeader = document.createElement("th");
  const continuationHeader = document.createElement("th");
  offsetHeader.scope = "col";
  offsetHeader.textContent = "何回先";
  continuationHeader.scope = "col";
  continuationHeader.textContent = "保存後の状態";
  comparisonHeaderRow.replaceChildren(
    offsetHeader,
    continuationHeader,
    ...comparisonRollSets.map((target) => {
      const header = document.createElement("th");
      header.scope = "col";
      header.textContent = comparisonTargetName(target);
      return header;
    }),
  );

  const count = comparisonRollSets[0].rolls.length;
  const minimumExCount = Number(bonusExFilterCountSelect.value);
  const rowMeetsExThreshold = (index) => comparisonRollSets.some((target) =>
    target.rolls[index].filter((bonusId) => EX_BONUS_IDS.has(bonusId)).length >= minimumExCount
  );
  const visibleIndices = Array.from({ length: count }, (_, index) => index)
    .filter((index) => !bonusExFilterEnabled.checked || rowMeetsExThreshold(index));
  comparisonRows.replaceChildren(
    ...visibleIndices.map((index) => createComparisonRow(index)),
  );
  if (visibleIndices.length === 0) {
    const row = document.createElement("tr");
    const cell = document.createElement("td");
    cell.colSpan = 2 + comparisonRollSets.length;
    cell.className = "prediction-empty";
    cell.textContent = `EXが${minimumExCount}個以上の結果は表示範囲内にありません。表示回数を増やすか最低EX数を下げてください。`;
    row.append(cell);
    comparisonRows.replaceChildren(row);
  }
  comparisonTableWrap.hidden = false;
  const unit = bonusPrediction.mode === "keep" ? "武器" : "条件";
  const prefix = bonusPrediction.mode === "keep" ? "EX厳選・" : "";
  const filterStatus = bonusExFilterEnabled.checked
    ? `・EX${minimumExCount}個以上 ${visibleIndices.length.toLocaleString("ja-JP")}行`
    : "";
  comparisonStatus.textContent = `${prefix}${comparisonRollSets.length.toLocaleString("ja-JP")}${unit} × ${count.toLocaleString("ja-JP")}回${filterStatus}`;
  comparisonStatus.className = "status-pill complete";
}

function createComparisonRow(index) {
  const row = document.createElement("tr");
  const offsetCell = document.createElement("th");

  offsetCell.scope = "row";
  offsetCell.textContent = `${index + 1}回先`;
  if (bonusExFilterEnabled.checked) row.classList.add("prediction-match");
  row.append(offsetCell, createSavedStateCell("bonus", index + 1, null, true));

  for (const target of comparisonRollSets) {
    const cell = document.createElement("td");
    const bonusSet = document.createElement("div");
    bonusSet.className = "comparison-bonus-set";
    for (const bonusId of target.rolls[index]) {
      const tag = document.createElement("span");
      tag.className = `bonus-tag compact ${bonusClassName(bonusId)}${EX_BONUS_IDS.has(bonusId) ? " ex" : ""}`;
      tag.textContent = compactGogmaBonusName(target.weaponType, bonusId);
      bonusSet.append(tag);
    }
    if (bonusPrediction.mode === "reset") {
      const keepButton = document.createElement("button");
      keepButton.type = "button";
      keepButton.className = "keep-transition-button";
      keepButton.textContent = "この構成でEX厳選へ";
      keepButton.addEventListener("click", () => void beginKeepOptimization(
        target,
        target.rolls[index],
        index + 1,
      ));
      bonusSet.append(keepButton);
    }
    cell.className = "comparison-result-cell";
    cell.append(bonusSet);
    row.append(cell);
  }
  return row;
}

function updateComparisonStatus() {
  if (comparisonTargets.length === 0) {
    comparisonStatus.textContent = "予測対象を登録してください";
  } else if (!selectedCandidate) {
    comparisonStatus.textContent = `${comparisonTargets.length.toLocaleString("ja-JP")}件・基準seedと復元カウンター待ち`;
  } else if (comparisonRollSets.length === 0) {
    if (bonusPrediction.mode === "keep") {
      const ready = comparisonTargets.filter((target) => keepLayoutProblem(target) === null).length;
      comparisonStatus.textContent = `${ready}/${comparisonTargets.length} 武器の構成入力済み`;
    } else {
      comparisonStatus.textContent = `${comparisonTargets.length.toLocaleString("ja-JP")}条件`;
    }
  }
  comparisonStatus.className = "status-pill";
}

function showComparisonError(message) {
  comparisonError.textContent = message;
  comparisonError.hidden = false;
}

function hideComparisonError() {
  comparisonError.textContent = "";
  comparisonError.hidden = true;
}

async function findSkillPosition() {
  hideSkillError();
  resetSkillSearchFeedback();

  if (saveState.baseSeed === null) {
    showSkillError("先に基準seedを検索するか、未来予測タブで基準seedを入力してください。");
    return;
  }

  findSkillPositionButton.disabled = true;
  skillStatus.textContent = "スキルカウンターを探索中";
  skillStatus.className = "status-pill running";

  try {
    const observations = readSkillObservations();
    const counterStart = readInteger("skill-counter-start", "スキル内部位置の開始", 0, 0xffffffff);
    const counterEnd = readInteger("skill-counter-end", "スキル内部位置の終了", 0, 0xffffffff);
    if (counterStart > counterEnd) {
      throw new Error("スキル内部位置の開始は終了以下にしてください。");
    }

    await ensurePredictionWasm();
    const counters = Array.from(
      find_skill_counters(
        saveState.baseSeed,
        Number(skillWeaponSelect.value),
        Number(skillAttributeSelect.value),
        SKILL_COUNTER_GATE,
        counterStart,
        counterEnd,
        new Uint16Array(observations),
      ),
    );

    if (counters.length === 0) {
      throw new Error(
        "一致するスキルカウンターがありません。武器種・属性・入力順を確認し、必要なら探索範囲を広げてください。",
      );
    }
    if (counters.length > 1) {
      skillStatus.textContent = `${counters.length.toLocaleString("ja-JP")}候補`;
      skillStatus.className = "status-pill";
      showSkillError(
        `候補が${counters.length.toLocaleString("ja-JP")}件あります。続きの再付与結果を追加してください。`,
      );
      return;
    }

    selectedSkillCounter = counters[0];
    skillObservedCount = observations.length;
    currentSkillObservations = observations;
    setStateFromSkill(saveState.baseSeed, selectedSkillCounter, "検索結果");
    const observedTarget = {
      weaponType: Number(skillWeaponSelect.value),
      attributeForce: Number(skillAttributeSelect.value),
      label: "",
    };
    if (
      comparisonTargets.length < MAX_REGISTERED_TARGETS &&
      !comparisonTargets.some(
        (target) => comparisonCombinationKey(target) === comparisonCombinationKey(observedTarget),
      )
    ) {
      comparisonTargets.push({
        ...observedTarget,
        id: createTargetId(),
        keepCategories: [null, null, null, null, null],
        keepSource: null,
      });
      renderComparisonTargets();
      persistAppState();
    }
    await verifySkillObservationPrefix(observations);
    renderPredictionTable();
    renderComparisonTable();
    await refreshSkillPredictions();
    skillStatus.textContent = `スキルカウンター ${selectedSkillCounter.toLocaleString("ja-JP")} を特定`;
    skillStatus.className = "status-pill complete";
  } catch (error) {
    if (selectedSkillCounter === null) {
      skillStatus.textContent = "位置未特定";
      skillStatus.className = "status-pill";
    }
    showSkillError(error instanceof Error ? error.message : String(error));
  } finally {
    findSkillPositionButton.disabled = false;
  }
}

async function verifySkillObservationPrefix(observations) {
  await ensurePredictionWasm();
  const tableIndices = predict_skill_rolls(
    saveState.baseSeed,
    Number(skillWeaponSelect.value),
    Number(skillAttributeSelect.value),
    saveState.skillCounter,
    SKILL_COUNTER_GATE,
    observations.length,
  );
  if (!flattenedPrefixMatches(tableIndices, observations)) {
    throw new Error("観測したスキル結果と特定位置の先頭が一致しません。");
  }
}

async function refreshSkillPredictions() {
  if (saveState.baseSeed === null || saveState.skillCounter === null) {
    clearSkillPredictionResults();
    skillFutureStatus.textContent = "基準seedとスキルカウンターを入力してください";
    return;
  }
  if (comparisonTargets.length === 0) {
    clearSkillPredictionResults();
    skillFutureStatus.textContent = "予測対象を登録してください";
    return;
  }

  skillFutureStatus.textContent = "スキル未来を計算中";
  skillFutureStatus.className = "status-pill running";

  try {
    const predictionCount = readSkillPredictionCount();
    await ensurePredictionWasm();
    skillPredictionRollSets = uniqueTargetsByCombination().map((target) => {
      const tableIndices = predict_skill_rolls(
        saveState.baseSeed,
        target.weaponType,
        target.attributeForce,
        saveState.skillCounter,
        SKILL_COUNTER_GATE,
        predictionCount,
      );
      return {
        ...target,
        rolls: Array.from(tableIndices, (tableIndex) => ({
          seriesIndex: Math.floor(tableIndex / GROUP_SKILLS.length),
          groupIndex: tableIndex % GROUP_SKILLS.length,
        })),
      };
    });
    renderSkillPredictionTable();
  } catch (error) {
    clearSkillPredictionResults();
    skillFutureStatus.textContent = "予測エラー";
    skillFutureStatus.className = "status-pill";
    showSkillTargetError(error instanceof Error ? error.message : String(error));
  }
}

function readSkillPredictionCount() {
  const value = Number(skillPredictionCountInput.value);
  if (!Number.isSafeInteger(value) || value < 1 || value > 1_000) {
    throw new Error("スキルの表示回数は1〜1,000の整数で入力してください。");
  }
  return value;
}

function selectedDesiredSeries() {
  return new Set(
    [...document.querySelectorAll('input[name="desired-series"]:checked')].map((checkbox) =>
      Number(checkbox.value),
    ),
  );
}

function selectedSkillFilter() {
  return {
    enabled: skillFilterEnabled.checked,
    groupIndex: Number(skillFilterGroupSelect.value),
    operator: skillFilterOperatorSelect.value,
    seriesIndex: Number(skillFilterSeriesSelect.value),
  };
}

function skillRollMatchesFilter(roll, filter) {
  const hasGroup = filter.groupIndex >= 0;
  const hasSeries = filter.seriesIndex >= 0;
  const groupMatches = hasGroup && roll.groupIndex === filter.groupIndex;
  const seriesMatches = hasSeries && roll.seriesIndex === filter.seriesIndex;

  if (!hasGroup) return !hasSeries || seriesMatches;
  if (!hasSeries) return groupMatches;
  return filter.operator === "and"
    ? groupMatches && seriesMatches
    : groupMatches || seriesMatches;
}

function renderSkillPredictionTable() {
  if (skillPredictionRollSets.length === 0) return;

  const desiredSeries = selectedDesiredSeries();
  const skillFilter = selectedSkillFilter();
  const isHit = (roll) =>
    desiredSeries.has(roll.seriesIndex) || roll.groupIndex === LORDS_SOUL_GROUP_INDEX;
  const count = skillPredictionRollSets[0].rolls.length;
  const rowMatchesFilter = (index) => skillPredictionRollSets.some((target) =>
    skillRollMatchesFilter(target.rolls[index], skillFilter)
  );
  const hitCount = skillPredictionRollSets.reduce(
    (total, target) => total + target.rolls.filter(isHit).length,
    0,
  );
  const matchingRowCount = Array.from({ length: count }, (_, index) => index)
    .filter(rowMatchesFilter).length;
  const visibleIndices = Array.from({ length: count }, (_, index) => index)
    .filter((index) => !skillFilter.enabled || rowMatchesFilter(index));

  const filterStatus = skillFilter.enabled
    ? `・条件一致${matchingRowCount.toLocaleString("ja-JP")}行`
    : "";
  skillFutureStatus.textContent = `${skillPredictionRollSets.length.toLocaleString("ja-JP")}件 × ${count.toLocaleString("ja-JP")}回・当たり${hitCount.toLocaleString("ja-JP")}セル${filterStatus}`;
  skillFutureStatus.className = "status-pill complete";
  skillTableWrap.hidden = false;

  const offsetHeader = document.createElement("th");
  const stateHeader = document.createElement("th");
  offsetHeader.scope = "col";
  offsetHeader.textContent = "何回先";
  stateHeader.scope = "col";
  stateHeader.textContent = "保存後の状態";
  skillPredictionHeaderRow.replaceChildren(
    offsetHeader,
    stateHeader,
    ...skillPredictionRollSets.map((target) => {
      const header = document.createElement("th");
      header.scope = "col";
      header.textContent = comparisonTargetName(target);
      return header;
    }),
  );

  if (visibleIndices.length === 0) {
    const row = document.createElement("tr");
    const cell = document.createElement("td");
    cell.colSpan = 2 + skillPredictionRollSets.length;
    cell.className = "prediction-empty";
    cell.textContent = "指定したグループ・シリーズ条件に合う結果は表示範囲内にありません。表示回数を増やすか条件を変更してください。";
    row.append(cell);
    skillPredictionRows.replaceChildren(row);
    return;
  }

  skillPredictionRows.replaceChildren(
    ...visibleIndices.map((index) => createSkillPredictionRow(index, desiredSeries)),
  );
}

function createSkillPredictionRow(index, desiredSeries) {
  const row = document.createElement("tr");
  const offsetCell = document.createElement("th");
  const anyHit = skillPredictionRollSets.some((target) => {
    const roll = target.rolls[index];
    return desiredSeries.has(roll.seriesIndex) || roll.groupIndex === LORDS_SOUL_GROUP_INDEX;
  });
  row.classList.toggle("prediction-match", anyHit);
  offsetCell.scope = "row";
  offsetCell.textContent = `${index + 1}回先`;
  row.append(offsetCell, createSavedStateCell("skill", index + 1, null, true));

  for (const target of skillPredictionRollSets) {
    const roll = target.rolls[index];
    const cell = document.createElement("td");
    const tags = document.createElement("div");
    const seriesTag = document.createElement("span");
    const groupTag = document.createElement("span");
    const desired = desiredSeries.has(roll.seriesIndex);
    const lordsSoul = roll.groupIndex === LORDS_SOUL_GROUP_INDEX;
    tags.className = "skill-result-pair";
    seriesTag.className = `skill-tag series${desired ? " desired" : ""}`;
    seriesTag.textContent = SERIES_SKILLS[roll.seriesIndex] ?? `シリーズ ${roll.seriesIndex}`;
    groupTag.className = `skill-tag group${lordsSoul ? " jackpot" : ""}`;
    groupTag.textContent = GROUP_SKILLS[roll.groupIndex] ?? `グループ ${roll.groupIndex}`;
    tags.append(seriesTag, groupTag);
    cell.append(tags);
    row.append(cell);
  }
  return row;
}

function clearSkillPredictionResults() {
  skillPredictionRollSets = [];
  skillPredictionHeaderRow.replaceChildren();
  skillPredictionRows.replaceChildren();
  skillTableWrap.hidden = true;
}

function resetSkillSearchFeedback() {
  skillStatus.textContent = saveState.skillCounter === null
    ? "観測結果を入力してください"
    : `現在のスキルカウンター ${saveState.skillCounter.toLocaleString("ja-JP")}`;
  skillStatus.className = `status-pill${saveState.skillCounter === null ? "" : " complete"}`;
  hideSkillError();
}

function showSkillError(message) {
  skillError.textContent = message;
  skillError.hidden = false;
}

function hideSkillError() {
  skillError.textContent = "";
  skillError.hidden = true;
}

function showSkillTargetError(message) {
  skillTargetError.textContent = message;
  skillTargetError.hidden = false;
}

function hideSkillTargetError() {
  skillTargetError.textContent = "";
  skillTargetError.hidden = true;
}

function showPredictionError(message) {
  predictionError.textContent = message;
  predictionError.hidden = false;
}

function hidePredictionError() {
  predictionError.textContent = "";
  predictionError.hidden = true;
}

function setRunning(running) {
  startButton.disabled = running;
  cancelButton.disabled = !running;
}

function showError(message) {
  errorBox.textContent = message;
  errorBox.hidden = false;
}

function hideError() {
  errorBox.textContent = "";
  errorBox.hidden = true;
}
