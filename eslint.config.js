// @ts-check
import ts from "@virtual-live-lab/eslint-config/presets/ts";
import tseslint from "typescript-eslint";

import eslintConfigTodo from "./dist/eslint/index.mjs";

export default tseslint.config(
  {
    extends: [...ts],
    name: "@repo/eslint-config/base",
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
  },
  {
    extends: [...(await eslintConfigTodo())],
    name: "@repo/eslint-config/todo",
  },
);
