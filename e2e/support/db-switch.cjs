// Preloaded into one test server (NODE_OPTIONS=--require). Reads a small file, so a running server's database can be
// switched off or made to hang, and brought back, without touching the real database.
// CommonJS because `--require` needs it.
// eslint-disable-next-line @typescript-eslint/no-require-imports
const fs = require("node:fs");

let state = {};
const refresh = () => {
  try {
    state = JSON.parse(fs.readFileSync(process.env.DB_SWITCH_FILE, "utf8"));
  } catch {
    state = {};
  }
};
refresh();
setInterval(refresh, 100).unref();

const realFetch = globalThis.fetch;
globalThis.fetch = function (input, init) {
  const url = typeof input === "string" ? input : (input?.url ?? String(input));
  if (url.endsWith("/sql")) {
    if (state.db === "down") return Promise.reject(new TypeError("fetch failed (database switched off)"));
    if (state.db === "hang") {
      return new Promise((_, reject) => {
        const signal = init?.signal;
        if (signal?.aborted) reject(signal.reason);
        signal?.addEventListener("abort", () => reject(signal.reason));
      });
    }
  }
  return realFetch.call(this, input, init);
};
