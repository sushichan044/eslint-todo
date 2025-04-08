import { relative } from "pathe";
import typia from "typia";

import type { TodoModuleHandler } from "./index";
import type { TodoModuleV2 } from "./v2";

import { isNonEmptyString } from "../utils/string";
import { TodoModuleV2Handler } from "./v2";

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
export type TodoModuleV1 = Record<string, ESLintTodoEntryV1>;

export const TodoModuleV1Handler: TodoModuleHandler<
  TodoModuleV1,
  TodoModuleV2
> = {
  version: 1,

  buildTodoFromLintResults(lintResult, config) {
    const todoModule: TodoModuleV1 = {};

    for (const result of lintResult) {
      const relativeFilePath = relative(config.root, result.filePath);

      for (const message of result.messages) {
        if (!isNonEmptyString(message.ruleId)) {
          continue;
        }

        todoModule[message.ruleId] ??= {
          autoFix: false,
          files: [],
        };

        if (Object.hasOwn(todoModule, message.ruleId)) {
          // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
          todoModule[message.ruleId]!.files.push(relativeFilePath);
          // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
          todoModule[message.ruleId]!.autoFix = message.fix != null;
        }
      }
    }

    return todoModule;
  },

  getDefaultTodo() {
    return {};
  },

  isVersion(todo): todo is TodoModuleV1 {
    return typia.validateEquals<TodoModuleV1>(todo).success;
  },

  upgradeToNextVersion: (todo) => {
    const todoModuleV2 = TodoModuleV2Handler.getDefaultTodo();

    for (const [ruleId, entry] of Object.entries(todo)) {
      for (const file of entry.files) {
        todoModuleV2.todo[ruleId] ??= {
          autoFix: entry.autoFix,
          violations: {},
        };

        todoModuleV2.todo[ruleId].violations[file] ??= 0;
        todoModuleV2.todo[ruleId].violations[file]++;
      }
    }

    return todoModuleV2;
  },
};
