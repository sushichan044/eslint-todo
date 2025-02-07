import { ESLint } from "eslint";
import { existsSync } from "node:fs";
import { writeFile } from "node:fs/promises";
import path from "pathe";

import type { UserOptions } from "./options";
import type { ESLintTodo } from "./types";

import { generateESLintTodoModule } from "./codegen";
import { type Options, optionsWithDefault } from "./options";
import { isNonEmptyString } from "./utils";

/**
 * Reset the ESLint todo file.
 * Use this function before re-generating the ESLint todo file.
 * @param todoFile
 */
const resetTodoFile = async (todoFilePath: string): Promise<void> => {
  if (!existsSync(todoFilePath)) {
    return;
  }

  await writeFile(todoFilePath, generateESLintTodoModule({}));
};

/**
 * Collect lint results from ESLint.
 * @param eslint
 * @param options
 * @returns
 */
const runESLintLinting = async (
  eslint: ESLint,
  options: Options,
): Promise<ESLint.LintResult[]> =>
  eslint.lintFiles(path.resolve(options.cwd, "**/*"));

const aggregateESLintTodoByRuleId = (
  results: ESLint.LintResult[],
  options: Options,
): ESLintTodo => {
  return results.reduce((acc, lintResult) => {
    for (const message of lintResult.messages) {
      if (!isNonEmptyString(message.ruleId)) {
        continue;
      }

      acc[message.ruleId] ??= {
        autoFix: false,
        files: [],
      };

      if (Object.hasOwn(acc, message.ruleId)) {
        // acc[message.ruleId] already exists

        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        acc[message.ruleId]!.files.push(
          path.relative(options.cwd, lintResult.filePath),
        );
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        acc[message.ruleId]!.autoFix = message.fix != null;
      }
    }
    return acc;
  }, {} as ESLintTodo);
};

/**
 * Format the ESLint todo object.
 * @param todo
 * @returns
 */
export const removeDuplicateFilesFromTodo = (todo: ESLintTodo): ESLintTodo => {
  return Object.entries(todo).reduce((acc, [ruleId, entry]) => {
    acc[ruleId] = {
      ...entry,
      files: [...new Set(entry.files)],
    };
    return acc;
  }, {} as ESLintTodo);
};

export const generateESLintTodo = async (
  userOptions: UserOptions,
): Promise<void> => {
  const resolvedOptions = optionsWithDefault(userOptions);

  const resolvedTodoPath = path.resolve(
    resolvedOptions.cwd,
    resolvedOptions.todoFile,
  );

  await resetTodoFile(resolvedTodoPath);

  const eslint = new ESLint();
  const results = await runESLintLinting(eslint, resolvedOptions);

  const todoByRuleId = aggregateESLintTodoByRuleId(results, resolvedOptions);
  const uniqueTodoList = removeDuplicateFilesFromTodo(todoByRuleId);

  await writeFile(resolvedTodoPath, generateESLintTodoModule(uniqueTodoList));
};
