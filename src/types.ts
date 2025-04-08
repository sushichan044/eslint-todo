import type { ESLint } from "eslint";

import type { TodoFilePath } from "./path";
import type { LatestTodoModule } from "./todofile";
import type { TodoModuleLike } from "./todofile/types";
import type { MaybePromisifyAllMethods } from "./utils/types";

export type ESLintInitializeOptions = Pick<ESLint.Options, "overrideConfig">;

export type IESLintTodoCoreLike = MaybePromisifyAllMethods<ESLintTodoCoreLike>;

interface ESLintTodoCoreLike {
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

  /**
   * Check if the todo module has uncommitted git changes.
   */
  todoModuleHasUncommittedChanges(): Promise<boolean>;

  writeTodoModule(todo: TodoModuleLike): Promise<void>;
}
