import { relative } from "pathe";
import * as v from "valibot";

import type { ESLintRuleId, TodoModuleHandler } from "./types";

import { escapeGlobCharacters, isNonEmptyString } from "../utils/string";

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

// only for version checking.
const todoModuleMetaIsV2 = v.strictObject({
  version: v.literal(2),
});

export const TodoModuleV2Handler: TodoModuleHandler<TodoModuleV2> = {
  version: 2,

  buildConfigsForESLint: ({ todo }, severity) => {
    return Object.entries(todo).map(([ruleId, entry]) => ({
      files: Object.keys(entry.violations).map((f) => escapeGlobCharacters(f)),
      name: `@sushichan044/eslint-todo/${severity}/${ruleId}`,
      rules: {
        [ruleId]: severity,
      },
    }));
  },

  buildTodoFromLintResults(lintResult, options) {
    const todoModule = TodoModuleV2Handler.getDefaultTodo();

    for (const result of lintResult) {
      const relativeFilePath = relative(options.cwd, result.filePath);

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
    if (!Object.hasOwn(todo, "meta")) {
      return false;
    }

    return v.safeParse(todoModuleMetaIsV2, todo["meta"]).success;
  },

  upgradeToNextVersion: () => false,
};
