import typia from "typia";

import type { TodoModuleHandler } from "./types";

/**
 * @example
 * ```json
 * {
 *   "@typescript-eslint/no-explicit-any": {
 *     "count": 1
 *   },
 *   "no-console": {
 *     "count": 1
 *   }
 * }
 * ```
 */
type SuppressionEntry = {
  [ruleId: string]: {
    count: number;
  };
};

export type ESLintSuppressionsJson = {
  [filePath: string]: SuppressionEntry;
};

export const ESLintSuppressionsJsonHandler: TodoModuleHandler<ESLintSuppressionsJson> =
  {
    // TODO: v1, v2 の型定義を削除したら "eslint-suppressions-json" に変更する
    version: 0,

    /**
     * @deprecated
     */
    buildConfigsForESLint: () => {
      return [];
    },

    /**
     * @deprecated
     */
    buildTodoFromLintResults: () => {
      return {};
    },

    getDefaultTodo() {
      return {};
    },

    isVersion(todo): todo is ESLintSuppressionsJson {
      return typia.validateEquals<ESLintSuppressionsJson>(todo).success;
    },

    upgradeToNextVersion: () => false,
  };
