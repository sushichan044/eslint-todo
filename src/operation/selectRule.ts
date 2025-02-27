import type { TodoModuleV2 } from "../todofile/v2";
import type {
  OperationFileLimit,
  OperationLimit,
  OperationOptions,
  OperationViolationLimit,
} from "./types";

export type SelectionResult =
  | {
      ruleId: string;
      success: true;
    }
  | {
      success: false;
    };

export const selectRuleBasedOnLimit = (
  todoModule: TodoModuleV2,
  limit: OperationLimit,
  options: OperationOptions = {},
) => {
  switch (limit.type) {
    case "file":
      return selectRuleBasedOnFilesLimit(todoModule, limit, options);
    case "violation":
      return selectRuleBasedOnViolationsLimit(todoModule, limit, options);
    default:
      // exhaustive check
      const l = limit satisfies never;
      throw new Error(`Got unknown limit: ${JSON.stringify(l)}`);
  }
};

const selectRuleBasedOnFilesLimit = (
  todoModule: TodoModuleV2,
  limit: OperationFileLimit,
  options: OperationOptions = {},
): SelectionResult => {
  const { count: limitCount } = limit;
  const { autoFixableOnly = true } = options;

  let selectedRule: string | null = null;
  let maxFiles = 0;

  for (const [ruleId, entry] of Object.entries(todoModule.todo)) {
    if (autoFixableOnly && !entry.autoFix) {
      continue;
    }

    const totalFiles = Object.keys(entry.violations).length;
    if (totalFiles > maxFiles && totalFiles < limitCount) {
      maxFiles = totalFiles;
      selectedRule = ruleId;
    }
  }

  return selectedRule != null
    ? { ruleId: selectedRule, success: true }
    : { success: false };
};

/**
 * Selects the rule with the most violations that can be auto-fixed and is below the specified limit.
 *
 * @param todoModule - The TodoModuleV2 object.
 * @param limit - The upper limit for the number of violations.
 * @returns The rule ID with the most violations that can be auto-fixed and is below the limit, or null if no such rule exists.
 */
function selectRuleBasedOnViolationsLimit(
  todoModule: TodoModuleV2,
  limit: OperationViolationLimit,
  options: OperationOptions = {},
): SelectionResult {
  const { count: limitCount } = limit;
  const { autoFixableOnly = true } = options;

  let selectedRule: string | null = null;
  let maxViolations = 0;

  for (const [ruleId, entry] of Object.entries(todoModule.todo)) {
    if (autoFixableOnly && !entry.autoFix) {
      continue;
    }

    const totalViolations = Object.values(entry.violations).reduce(
      (sum, count) => sum + count,
      0,
    );
    if (totalViolations > maxViolations && totalViolations < limitCount) {
      maxViolations = totalViolations;
      selectedRule = ruleId;
    }
  }

  return selectedRule != null
    ? { ruleId: selectedRule, success: true }
    : { success: false };
}
