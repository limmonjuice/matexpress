import path from "node:path";
import { defineConfig } from "vitest/config";

// The real order code against a real database: `npm run test:db`. See e2e/database/.
export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
      "server-only": path.resolve(__dirname, "e2e/support/empty.ts"),
    },
  },
  test: {
    environment: "node",
    include: ["e2e/database/**/*.test.ts"],
    testTimeout: 60_000,
    hookTimeout: 60_000,
  },
});
