import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    reporters:
      process.env["GITHUB_ACTIONS"] != null
        ? ["default", "github-actions"]
        : "default",
  },
});
