import type { ESLint } from "eslint";

import type { Config } from "../config";

export type TodoModuleLike = Record<string, unknown>;

/**
 * Interface representing a handler for managing different versions of a todo module.
 *
 * @template CURRENT - The current version of the todo module.
 * @template NEXT - The next version of the todo module, defaults to `TodoModuleLike`.
 *
 * @package
 */
export interface TodoModuleHandler<
  CURRENT extends TodoModuleLike,
  NEXT extends TodoModuleLike = TodoModuleLike,
> {
  /**
   * Build a todo object from the lint results.
   * @param lintResult Lint results from ESLint
   */
  buildTodoFromLintResults(
    lintResult: ESLint.LintResult[],
    config: Config,
  ): CURRENT;

  /**
   * Get a default todo object.
   */
  getDefaultTodo(): CURRENT;

  /**
   * Check if the object is a version of this todo file.
   *
   * NOTE: you should use `typia.validateEquals<CURRENT>()` when implementing this method.
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
