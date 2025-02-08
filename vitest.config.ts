import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    coverage: {
      provider: "v8",
      reporter: ["text", "json-summary", "json"],
      reportOnFailure: true,
    },
    reporters:
      process.env["GITHUB_ACTIONS"] != null
        ? ["default", "github-actions"]
        : "default",
  },
});
