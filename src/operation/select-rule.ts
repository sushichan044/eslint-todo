import type { CorrectModeConfig, CorrectModeLimitType } from "../config/config";
import type { ESLintConfigSubset } from "../lib/eslint";
import type { ESLintSuppressionsJson } from "../suppressions-json/types";

import { isRuleFixable } from "../lib/eslint";
import { toRuleBasedSuppression } from "../suppressions-json/rule-based";
import { extractPathsByGlobs } from "../utils/glob";

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
 * Selects a rule based on the given limit.
 * @param suppressions - Suppressions.
 * @param ruleMetaMap - ESLint config.
 * @param correctConfig - Correct mode config.
 */
export const selectRuleBasedOnLimit = (
  suppressions: ESLintSuppressionsJson,
  eslintConfig: ESLintConfigSubset,
  correctConfig: CorrectModeConfig,
): SelectionResult => {
  switch (correctConfig.limit.type) {
    case "file": {
      return selectRuleBasedOnFilesLimit(
        suppressions,
        eslintConfig,
        correctConfig,
      );
    }
    case "violation": {
      return selectRuleBasedOnViolationsLimit(
        suppressions,
        eslintConfig,
        correctConfig,
      );
    }
    default: {
      // exhaustive check
      const l = correctConfig.limit.type satisfies never;
      throw new Error(`Got unknown limit type: ${JSON.stringify(l)}`);
    }
  }
};

/**
 * @package
 */
export const selectRuleBasedOnFilesLimit = (
  suppressions: ESLintSuppressionsJson,
  eslintConfig: ESLintConfigSubset,
  config: CorrectModeConfig,
): SelectionResult => {
  const {
    limit: { count: limitCount },
    partialSelection: allowPartialSelection,
  } = config;

  if (limitCount <= 0) {
    throw new Error("The file limit must be greater than 0.");
  }

  const ruleCounts = calculateRuleCounts(
    suppressions,
    eslintConfig,
    config,
    "file",
  );

  return selectOptimalRule(ruleCounts, limitCount, allowPartialSelection);
};

/**
 * @package
 */
export const selectRuleBasedOnViolationsLimit = (
  suppressions: ESLintSuppressionsJson,
  eslintConfig: ESLintConfigSubset,
  config: CorrectModeConfig,
): SelectionResult => {
  const {
    limit: { count: limitCount },
    partialSelection: allowPartialSelection,
  } = config;

  if (limitCount <= 0) {
    throw new Error("The violation limit must be greater than 0.");
  }

  const ruleCounts = calculateRuleCounts(
    suppressions,
    eslintConfig,
    config,
    "violation",
  );

  return selectOptimalRule(
    ruleCounts,
    limitCount,
    allowPartialSelection,
    "violation",
  );
};

/**
 * Result of applying rule and file filters.
 */
type RuleFilterResult =
  | { correctableFiles: string[]; isEligible: true }
  | { isEligible: false };

/**
 * Apply rule-level and file-level filters to determine if a rule is eligible
 * and get the list of correctable files.
 * @param ruleId - The rule ID to check
 * @param violatedFiles - Array of all file paths for this rule
 * @param eslintConfig - ESLint configuration
 * @param config - Correct mode configuration
 * @returns RuleFilterResult indicating whether rule is eligible and filtered files
 *
 * @package
 */
export const applyRuleAndFileFilters = (
  ruleId: string,
  violatedFiles: string[],
  eslintConfig: ESLintConfigSubset,
  config: CorrectModeConfig,
): RuleFilterResult => {
  const {
    autoFixableOnly,
    exclude: { files: excludedFiles, rules: excludedRules },
    include: { files: includedFiles, rules: includedRules },
  } = config;

  // Check if rule is auto-fixable when required
  if (autoFixableOnly && !isRuleFixable(eslintConfig, ruleId)) {
    return { isEligible: false };
  }

  // Check if rule is excluded
  if (excludedRules.includes(ruleId)) {
    return { isEligible: false };
  }

  // Check if rule is included when include filter is specified
  if (includedRules.length > 0 && !includedRules.includes(ruleId)) {
    return { isEligible: false };
  }

  // Apply file filtering: first exclude files, then apply include filter
  let filteredFiles: string[] = violatedFiles;

  // Exclude files that match exclude.files patterns
  if (excludedFiles.length > 0) {
    const excludedMatches = extractPathsByGlobs(violatedFiles, excludedFiles);
    filteredFiles = filteredFiles.filter(
      (file) => !excludedMatches.includes(file),
    );
  }

  // Apply include.files filtering
  if (includedFiles.length > 0) {
    filteredFiles = extractPathsByGlobs(filteredFiles, includedFiles);
  }

  if (filteredFiles.length === 0) {
    return { isEligible: false };
  }

  return { correctableFiles: filteredFiles, isEligible: true };
};

/**
 * Select the optimal rule from rule count information.
 * @param ruleCounts - Array of rule count information.
 * @param limitCount - The limit count.
 * @param allowPartialSelection - Whether partial selection is allowed.
 * @param limitType - Whether the limit is for files or violations.
 *
 * @returns The result of the selection.
 *
 * @package
 */
export const selectOptimalRule = (
  ruleCounts: RuleCountInfo[],
  limitCount: number,
  allowPartialSelection: boolean,
  limitType: CorrectModeLimitType = "file",
): SelectionResult => {
  if (ruleCounts.length === 0) {
    return { success: false };
  }

  // Sort rules by multi-criteria: [fixable DESC, filtered_count DESC, rule_id ASC]
  const sortedRules = ruleCounts.toSorted((a, b) => {
    // First: prioritize fixable rules (true > false)
    if (a.isFixable !== b.isFixable) {
      return b.isFixable ? 1 : -1;
    }

    // Second: prioritize higher filtered count
    if (a.filteredCount !== b.filteredCount) {
      return b.filteredCount - a.filteredCount;
    }

    // Third: use rule ID as tiebreaker (lexicographical order)
    return a.ruleId.localeCompare(b.ruleId);
  });

  // Partition rules into full and partial selectable in single pass
  const partitionedRules = {
    fullSelectable: [] as RuleCountInfo[],
    partialSelectable: [] as RuleCountInfo[],
  };

  for (const rule of sortedRules) {
    if (rule.originalCount <= limitCount) {
      partitionedRules.fullSelectable.push(rule);
    } else {
      partitionedRules.partialSelectable.push(rule);
    }
  }

  // Try full selection first
  if (partitionedRules.fullSelectable.length > 0) {
    // Select first rule from sorted list (already the best)
    // Safe: fullSelectable.length > 0 guaranteed by preceding check
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const bestRule = partitionedRules.fullSelectable[0]!;

    return {
      selection: { ruleId: bestRule.ruleId, type: "full" },
      success: true,
    };
  }

  // If no full selection possible and partial selection is allowed
  if (allowPartialSelection) {
    // Use first partial rule (already sorted by priority)
    const partialSelectableRule = partitionedRules.partialSelectable[0];

    if (partialSelectableRule) {
      const selectedViolations: Record<string, number> = {};
      let selectedCount = 0;

      if (limitType === "file") {
        // For file limit, select files up to the limit count
        for (const file of partialSelectableRule.filteredFiles.slice(
          0,
          limitCount,
        )) {
          const violationCount = partialSelectableRule.filteredViolations[file];
          if (violationCount === undefined || violationCount === null) continue;
          selectedViolations[file] = violationCount;
        }
      } else {
        // For violation limit, select files until violation count reaches limit
        for (const file of partialSelectableRule.filteredFiles) {
          const violationCount = partialSelectableRule.filteredViolations[file];
          if (violationCount === undefined || violationCount === null) continue;

          if (selectedCount + violationCount > limitCount) {
            break;
          }

          selectedCount += violationCount;
          selectedViolations[file] = violationCount;
        }
      }

      if (Object.keys(selectedViolations).length > 0) {
        return {
          selection: {
            ruleId: partialSelectableRule.ruleId,
            type: "partial",
            violations: selectedViolations,
          },
          success: true,
        };
      }
    }
  }

  return { success: false };
};

/**
 * Information about a rule's counts after filtering.
 *
 * @package
 */
export type RuleCountInfo = {
  filteredCount: number;
  filteredFiles: string[];
  filteredViolations: Record<string, number>;
  isFixable: boolean;
  originalCount: number;
  ruleId: string;
};

/**
 * Calculate rule counts with filtering applied.
 * @param suppressions - Suppressions.
 * @param eslintConfig - ESLint config.
 * @param config - Correct mode config.
 * @param countType - Whether to count files or violations.
 *
 * @returns Array of violation information for each rule.
 *
 * @package
 */
export const calculateRuleCounts = (
  suppressions: ESLintSuppressionsJson,
  eslintConfig: ESLintConfigSubset,
  config: CorrectModeConfig,
  countType: CorrectModeLimitType,
): RuleCountInfo[] => {
  const ruleBasedSuppressions = toRuleBasedSuppression(suppressions);

  return Object.entries(ruleBasedSuppressions)
    .map(([ruleId, entry]) => {
      // Calculate original counts
      const originalFileCount = Object.keys(entry).length;
      const originalViolationCount = Object.values(entry).reduce(
        (sum, fileEntry) => sum + fileEntry.count,
        0,
      );
      const originalCount =
        countType === "file" ? originalFileCount : originalViolationCount;

      // Apply filtering
      const filterResult = applyRuleAndFileFilters(
        ruleId,
        Object.keys(entry),
        eslintConfig,
        config,
      );

      if (!filterResult.isEligible) {
        return null;
      }

      // Calculate filtered counts and violations
      const filteredFiles = filterResult.correctableFiles;
      const filteredViolations: Record<string, number> = {};
      let filteredViolationCount = 0;

      for (const file of filteredFiles) {
        const fileEntry = entry[file];
        if (fileEntry) {
          filteredViolations[file] = fileEntry.count;
          filteredViolationCount += fileEntry.count;
        }
      }

      const filteredCount =
        countType === "file" ? filteredFiles.length : filteredViolationCount;

      return {
        filteredCount,
        filteredFiles,
        filteredViolations,
        isFixable: isRuleFixable(eslintConfig, ruleId),
        originalCount,
        ruleId,
      };
    })
    .filter((info): info is RuleCountInfo => info !== null);
};
