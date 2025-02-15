import type { ESLint, Linter } from "eslint";

import type {
  LatestSupportedModuleHandler,
  SupportedModules,
} from "./todofile";
import type { TodoFilePath } from "./todofile/path";
import type {
  GetCurrentTodoModule,
  RuleSeverity,
  TodoModuleLike,
} from "./todofile/types";
import type { PromisifyAllMethods } from "./utils/types";

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
   * Get ESLintTodo object.
   * @param lintResults LintResults from ESLint
   */
  getESLintTodo(
    lintResults: ESLint.LintResult[],
  ): GetCurrentTodoModule<LatestSupportedModuleHandler>;

  /**
   * Get the path of current todo module.
   */
  getTodoModulePath(): TodoFilePath;

  /**
   * Initialize ESLint instance.
   */
  initializeESLint(): void;

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

export type IESLintTodoCoreLike = PromisifyAllMethods<ESLintTodoCoreLike>;
