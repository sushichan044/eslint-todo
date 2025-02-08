import path from "pathe";

import type { ESLintRuleId, TodoModuleHandler } from "./types";

import { isNonEmptyString } from "../utils/string";

type ESLintTodoEntryV2 = {
  /**
   * Whether rule can be auto fixed.
   */
  autoFix: boolean;
  /**
   * Files violating the rule.
   */
  violations: {
    [filePath: string]: number;
  };
};

/**
 * ESLint todo object version 2. key is ESLint rule id.
 *
 * @example
 * ```js
 * {
 *   meta: {
 *     version: 2,
 *   },
 *   todo: {
 *     "no-console": {
 *       autoFix: false,
 *       violations: {
 *         "src/index.js": 1,
 *       }
 *     }
 *   }
 * }
 */
export type TodoModuleV2 = {
  meta: {
    version: 2;
  };
  todo: Record<ESLintRuleId, ESLintTodoEntryV2>;
};

export const TodoModuleV2Handler: TodoModuleHandler<TodoModuleV2> = {
  version: 2,

  buildDisableConfigsForESLint: ({ todo }) => {
    return Object.entries(todo).map(([ruleId, entry]) => ({
      files: Object.keys(entry.violations),
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

        todoMod.todo[message.ruleId] ??= {
          autoFix: false,
          violations: {},
        };
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        todoMod.todo[message.ruleId]!.violations[relativeFilePath] ??= 0;

        if (Object.hasOwn(todoMod.todo, message.ruleId)) {
          // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
          todoMod.todo[message.ruleId]!.violations[relativeFilePath]!++;
          // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
          todoMod.todo[message.ruleId]!.autoFix = message.fix != null;
        }
      }
      return todoMod;
    }, TodoModuleV2Handler.getDefaultTodo());
  },

  getDefaultTodo() {
    return {
      meta: {
        version: 2,
      },
      todo: {},
    };
  },

  isVersion(todo): todo is TodoModuleV2 {
    return (
      Object.hasOwn(todo, "meta") &&
      // @ts-expect-error VERSION is always a number
      Object.hasOwn(todo["meta"], "VERSION") &&
      // @ts-expect-error VERSION is always a number
      typeof todo["meta"].VERSION === "number" &&
      // @ts-expect-error VERSION is always a number
      todo["meta"].VERSION === 2
    );
  },

  upgradeToNextVersion: () => false,
};
