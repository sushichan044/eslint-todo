import type { ESLint } from "eslint";

import type { ESLintConfig } from "./lib/eslint";
import type { TodoFilePath } from "./path";
import type { TodoModuleLike } from "./todofile";
import type { TodoModuleV2 } from "./todofile/v2";
import type { MaybePromisifyAllMethods } from "./utils/types";

export type ESLintInitializeOptions = Pick<ESLint.Options, "overrideConfig">;

export type IESLintTodoCoreLike = MaybePromisifyAllMethods<ESLintTodoCoreLike>;

interface ESLintTodoCoreLike {
  /**
   * Build a todo object from the lint results.
   * @param lintResults LintResults from ESLint
   */
  buildTodoFromLintResults(lintResults: ESLint.LintResult[]): TodoModuleV2;

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
   * Read the ESLint config with resolved rule metadata.
   */
  readESLintConfig(): Promise<ESLintConfig>;

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
