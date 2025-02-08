import { isEmpty } from "es-toolkit/compat";
import path from "pathe";

import type { ESLintRuleId, TodoModuleHandler } from "./types";
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
export type TodoModuleV1 = Record<ESLintRuleId, ESLintTodoEntryV1>;

export const TodoModuleV1Handler: TodoModuleHandler<
  TodoModuleV1,
  TodoModuleV2
> = {
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
    return todo["meta"] == null;
  },

  upgradeToNextVersion: (todo) => {
    if (isEmpty(todo)) {
      return TodoModuleV2Handler.getDefaultTodo();
    }

    return Object.entries(todo).reduce((todoV2, [ruleId, entry]) => {
      todoV2.todo[ruleId] = {
        autoFix: entry.autoFix,
        violations: entry.files.reduce(
          (violations, file) => {
            violations[file] ??= 0;
            violations[file]++;
            return violations;
          },
          {} as Record<string, number>,
        ),
      };
      return todoV2;
    }, TodoModuleV2Handler.getDefaultTodo());
  },
};
