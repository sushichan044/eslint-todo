import type { TodoModuleV2 } from "../todofile/v2";
import type {
  OperationFileLimit,
  OperationLimit,
  OperationOptions,
  OperationViolationLimit,
} from "./types";

type PartialRuleSelection = {
  /**
   * The rule ID that was selected.
   */
  ruleId: string;
  type: "partial";
  /**
   * The selected violations for the rule.
   */
  violations: {
    [file: string]: number;
  };
};

type FullRuleSelection = {
  /**
   * The rule ID that was selected.
   */
  ruleId: string;
  type: "full";
};

export type RuleSelection = FullRuleSelection | PartialRuleSelection;

export type SelectionResult =
  | {
      selection: RuleSelection;
      success: true;
    }
  | {
      success: false;
    };

export const selectRuleBasedOnLimit = (
  todoModule: TodoModuleV2,
  limit: OperationLimit,
  options: OperationOptions = {},
): SelectionResult => {
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

export const selectRuleBasedOnFilesLimit = (
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
    if (totalFiles > maxFiles && totalFiles <= limitCount) {
      maxFiles = totalFiles;
      selectedRule = ruleId;
    }
  }

  if (selectedRule == null) {
    return { success: false };
  }

  return {
    selection: {
      ruleId: selectedRule,
      type: "full",
    },
    success: true,
  };
};

/**
 * Selects the rule with the most violations that can be auto-fixed and is below the specified limit.
 *
 * @param todoModule - The TodoModuleV2 object.
 * @param limit - The upper limit for the number of violations.
 * @returns The rule ID with the most violations that can be auto-fixed and is below the limit, or null if no such rule exists.
 */
export const selectRuleBasedOnViolationsLimit = (
  todoModule: TodoModuleV2,
  limit: OperationViolationLimit,
  options: OperationOptions = {},
): SelectionResult => {
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
    if (totalViolations > maxViolations && totalViolations <= limitCount) {
      maxViolations = totalViolations;
      selectedRule = ruleId;
    }
  }

  if (selectedRule == null) {
    return { success: false };
  }

  return {
    selection: {
      ruleId: selectedRule,
      type: "full",
    },
    success: true,
  };
};
