import type { ESLint, Linter } from "eslint";

import type { Options } from "../options";

export type GetTodoFileSchema<T> = T extends TodoFile<infer U> ? U : never;

export type TodoFileLike = Record<string, unknown>;

export type ESLintRuleId = string;

export interface TodoFile<
  CURRENT extends TodoFileLike,
  NEXT extends TodoFileLike = TodoFileLike,
> {
  /**
   * Build ESLint configs to disable todo rules.
   * @param todo Todo object
   */
  buildDisableConfigsForESLint(todo: CURRENT): Linter.Config[];
  /**
   * Build a todo object from the lint results.
   * @param lintResult Lint results from ESLint
   */
  buildTodoFromLintResults(
    lintResult: ESLint.LintResult[],
    options: Options,
  ): CURRENT;
  /**
   * Check if the object is a version of this todo file.
   * @param todo Object to check.
   */
  isVersion(todo: TodoFileLike): todo is CURRENT;
  /**
   * Upgrade the todo object to the next version.
   * @param todo Current todo object
   * @returns
   * - `false` if the object cannot be upgraded. (Breaking change)
   * - Next version of the todo object if the object can be upgraded.
   */
  upgradeToNextVersion(todo: CURRENT): false | NEXT;
  version: number;
}
