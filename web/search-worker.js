import init, { GogmaCounterSearchSession } from "./pkg/gogma_wasm_search.js";

let cancelled = false;

self.addEventListener("message", async ({ data }) => {
  if (data.type === "cancel") {
    cancelled = true;
    return;
  }
  if (data.type !== "start") return;

  cancelled = false;
  let session;

  try {
    await init();
    const config = data.config;
    session = new GogmaCounterSearchSession(
      config.weaponType,
      config.attributeForce,
      config.counterGate,
      config.counterStart,
      config.counterEnd,
      new Uint8Array(config.observations),
      config.seedStart,
      config.seedEnd,
    );

    while (!session.done() && !cancelled) {
      const pairs = session.search_next(config.chunkSize);
      self.postMessage(
        {
          type: "progress",
          workerId: data.workerId,
          checked: Number(session.checked_seeds()),
          total: Number(session.total_seeds()),
          pairs,
        },
        [pairs.buffer],
      );

      await new Promise((resolve) => setTimeout(resolve, 0));
    }

    self.postMessage({
      type: cancelled ? "cancelled" : "done",
      workerId: data.workerId,
    });
  } catch (error) {
    self.postMessage({
      type: "error",
      workerId: data.workerId,
      message: error instanceof Error ? error.message : String(error),
    });
  } finally {
    session?.free();
  }
});
