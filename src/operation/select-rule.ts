import type { CorrectModeConfig } from "../config/config";
import type { ESLintConfigSubset } from "../lib/eslint";
import type { ESLintSuppressionsJson } from "../suppressions-json/types";

import { isRuleFixable } from "../lib/eslint";
import { toRuleBasedSuppression } from "../suppressions-json/rule-based";
import { extractPathsByGlobs } from "../utils/glob";

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

// ============================================================================
// Rule Processing Types
// ============================================================================

/**
 * Information about a rule's counts after filtering.
 *
 * Used by `calculateRuleCounts` and consumed by `selectOptimalRule` for prioritization.
 * Contains both original and filtered data to support different limit types and selection strategies.
 *
 * @package
 */
export type RuleCountInfo = {
  /** Count after applying filters (files or violations depending on limitType) */
  eligibleCount: number;
  /** Array of file paths that passed filtering */
  eligibleFiles: string[];
  /** Map of file -> violation count for filtered files only */
  filteredViolations: Record<string, number>;
  /** ESLint rule identifier */
  ruleId: string;
  /** Whether this rule supports auto-fixing (impacts prioritization) */
  supportsAutoFix: boolean;
  /** Original count before filtering (files or violations depending on limitType) */
  totalCount: number;
};

/**
 * Result of applying rule and file filters in `applyRuleAndFileFilters`.
 *
 * Discriminated union that either provides eligible files or indicates ineligibility.
 * Used to determine if a rule should be considered for selection and which files can be processed.
 *
 * @example
 * ```ts
 * const result = applyRuleAndFileFilters(ruleId, files, config);
 * if (result.isEligible) {
 *   // Process result.correctableFiles
 * } else {
 *   // Skip this rule entirely
 * }
 * ```
 */
type RuleFilterResult =
  | {
      /** Files that passed all filtering criteria and can be corrected */
      eligibleFiles: string[];
      isEligible: true;
    }
  | {
      /** Rule was filtered out due to fixability, inclusion/exclusion rules, or no files remained */
      isEligible: false;
    };

// ============================================================================
// Internal Helpers
// ============================================================================

/**
 * Apply rule-level and file-level filters to determine if a rule is eligible
 * and get the list of correctable files.
 * @param ruleId - The rule ID to check
 * @param violatedFiles - Array of all file paths for this rule
 * @param eslintConfig - ESLint configuration
 * @param config - Correct mode configuration
 * @returns RuleFilterResult indicating whether rule is eligible and filtered files
 *
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

  // Guard clause: Check if rule is auto-fixable when required
  if (autoFixableOnly && !isRuleFixable(eslintConfig, ruleId)) {
    return { isEligible: false };
  }

  // Guard clause: Check if rule is excluded
  if (excludedRules.includes(ruleId)) {
    return { isEligible: false };
  }

  // Guard clause: Check if rule is included when include filter is specified
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

  // Guard clause: Check if any files remain after filtering
  if (filteredFiles.length === 0) {
    return { isEligible: false };
  }

  return { eligibleFiles: filteredFiles, isEligible: true };
};

/**
 * Sort rules by priority: fixable first, then by count, then by rule ID.
 * @param ruleCounts - Array of rule count information.
 * @returns Sorted array of rule count information.
 */
const sortRulesByPriority = (ruleCounts: RuleCountInfo[]): RuleCountInfo[] => {
  return ruleCounts.toSorted((a, b) => {
    // First: prioritize fixable rules (true > false)
    if (a.supportsAutoFix !== b.supportsAutoFix) {
      return b.supportsAutoFix ? 1 : -1;
    }

    // Second: prioritize higher filtered count
    if (a.eligibleCount !== b.eligibleCount) {
      return b.eligibleCount - a.eligibleCount;
    }

    // Third: use rule ID as tiebreaker (lexicographical order)
    return a.ruleId.localeCompare(b.ruleId);
  });
};

/**
 * Partition rules into those that can be fully selected and those requiring partial selection.
 * @param sortedRules - Array of sorted rule count information.
 * @param limitCount - The limit count.
 * @returns Object with fullSelectable and partialSelectable arrays.
 */
const partitionRulesByLimit = (
  sortedRules: RuleCountInfo[],
  limitCount: number,
): {
  fullSelectable: RuleCountInfo[];
  partialSelectable: RuleCountInfo[];
} => {
  // eslint-disable-next-line unicorn/no-array-reduce
  return sortedRules.reduce(
    (accumulator, rule) => {
      if (rule.totalCount <= limitCount) {
        accumulator.fullSelectable.push(rule);
      } else {
        accumulator.partialSelectable.push(rule);
      }
      return accumulator;
    },
    {
      fullSelectable: [] as RuleCountInfo[],
      partialSelectable: [] as RuleCountInfo[],
    },
  );
};

/**
 * Select violations for a rule based on the limit type and count.
 * @param rule - The rule to select violations from.
 * @param limitCount - The limit count.
 * @param config - Correct mode config.
 * @returns Record of selected violations by file.
 */
const selectViolationsForRule = (
  rule: RuleCountInfo,
  limitCount: number,
  config: CorrectModeConfig,
): Record<string, number> => {
  const selectedViolations: Record<string, number> = {};
  let selectedCount = 0;
  const limitType = config.limit.type;

  if (limitType === "file") {
    // For file limit, select files up to the limit count
    for (const file of rule.eligibleFiles.slice(0, limitCount)) {
      const violationCount = rule.filteredViolations[file];
      if (violationCount == null) continue;
      selectedViolations[file] = violationCount;
    }
  } else {
    // For violation limit, select files until violation count reaches limit
    for (const file of rule.eligibleFiles) {
      const violationCount = rule.filteredViolations[file];
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

// ============================================================================
// Phase 2: Optimal Selection
// ============================================================================

/**
 * Decide the optimal rule from candidate rules - Phase 2 of rule selection.
 * @param candidates - Array of candidate rule information.
 * @param config - Correct mode config.
 * @returns The result of the selection.
 */
export function decideOptimalRule(
  candidates: RuleCountInfo[],
  config: CorrectModeConfig,
): SelectionResult {
  const {
    limit: { count: limitCount },
    partialSelection: allowPartialSelection,
  } = config;
  // Guard clause: early return for empty candidates
  if (candidates.length === 0) {
    return { success: false };
  }

  const sortedRules = sortRulesByPriority(candidates);
  const partitionedRules = partitionRulesByLimit(sortedRules, limitCount);

  // Try full selection first - early return if possible
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

  // Guard clause: early return if partial selection not allowed
  if (!allowPartialSelection) {
    return { success: false };
  }

  // Attempt partial selection
  const partialSelectableRule = partitionedRules.partialSelectable[0];
  if (!partialSelectableRule) {
    return { success: false };
  }

  const selectedViolations = selectViolationsForRule(
    partialSelectableRule,
    limitCount,
    config,
  );

  // Guard clause: early return if no violations selected
  if (Object.keys(selectedViolations).length === 0) {
    return { success: false };
  }

  return {
    selection: {
      ruleId: partialSelectableRule.ruleId,
      type: "partial",
      violations: selectedViolations,
    },
    success: true,
  };
}

// ============================================================================
// Phase 1: Candidate Collection
// ============================================================================

/**
 * Collect candidate rules with filtering applied - Phase 1 of rule selection.
 * @param suppressions - Suppressions.
 * @param eslintConfig - ESLint config.
 * @param config - Correct mode config.
 * @returns Array of violation information for each eligible rule.
 */
export function collectCandidateRules(
  suppressions: ESLintSuppressionsJson,
  eslintConfig: ESLintConfigSubset,
  config: CorrectModeConfig,
): RuleCountInfo[] {
  const ruleBasedSuppressions = toRuleBasedSuppression(suppressions);
  const countType = config.limit.type;

  return Object.entries(ruleBasedSuppressions)
    .map(([ruleId, entry]) => {
      // Calculate original counts
      const originalFileCount = Object.keys(entry).length;
      const originalViolationCount = Object.values(entry).reduce(
        (sum, fileEntry) => sum + fileEntry.count,
        0,
      );
      const totalCount =
        countType === "file" ? originalFileCount : originalViolationCount;

      // Apply filtering
      const filteredResult = applyRuleAndFileFilters(
        ruleId,
        Object.keys(entry),
        eslintConfig,
        config,
      );

      if (!filteredResult.isEligible) {
        return null;
      }

      // Calculate filtered counts and violations
      const eligibleFiles = filteredResult.eligibleFiles;
      const filteredViolations: Record<string, number> = {};
      let filteredViolationCount = 0;

      for (const file of eligibleFiles) {
        const fileEntry = entry[file];
        if (fileEntry) {
          filteredViolations[file] = fileEntry.count;
          filteredViolationCount += fileEntry.count;
        }
      }

      const eligibleCount =
        countType === "file" ? eligibleFiles.length : filteredViolationCount;

      return {
        eligibleCount,
        eligibleFiles,
        filteredViolations,
        ruleId,
        supportsAutoFix: isRuleFixable(eslintConfig, ruleId),
        totalCount,
      };
    })
    .filter((info): info is RuleCountInfo => info !== null);
}

// ============================================================================
// Public API
// ============================================================================

/**
 * Select a rule to correct based on the given configuration.
 * @param suppressions - Suppressions.
 * @param eslintConfig - ESLint config.
 * @param config - Correct mode config.
 * @returns The result of the selection.
 */
export function selectRuleToCorrect(
  suppressions: ESLintSuppressionsJson,
  eslintConfig: ESLintConfigSubset,
  config: CorrectModeConfig,
): SelectionResult {
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

  const candidates = collectCandidateRules(suppressions, eslintConfig, config);
  return decideOptimalRule(candidates, config);
}
