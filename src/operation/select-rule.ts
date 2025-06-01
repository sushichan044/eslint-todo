import type { CorrectModeConfig } from "../config/config";
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

    // Use original file count for limit check, not filtered count
    const originalViolatedFiles = Object.keys(entry).length;

    if (originalViolatedFiles > limitCount) {
      if (allowPartialSelection && partialSelectableRule == null) {
        // do partial selection only once since no need to compare with other rules exceeding the limit
        partialSelectableRule = ruleId;
      }
      continue;
    }

    // For full selection, use filtered file count for comparison
    const correctableFileCount = filterResult.correctableFiles.length;

    // update FullSelection rule if it has more violations
    if (correctableFileCount > selectedTargetCount) {
      fullSelectableRule = ruleId;
      selectedTargetCount = correctableFileCount;
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

    const selectedViolations: Record<string, number> = {};
    for (const file of result.correctableFiles.slice(0, limitCount)) {
      // file is always key of rule. using non-null assertion is safe.
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      selectedViolations[file] = rule[file]!.count;
    }

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
    for (const file of filterResult.correctableFiles) {
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

    const filteredFiles = result.correctableFiles;
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
 */
const applyRuleAndFileFilters = (
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
