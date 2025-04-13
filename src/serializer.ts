import { generateCode, parseModule } from "magicast";

import type { ESLintSuppressionsJson } from "./suppressions-json/types";
// eslint-disable-next-line @typescript-eslint/no-restricted-imports
import type { TodoModuleV1 } from "./todofile/v1";
import type { TodoModuleV2 } from "./todofile/v2";

export const TodoModuleSerializer = {
  fromV1: (todo: TodoModuleV1): string => {
    return serializeTodoModule(todo);
  },

  fromV2: (todo: TodoModuleV2): string => {
    return serializeTodoModule(todo);
  },

  fromSuppressionsJson: (sup: ESLintSuppressionsJson): string => {
    return serializeSuppressionsJson(sup);
  },
};

/**
 * Create a JavaScript code from the ESLint todo module.
 * @returns
 * JavaScript file content. Just write it to a file.
 */
const serializeTodoModule = (
  eslintTodo: TodoModuleV1 | TodoModuleV2,
): string => {
  const js = [
    "/* eslint-disable */",
    "/**",
    " * Auto generated file by eslint-todo. DO NOT EDIT MANUALLY.",
    " */",
    "",
    "/* prettier-ignore */",
    "// biome-ignore format: this is an auto-generated file",
    "export default {};",
  ].join("\n");

  const module_ = parseModule<{ default: unknown }>(js);

  module_.exports.default = eslintTodo;

  const { code: jsCode } = generateCode(module_, {
    format: { objectCurlySpacing: true, tabWidth: 2 },
  });

  return `${jsCode}\n`;
};

const serializeSuppressionsJson = (sup: ESLintSuppressionsJson): string => {
  return JSON.stringify(sup, null, 2);
};
