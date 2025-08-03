import type { Config, CorrectModeConfig } from "../../config/config";
import type { ESLintConfigSubset } from "../../lib/eslint";
import type { ESLintSuppressionsJson } from "../../suppressions-json/types";
import type { IViolationFilteringStrategy } from "./filters/types";

import { isRuleFixable } from "../../lib/eslint";
import { toRuleBasedSuppression } from "../../suppressions-json/rule-based";
import { applyViolationFilters } from "./filters";
import { ImportGraphBasedStrategy } from "./filters/import-graph";
import { IncludeExcludeFilter } from "./filters/include-exclude";

// ============================================================================
// Rule Selection Types
// ============================================================================

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

type ViolationAmount = {
  [filePath: string]: {
    count: number;
  };
};

/**
 * @package
 */
export type RuleViolationInfo = {
  meta: {
    isFixable: boolean;
    ruleId: string;
  };
  violations: ViolationAmount;
};

// ============================================================================
// Internal Helpers
// ============================================================================

/**
 * Calculate the total count of violations for a rule based on the limit type.
 * @param rule - Rule violation information.
 * @param limitType - The limit type (file or violation).
 * @returns The total count based on the limit type.
 */
const countRuleViolationsByLimit = (
  violations: ViolationAmount,
  limitType: "file" | "violation",
): number => {
  return limitType === "file"
    ? Object.keys(violations).length
    : Object.values(violations).reduce((sum, { count }) => sum + count, 0);
};

/**
 * Categorize violations by partitioning by limit.
 * @param violationInfos - Array of rule violation information.
 * @param limitCount - The limit count.
 * @param limitType - The limit type (file or violation).
 * @returns Object with fullSelectable and partialSelectable arrays.
 */
const categorizeViolationsByLimit = (
  violationInfos: RuleViolationInfo[],
  correctModeConfig: CorrectModeConfig,
): {
  fullSelectable: RuleViolationInfo[];
  partialSelectable: RuleViolationInfo[];
} => {
  // Partition rules by limit
  // eslint-disable-next-line unicorn/no-array-reduce
  return violationInfos.reduce(
    (accumulator, rule) => {
      const totalCount = countRuleViolationsByLimit(
        rule.violations,
        correctModeConfig.limit.type,
      );

      if (totalCount <= correctModeConfig.limit.count) {
        accumulator.fullSelectable.push(rule);
      } else {
        accumulator.partialSelectable.push(rule);
      }
      return accumulator;
    },
    {
      fullSelectable: [] as RuleViolationInfo[],
      partialSelectable: [] as RuleViolationInfo[],
    },
  );
};

/**
 * Sort rules by priority: fixable first, then by count, then by rule ID.
 * @param violationInfos - Array of rule violation information.
 * @param limitType - The limit type (file or violation).
 * @returns Sorted array of rule violation information.
 */
const sortRulesByPriority = (
  violationInfos: RuleViolationInfo[],
  limitType: "file" | "violation",
): RuleViolationInfo[] => {
  return violationInfos.toSorted((a, b) => {
    // First: prioritize fixable rules (true > false)
    if (a.meta.isFixable !== b.meta.isFixable) {
      return b.meta.isFixable ? 1 : -1;
    }

    // Calculate selectable violation counts for comparison
    const aSelectableCount = countRuleViolationsByLimit(
      a.violations,
      limitType,
    );
    const bSelectableCount = countRuleViolationsByLimit(
      b.violations,
      limitType,
    );

    // Second: prioritize higher selectable violation count
    if (aSelectableCount !== bSelectableCount) {
      return bSelectableCount - aSelectableCount;
    }

    // Third: use rule ID as tiebreaker (lexicographical order)
    return a.meta.ruleId.localeCompare(b.meta.ruleId);
  });
};

/**
 * Select violations for a rule based on the limit type and count.
 * @param rule - The rule to select violations from.
 * @param limitCount - The limit count.
 * @param config - Correct mode config.
 * @returns Record of selected violations by file.
 */
const selectPartialViolations = (
  rule: RuleViolationInfo,
  config: CorrectModeConfig,
): {
  [filePath: string]: number;
} => {
  const selectedViolations: {
    [filePath: string]: number;
  } = {};
  let selectedCount = 0;
  const limitType = config.limit.type;
  const limitCount = config.limit.count;
  const eligibleFiles = Object.keys(rule.violations);

  if (limitType === "file") {
    // For file limit, select files up to the limit count
    for (const file of eligibleFiles.slice(0, limitCount)) {
      const violationCount = rule.violations[file]?.count;
      if (violationCount != null) {
        selectedViolations[file] = violationCount;
      }
    }
  } else {
    // For violation limit, select files until violation count reaches limit
    for (const file of eligibleFiles) {
      const violationCount = rule.violations[file]?.count;
      if (violationCount == null) continue;

      if (selectedCount + violationCount > limitCount) {
        // Calculate remaining capacity and add partial violations if possible
        const remainingCapacity = limitCount - selectedCount;
        if (remainingCapacity > 0) {
          selectedViolations[file] = remainingCapacity;
        }
        break;
      }

      selectedCount += violationCount;
      selectedViolations[file] = violationCount;
    }
  }

  return selectedViolations;
};

// ============================================================================
// Public Functions
// ============================================================================

/**
 * Select a rule to correct based on the given configuration.
 * @param suppressions - Suppressions.
 * @param eslintConfig - ESLint config.
 * @param config - Correct mode config.
 * @returns The result of the selection.
 */
export async function selectRuleToCorrect(
  suppressions: ESLintSuppressionsJson,
  eslintConfig: ESLintConfigSubset,
  config: Config,
): Promise<SelectionResult> {
  // Validate limit type for exhaustive checking
  switch (config.correct.limit.type) {
    case "file":
    case "violation": {
      break;
    }
    default: {
      // exhaustive check
      const l = config.correct.limit.type satisfies never;
      throw new Error(`Got unknown limit type: ${JSON.stringify(l)}`);
    }
  }

  if (config.correct.limit.count <= 0) {
    const limitTypeLabel =
      config.correct.limit.type === "file" ? "file" : "violation";
    throw new Error(`The ${limitTypeLabel} limit must be greater than 0.`);
  }

  const ruleBasedSuppression = toRuleBasedSuppression(suppressions);

  // no rule found
  if (Object.keys(ruleBasedSuppression).length === 0) {
    return { success: false };
  }

  const violationInfos: RuleViolationInfo[] = Object.entries(
    ruleBasedSuppression,
  ).map(([ruleId, violations]) => ({
    meta: {
      isFixable: isRuleFixable(eslintConfig, ruleId),
      ruleId,
    },
    violations,
  }));

  const { fullSelectable, partialSelectable } = categorizeViolationsByLimit(
    violationInfos,
    config.correct,
  );
  const strategies: IViolationFilteringStrategy[] = [];
  if (config.correct.strategy.type === "import-graph") {
    strategies.push(new ImportGraphBasedStrategy({ config }));
  }
  strategies.push(new IncludeExcludeFilter({ config }));

  if (fullSelectable.length > 0) {
    const candidates = await applyViolationFilters(
      fullSelectable,
      strategies,
      config,
    );
    const nonEmpty = candidates.filter(
      (info) => Object.keys(info.violations).length > 0,
    );
    const bestRule = sortRulesByPriority(
      nonEmpty,
      config.correct.limit.type,
    )[0];

    if (bestRule != null) {
      return {
        selection: { ruleId: bestRule.meta.ruleId, type: "full" },
        success: true,
      };
    }
  }

  // Guard clause: early return if partial selection not allowed
  if (!config.correct.partialSelection) {
    return { success: false };
  }

  const pCandidates = await applyViolationFilters(
    partialSelectable,
    strategies,
    config,
  );
  const pNonEmpty = pCandidates.filter(
    (info) => Object.keys(info.violations).length > 0,
  );
  const bestPartialSelectableRule = sortRulesByPriority(
    pNonEmpty,
    config.correct.limit.type,
  )[0];

  if (bestPartialSelectableRule == null) {
    return { success: false };
  }

  const partialSelected = selectPartialViolations(
    bestPartialSelectableRule,
    config.correct,
  );

  return {
    selection: {
      ruleId: bestPartialSelectableRule.meta.ruleId,
      type: "partial",
      violations: partialSelected,
    },
    success: true,
  };
}
