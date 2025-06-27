import { bench, describe } from "vitest";

import type { CorrectModeConfig } from "../config/config";
import type { ESLintConfigSubset } from "../lib/eslint";
import type { ESLintSuppressionsJson } from "../suppressions-json/types";

import { calculateRuleCounts, selectOptimalRule } from "./select-rule";

/**
 * Generate large-scale suppressions data for benchmarking.
 * Creates approximately 10,000-15,000 lines when serialized as JSON.
 */
const generateLargeSuppressions = (): ESLintSuppressionsJson => {
  const suppressions: ESLintSuppressionsJson = {};

  // Generate a variety of rule types with different characteristics
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

  let ruleCounter = 0;

  for (const ruleType of ruleTypes) {
    // Create multiple rules of each type
    for (let i = 0; i < 10; i++) {
      const ruleId = `${ruleType.prefix}-${i}`;

      // Generate files for this rule
      for (let fileIndex = 0; fileIndex < ruleType.fileCount; fileIndex++) {
        const fileName = `src/${ruleType.prefix}/file-${fileIndex}.ts`;

        if (!suppressions[fileName]) {
          suppressions[fileName] = {};
        }

        // Add some randomness to violation counts
        const violationCount = Math.max(
          1,
          ruleType.avgViolations + Math.floor(Math.random() * 3) - 1,
        );

        suppressions[fileName][ruleId] = { count: violationCount };
      }

      ruleCounter++;
    }
  }

  return suppressions;
};

/**
 * Generate ESLint config with fixable information for rules.
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

  // Generate rules based on patterns
  for (let i = 0; i < 10; i++) {
    for (const { pattern, fixable } of rulePatterns) {
      const ruleId = pattern.source.replace("^", "").replace("$", "") + `-${i}`;
      rules[ruleId] = { fixable };
    }
  }

  return { rules };
};

/**
 * Create test config with different scenarios.
 */
const createTestConfigs = (): Array<{
  name: string;
  config: CorrectModeConfig;
}> => [
  {
    name: "default (no autoFixableOnly)",
    config: {
      autoFixableOnly: false,
      exclude: { files: [], rules: [] },
      include: { files: [], rules: [] },
      limit: { count: 100, type: "file" },
      partialSelection: false,
    },
  },
  {
    name: "autoFixableOnly enabled",
    config: {
      autoFixableOnly: true,
      exclude: { files: [], rules: [] },
      include: { files: [], rules: [] },
      limit: { count: 100, type: "file" },
      partialSelection: false,
    },
  },
  {
    name: "high limit with partial selection",
    config: {
      autoFixableOnly: false,
      exclude: { files: [], rules: [] },
      include: { files: [], rules: [] },
      limit: { count: 1000, type: "file" },
      partialSelection: true,
    },
  },
  {
    name: "violation-based limit",
    config: {
      autoFixableOnly: false,
      exclude: { files: [], rules: [] },
      include: { files: [], rules: [] },
      limit: { count: 500, type: "violation" },
      partialSelection: false,
    },
  },
];

describe("select-rule performance benchmarks", () => {
  const largeSuppressions = generateLargeSuppressions();
  const eslintConfig = generateESLintConfig();
  const testConfigs = createTestConfigs();

  // Log the size of generated data
  const jsonSize = JSON.stringify(largeSuppressions).length;
  console.log(
    `Generated suppressions JSON size: ${jsonSize.toLocaleString()} characters`,
  );
  console.log(
    `Estimated lines: ${Math.floor(jsonSize / 80)} (assuming ~80 chars per line)`,
  );

  describe("calculateRuleCounts", () => {
    for (const { name, config } of testConfigs) {
      bench(`calculateRuleCounts - ${name}`, () => {
        calculateRuleCounts(largeSuppressions, eslintConfig, config, "file");
      });
    }

    bench("calculateRuleCounts - violation counting", () => {
      const config = testConfigs[0]!.config;
      calculateRuleCounts(largeSuppressions, eslintConfig, config, "violation");
    });
  });

  describe("selectOptimalRule", () => {
    // Pre-calculate rule counts for selectOptimalRule benchmarks
    const baseConfig = testConfigs[0]!.config;
    const ruleCounts = calculateRuleCounts(
      largeSuppressions,
      eslintConfig,
      baseConfig,
      "file",
    );

    bench("selectOptimalRule - small limit (10 files)", () => {
      selectOptimalRule(ruleCounts, 10, false, "file");
    });

    bench("selectOptimalRule - medium limit (100 files)", () => {
      selectOptimalRule(ruleCounts, 100, false, "file");
    });

    bench("selectOptimalRule - large limit (1000 files)", () => {
      selectOptimalRule(ruleCounts, 1000, false, "file");
    });

    bench("selectOptimalRule - with partial selection", () => {
      selectOptimalRule(ruleCounts, 50, true, "file");
    });

    bench("selectOptimalRule - violation based", () => {
      const violationRuleCounts = calculateRuleCounts(
        largeSuppressions,
        eslintConfig,
        baseConfig,
        "violation",
      );
      selectOptimalRule(violationRuleCounts, 500, false, "violation");
    });
  });

  describe("end-to-end performance", () => {
    for (const { name, config } of testConfigs) {
      bench(`full pipeline - ${name}`, () => {
        const ruleCounts = calculateRuleCounts(
          largeSuppressions,
          eslintConfig,
          config,
          config.limit.type,
        );
        selectOptimalRule(
          ruleCounts,
          config.limit.count,
          config.partialSelection,
          config.limit.type,
        );
      });
    }
  });
});
