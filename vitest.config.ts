import { defineConfig } from "vitest/config";

export const config = defineConfig({
  test: {
    reporters:
      process.env["GITHUB_ACTIONS"] != null
        ? ["default", "github-actions"]
        : "default",
  },
});
