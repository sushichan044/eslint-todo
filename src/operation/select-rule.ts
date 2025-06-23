import type { CorrectModeConfig } from "../config/config";
import type { DependencyGraph } from "../import-graph/types";
import type { ESLintConfigSubset } from "../lib/eslint";
import type { ESLintSuppressionsJson } from "../suppressions-json/types";

import {
  buildDependencyGraph,
  DependencyGraphCache,
  filterFilesByImportGraph,
} from "../import-graph";
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
 * @param rootDirectory - Project root directory.
 * @param dependencyGraph - Optional pre-built dependency graph.
 */
export const selectRuleBasedOnLimit = async (
  suppressions: ESLintSuppressionsJson,
  eslintConfig: ESLintConfigSubset,
  correctConfig: CorrectModeConfig,
  rootDirectory: string,
  dependencyGraph?: DependencyGraph,
): Promise<SelectionResult> => {
  switch (correctConfig.limit.type) {
    case "file": {
      return await selectRuleBasedOnFilesLimit(
        suppressions,
        eslintConfig,
        correctConfig,
        rootDirectory,
        dependencyGraph,
      );
    }
    case "violation": {
      return await selectRuleBasedOnViolationsLimit(
        suppressions,
        eslintConfig,
        correctConfig,
        rootDirectory,
        dependencyGraph,
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
export const selectRuleBasedOnFilesLimit = async (
  suppressions: ESLintSuppressionsJson,
  eslintConfig: ESLintConfigSubset,
  config: CorrectModeConfig,
  rootDirectory: string,
  dependencyGraph?: DependencyGraph,
): Promise<SelectionResult> => {
  const {
    limit: { count: limitCount },
    partialSelection: allowPartialSelection,
  } = config;

  if (limitCount <= 0) {
    throw new Error("The file limit must be greater than 0.");
  }

  const ruleCounts = await calculateRuleCounts(
    suppressions,
    eslintConfig,
    config,
    "file",
    rootDirectory,
    dependencyGraph,
  );

  return selectOptimalRule(ruleCounts, limitCount, allowPartialSelection);
};

/**
 * @package
 */
export const selectRuleBasedOnViolationsLimit = async (
  suppressions: ESLintSuppressionsJson,
  eslintConfig: ESLintConfigSubset,
  config: CorrectModeConfig,
  rootDirectory: string,
  dependencyGraph?: DependencyGraph,
): Promise<SelectionResult> => {
  const {
    limit: { count: limitCount },
    partialSelection: allowPartialSelection,
  } = config;

  if (limitCount <= 0) {
    throw new Error("The violation limit must be greater than 0.");
  }

  const ruleCounts = await calculateRuleCounts(
    suppressions,
    eslintConfig,
    config,
    "violation",
    rootDirectory,
    dependencyGraph,
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
 * @param rootDirectory - Project root directory (for import graph analysis)
 * @param dependencyGraph - Optional pre-built dependency graph
 * @returns Promise<RuleFilterResult> indicating whether rule is eligible and filtered files
 *
 * @package
 */
export const applyRuleAndFileFilters = async (
  ruleId: string,
  violatedFiles: string[],
  eslintConfig: ESLintConfigSubset,
  config: CorrectModeConfig,
  rootDirectory: string,
  dependencyGraph?: DependencyGraph,
): Promise<RuleFilterResult> => {
  const {
    autoFixableOnly,
    exclude: { files: excludedFiles, rules: excludedRules },
    importGraph,
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

  // Apply import graph filtering if enabled
  if (importGraph.enabled && importGraph.entryPoints.length > 0) {
    let graph = dependencyGraph;

    // Build dependency graph if not provided
    if (!graph) {
      try {
        const cache = new DependencyGraphCache(rootDirectory);
        graph = (await cache.get(importGraph, rootDirectory)) ?? undefined;

        if (!graph) {
          graph = await buildDependencyGraph({
            entryPoints: importGraph.entryPoints,
            maxDepth: importGraph.dependencyDepth,
            rootDir: rootDirectory,
          });

          // Cache the graph for future use
          await cache.set(graph, importGraph, rootDirectory);
        }
      } catch (error) {
        // If import graph analysis fails, fall back to existing filtering
        console.warn(
          "Import graph analysis failed, falling back to glob filtering:",
          error,
        );

        if (filteredFiles.length === 0) {
          return { isEligible: false };
        }

        return { correctableFiles: filteredFiles, isEligible: true };
      }
    }

    // Apply import graph filtering
    const importGraphResult = filterFilesByImportGraph(
      filteredFiles,
      graph,
      importGraph,
    );

    filteredFiles = importGraphResult.matchedFiles;
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
  limitType: "file" | "violation" = "file",
): SelectionResult => {
  if (ruleCounts.length === 0) {
    return { success: false };
  }

  // Find the best rule for full selection (original count <= limit)
  const fullSelectableRules = ruleCounts.filter(
    (rule) => rule.originalCount <= limitCount,
  );

  if (fullSelectableRules.length > 0) {
    // Select rule with highest filtered count
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    let bestRule = fullSelectableRules[0]!;
    for (const rule of fullSelectableRules) {
      if (rule.filteredCount > bestRule.filteredCount) {
        bestRule = rule;
      }
    }

    return {
      selection: { ruleId: bestRule.ruleId, type: "full" },
      success: true,
    };
  }

  // If no full selection possible and partial selection is allowed
  if (allowPartialSelection) {
    // Find first rule that exceeds the original limit (for partial selection)
    const partialSelectableRule = ruleCounts.find(
      (rule) => rule.originalCount > limitCount,
    );

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
  originalCount: number;
  ruleId: string;
};

/**
 * Calculate rule counts with filtering applied.
 * @param suppressions - Suppressions.
 * @param eslintConfig - ESLint config.
 * @param config - Correct mode config.
 * @param countType - Whether to count files or violations.
 * @param rootDir - Project root directory.
 * @param dependencyGraph - Optional pre-built dependency graph.
 *
 * @returns Promise<Array<RuleCountInfo>> - Array of violation information for each rule.
 *
 * @package
 */
export const calculateRuleCounts = async (
  suppressions: ESLintSuppressionsJson,
  eslintConfig: ESLintConfigSubset,
  config: CorrectModeConfig,
  countType: "file" | "violation",
  rootDirectory: string,
  dependencyGraph?: DependencyGraph,
): Promise<RuleCountInfo[]> => {
  const ruleBasedSuppressions = toRuleBasedSuppression(suppressions);

  const rulePromises = Object.entries(ruleBasedSuppressions).map(
    async ([ruleId, entry]) => {
      // Calculate original counts
      const originalFileCount = Object.keys(entry).length;
      const originalViolationCount = Object.values(entry).reduce(
        (sum, fileEntry) => sum + fileEntry.count,
        0,
      );
      const originalCount =
        countType === "file" ? originalFileCount : originalViolationCount;

      // Apply filtering
      const filterResult = await applyRuleAndFileFilters(
        ruleId,
        Object.keys(entry),
        eslintConfig,
        config,
        rootDirectory,
        dependencyGraph,
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
        originalCount,
        ruleId,
      };
    },
  );

  const results = await Promise.all(rulePromises);
  return results.filter((info): info is RuleCountInfo => info !== null);
};
