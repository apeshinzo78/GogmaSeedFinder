import { spawn } from "node:child_process";
import { mkdir, rm, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";

const chromePath = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const outputDir = resolve("artifacts", "note-images-noto");
const profileDir = resolve("artifacts", ".note-capture-profile");
const port = 9337;
const appUrl = "http://127.0.0.1:4173/";

await mkdir(outputDir, { recursive: true });
await rm(profileDir, { recursive: true, force: true });

const chrome = spawn(chromePath, [
  "--headless=new",
  "--disable-gpu",
  "--hide-scrollbars",
  "--no-first-run",
  "--no-default-browser-check",
  `--remote-debugging-port=${port}`,
  `--user-data-dir=${profileDir}`,
  "about:blank",
], { stdio: "ignore", windowsHide: true });

const delay = (milliseconds) => new Promise((resolveDelay) => setTimeout(resolveDelay, milliseconds));

async function waitForJson(url, attempts = 60) {
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    try {
      const response = await fetch(url);
      if (response.ok) return response.json();
    } catch {
      // Chrome may still be starting.
    }
    await delay(100);
  }
  throw new Error(`Timed out waiting for ${url}`);
}

let socket;
let commandId = 0;
const pending = new Map();

function send(method, params = {}) {
  commandId += 1;
  const id = commandId;
  socket.send(JSON.stringify({ id, method, params }));
  return new Promise((resolveCommand, rejectCommand) => {
    pending.set(id, { resolve: resolveCommand, reject: rejectCommand });
  });
}

function evaluate(expression) {
  return send("Runtime.evaluate", {
    expression,
    awaitPromise: true,
    returnByValue: true,
  }).then((result) => {
    if (result.exceptionDetails) {
      throw new Error(result.exceptionDetails.text ?? "Page evaluation failed");
    }
    return result.result.value;
  });
}

async function waitFor(expression, attempts = 100) {
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    if (await evaluate(`Boolean(${expression})`)) return;
    await delay(50);
  }
  throw new Error(`Timed out waiting for: ${expression}`);
}

async function setViewport(width, height = 900) {
  await send("Emulation.setDeviceMetricsOverride", {
    width,
    height,
    deviceScaleFactor: 1,
    mobile: false,
  });
}

async function activateTab(name) {
  await evaluate(`document.querySelector('[data-tab="${name}"]').click()`);
  await waitFor(`document.querySelector('[data-tab-view="${name}"]').classList.contains('active')`);
  await delay(100);
}

async function captureRange(filename, selectors, padding = 16) {
  const bounds = await evaluate(`(() => {
    const elements = ${JSON.stringify(selectors)}.flatMap((selector) => [...document.querySelectorAll(selector)]);
    if (!elements.length) throw new Error('No capture elements found');
    const boxes = elements.map((element) => {
      const rect = element.getBoundingClientRect();
      return {
        left: rect.left + scrollX,
        top: rect.top + scrollY,
        right: rect.right + scrollX,
        bottom: rect.bottom + scrollY,
      };
    });
    return {
      x: Math.max(0, Math.min(...boxes.map((box) => box.left)) - ${padding}),
      y: Math.max(0, Math.min(...boxes.map((box) => box.top)) - ${padding}),
      right: Math.max(...boxes.map((box) => box.right)) + ${padding},
      bottom: Math.max(...boxes.map((box) => box.bottom)) + ${padding},
    };
  })()`);
  const screenshot = await send("Page.captureScreenshot", {
    format: "png",
    fromSurface: true,
    captureBeyondViewport: true,
    clip: {
      x: bounds.x,
      y: bounds.y,
      width: bounds.right - bounds.x,
      height: bounds.bottom - bounds.y,
      scale: 1,
    },
  });
  await writeFile(join(outputDir, filename), Buffer.from(screenshot.data, "base64"));
}

try {
  await waitForJson(`http://127.0.0.1:${port}/json/version`);
  const targetResponse = await fetch(
    `http://127.0.0.1:${port}/json/new?${encodeURIComponent(appUrl)}`,
    { method: "PUT" },
  );
  if (!targetResponse.ok) throw new Error("Could not create a Chrome capture tab");
  const target = await targetResponse.json();
  socket = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((resolveSocket, rejectSocket) => {
    socket.onopen = resolveSocket;
    socket.onerror = rejectSocket;
  });
  socket.onmessage = (event) => {
    const message = JSON.parse(event.data);
    if (!message.id || !pending.has(message.id)) return;
    const { resolve: resolveCommand, reject: rejectCommand } = pending.get(message.id);
    pending.delete(message.id);
    if (message.error) rejectCommand(new Error(message.error.message));
    else resolveCommand(message.result);
  };

  await send("Page.enable");
  await send("Runtime.enable");
  await setViewport(1080, 900);
  await send("Page.navigate", { url: `${appUrl}?capture=note#guide` });
  await waitFor(`document.readyState === 'complete' && document.querySelector('.seed-stream-figure')`);

  const savedState = {
    saveState: {
      baseSeed: 86315169,
      bonusCounter: 480,
      skillCounter: 33,
      baseSource: "手入力",
      bonusSource: "手入力",
      skillSource: "手入力",
    },
    targets: [
      { id: "fire-ls", weaponType: 3, attributeForce: 1, label: "火太刀", keepCategories: [0, 0, 1, 2, 2], keepSource: "手入力" },
      { id: "dragon-ls", weaponType: 3, attributeForce: 5, label: "龍太刀", keepCategories: [0, 1, 1, 2, 3], keepSource: "手入力" },
      { id: "thunder-hammer", weaponType: 4, attributeForce: 3, label: "雷ハンマー", keepCategories: [0, 0, 0, 1, 2], keepSource: "手入力" },
    ],
    bonusPrediction: { mode: "reset" },
    artianBaseState: { baseSeed: 86315169, counters: {}, sources: {} },
  };
  await evaluate(`localStorage.setItem('gogma-seed-finder-state-v1', ${JSON.stringify(JSON.stringify(savedState))}); location.reload()`);
  await waitFor(`document.readyState === 'complete' && document.querySelector('.seed-stream-figure')`);
  await evaluate(`document.fonts.ready`);
  await delay(200);

  await activateTab("guide");
  await captureRange("01-seed-and-counters.png", [
    ".guide-panel > .guide-heading",
    ".guide-panel > .guide-intro",
    ".seed-stream-figure",
  ], 12);

  await setViewport(1200, 900);
  await activateTab("search");
  await evaluate(`document.querySelector('#load-sample').click()`);
  await delay(150);
  await captureRange("02-bonus-observations.png", [
    ".observations-heading",
    "#observation-rows",
  ], 12);

  await evaluate(`(() => {
    document.querySelector('#start-button').disabled = true;
    document.querySelector('#cancel-button').disabled = false;
    document.querySelector('#status-text').textContent = '探索中';
    document.querySelector('#progress-bar').style.width = '57.8%';
    document.querySelector('#progress-value').textContent = '57.80%';
    document.querySelector('#checked-value').textContent = '57,800,000';
    document.querySelector('#elapsed-value').textContent = '32.4秒';
    document.querySelector('#candidate-value').textContent = '0';
    document.querySelector('#empty-result').textContent = '候補を探索しています…';
  })()`);
  await captureRange("03-seed-search-progress.png", [
    "#search-form .actions",
    "#progress-panel",
  ], 12);

  await activateTab("skill-search");
  await evaluate(`(() => {
    const choose = (select, text) => {
      const option = [...select.options].find((item) => item.textContent === text);
      if (option) select.value = option.value;
    };
    const rows = [...document.querySelectorAll('.skill-observation-row')];
    const values = [['黒蝕竜の力', 'ヌシの魂'], ['雷顎竜の闘志', 'ヌシの魂']];
    rows.slice(0, 2).forEach((row, index) => {
      const selects = row.querySelectorAll('select');
      choose(selects[0], values[index][0]);
      choose(selects[1], values[index][1]);
    });
  })()`);
  await captureRange("04-skill-observations.png", [
    ".skill-settings",
    ".skill-observation-heading",
    "#skill-observation-rows",
    ".skill-actions",
  ], 12);

  await activateTab("bonus-future");
  await waitFor(`document.querySelectorAll('#comparison-rows tr').length > 0`);
  await captureRange("05-multi-weapon-bonus-results.png", [
    "[data-tab-view='bonus-future'] .comparison-actions",
    "#comparison-target-list",
    ".bonus-ex-filter-settings",
    ".bonus-export-actions",
    "[data-tab-view='bonus-future'] .adoption-note",
    "#comparison-header-row",
    "#comparison-rows tr:first-child",
  ], 12);

  await activateTab("skill-future");
  await waitFor(`document.querySelectorAll('#skill-prediction-rows tr').length > 1`);
  await captureRange("06-multi-weapon-skill-results.png", [
    "#skill-target-list",
    ".skill-filter-settings",
    "[data-tab-view='skill-future'] .prediction-export-actions",
    "[data-tab-view='skill-future'] .adoption-note",
    "#skill-prediction-header-row",
    "#skill-prediction-rows tr:nth-child(-n+2)",
  ], 12);

  await activateTab("guide");
  await captureRange("07-efficient-selection-flow.png", [
    ".efficient-selection-guide",
  ], 12);

  await activateTab("bonus-future");
  await evaluate(`document.querySelector('#bonus-operation-reset').click()`);
  await delay(100);
  await captureRange("08-lottery-method.png", [
    ".bonus-operation-section",
  ], 12);

  await evaluate(`document.querySelector('#bonus-operation-keep').click()`);
  await waitFor(`!document.querySelector('#keep-layout-panel').hidden && document.querySelectorAll('.keep-layout-card').length === 3`);
  await captureRange("09-current-layouts.png", [
    "#keep-layout-panel",
  ], 12);

  console.log(outputDir);
} finally {
  try {
    socket?.close();
  } catch {
    // Ignore cleanup failures.
  }
  chrome.kill();
  await delay(200);
  await rm(profileDir, { recursive: true, force: true });
}
