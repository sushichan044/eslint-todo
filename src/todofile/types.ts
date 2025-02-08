import type { ESLint, Linter } from "eslint";

import type { Options } from "../options";

export type TodoModuleLike = Record<string, unknown>;

export type GetCurrentTodoModule<T extends TodoModuleHandler<TodoModuleLike>> =
  ReturnType<T["getDefaultTodo"]>;

export type ESLintRuleId = string;

export interface TodoModuleHandler<
  CURRENT extends TodoModuleLike,
  NEXT extends TodoModuleLike = TodoModuleLike,
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
   * Get a default todo object.
   */
  getDefaultTodo(): CURRENT;
  /**
   * Check if the object is a version of this todo file.
   * @param todo Object to check.
   */
  isVersion(todo: TodoModuleLike): todo is CURRENT;
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
