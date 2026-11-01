import path from "node:path";
import react from "@vitejs/plugin-react";
import { configDefaults, defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: { "@": path.resolve(__dirname, "src") },
  },
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./src/test/setup.ts"],
    css: false,
    // The browser tests run under Playwright, and the database tests under vitest.db.config.ts.
    exclude: [...configDefaults.exclude, "e2e/**"],
    // The buy box re-ranks on every keystroke, which can outlast the default 5 seconds on a busy machine.
    testTimeout: 15_000,
  },
});
