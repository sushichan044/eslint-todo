import type { ESLint } from "eslint";

import ts from "@virtual-live-lab/eslint-config/presets/ts";
import vitest from "@vitest/eslint-plugin";
import importAccess from "eslint-plugin-import-access/flat-config";
import eslintPluginUnicorn from "eslint-plugin-unicorn";
import { defineConfig } from "eslint/config";
import globals from "globals";

import eslintConfigTodo from "./dist/eslint/index.mjs";

export default defineConfig(
  {
    extends: [ts],
  },
  {
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
  },
  {
    extends: [vitest.configs.recommended],
    files: ["**/*.test.ts", "**/*.spec.ts"],
    rules: {
      "vitest/consistent-test-filename": "error",
    },
  },
  {
    files: ["**/*.ts"],
    plugins: {
      // Plugin の型が typescript-eslint ベースなので合わない
      "import-access": importAccess as ESLint.Plugin,
    },
    rules: {
      "import-access/jsdoc": "error",
    },
  },
  {
    files: ["bin/eslint-todo.mjs"],
    languageOptions: {
      globals: globals.nodeBuiltin,
    },
    rules: {
      "unicorn/filename-case": "off",
    },
  },
  await eslintConfigTodo(),
);
