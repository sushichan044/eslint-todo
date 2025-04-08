import { relative } from "pathe";
import typia from "typia";

import type { TodoModuleHandler } from "./types";

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
  todo: Record<string, ESLintTodoEntryV2>;
};

export const TodoModuleV2Handler: TodoModuleHandler<TodoModuleV2> = {
  version: 2,

  buildTodoFromLintResults(lintResult, config) {
    const todoModule = TodoModuleV2Handler.getDefaultTodo();

    for (const result of lintResult) {
      const relativeFilePath = relative(config.root, result.filePath);

      for (const message of result.messages) {
        if (!isNonEmptyString(message.ruleId)) {
          continue;
        }

        todoModule.todo[message.ruleId] ??= {
          autoFix: false,
          violations: {},
        };
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        todoModule.todo[message.ruleId]!.violations[relativeFilePath] ??= 0;

        if (Object.hasOwn(todoModule.todo, message.ruleId)) {
          // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
          todoModule.todo[message.ruleId]!.violations[relativeFilePath]!++;
          // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
          todoModule.todo[message.ruleId]!.autoFix = message.fix != null;
        }
      }
    }

    return todoModule;
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
    return typia.validateEquals<TodoModuleV2>(todo).success;
  },

  upgradeToNextVersion: () => false,
};
