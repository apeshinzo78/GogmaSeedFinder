import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import vm from "node:vm";

const appSource = readFileSync(new URL("./app.js", import.meta.url), "utf8");
const htmlSource = readFileSync(new URL("./index.html", import.meta.url), "utf8");
const i18nSource = readFileSync(new URL("./i18n.js", import.meta.url), "utf8");
const japaneseLetters = /\p{Script=Hiragana}|\p{Script=Katakana}/u;
const cjkText = /\p{Script=Han}|\p{Script=Hiragana}|\p{Script=Katakana}/u;

function translator(locale) {
  let observerCallback;
  class Element {
    childNodes = [];
    hasAttribute() { return false; }
  }
  const context = vm.createContext({
    localStorage: { getItem: () => locale },
    document: { documentElement: {}, body: new Element(), querySelector: () => null },
    Node: { TEXT_NODE: 3 },
    Element,
    MutationObserver: class {
      constructor(callback) { observerCallback = callback; }
      observe() {}
    },
  });
  // Run the browser module with a minimal DOM; retain its initialization and observer.
  vm.runInContext(i18nSource.replace(/^export /gm, ""), context);
  return { context, t: context.t, observe: (node) => observerCallback([{ addedNodes: [node] }]) };
}

const exampleState = {
  start: 1000, end: 1010, candidateCount: 11,
  suffix: "狭い探索範囲です。推定値に自信がある場合に使用してください。",
  label: "武器の属性", minimum: 0, maximum: 4294967295,
  source: "手入力", knownCount: 2, target: { keepSource: "10回先のリセット結果" },
  slotIndex: 2, readyCount: 1, comparisonTargets: [{}, {}], incompleteCount: 1,
  code: "GSF2-B67723575-G87-S0", rollIndex: 1, bonusName: "基礎攻撃力強化Ⅱ",
  weaponType: 3, bonusId: 8, count: 1000, categoryName: "斬れ味系", sharpnessAmmoCount: 3,
  index: 1, seed: 67723575, counter: 87, selected: false, startedAt: 1,
  performance: { now: () => 1500 }, range: "475〜485", impossibleObservation: ["", 2],
  detail: "抽選2の5枠がゲーム内の復元ボーナス上限に合いません。入力内容を確認してください。",
  MAX_REGISTERED_TARGETS: 16, completedRolls: 10, profile: {},
  predictionRolls: [{}, {}, {}], matchedRolls: [{}, {}], roll: { index: 1, seriesIndex: 99, groupIndex: 99 },
  nextCounter: 1000, visibleIndices: [{}, {}, {}], prefix: "", comparisonRollSets: [{}, {}],
  unit: "条件", filterStatus: "", minimumExCount: 4, rows: [{}, {}, {}], headers: [{}, {}],
  ready: 1, counters: [{}, {}], selectedSkillCounter: 1000, skillPredictionRollSets: [{}, {}],
  conditionMatchCount: 0, matchingRowCount: 0, targetName: "Custom Weapon", saveState: { skillCounter: 1000 },
  comparisonTargetName: () => "Custom Weapon", gogmaBonusName: () => "基礎攻撃力強化Ⅱ",
};

// These fragments are assembled into larger messages or compact bonus labels.
const internalFragments = new Set([
  "手入力", "状態コード", "予測結果", "装", "斬", "指定範囲",
  "武器", "条件", "EX厳選・",
  "非常に長時間かかります。端末やブラウザによっては完了が難しい場合があります。",
  "非常に長時間かかります。可能なら推定値を見直して範囲を分割してください。",
  "候補数が多いため長時間かかります。", "端末によっては数分かかります。",
  "狭い探索範囲です。推定値に自信がある場合に使用してください。",
]);

function assertLocalized(t, source, locale) {
  const result = t(source);
  if (locale === "ja") assert.equal(result, source);
  else assert.doesNotMatch(result, locale === "en" ? cjkText : japaneseLetters, source);
}

for (const locale of ["ja", "en", "zh-Hant"]) {
  test(`${locale}: static UI text and attributes have translations`, () => {
    const { t } = translator(locale);
    const withoutTemplates = appSource.replace(/`(?:[^`\\]|\\.)*`/g, "");
    const literals = [...withoutTemplates.matchAll(/"(?:[^"\\]|\\.)*"/g)].map((match) => JSON.parse(match[0]));
    const html = htmlSource.replace(/<script\b[^>]*>[\s\S]*?<\/script>/g, "");
    const texts = [...html.matchAll(/>([^<>]+)</g)].map((match) => match[1].trim().replace(/\s+/g, " "));
    const attributes = [...html.matchAll(/(?:placeholder|aria-label|title)="([^"]+)"/g)].map((match) => match[1]);
    for (const source of new Set([...literals, ...texts, ...attributes])) {
      if (!cjkText.test(source) || internalFragments.has(source) || ["日本語", "繁體中文"].includes(source)) continue;
      assertLocalized(t, source, locale);
    }
  });

  test(`${locale}: dynamic messages from app.js have translations`, () => {
    const { context, t } = translator(locale);
    Object.assign(context, exampleState);
    const variants = [
      {},
      { bonusFilterStatus: "・EX4個以上 0行", count: 10000 },
      { prefix: "EX厳選・", unit: "武器", selected: true, categoryName: "装填系" },
      { prefix: "EX厳選・", unit: "武器", bonusFilterStatus: "・EX4個以上 0行" },
      { skillFilterStatus: "・条件一致0行", range: "指定範囲" },
      { skillFilterStatus: "・条件一致900行", range: "1,000〜10,000", conditionMatchCount: 1500 },
      ...[...internalFragments].filter((text) => text.endsWith("。") && text !== exampleState.suffix).map((suffix) => ({ suffix })),
    ];
    for (const variant of variants) {
      Object.assign(context, exampleState, variant);
      for (const match of appSource.matchAll(/`(?:[^`\\]|\\.)*`/g)) {
        if (!cjkText.test(match[0])) continue;
        // The two filter suffixes are covered by their complete status messages.
        if (match[0].startsWith("`・EX") || match[0].startsWith("`・条件一致")) continue;
        // Each table uses its own suffix, even when testing the other table's filter.
        context.filterStatus = match[0].includes("${prefix}")
          ? variant.bonusFilterStatus ?? ""
          : variant.skillFilterStatus ?? "";
        const raw = vm.runInContext(match[0], context);
        const pieces = raw.startsWith("<div>") ? [...raw.matchAll(/>([^<>]+)</g)].map((piece) => piece[1]) : [raw];
        for (const source of pieces) assertLocalized(t, source, locale);
      }
    }
  });
}

test("Traditional Chinese translates reported messages after DOM insertion", () => {
  const { context, t, observe } = translator("zh-Hant");
  Object.assign(context, exampleState);
  const emptySearchTemplate = [...appSource.matchAll(/`(?:[^`\\]|\\.)*`/g)]
    .find((match) => match[0].startsWith("`候補を特定できませんでした。"))[0];
  const messages = [
    [vm.runInContext(emptySearchTemplate, context), "找不到候選。若輸入內容正確，目前的復原加成計數器可能在搜尋範圍（475～485）之外。請調整範圍，涵蓋此存檔至今抽選復原加成的大約累計次數，然後再試一次。"],
    ["EXが4個以上の結果は表示範囲内にありません。表示回数を増やすか最低EX数を下げてください。", "顯示範圍內沒有至少4個EX的結果。請增加顯示次數或降低最低EX數量。"],
    ["1件 × 100回・条件一致0セル", "1個目標 × 100次・0格符合條件"],
    ["1件 × 100回・条件一致0セル・条件一致0行", "1個目標 × 100次・0格符合條件・0列符合條件"],
    ["EX厳選・2武器 × 1,000回・EX4個以上 0行", "EX嚴選・2把武器 × 1,000次・0列達到至少4個EX"],
  ];
  for (const [source, expected] of messages) {
    assert.equal(t(source), expected);
    const node = { nodeType: 3, nodeValue: ` ${source} `, parentElement: { closest: () => null } };
    observe(node);
    assert.equal(node.nodeValue, ` ${expected} `);
  }
});

test("nested weapon validation localizes the error while preserving a custom name", () => {
  const { context } = translator("zh-Hant");
  context.comparisonTargetName = () => "日本語の武器";
  context.keepLayoutProblem = () => "弓には斬れ味・装填系を設定できません。";
  const validation = appSource.match(/^function requireTargetKeepCategories\(target\) \{[\s\S]*?^\}/m)[0];
  vm.runInContext(validation, context);
  assert.throws(() => context.requireTargetKeepCategories({}), { message: "日本語の武器: 弓不可設定銳利度／裝填系。" });
});
