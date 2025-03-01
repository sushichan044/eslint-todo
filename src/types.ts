import type { ESLint, Linter } from "eslint";

import type { LatestModule, SupportedModules } from "./todofile";
import type { TodoFilePath } from "./todofile/path";
import type { RuleSeverity, TodoModuleLike } from "./todofile/types";
import type { MaybePromisifyAllMethods } from "./utils/types";

export type ESLintInitializeOptions = Pick<ESLint.Options, "overrideConfig">;

interface ESLintTodoCoreLike {
  /**
   * Build ESLint configs to enable / disable rules in the todo object.
   * @returns ESLint configs
   */
  buildESLintConfig(
    todoModule: SupportedModules,
    severity: RuleSeverity,
  ): Linter.Config[];

  /**
   * Build a todo object from the lint results.
   * @param lintResults LintResults from ESLint
   */
  buildTodoFromLintResults(lintResults: ESLint.LintResult[]): LatestModule;

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
