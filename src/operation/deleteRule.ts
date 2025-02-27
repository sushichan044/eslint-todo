import { klona } from "klona/json";

import type { TodoModuleV2 } from "../todofile/v2";

/**
 * Delete a rule from the todo module.
 *
 * @param currentModule - The current todo module.
 * @param ruleId - The rule ID to delete.
 * @returns The new todo module with the rule deleted.
 */
export const deleteRule = (
  currentModule: TodoModuleV2,
  ruleId: string,
): TodoModuleV2 => {
  const newModule = klona(currentModule);

  if (Object.hasOwn(newModule.todo, ruleId)) {
    delete newModule.todo[ruleId];
  }

  return newModule;
};
