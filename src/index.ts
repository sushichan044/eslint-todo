import { ESLint } from "eslint";
import path from "pathe";

import type { Options } from "./options";
import type { ESLintTodo } from "./types";

import { isNonEmptyString } from "./utils";

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

/**
 * Generate ESLint Todo object.
 */
export const generateESLintTodo = async (
  options: Options,
): Promise<ESLintTodo> => {
  const eslint = new ESLint({ cwd: options.cwd });
  const results = await runESLintLinting(eslint, options);

  const todoByRuleId = aggregateESLintTodoByRuleId(results, options);
  const uniqueTodoList = removeDuplicateFilesFromTodo(todoByRuleId);

  return uniqueTodoList;
};
