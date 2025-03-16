// eslint-disable-next-line @typescript-eslint/triple-slash-reference
/// <reference path="./eslint-typegen.d.ts" />

import type { ESLint } from "eslint";

import ts from "@virtual-live-lab/eslint-config/presets/ts";
import vitest from "@vitest/eslint-plugin";
import { composer } from "eslint-flat-config-utils";
import importAccess from "eslint-plugin-import-access/flat-config";
import eslintPluginUnicorn from "eslint-plugin-unicorn";
import typegen from "eslint-typegen";
import globals from "globals";
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
          "@typescript-eslint/no-restricted-types": [
            "error",
            {
              types: {
                Partial: {
                  message:
                    "Consider using `DeepPartial` from `utils/types` instead",
                  suggest: ["DeepPartial"],
                },
              },
            },
          ],
          "no-restricted-imports": "off",
        },
      },
    )
    .append(
      // @ts-expect-error 型が合わない
      tseslint.config({
        extends: [eslintPluginUnicorn.configs.recommended],
        name: "@repo/eslint-config/unicorn",
        rules: {
          "unicorn/filename-case": [
            "error",
            {
              case: "kebabCase",
            },
          ],
          "unicorn/no-null": "off",
        },
      }),
    )
    .append({
      files: ["**/*.test.ts", "**/*.spec.ts"],
      plugins: {
        vitest,
      },
      rules: {
        ...vitest.configs.recommended.rules,
        "vitest/consistent-test-filename": "error",
      },
    })
    .append({
      files: ["**/*.ts"],
      plugins: {
        // Plugin の型が typescript-eslint ベースなので合わない
        "import-access": importAccess as ESLint.Plugin,
      },
      rules: {
        "import-access/jsdoc": "error",
      },
    })
    .append({
      files: ["bin/eslint-todo.mjs"],
      languageOptions: {
        globals: globals.nodeBuiltin,
      },
      rules: {
        "unicorn/filename-case": "off",
      },
    })
    .prepend({
      ignores: ["src/generated/**"],
    })
    .append(eslintConfigTodo()),
);
