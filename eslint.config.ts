// eslint-disable-next-line @typescript-eslint/triple-slash-reference
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
    .override(
      "@repo/eslint-config/base__@virtual-live-lab/eslint-config/typescript",
      {
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
              patterns: [
                {
                  message: "Todofile v1 is deprecated. Please use v2 instead.",
                  regex: "/todofile/v1$",
                },
              ],
            },
          ],
          "no-restricted-imports": "off",
        },
      },
    )
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
