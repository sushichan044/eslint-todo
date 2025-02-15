import type { Linter } from "eslint";

import type { SupportedModules } from "../todofile";
import type { RuleSeverity } from "../todofile/types";

import { TodoModuleV1Handler } from "../todofile/v1";
import { TodoModuleV2Handler } from "../todofile/v2";

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
export const buildESLintConfigForModule = (
  todoModule: SupportedModules,
  severity: RuleSeverity,
): Linter.Config[] | null => {
  if (TodoModuleV1Handler.isVersion(todoModule)) {
    return TodoModuleV1Handler.buildConfigsForESLint(todoModule, severity);
  }

  if (TodoModuleV2Handler.isVersion(todoModule)) {
    return TodoModuleV2Handler.buildConfigsForESLint(todoModule, severity);
  }

  // When new version is supported, typecheck will fail here.
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const _exhaustiveCheck = todoModule satisfies never;

  return null;
};
