import { bench, describe } from "vitest";

import type { CorrectModeConfig, CorrectModeLimitType } from "../config/config";
import type { ESLintConfigSubset } from "../lib/eslint";
import type { ESLintSuppressionsJson } from "../suppressions-json/types";

import { calculateRuleCounts, selectOptimalRule } from "./select-rule";

const createConfig = (
  limitType: CorrectModeLimitType = "file",
  limitCount = 10,
): CorrectModeConfig => ({
  autoFixableOnly: false,
  exclude: { files: [], rules: [] },
  include: { files: [], rules: [] },
  limit: { count: limitCount, type: limitType },
  partialSelection: false,
});

/**
 * Generate large-scale suppressions data for benchmarking.
 * Creates approximately 10,000-15,000 lines when serialized as JSON.
 */
const generateLargeSuppressions = (): ESLintSuppressionsJson => {
  const suppressions: ESLintSuppressionsJson = {};

  // Generate a variety of rule types with different characteristics
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
    // Create multiple rules of each type
    for (let index = 0; index < 10; index++) {
      const ruleId = `${ruleType.prefix}-${index}`;

      // Generate files for this rule
      for (let fileIndex = 0; fileIndex < ruleType.fileCount; fileIndex++) {
        const fileName = `src/${ruleType.prefix}/file-${fileIndex}.ts`;

        suppressions[fileName] ??= {};

        // Add some randomness to violation counts
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
 * Generate ESLint config with fixable information for rules.
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

  // Generate rules based on patterns
  for (let index = 0; index < 10; index++) {
    for (const { fixable, pattern } of rulePatterns) {
      const ruleId = `${pattern.source.replace("^", "").replace("$", "")}-${index}`;
      rules[ruleId] = { fixable };
    }
  }

  return { rules };
};

/**
 * Create test config with different scenarios.
 */
const createTestConfigs = (): Array<{
  config: CorrectModeConfig;
  name: string;
}> => [
  {
    config: {
      autoFixableOnly: false,
      exclude: { files: [], rules: [] },
      include: { files: [], rules: [] },
      limit: { count: 100, type: "file" },
      partialSelection: false,
    },
    name: "default (no autoFixableOnly)",
  },
  {
    config: {
      autoFixableOnly: true,
      exclude: { files: [], rules: [] },
      include: { files: [], rules: [] },
      limit: { count: 100, type: "file" },
      partialSelection: false,
    },
    name: "autoFixableOnly enabled",
  },
  {
    config: {
      autoFixableOnly: false,
      exclude: { files: [], rules: [] },
      include: { files: [], rules: [] },
      limit: { count: 1000, type: "file" },
      partialSelection: true,
    },
    name: "high limit with partial selection",
  },
  {
    config: {
      autoFixableOnly: false,
      exclude: { files: [], rules: [] },
      include: { files: [], rules: [] },
      limit: { count: 500, type: "violation" },
      partialSelection: false,
    },
    name: "violation-based limit",
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
    for (const { config, name } of testConfigs) {
      bench(`calculateRuleCounts - ${name}`, () => {
        calculateRuleCounts(largeSuppressions, eslintConfig, config);
      });
    }

    bench("calculateRuleCounts - violation counting", () => {
      const config = testConfigs[0]?.config;
      if (!config) throw new Error("Config not found");
      calculateRuleCounts(largeSuppressions, eslintConfig, config);
    });
  });

  describe("selectOptimalRule", () => {
    // Pre-calculate rule counts for selectOptimalRule benchmarks
    const baseConfig = testConfigs[0]?.config;
    if (!baseConfig) throw new Error("Config not found");
    const ruleCounts = calculateRuleCounts(
      largeSuppressions,
      eslintConfig,
      baseConfig,
    );

    bench("selectOptimalRule - small limit (10 files)", () => {
      selectOptimalRule(ruleCounts, 10, false, createConfig("file", 10));
    });

    bench("selectOptimalRule - medium limit (100 files)", () => {
      selectOptimalRule(ruleCounts, 100, false, createConfig("file", 100));
    });

    bench("selectOptimalRule - large limit (1000 files)", () => {
      selectOptimalRule(ruleCounts, 1000, false, createConfig("file", 1000));
    });

    bench("selectOptimalRule - with partial selection", () => {
      selectOptimalRule(ruleCounts, 50, true, createConfig("file", 50));
    });

    bench("selectOptimalRule - violation based", () => {
      const violationConfig = createConfig("violation", 500);
      const violationRuleCounts = calculateRuleCounts(
        largeSuppressions,
        eslintConfig,
        violationConfig,
      );
      selectOptimalRule(violationRuleCounts, 500, false, violationConfig);
    });
  });

  describe("end-to-end performance", () => {
    for (const { config, name } of testConfigs) {
      bench(`full pipeline - ${name}`, () => {
        const ruleCounts = calculateRuleCounts(
          largeSuppressions,
          eslintConfig,
          config,
        );
        selectOptimalRule(
          ruleCounts,
          config.limit.count,
          config.partialSelection,
          config,
        );
      });
    }
  });
});
