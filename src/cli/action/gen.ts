import type { CLIAction } from "../types";

export const genAction: CLIAction = async (core, consola) => {
  await core.resetTodoModule();

  consola.start("Running ESLint ...");
  const lintResults = await core.lint();
  consola.success("ESLint finished!");

  consola.start("Generating ESLint todo file ...");
  const todo = await core.getESLintTodo(lintResults);
  await core.writeTodoModule(todo);
};
