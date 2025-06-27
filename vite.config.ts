/// <reference types="vitest/config" />

import { defineConfig } from "vite";

import { typiaVite } from "./typia-plugin";

export default defineConfig({
  plugins: [typiaVite],
  test: {
    benchmark: {
      include: ["**/*.{bench,benchmark}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}"],
    },
    coverage: {
      include: ["src/**"],
      provider: "v8",
      reporter: ["text", "json-summary", "json"],
      reportOnFailure: true,
    },
    reporters:
      process.env["GITHUB_ACTIONS"] == null
        ? "default"
        : ["default", "github-actions"],
    typecheck: {
      enabled: true,
    },
  },
});
