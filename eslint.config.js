// @ts-check
import ts from "@virtual-live-lab/eslint-config/presets/ts";
import tseslint from "typescript-eslint";

import eslintConfigTodo from "./dist/eslint/index.mjs";

export default tseslint.config(
  {
    extends: [...ts],
    name: "@repo/eslint-config/base",
  },
  {
    extends: [...(await eslintConfigTodo())],
    name: "@repo/eslint-config/todo",
  },
);
