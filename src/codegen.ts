import { generateCode, parseModule } from "magicast";

import type { ESLintTodoV1 } from "./todofile/v1";

/**
 * Create a JavaScript module code from the ESLint todo list.
 * @returns
 * JavaScript file content. Just write it to a file.
 */
export const generateESLintTodoModule = (eslintTodo: ESLintTodoV1): string => {
  const js = [
    "/* eslint-disable */",
    "/**",
    " * Auto generated file by eslint-todo. DO NOT EDIT MANUALLY.",
    " */",
    "",
    "export default {};",
  ].join("\n");

  const mod = parseModule(js);

  mod.exports["default"] = eslintTodo;

  const { code: jsCode } = generateCode(mod, {
    format: { objectCurlySpacing: true, tabWidth: 2 },
  });

  return `${jsCode}\n`;
};
