import { bench, describe } from "vitest";

import type { CorrectModeConfig, CorrectModeLimitType } from "../config/config";
import type { ESLintConfigSubset } from "../lib/eslint";
import type { ESLintSuppressionsJson } from "../suppressions-json/types";

import {
  calculateRuleCounts,
  type RuleCountInfo,
  selectOptimalRule as selectOptimalRuleNew,
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
    { avgViolations: 3, fileCount: 100, fixable: true, prefix: "fixable-rule" },
    {
      avgViolations: 5,
      fileCount: 80,
      fixable: false,
      prefix: "non-fixable-rule",
    },
    {
      avgViolations: 2,
      fileCount: 150,
      fixable: true,
      prefix: "typescript-rule",
    },
    { avgViolations: 4, fileCount: 120, fixable: false, prefix: "react-rule" },
    { avgViolations: 1, fileCount: 200, fixable: true, prefix: "import-rule" },
    { avgViolations: 2, fileCount: 300, fixable: true, prefix: "style-rule" },
    {
      avgViolations: 8,
      fileCount: 50,
      fixable: false,
      prefix: "complexity-rule",
    },
    {
      avgViolations: 10,
      fileCount: 30,
      fixable: false,
      prefix: "security-rule",
    },
  ];

  for (const ruleType of ruleTypes) {
    for (let index = 0; index < 10; index++) {
      const ruleId = `${ruleType.prefix}-${index}`;

      for (let fileIndex = 0; fileIndex < ruleType.fileCount; fileIndex++) {
        const fileName = `src/${ruleType.prefix}/file-${fileIndex}.ts`;

        suppressions[fileName] ??= {};

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
    { fixable: true, pattern: /^fixable-rule/ },
    { fixable: false, pattern: /^non-fixable-rule/ },
    { fixable: true, pattern: /^typescript-rule/ },
    { fixable: false, pattern: /^react-rule/ },
    { fixable: true, pattern: /^import-rule/ },
    { fixable: true, pattern: /^style-rule/ },
    { fixable: false, pattern: /^complexity-rule/ },
    { fixable: false, pattern: /^security-rule/ },
  ];

  for (let index = 0; index < 10; index++) {
    for (const { fixable, pattern } of rulePatterns) {
      const ruleId =
        pattern.source.replace("^", "").replace("$", "") + `-${index}`;
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
    const veryLargeRuleCounts = Array.from({ length: 1000 }).map(
      (_, index) => ({
        filteredCount: Math.floor(Math.random() * 500) + 1,
        filteredFiles: [`file-${index}.ts`],
        filteredViolations: {
          [`file-${index}.ts`]: Math.floor(Math.random() * 10) + 1,
        },
        isFixable: Math.random() > 0.5,
        originalCount: Math.floor(Math.random() * 500) + 1,
        ruleId: `rule-${index}`,
      }),
    ) satisfies RuleCountInfo[];

    bench("OLD algorithm (1000 rules)", () => {
      selectOptimalRuleOld(veryLargeRuleCounts, 100, false, "file");
    });

    bench("NEW algorithm (1000 rules)", () => {
      selectOptimalRuleNew(veryLargeRuleCounts, 100, false, "file");
    });
  });
});
