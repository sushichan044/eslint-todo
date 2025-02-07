import type { ESLint } from "eslint";

import path from "pathe";

import type { Options } from "../options";
import type { ESLintRuleId, TodoFile } from "./types";

import { isNonEmptyString } from "../utils/string";

export type ESLintTodoEntryV1 = {
  /**
   * Whether rule can be auto fixed.
   */
  autoFix: boolean;
  /**
   * Files violating the rule.
   */
  files: string[];
};

/**
 * ESLint todo object. key is ESLint rule id.
 *
 * @example
 * ```js
 * {
 *   "no-console": {
 *     autoFix: false,
 *     files: ["src/index.js"]
 *   }
 * }
 * ```
 */
export type ESLintTodoV1 = Record<ESLintRuleId, ESLintTodoEntryV1>;

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
interface ITodoFileV1 extends TodoFile<ESLintTodoV1> {}

export const TodoFileV1: ITodoFileV1 = {
  buildDisableConfigsForESLint: (todo) => {
    return Object.entries(todo).map(([ruleId, entry]) => ({
      files: entry.files,
      name: `@sushichan044/eslint-todo/todo/${ruleId}`,
      rules: {
        [ruleId]: "off",
      },
    }));
  },
  buildTodoFromLintResults(lintResult, options) {
    const todoByRuleId = aggregateESLintResultsByRule(lintResult, options);
    return removeDuplicateFilesFromTodo(todoByRuleId);
  },
  isVersion(todo): todo is ESLintTodoV1 {
    return !Object.hasOwn(todo, "meta");
  },
  upgradeToNextVersion: () => false,
  version: 1,
};

const aggregateESLintResultsByRule = (
  results: ESLint.LintResult[],
  options: Options,
): ESLintTodoV1 => {
  return results.reduce((acc, lintResult) => {
    for (const message of lintResult.messages) {
      if (!isNonEmptyString(message.ruleId)) {
        continue;
      }
      const relativeFilePath = path.relative(options.cwd, lintResult.filePath);

      acc[message.ruleId] ??= {
        autoFix: false,
        files: [],
        // v2 code
        // violations: {
        //   [relativeFilePath]: 0,
        // },
      };

      if (Object.hasOwn(acc, message.ruleId)) {
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        acc[message.ruleId]!.files.push(relativeFilePath);
        // v2 code
        // acc[message.ruleId]!.violations[relativeFilePath]!++;
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        acc[message.ruleId]!.autoFix = message.fix != null;
      }
    }
    return acc;
  }, {} as ESLintTodoV1);
};

/**
 * Format the ESLint todo object.
 * @param todo
 * @returns
 */
const removeDuplicateFilesFromTodo = (todo: ESLintTodoV1): ESLintTodoV1 => {
  return Object.entries(todo).reduce((acc, [ruleId, entry]) => {
    acc[ruleId] = {
      ...entry,
      files: [...new Set(entry.files)],
    };
    return acc;
  }, {} as ESLintTodoV1);
};
