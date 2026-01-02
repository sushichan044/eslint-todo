/// <reference types="vitest/config" />

import { defineConfig } from "vite";

import { typiaVite } from "./typia-plugin";

export default defineConfig({
  plugins: [typiaVite],
  test: {
    benchmark: {
      include: ["**/*.{bench,benchmark}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}"],
    },
    typecheck: {
      enabled: true,
    },
  },
});
