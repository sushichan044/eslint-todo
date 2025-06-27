import { bench, describe } from "vitest";
import { klona as klonaJSON } from "klona/json";

import type { CorrectModeConfig, CorrectModeLimitType } from "../config/config";
import type { ESLintConfigSubset } from "../lib/eslint";
import type { ESLintSuppressionsJson } from "../suppressions-json/types";

import {
  calculateRuleCounts,
  selectOptimalRule as selectOptimalRuleNew,
  type RuleCountInfo,
} from "./select-rule";

/**
 * Original implementation of selectOptimalRule (before the change).
 * This is the version before prioritizing fixable rules.
 */
const selectOptimalRuleOld = (
  ruleCounts: RuleCountInfo[],
  limitCount: number,
  allowPartialSelection: boolean,
  limitType: CorrectModeLimitType = "file",
): ReturnType<typeof selectOptimalRuleNew> => {
  if (ruleCounts.length === 0) {
    return { success: false };
  }

  // Find the best rule for full selection (original count <= limit)
  const fullSelectableRules = ruleCounts.filter(
    (rule) => rule.originalCount <= limitCount,
  );

  if (fullSelectableRules.length > 0) {
    // Select rule with highest filtered count (old logic)
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
    // Find rule with highest original count (for partial selection)
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    let bestPartialRule = ruleCounts[0]!;
    for (const rule of ruleCounts) {
      if (rule.originalCount > bestPartialRule.originalCount) {
        bestPartialRule = rule;
      }
    }

    if (bestPartialRule.originalCount > limitCount) {
      const selectedViolations: Record<string, number> = {};
      let selectedCount = 0;

      if (limitType === "file") {
        // For file limit, select files up to the limit count
        for (const file of bestPartialRule.filteredFiles.slice(0, limitCount)) {
          const violationCount = bestPartialRule.filteredViolations[file];
          if (violationCount === undefined || violationCount === null) continue;
          selectedViolations[file] = violationCount;
        }
      } else {
        // For violation limit, select files until violation count reaches limit
        for (const file of bestPartialRule.filteredFiles) {
          const violationCount = bestPartialRule.filteredViolations[file];
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
            ruleId: bestPartialRule.ruleId,
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
 * Generate large-scale suppressions data for benchmarking.
 */
const generateLargeSuppressions = (): ESLintSuppressionsJson => {
  const suppressions: ESLintSuppressionsJson = {};

  // Generate mixed fixable and non-fixable rules
  const ruleTypes = [
    { prefix: "fixable-rule", fixable: true, fileCount: 100, avgViolations: 3 },
    {
      prefix: "non-fixable-rule",
      fixable: false,
      fileCount: 80,
      avgViolations: 5,
    },
    {
      prefix: "typescript-rule",
      fixable: true,
      fileCount: 150,
      avgViolations: 2,
    },
    { prefix: "react-rule", fixable: false, fileCount: 120, avgViolations: 4 },
    { prefix: "import-rule", fixable: true, fileCount: 200, avgViolations: 1 },
    { prefix: "style-rule", fixable: true, fileCount: 300, avgViolations: 2 },
    {
      prefix: "complexity-rule",
      fixable: false,
      fileCount: 50,
      avgViolations: 8,
    },
    {
      prefix: "security-rule",
      fixable: false,
      fileCount: 30,
      avgViolations: 10,
    },
  ];

  for (const ruleType of ruleTypes) {
    for (let i = 0; i < 10; i++) {
      const ruleId = `${ruleType.prefix}-${i}`;

      for (let fileIndex = 0; fileIndex < ruleType.fileCount; fileIndex++) {
        const fileName = `src/${ruleType.prefix}/file-${fileIndex}.ts`;

        if (!suppressions[fileName]) {
          suppressions[fileName] = {};
        }

        const violationCount = Math.max(
          1,
          ruleType.avgViolations + Math.floor(Math.random() * 3) - 1,
        );

        suppressions[fileName][ruleId] = { count: violationCount };
      }
    }
  }

  return suppressions;
};

/**
 * Generate ESLint config with fixable information.
 */
const generateESLintConfig = (): ESLintConfigSubset => {
  const rules: Record<string, { fixable: boolean }> = {};

  const rulePatterns = [
    { pattern: /^fixable-rule/, fixable: true },
    { pattern: /^non-fixable-rule/, fixable: false },
    { pattern: /^typescript-rule/, fixable: true },
    { pattern: /^react-rule/, fixable: false },
    { pattern: /^import-rule/, fixable: true },
    { pattern: /^style-rule/, fixable: true },
    { pattern: /^complexity-rule/, fixable: false },
    { pattern: /^security-rule/, fixable: false },
  ];

  for (let i = 0; i < 10; i++) {
    for (const { pattern, fixable } of rulePatterns) {
      const ruleId = pattern.source.replace("^", "").replace("$", "") + `-${i}`;
      rules[ruleId] = { fixable };
    }
  }

  return { rules };
};

const createBaseConfig = (): CorrectModeConfig => ({
  autoFixableOnly: false,
  exclude: { files: [], rules: [] },
  include: { files: [], rules: [] },
  limit: { count: 100, type: "file" },
  partialSelection: false,
});

describe("selectOptimalRule comparison benchmarks", () => {
  const largeSuppressions = generateLargeSuppressions();
  const eslintConfig = generateESLintConfig();
  const baseConfig = createBaseConfig();

  // Pre-calculate rule counts for consistent comparison
  const ruleCounts = calculateRuleCounts(
    largeSuppressions,
    eslintConfig,
    baseConfig,
    "file",
  );

  // Log information about the test data
  const jsonSize = JSON.stringify(largeSuppressions).length;
  const fixableRules = ruleCounts.filter((r) => r.isFixable).length;
  const nonFixableRules = ruleCounts.filter((r) => !r.isFixable).length;

  console.log(
    `Generated suppressions JSON size: ${jsonSize.toLocaleString()} characters`,
  );
  console.log(
    `Total rules: ${ruleCounts.length} (${fixableRules} fixable, ${nonFixableRules} non-fixable)`,
  );

  describe("Algorithm comparison - small limit (10 files)", () => {
    bench("OLD algorithm (no fixable priority)", () => {
      selectOptimalRuleOld(ruleCounts, 10, false, "file");
    });

    bench("NEW algorithm (fixable priority)", () => {
      selectOptimalRuleNew(ruleCounts, 10, false, "file");
    });
  });

  describe("Algorithm comparison - medium limit (100 files)", () => {
    bench("OLD algorithm (no fixable priority)", () => {
      selectOptimalRuleOld(ruleCounts, 100, false, "file");
    });

    bench("NEW algorithm (fixable priority)", () => {
      selectOptimalRuleNew(ruleCounts, 100, false, "file");
    });
  });

  describe("Algorithm comparison - large limit (1000 files)", () => {
    bench("OLD algorithm (no fixable priority)", () => {
      selectOptimalRuleOld(ruleCounts, 1000, false, "file");
    });

    bench("NEW algorithm (fixable priority)", () => {
      selectOptimalRuleNew(ruleCounts, 1000, false, "file");
    });
  });

  describe("Algorithm comparison - with partial selection", () => {
    bench("OLD algorithm (partial selection)", () => {
      selectOptimalRuleOld(ruleCounts, 50, true, "file");
    });

    bench("NEW algorithm (partial selection)", () => {
      selectOptimalRuleNew(ruleCounts, 50, true, "file");
    });
  });

  describe("Algorithm comparison - violation based", () => {
    const violationRuleCounts = calculateRuleCounts(
      largeSuppressions,
      eslintConfig,
      baseConfig,
      "violation",
    );

    bench("OLD algorithm (violation based)", () => {
      selectOptimalRuleOld(violationRuleCounts, 500, false, "violation");
    });

    bench("NEW algorithm (violation based)", () => {
      selectOptimalRuleNew(violationRuleCounts, 500, false, "violation");
    });
  });

  describe("Edge cases", () => {
    // Test with very large dataset
    const veryLargeRuleCounts = [...Array(1000)].map((_, i) => ({
      filteredCount: Math.floor(Math.random() * 500) + 1,
      filteredFiles: [`file-${i}.ts`],
      filteredViolations: {
        [`file-${i}.ts`]: Math.floor(Math.random() * 10) + 1,
      },
      isFixable: Math.random() > 0.5,
      originalCount: Math.floor(Math.random() * 500) + 1,
      ruleId: `rule-${i}`,
    })) satisfies RuleCountInfo[];

    bench("OLD algorithm (1000 rules)", () => {
      selectOptimalRuleOld(veryLargeRuleCounts, 100, false, "file");
    });

    bench("NEW algorithm (1000 rules)", () => {
      selectOptimalRuleNew(veryLargeRuleCounts, 100, false, "file");
    });
  });
});
