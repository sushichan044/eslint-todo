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
  buildESLintConfig(
    todoModule: SupportedModules,
    severity: RuleSeverity,
  ): Linter.Config[];

  getESLintTodo(
    lintResults: ESLint.LintResult[],
  ): GetCurrentTodoModule<LatestSupportedModuleHandler>;

  getTodoModulePath(): TodoFilePath;

  initializeESLint(): void;

  /**
   * Run ESLint and collect the LintResults.
   * @returns LintResults from ESLint
   */
  lint(): Promise<ESLint.LintResult[]>;

  resetTodoModule(): Promise<void>;

  writeTodoModule(todo: TodoModuleLike): Promise<void>;
}

export type IESLintTodoCoreLike = PromisifyAllMethods<ESLintTodoCoreLike>;
