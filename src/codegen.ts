import { generateCode, parseModule } from "magicast";

import type { TodoModuleLike } from "./todofile/types";

/**
 * Create a JavaScript code from the ESLint todo module.
 * @returns
 * JavaScript file content. Just write it to a file.
 */
export const generateTodoModuleCode = (eslintTodo: TodoModuleLike): string => {
  const js = [
    "/* eslint-disable */",
    "/**",
    " * Auto generated file by eslint-todo. DO NOT EDIT MANUALLY.",
    " */",
    "",
    "export default {};",
  ].join("\n");

  const module_ = parseModule<{ default: unknown }>(js);

  module_.exports.default = eslintTodo;

  const { code: jsCode } = generateCode(module_, {
    format: { objectCurlySpacing: true, tabWidth: 2 },
  });

  return `${jsCode}\n`;
};
