import { generateCode, parseModule } from "magicast";

import type { ESLintTodo } from "./types";

/**
 * Create a JavaScript module code from the ESLint todo list.
 * @returns
 * JavaScript file content. Just write it to a file.
 */
export const generateESLintTodoModule = (eslintTodo: ESLintTodo): string => {
  const js = `/* eslint-disable */
/**
 * Auto generated file by eslint-todo. DO NOT EDIT MANUALLY.
 */

export default {};
`;

  const mod = parseModule(js);

  mod.exports["default"] = eslintTodo;

  const { code: jsCode } = generateCode(mod, {
    format: { objectCurlySpacing: true, tabWidth: 2 },
  });

  return `${jsCode}\n`;
};
