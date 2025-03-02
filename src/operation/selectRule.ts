import type { TodoModuleV2 } from "../todofile/v2";
import type {
  OperationFileLimit,
  OperationLimit,
  OperationViolationLimit,
} from "./types";

import { isNonEmptyString } from "../utils/string";
import {
  type OperationOptions,
  operationOptionsWithDefault,
  type UserOperationOptions,
} from "./options";

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
  options: UserOperationOptions = {},
): SelectionResult => {
  const resolvedOptions = operationOptionsWithDefault(options);

  switch (limit.type) {
    case "file":
      return selectRuleBasedOnFilesLimit(todoModule, limit, resolvedOptions);
    case "violation":
      return selectRuleBasedOnViolationsLimit(
        todoModule,
        limit,
        resolvedOptions,
      );
    default:
      // exhaustive check
      const l = limit satisfies never;
      throw new Error(`Got unknown limit: ${JSON.stringify(l)}`);
  }
};

/**
 * @package
 */
export const selectRuleBasedOnFilesLimit = (
  todoModule: TodoModuleV2,
  limit: OperationFileLimit,
  options: OperationOptions,
): SelectionResult => {
  const { count: limitCount } = limit;
  const { allowPartialSelection, autoFixableOnly } = options;

  if (limitCount <= 0) {
    throw new Error("The file limit must be greater than 0.");
  }

  let fullSelectableRule: string | null = null;
  let selectedTargetCount = 0;
  let partialSelectableRule: string | null = null;

  for (const [ruleId, entry] of Object.entries(todoModule.todo)) {
    if (autoFixableOnly && !entry.autoFix) {
      continue;
    }

    const violatedFiles = Object.keys(entry.violations).length;

    if (violatedFiles > limitCount) {
      if (allowPartialSelection && partialSelectableRule == null) {
        // do partial selection only once since no need to compare with other rules exceeding the limit
        partialSelectableRule = ruleId;
      }
      continue;
    }

    // update FullSelection rule if it has more violations
    if (violatedFiles > selectedTargetCount) {
      fullSelectableRule = ruleId;
      selectedTargetCount = violatedFiles;
    }
  }

  if (fullSelectableRule != null) {
    return {
      selection: {
        ruleId: fullSelectableRule,
        type: "full",
      },
      success: true,
    };
  }

  if (
    allowPartialSelection &&
    isKeyOfTodo(todoModule.todo, partialSelectableRule)
  ) {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const rule = todoModule.todo[partialSelectableRule]!;

    const selectedPaths = Object.keys(rule.violations).slice(0, limitCount);

    const selectedViolations = selectedPaths.reduce(
      (acc, file) => {
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        acc[file] = rule.violations[file]!;
        return acc;
      },
      {} as Record<string, number>,
    );

    return {
      selection: {
        ruleId: partialSelectableRule,
        type: "partial",
        violations: selectedViolations,
      },
      success: true,
    };
  }

  return { success: false };
};

/**
 * Selects the rule with the most violations that can be auto-fixed and is below the specified limit.
 *
 * @param todoModule - The TodoModuleV2 object.
 * @param limit - The upper limit for the number of violations.
 * @returns The rule ID with the most violations that can be auto-fixed and is below the limit, or null if no such rule exists.
 *
 * @package
 */
export const selectRuleBasedOnViolationsLimit = (
  todoModule: TodoModuleV2,
  limit: OperationViolationLimit,
  options: OperationOptions,
): SelectionResult => {
  const { count: limitCount } = limit;
  const { allowPartialSelection, autoFixableOnly } = options;

  if (limitCount <= 0) {
    throw new Error("The violation limit must be greater than 0.");
  }

  let fullSelectableRule: string | null = null;
  let selectedTargetCount = 0;
  let partialSelectableRule: string | null = null;

  for (const [ruleId, entry] of Object.entries(todoModule.todo)) {
    if (autoFixableOnly && !entry.autoFix) {
      continue;
    }

    const totalViolationCount = Object.values(entry.violations).reduce(
      (sum, count) => sum + count,
      0,
    );

    if (totalViolationCount > limitCount) {
      if (allowPartialSelection && partialSelectableRule == null) {
        // do partial selection only once since no need to compare with other rules exceeding the limit
        partialSelectableRule = ruleId;
      }
      continue;
    }

    // update FullSelection rule if it has more violations
    if (totalViolationCount > selectedTargetCount) {
      fullSelectableRule = ruleId;
      selectedTargetCount = totalViolationCount;
    }
  }

  if (fullSelectableRule != null) {
    return {
      selection: {
        ruleId: fullSelectableRule,
        type: "full",
      },
      success: true,
    };
  }

  if (
    allowPartialSelection &&
    isKeyOfTodo(todoModule.todo, partialSelectableRule)
  ) {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const rule = todoModule.todo[partialSelectableRule]!;

    let selectedCount = 0;
    const selectedViolations: Record<string, number> = {};

    for (const [file, count] of Object.entries(rule.violations)) {
      if (selectedCount + count > limitCount) {
        break;
      }

      selectedCount += count;
      selectedViolations[file] = count;
    }

    // todo: {
    //   rule1: {
    //     autoFix: true,
    //     violations: {
    //       "file1.js": 3,
    //     },
    //   },
    // }
    // { limit: 2 }
    //
    // when this kind of situation occurs, no partial selection could be made
    // so we should return { success: false }
    if (Object.keys(selectedViolations).length === 0) {
      return { success: false };
    }

    return {
      selection: {
        ruleId: partialSelectableRule,
        type: "partial",
        violations: selectedViolations,
      },
      success: true,
    };
  }

  return { success: false };
};

const isKeyOfTodo = (
  todoModule: TodoModuleV2["todo"],
  ruleId: string | null,
): ruleId is keyof TodoModuleV2["todo"] => {
  return isNonEmptyString(ruleId) && Object.hasOwn(todoModule, ruleId);
};
