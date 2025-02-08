import path from "pathe";

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
    return lintResult.reduce((todoMod, result) => {
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
  },

  getDefaultTodo() {
    return {};
  },

  isVersion(todo): todo is TodoModuleV1 {
    return !Object.hasOwn(todo, "meta");
  },

  upgradeToNextVersion: () => false,
};
