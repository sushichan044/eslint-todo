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
    const result = shouldCorrectRuleViolation(
      ruleId,
      Object.keys(entry),
      eslintConfig,
      config,
    );

    if (!result.shouldCorrect) {
      continue;
    }

    const correctableViolatedFilesAmount = result.correctableFiles.length;

    if (correctableViolatedFilesAmount > limitCount) {
      if (allowPartialSelection && partialSelectableRule == null) {
        // do partial selection only once since no need to compare with other rules exceeding the limit
        partialSelectableRule = ruleId;
      }
      continue;
    }

    // update FullSelection rule if it has more violations
    if (correctableViolatedFilesAmount > selectedTargetCount) {
      fullSelectableRule = ruleId;
      selectedTargetCount = correctableViolatedFilesAmount;
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

    const result = shouldCorrectRuleViolation(
      partialSelectableRule,
      Object.keys(rule),
      eslintConfig,
      config,
    );

    if (!result.shouldCorrect) {
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
    const result = shouldCorrectRuleViolation(
      ruleId,
      Object.keys(entry),
      eslintConfig,
      config,
    );

    if (!result.shouldCorrect) {
      continue;
    }

    // Calculate total violation count for filtered files only
    let totalViolationCount = 0;
    for (const file of result.correctableFiles) {
      const fileEntry = entry[file];
      if (fileEntry) {
        totalViolationCount += fileEntry.count;
      }
    }

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
    partialSelectableRule != null &&
    Object.hasOwn(ruleBasedSuppressions, partialSelectableRule)
  ) {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const rule = ruleBasedSuppressions[partialSelectableRule]!;

    const result = shouldCorrectRuleViolation(
      partialSelectableRule,
      Object.keys(rule),
      eslintConfig,
      config,
    );

    if (!result.shouldCorrect) {
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
 * Result of checking if a rule violation should be corrected.
 */
type ShouldCorrectRuleViolationResult =
  | { correctableFiles: string[]; shouldCorrect: true }
  | { shouldCorrect: false };

/**
 * Check if a rule violation should be corrected.
 * @param ruleId - The rule ID to check
 * @param violatedFiles - Array of all file paths for this rule
 * @param eslintConfig - ESLint configuration
 * @param config - Correct mode configuration
 * @returns ShouldCorrectRuleViolationResult indicating whether to continue and filtered files
 */
const shouldCorrectRuleViolation = (
  ruleId: string,
  violatedFiles: string[],
  eslintConfig: ESLintConfigSubset,
  config: CorrectModeConfig,
): ShouldCorrectRuleViolationResult => {
  const {
    autoFixableOnly,
    exclude: { rules: excludedRules },
    include: { files: includedFiles, rules: includedRules },
  } = config;

  // Check if rule is auto-fixable when required
  if (autoFixableOnly && !isRuleFixable(eslintConfig, ruleId)) {
    return { shouldCorrect: false };
  }

  // Check if rule is excluded
  if (excludedRules.includes(ruleId)) {
    return { shouldCorrect: false };
  }

  // Check if rule is included when include filter is specified
  if (includedRules.length > 0 && !includedRules.includes(ruleId)) {
    return { shouldCorrect: false };
  }

  // Apply file filtering based on include.files
  const filteredFiles = extractPathsByGlobs(violatedFiles, includedFiles);

  if (filteredFiles.length === 0) {
    return { shouldCorrect: false };
  }

  return { correctableFiles: filteredFiles, shouldCorrect: true };
};
