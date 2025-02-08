import type { ESLint } from "eslint";

import path from "pathe";

import type { Options } from "../options";
import type { ESLintRuleId, TodoModuleHandler } from "./types";

import { isNonEmptyString } from "../utils/string";

type ESLintTodoEntryV1 = {
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
export type TodoModuleV1 = Record<ESLintRuleId, ESLintTodoEntryV1>;

export const TodoModuleV1Handler: TodoModuleHandler<TodoModuleV1> = {
  version: 1,

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

  getDefaultTodo() {
    return {};
  },

  isVersion(todo): todo is TodoModuleV1 {
    return !Object.hasOwn(todo, "meta");
  },

  upgradeToNextVersion: () => false,
};

const aggregateESLintResultsByRule = (
  results: ESLint.LintResult[],
  options: Options,
): TodoModuleV1 => {
  return results.reduce((todoMod, result) => {
    const relativeFilePath = path.relative(options.cwd, result.filePath);

    for (const message of result.messages) {
      if (!isNonEmptyString(message.ruleId)) {
        continue;
      }

      todoMod[message.ruleId] ??= {
        autoFix: false,
        files: [],
      };

      if (Object.hasOwn(todoMod, message.ruleId)) {
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        todoMod[message.ruleId]!.files.push(relativeFilePath);
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        todoMod[message.ruleId]!.autoFix = message.fix != null;
      }
    }
    return todoMod;
  }, TodoModuleV1Handler.getDefaultTodo());
};

/**
 * Format the ESLint todo object.
 * @param todo
 * @returns
 */
const removeDuplicateFilesFromTodo = (todo: TodoModuleV1): TodoModuleV1 => {
  return Object.entries(todo).reduce((acc, [ruleId, entry]) => {
    acc[ruleId] = {
      ...entry,
      files: [...new Set(entry.files)],
    };
    return acc;
  }, TodoModuleV1Handler.getDefaultTodo());
};
