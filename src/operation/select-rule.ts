import type { CorrectModeConfig } from "../config/config";
import type { ESLintConfigSubset } from "../lib/eslint";
import type { ESLintSuppressionsJson } from "../suppressions-json/types";

import { isRuleFixable } from "../lib/eslint";
import { toRuleBasedSuppression } from "../suppressions-json/rule-based";
import { extractPathsByGlobs } from "../utils/glob";

// ============================================================================
// Strategy Interface
// ============================================================================

/**
 * Strategy interface for rule selection algorithms.
 * Enables pluggable rule selection strategies (count-based, graph-based, etc.).
 */
export interface RuleSelectionStrategy {
  selectRule(
    suppressions: ESLintSuppressionsJson,
    eslintConfig: ESLintConfigSubset,
    config: CorrectModeConfig,
  ): SelectionResult;
}

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
  // Validate limit type for exhaustive checking
  switch (correctConfig.limit.type) {
    case "file":
    case "violation": {
      break;
    }
    case "import-graph": {
      throw new Error("Import graph strategy not implemented yet");
    }
    default: {
      // exhaustive check
      const l = correctConfig.limit.type satisfies never;
      throw new Error(`Got unknown limit type: ${JSON.stringify(l)}`);
    }
  }

  return selectRuleBasedOnLimitInternal(
    suppressions,
    eslintConfig,
    correctConfig,
  );
};

/**
 * Internal shared implementation for rule selection based on limits.
 * @param suppressions - Suppressions.
 * @param eslintConfig - ESLint config.
 * @param config - Correct mode config.
 * @package
 */
export const selectRuleBasedOnLimitInternal = (
  suppressions: ESLintSuppressionsJson,
  eslintConfig: ESLintConfigSubset,
  config: CorrectModeConfig,
): SelectionResult => {
  const strategy = createRuleSelectionStrategy(config);
  return strategy.selectRule(suppressions, eslintConfig, config);
};

/**
<<<<<<< Updated upstream
||||||| Stash base
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

  let fullSelectableRule: string | null = null;
  let selectedTargetCount = 0;
  let partialSelectableRule: string | null = null;

  const ruleBasedSuppressions = toRuleBasedSuppression(suppressions);

  for (const [ruleId, entry] of Object.entries(ruleBasedSuppressions)) {
    // First check basic rule-level filters (auto-fixable, exclude.rules, include.rules)
    const filterResult = applyRuleAndFileFilters(
      ruleId,
      Object.keys(entry),
      eslintConfig,
      config,
    );

    if (!filterResult.isEligible) {
      continue;
    }

    // Use original violation count for limit check, not filtered count
    const originalTotalViolationCount = Object.values(entry).reduce(
      (sum, count) => sum + count.count,
      0,
    );

    if (originalTotalViolationCount > limitCount) {
      if (allowPartialSelection && partialSelectableRule == null) {
        // do partial selection only once since no need to compare with other rules exceeding the limit
        partialSelectableRule = ruleId;
      }
      continue;
    }

    // Calculate total violation count for filtered files only for comparison
    let totalViolationCount = 0;
    for (const file of filterResult.eligibleFiles) {
      const fileEntry = entry[file];
      if (fileEntry) {
        totalViolationCount += fileEntry.count;
      }
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
    partialSelectableRule != null &&
    Object.hasOwn(ruleBasedSuppressions, partialSelectableRule)
  ) {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const rule = ruleBasedSuppressions[partialSelectableRule]!;

    const result = applyRuleAndFileFilters(
      partialSelectableRule,
      Object.keys(rule),
      eslintConfig,
      config,
    );

    if (!result.isEligible) {
      return { success: false };
    }

    const filteredFiles = result.eligibleFiles;
    let selectedCount = 0;
    const selectedViolations: Record<string, number> = {};

    for (const file of filteredFiles) {
      const fileEntry = rule[file];
      if (!fileEntry) continue;

      const { count } = fileEntry;
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

/**
 * Select the optimal rule from rule count information.
 * @param ruleCounts - Array of rule count information.
 * @param limitCount - The limit count.
 * @param allowPartialSelection - Whether partial selection is allowed.
 * @param config - Correct mode config.
 *
 * @returns The result of the selection.
 *
 * @package
 */
export const selectOptimalRule = (
  ruleCounts: readonly RuleCountInfo[],
  limitCount: number,
  allowPartialSelection: boolean,
  config: CorrectModeConfig,
): SelectionResult => {
  return CountBasedRuleSelectionStrategy.selectOptimalRule(
    [...ruleCounts],
    limitCount,
    allowPartialSelection,
    config,
  );
};

// ============================================================================
// Strategy Implementations
// ============================================================================

/**
 * Count-based rule selection strategy.
 * Selects rules based on violation counts and file counts with filtering.
 */
export class CountBasedRuleSelectionStrategy implements RuleSelectionStrategy {
  public static calculateRuleCounts(
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

  public static selectOptimalRule(
    ruleCounts: RuleCountInfo[],
    limitCount: number,
    allowPartialSelection: boolean,
    config: CorrectModeConfig,
  ): SelectionResult {
    // Guard clause: early return for empty rule counts
    if (ruleCounts.length === 0) {
      return { success: false };
    }

    const sortedRules = sortRulesByPriority(ruleCounts);
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

  selectRule(
    suppressions: ESLintSuppressionsJson,
    eslintConfig: ESLintConfigSubset,
    config: CorrectModeConfig,
  ): SelectionResult {
    const {
      limit: { count: limitCount, type: limitType },
      partialSelection: allowPartialSelection,
    } = config;

    if (limitCount <= 0) {
      const limitTypeLabel = limitType === "file" ? "file" : "violation";
      throw new Error(`The ${limitTypeLabel} limit must be greater than 0.`);
    }

    const ruleCounts = CountBasedRuleSelectionStrategy.calculateRuleCounts(
      suppressions,
      eslintConfig,
      config,
    );

    return CountBasedRuleSelectionStrategy.selectOptimalRule(
      ruleCounts,
      limitCount,
      allowPartialSelection,
      config,
    );
  }
}

/**
 * Graph-based rule selection strategy placeholder.
 * TODO: Implement entry point analysis and import graph construction.
 */
export class GraphBasedRuleSelectionStrategy implements RuleSelectionStrategy {
  selectRule(): SelectionResult {
    throw new Error("Graph-based strategy not implemented yet");
  }
}

/**
 * Create a rule selection strategy based on configuration.
 * @param config - Correct mode configuration
 * @returns Appropriate strategy instance
 */
export const createRuleSelectionStrategy = (
  config: CorrectModeConfig,
): RuleSelectionStrategy => {
  const strategyType = config.limit.type;

  switch (strategyType) {
    case "file":
    case "violation": {
      return new CountBasedRuleSelectionStrategy();
    }
    case "import-graph": {
      return new GraphBasedRuleSelectionStrategy();
    }
    default: {
      throw new Error(`Unknown strategy type: ${String(strategyType)}`);
    }
  }
};

// ============================================================================
// Backward Compatibility Functions
// ============================================================================

/**
 * Calculate rule counts with filtering applied.
 * @param suppressions - Suppressions.
 * @param eslintConfig - ESLint config.
 * @param config - Correct mode config.
 *
 * @returns Array of violation information for each rule.
 *
 * @package
 */
export const calculateRuleCounts = (
  suppressions: ESLintSuppressionsJson,
  eslintConfig: ESLintConfigSubset,
  config: CorrectModeConfig,
): RuleCountInfo[] => {
  return CountBasedRuleSelectionStrategy.calculateRuleCounts(
    suppressions,
    eslintConfig,
    config,
  );
};
