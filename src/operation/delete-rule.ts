import { klona } from "klona/json";

import type { TodoModuleV2 } from "../todofile/v2";
import type { RuleSelection } from "./select-rule";

/**
 * Delete a rule from the todo module.
 *
 * @param currentModule - The latest todo module.
 * @param ruleSelection - The rule selection to delete.
 * @returns The new todo module with the rule deleted.
 */
export const deleteRule = (
  currentModule: TodoModuleV2,
  ruleSelection: RuleSelection,
): TodoModuleV2 => {
  if (!Object.hasOwn(currentModule.todo, ruleSelection.ruleId)) {
    return currentModule;
  }

  if (ruleSelection.type === "full") {
    const newModule = klona(currentModule);
    delete newModule.todo[ruleSelection.ruleId];

    return newModule;
  }

  if (ruleSelection.type === "partial") {
    const newModule = klona(currentModule);

    // todo[ruleSelection.ruleId] is guaranteed to exist as we checked it first in the function.
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const entry = newModule.todo[ruleSelection.ruleId]!;

    for (const [file, count] of Object.entries(ruleSelection.violations)) {
      if (!Object.hasOwn(entry.violations, file)) {
        continue;
      }

      if (entry.violations[file] == null || entry.violations[file] !== count) {
        continue;
      }

      delete entry.violations[file];
    }
    return newModule;
  }

  const _exhaustiveCheck = ruleSelection satisfies never;
  throw new Error(`Unknown rule selection type ${JSON.stringify(_exhaustiveCheck)}`);
};
