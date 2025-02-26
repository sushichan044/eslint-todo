// @ts-check
/// <reference path="./eslint-typegen.d.ts" />

import ts from "@virtual-live-lab/eslint-config/presets/ts";
import vitest from "@vitest/eslint-plugin";
import { composer } from "eslint-flat-config-utils";
import typegen from "eslint-typegen";
import tseslint from "typescript-eslint";

import eslintConfigTodo from "./dist/eslint/index.mjs";

export default typegen(
  composer(
    // @ts-expect-error 型が合わない
    ...tseslint.config({
      extends: ts,
      name: "@repo/eslint-config/base",
    }),
  )
    .override("@repo/eslint-config/base", {
      plugins: {
        // @ts-expect-error 型が合わない
        "@typescript-eslint": tseslint.plugin,
      },
      rules: {
        "@typescript-eslint/no-restricted-imports": [
          "error",
          {
            paths: [
              {
                importNames: ["default"],
                message: "Please use named imports instead.",
                name: "pathe",
              },
            ],
          },
        ],
        "no-restricted-imports": "off",
      },
    })
    .append(eslintConfigTodo())
    .append({
      files: ["**/*.test.ts", "**/*.spec.ts"],
      plugins: {
        vitest,
      },
      rules: {
        ...vitest.configs.recommended.rules,
        "vitest/consistent-test-filename": "error",
      },
    }),
);
