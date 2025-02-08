import type { Linter } from "eslint";

import type { SupportedModules } from "../todofile";

import { TodoModuleV1Handler } from "../todofile/v1";
import { TodoModuleV2Handler } from "../todofile/v2";

/**
 * Build ESLint configs for the todo file.
 * @param todoModule
 * Todo module object with supported version.
 * @returns
 * - ESLint configs to disable todo rules.
 * - `null` if unsupported todo module passed.
 */
export const buildESLintFlatConfig = (
  todoModule: SupportedModules,
): Linter.Config[] | null => {
  if (TodoModuleV1Handler.isVersion(todoModule)) {
    return TodoModuleV1Handler.buildDisableConfigsForESLint(todoModule);
  }

  if (TodoModuleV2Handler.isVersion(todoModule)) {
    return TodoModuleV2Handler.buildDisableConfigsForESLint(todoModule);
  }

  // When new version is supported, typecheck will fail here.
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const _exhaustiveCheck = todoModule satisfies never;

  return null;
};
