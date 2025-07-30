import type { CorrectModeConfig } from "../../config/config";
import type { ESLintConfigSubset } from "../../lib/eslint";
import type { ESLintSuppressionsJson } from "../../suppressions-json/types";

import { isRuleFixable } from "../../lib/eslint";
import { toRuleBasedSuppression } from "../../suppressions-json/rule-based";
import { extractPathsByGlobs } from "../../utils/glob";
import { pick } from "../../utils/object";
import { createCandidateCollectionStrategy } from "./strategies";

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

/**
 * @package
 */
export type RuleViolationInfo = {
  isFixable: boolean;
  originalViolations: {
    [filePath: string]: {
      count: number;
    };
  };
  ruleId: string;
  selectableViolations: {
    [filePath: string]: {
      count: number;
    };
  };
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
  violations:
    | RuleViolationInfo["originalViolations"]
    | RuleViolationInfo["selectableViolations"],
  limitType: "file" | "violation",
): number => {
  return limitType === "file"
    ? Object.keys(violations).length
    : Object.values(violations).reduce((sum, { count }) => sum + count, 0);
};

/**
 * Categorize rules for selection by partitioning by limit.
 * @param violationInfos - Array of rule violation information.
 * @param limitCount - The limit count.
 * @param limitType - The limit type (file or violation).
 * @returns Object with fullSelectable and partialSelectable arrays.
 */
const categorizeRulesForSelection = (
  violationInfos: RuleViolationInfo[],
  limitCount: number,
  limitType: "file" | "violation",
): {
  fullSelectable: RuleViolationInfo[];
  partialSelectable: RuleViolationInfo[];
} => {
  // Partition rules by limit
  // eslint-disable-next-line unicorn/no-array-reduce
  return violationInfos.reduce(
    (accumulator, rule) => {
      const totalCount = countRuleViolationsByLimit(
        // If we use selectableViolations, non full-selectable rules would be marked as full-selectable.
        // Because the count of selectableViolations is always less than or equal to the count of originalViolations.
        rule.originalViolations,
        limitType,
      );

      if (totalCount <= limitCount) {
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
    if (a.isFixable !== b.isFixable) {
      return b.isFixable ? 1 : -1;
    }

    // Calculate selectable violation counts for comparison
    const aSelectableCount = countRuleViolationsByLimit(
      a.selectableViolations,
      limitType,
    );
    const bSelectableCount = countRuleViolationsByLimit(
      b.selectableViolations,
      limitType,
    );

    // Second: prioritize higher selectable violation count
    if (aSelectableCount !== bSelectableCount) {
      return bSelectableCount - aSelectableCount;
    }

    // Third: use rule ID as tiebreaker (lexicographical order)
    return a.ruleId.localeCompare(b.ruleId);
  });
};

/**
 * Select violations for a rule based on the limit type and count.
 * @param rule - The rule to select violations from.
 * @param limitCount - The limit count.
 * @param config - Correct mode config.
 * @returns Record of selected violations by file.
 */
const selectViolationsForRule = (
  rule: RuleViolationInfo,
  limitCount: number,
  config: CorrectModeConfig,
): {
  [filePath: string]: number;
} => {
  const selectedViolations: {
    [filePath: string]: number;
  } = {};
  let selectedCount = 0;
  const limitType = config.limit.type;
  const eligibleFiles = Object.keys(rule.selectableViolations);

  if (limitType === "file") {
    // For file limit, select files up to the limit count
    for (const file of eligibleFiles.slice(0, limitCount)) {
      const violationCount = rule.selectableViolations[file]?.count;
      if (violationCount != null) {
        selectedViolations[file] = violationCount;
      }
    }
  } else {
    // For violation limit, select files until violation count reaches limit
    for (const file of eligibleFiles) {
      const violationCount = rule.selectableViolations[file]?.count;
      if (violationCount == null) continue;

      if (selectedCount + violationCount > limitCount) {
        break;
      }

      selectedCount += violationCount;
      selectedViolations[file] = violationCount;
    }
  }

  return selectedViolations;
};

/**
 * Decide the optimal rule from candidate rules - Phase 2 of rule selection.
 * @param violationInfos - Array of filtered rule violation information.
 * @param config - Correct mode config.
 * @returns The result of the selection.
 *
 * @package
 */
export function decideOptimalRule(
  violationInfos: RuleViolationInfo[],
  config: CorrectModeConfig,
): SelectionResult {
  const {
    limit: { count: limitCount, type: limitType },
    partialSelection: allowPartialSelection,
  } = config;

  // Guard clause: early return for empty candidates
  if (violationInfos.length === 0) {
    return { success: false };
  }

  const partitionedRules = categorizeRulesForSelection(
    violationInfos,
    limitCount,
    limitType,
  );

  // Try full selection first - early return if possible
  if (partitionedRules.fullSelectable.length > 0) {
    // Safe: sortedFullSelectable.length > 0 guaranteed by preceding check
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const bestRule = sortRulesByPriority(
      partitionedRules.fullSelectable,
      limitType,
    )[0]!;

    return {
      selection: { ruleId: bestRule.ruleId, type: "full" },
      success: true,
    };
  }

  // Guard clause: early return if partial selection not allowed
  if (!allowPartialSelection) {
    return { success: false };
  }

  // Attempt partial selection
  if (partitionedRules.partialSelectable.length === 0) {
    return { success: false };
  }

  // Safe: sortedPartialSelectable.length > 0 guaranteed by preceding check
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const bestPartialSelectableRule = sortRulesByPriority(
    partitionedRules.partialSelectable,
    limitType,
  )[0]!;

  const selectedViolations = selectViolationsForRule(
    bestPartialSelectableRule,
    limitCount,
    config,
  );

  // Guard clause: early return if no violations selected
  if (Object.keys(selectedViolations).length === 0) {
    return { success: false };
  }

  return {
    selection: {
      ruleId: bestPartialSelectableRule.ruleId,
      type: "partial",
      violations: selectedViolations,
    },
    success: true,
  };
}

/**
 * Filter rule violation information based on the given configuration.
 * @param infos - Rule violation information.
 * @param config - Correct mode configuration.
 * @returns Array of filtered rule violation information.
 *
 * @package
 */
export function filterViolations(
  infos: RuleViolationInfo[],
  config: CorrectModeConfig,
): RuleViolationInfo[] {
  const {
    autoFixableOnly,
    exclude: { files: excludeGlobs, rules: excludedRules },
    include: { files: includeGlobs, rules: includedRules },
  } = config;

  const filteredViolationInfos: RuleViolationInfo[] = [];
  for (const info of infos) {
    const { isFixable, originalViolations, ruleId } = info;

    // Guard clause: Check if rule is auto-fixable when required
    if (autoFixableOnly && !isFixable) {
      continue;
    }

    // Guard clause: Check if rule is excluded
    if (excludedRules.includes(ruleId)) {
      continue;
    }

    // Guard clause: Check if rule is included when include filter is specified
    if (includedRules.length > 0 && !includedRules.includes(ruleId)) {
      continue;
    }

    // Apply file filtering: first exclude files, then apply include filter
    let filteredFiles: string[] = Object.keys(originalViolations);
    // Exclude files that match exclude.files patterns
    if (excludeGlobs.length > 0) {
      const excludedMatches = extractPathsByGlobs(filteredFiles, excludeGlobs);
      filteredFiles = filteredFiles.filter(
        (file) => !excludedMatches.includes(file),
      );
    }

    // Apply include.files filtering
    if (includeGlobs.length > 0) {
      filteredFiles = extractPathsByGlobs(filteredFiles, includeGlobs);
    }

    filteredViolationInfos.push({
      isFixable,
      originalViolations,
      ruleId,
      selectableViolations: pick(originalViolations, filteredFiles),
    });
  }

  return filteredViolationInfos;
}

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
  config: CorrectModeConfig,
): Promise<SelectionResult> {
  // Validate limit type for exhaustive checking
  switch (config.limit.type) {
    case "file":
    case "violation": {
      break;
    }
    default: {
      // exhaustive check
      const l = config.limit.type satisfies never;
      throw new Error(`Got unknown limit type: ${JSON.stringify(l)}`);
    }
  }

  if (config.limit.count <= 0) {
    const limitTypeLabel = config.limit.type === "file" ? "file" : "violation";
    throw new Error(`The ${limitTypeLabel} limit must be greater than 0.`);
  }

  const ruleBasedSuppression = toRuleBasedSuppression(suppressions);

  const violations: RuleViolationInfo[] = Object.entries(
    ruleBasedSuppression,
  ).map(([ruleId, violations]) => ({
    isFixable: isRuleFixable(eslintConfig, ruleId),
    originalViolations: violations,
    ruleId,
    selectableViolations: {},
  }));

  const filteredViolations = filterViolations(violations, config);

  const getCandidates = createCandidateCollectionStrategy(config);
  const candidates = await getCandidates(filteredViolations, config);

  return decideOptimalRule(candidates, config);
}
