import { defineAction } from "./index";

export const genAction = defineAction(async ({ core, logger }) => {
  await core.resetTodoModule();

  logger.start("Running ESLint ...");
  const lintResults = await core.lint();
  logger.success("ESLint finished!");

  logger.start("Generating ESLint todo file ...");
  const todo = await core.getESLintTodo(lintResults);
  await core.writeTodoModule(todo);
});
