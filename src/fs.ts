import { existsSync } from "node:fs";
import { writeFile } from "node:fs/promises";
import path from "pathe";

import type { Options } from "./options";
import type { ESLintTodo } from "./types";

import { generateESLintTodoModule } from "./codegen";

/**
 * Reset the ESLint todo file.
 * Use this function before re-generating the ESLint todo file.
 * @param todoFile
 */
export const resetTodoFile = async (options: Options): Promise<void> => {
  const todoFilePath = path.resolve(options.cwd, options.todoFile);

  if (!existsSync(todoFilePath)) {
    return;
  }

  await writeFile(todoFilePath, generateESLintTodoModule({}));
};

/**
 * Write the ESLint todo object to the file.
 * @param options
 * @param todo
 */
export const writeTodoFile = async (
  todo: ESLintTodo,
  options: Options,
): Promise<void> => {
  const todoFilePath = path.resolve(options.cwd, options.todoFile);

  const todoModule = generateESLintTodoModule(todo);

  await writeFile(todoFilePath, todoModule);
};
