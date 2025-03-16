import { defineConfig } from "vitest/config";

import { typiaVite } from "./typia-plugin";

export default defineConfig({
  plugins: [typiaVite],
  test: {
    coverage: {
      provider: "v8",
      reporter: ["text", "json-summary", "json"],
      reportOnFailure: true,
    },
    reporters:
      process.env["GITHUB_ACTIONS"] == null
        ? "default"
        : ["default", "github-actions"],
  },
});
