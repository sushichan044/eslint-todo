import type { ESLintTodo } from "./types";

/**
 * Create a JavaScript file from the ESLint todo list.
 * @returns
 * JavaScript file content.
 */
export const generateESLintTodoFile = (eslintTodo: ESLintTodo): string => {
  const js = `/* eslint-disable */
/**
 * Auto generated file by eslint-todo. DO NOT EDIT MANUALLY.
 */

const eslintTodo = ${JSON.stringify(eslintTodo, null, 2)};

export default eslintTodo;
`;
  return js;
};
