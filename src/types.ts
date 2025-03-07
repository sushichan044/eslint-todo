import type { ESLint, Linter } from "eslint";

import type { LatestTodoModule, SupportedTodoModules } from "./todofile";
import type { TodoFilePath } from "./todofile/path";
import type { RuleSeverity, TodoModuleLike } from "./todofile/types";
import type { MaybePromisifyAllMethods } from "./utils/types";

export type ESLintInitializeOptions = Pick<ESLint.Options, "overrideConfig">;

interface ESLintTodoCoreLike {
  /**
   * Build ESLint configs for the todo file.
   * @param todoModule
   * Todo module object with supported version.
   * @param severity
   * Severity of the rule.
   * @returns
   * - ESLint configs to disable todo rules.
   * - `null` if unsupported todo module passed.
   */
  buildESLintConfig(
    todoModule: SupportedTodoModules,
    severity: RuleSeverity,
  ): Linter.Config[];

  /**
   * Build a todo object from the lint results.
   * @param lintResults LintResults from ESLint
   */
  buildTodoFromLintResults(lintResults: ESLint.LintResult[]): LatestTodoModule;

  /**
   * Get the path of current todo module.
   */
  getTodoModulePath(): TodoFilePath;

  /**
   * Initialize ESLint instance.
   */
  initializeESLint(options?: ESLintInitializeOptions): void;

  /**
   * Run ESLint and collect the LintResults.
   * @returns LintResults from ESLint
   */
  lint(): Promise<ESLint.LintResult[]>;

  /**
   * Empty the todo module and reset to the default.
   */
  resetTodoModule(): Promise<void>;

  writeTodoModule(todo: TodoModuleLike): Promise<void>;
}

export type IESLintTodoCoreLike = MaybePromisifyAllMethods<ESLintTodoCoreLike>;
