import { klona } from "klona/json";

import type { TodoModuleV2 } from "../todofile/v2";
import type { RuleSelection } from "./selectRule";

/**
 * Delete a rule from the todo module.
 *
 * @param currentModule - The current todo module.
 * @param ruleSelection - The rule selection to delete.
 * @returns The new todo module with the rule deleted.
 */
export const deleteRule = (
  currentModule: TodoModuleV2,
  ruleSelection: RuleSelection,
): TodoModuleV2 => {
  const newModule = klona(currentModule);

  if (ruleSelection.type === "full") {
    if (Object.hasOwn(newModule.todo, ruleSelection.ruleId)) {
      delete newModule.todo[ruleSelection.ruleId];
    }
    return newModule;
  }

  return newModule;
};
