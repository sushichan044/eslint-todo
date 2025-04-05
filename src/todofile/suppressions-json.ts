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

export type ESLintSuppressionsJSON = {
  [filePath: string]: SuppressionEntry;
};

export const ESLintSuppressionsJSONHandler: TodoModuleHandler<ESLintSuppressionsJSON> =
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

    isVersion(todo): todo is ESLintSuppressionsJSON {
      return typia.validateEquals<ESLintSuppressionsJSON>(todo).success;
    },

    upgradeToNextVersion: () => false,
  };
