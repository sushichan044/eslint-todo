import { describe, expect, it } from "vitest";

import type { RuleCountInfo } from "./select-rule";

import { SuppressionsJsonGenerator } from "../suppressions-json";
import {
  createTestConfig,
  createTestESLintConfig,
  createTestSuppressions,
  createTestTodoModuleV2,
  TEST_FILES,
  TEST_RULES,
} from "./__tests__/helpers";
import {
  applyRuleAndFileFilters,
  calculateRuleCountsForTesting,
  selectOptimalRule,
  selectRuleBasedOnLimit,
} from "./select-rule";

describe("calculateRuleCountsForTesting", () => {
  describe("fixability detection", () => {
    it("sets supportsAutoFix correctly based on ESLint config", () => {
      const suppressions = createTestSuppressions({
        "fixable-rule": {
          "file1.ts": { count: 3 },
          "file2.ts": { count: 2 },
        },
        "non-fixable-rule": {
          "file1.ts": { count: 1 },
        },
      });

      const eslintConfig = createTestESLintConfig({
        "fixable-rule": { fixable: true },
        "non-fixable-rule": { fixable: false },
      });

      const config = createTestConfig({ autoFixableOnly: false });
      const result = calculateRuleCountsForTesting(
        suppressions,
        eslintConfig,
        config,
      );

      expect(result).toHaveLength(2);

      const fixableRule = result.find((r) => r.ruleId === "fixable-rule");
      const nonFixableRule = result.find(
        (r) => r.ruleId === "non-fixable-rule",
      );

      expect(fixableRule?.supportsAutoFix).toBe(true);
      expect(nonFixableRule?.supportsAutoFix).toBe(false);
    });

    it("defaults to false for unknown rules", () => {
      const suppressions = createTestSuppressions({
        "unknown-rule": { "file1.ts": { count: 1 } },
      });

      const eslintConfig = createTestESLintConfig({
        "unknown-rule": { fixable: false },
      });
      const config = createTestConfig({ autoFixableOnly: false });
      const result = calculateRuleCountsForTesting(
        suppressions,
        eslintConfig,
        config,
      );

      expect(result).toHaveLength(1);
      expect(result[0]?.supportsAutoFix).toBe(false);
    });
  });

  describe("filtering behavior", () => {
    it("filters out non-fixable rules when autoFixableOnly is true", () => {
      const suppressions = createTestSuppressions({
        "fixable-rule": { "file1.ts": { count: 3 } },
        "non-fixable-rule": { "file1.ts": { count: 1 } },
      });

      const eslintConfig = createTestESLintConfig(TEST_RULES.MIXED);
      const config = createTestConfig({ autoFixableOnly: true });
      const result = calculateRuleCountsForTesting(
        suppressions,
        eslintConfig,
        config,
      );

      expect(result).toHaveLength(1);
      expect(result[0]?.ruleId).toBe("fixable-rule");
    });

    it("calculates correct counts for file limit type", () => {
      const suppressions = createTestSuppressions({
        "test-rule": {
          "file1.ts": { count: 5 },
          "file2.ts": { count: 3 },
        },
      });

      const config = createTestConfig({ limit: { count: 10, type: "file" } });
      const result = calculateRuleCountsForTesting(
        suppressions,
        createTestESLintConfig({ "test-rule": { fixable: true } }),
        config,
      );

      expect(result[0]?.eligibleCount).toBe(2); // 2 files
      expect(result[0]?.totalCount).toBe(2);
    });

    it("calculates correct counts for violation limit type", () => {
      const suppressions = createTestSuppressions({
        "test-rule": {
          "file1.ts": { count: 5 },
          "file2.ts": { count: 3 },
        },
      });

      const config = createTestConfig({
        limit: { count: 10, type: "violation" },
      });
      const result = calculateRuleCountsForTesting(
        suppressions,
        createTestESLintConfig({ "test-rule": { fixable: true } }),
        config,
      );

      expect(result[0]?.eligibleCount).toBe(8); // 5 + 3 violations
      expect(result[0]?.totalCount).toBe(8);
    });
  });

  describe("edge cases", () => {
    it("returns empty array for empty suppressions", () => {
      const result = calculateRuleCountsForTesting(
        {},
        createTestESLintConfig(),
        createTestConfig(),
      );
      expect(result).toEqual([]);
    });
  });
});

describe("applyRuleAndFileFilters", () => {
  describe("rule eligibility", () => {
    it("excludes non-fixable rule when autoFixableOnly is true", () => {
      const config = createTestConfig({ autoFixableOnly: true });
      const eslintConfig = createTestESLintConfig({
        "no-console": { fixable: false },
      });

      const result = applyRuleAndFileFilters(
        "no-console",
        TEST_FILES,
        eslintConfig,
        config,
      );
      expect(result).toEqual({ isEligible: false });
    });

    it("includes non-fixable rule when autoFixableOnly is false", () => {
      const config = createTestConfig({ autoFixableOnly: false });
      const eslintConfig = createTestESLintConfig({
        "no-console": { fixable: false },
      });

      const result = applyRuleAndFileFilters(
        "no-console",
        TEST_FILES,
        eslintConfig,
        config,
      );
      expect(result).toEqual({
        eligibleFiles: TEST_FILES,
        isEligible: true,
      });
    });

    it("excludes rule in exclude.rules", () => {
      const config = createTestConfig({
        exclude: { files: [], rules: ["no-console"] },
      });

      const result = applyRuleAndFileFilters(
        "no-console",
        TEST_FILES,
        createTestESLintConfig(),
        config,
      );
      expect(result).toEqual({ isEligible: false });
    });

    it("excludes rule not in include.rules when include filter is set", () => {
      const config = createTestConfig({
        include: { files: [], rules: ["allowed-rule"] },
      });

      const result = applyRuleAndFileFilters(
        "other-rule",
        TEST_FILES,
        createTestESLintConfig(),
        config,
      );
      expect(result).toEqual({ isEligible: false });
    });
  });

  describe("file filtering", () => {
    it("excludes files matching exclude.files patterns", () => {
      const config = createTestConfig({
        exclude: { files: ["dist/**"], rules: [] },
      });

      const result = applyRuleAndFileFilters(
        "test-rule",
        TEST_FILES,
        createTestESLintConfig({ "test-rule": { fixable: true } }),
        config,
      );
      expect(result).toEqual({
        eligibleFiles: ["src/file1.ts", "src/file2.ts", "app/file3.tsx"],
        isEligible: true,
      });
    });

    it("includes only files matching include.files patterns", () => {
      const config = createTestConfig({
        include: { files: ["src/**"], rules: [] },
      });

      const result = applyRuleAndFileFilters(
        "test-rule",
        TEST_FILES,
        createTestESLintConfig({ "test-rule": { fixable: true } }),
        config,
      );
      expect(result).toEqual({
        eligibleFiles: ["src/file1.ts", "src/file2.ts"],
        isEligible: true,
      });
    });

    it("returns not eligible when all files are filtered out", () => {
      const config = createTestConfig({
        include: { files: ["test/**"], rules: [] },
      });

      const result = applyRuleAndFileFilters(
        "test-rule",
        TEST_FILES,
        createTestESLintConfig({ "test-rule": { fixable: true } }),
        config,
      );
      expect(result).toEqual({ isEligible: false });
    });
  });
});

describe("selectOptimalRule", () => {
  const createRuleInfo = (
    ruleId: string,
    totalCount: number,
    eligibleCount: number,
    isFixable = false,
    // eslint-disable-next-line unicorn/consistent-function-scoping
  ): RuleCountInfo => ({
    eligibleCount,
    eligibleFiles: [],
    filteredViolations: {},
    ruleId,
    supportsAutoFix: isFixable,
    totalCount,
  });

  describe("full selection", () => {
    it("selects rule with highest eligible count within limit", () => {
      const rules = [
        createRuleInfo("rule1", 5, 3),
        createRuleInfo("rule2", 8, 8), // Best option
        createRuleInfo("rule3", 6, 2),
      ];

      const result = selectOptimalRule(rules, 10, false, createTestConfig());
      expect(result).toEqual({
        selection: { ruleId: "rule2", type: "full" },
        success: true,
      });
    });

    it("prioritizes fixable rules over non-fixable with same count", () => {
      const rules = [
        createRuleInfo("non-fixable", 10, 10, false),
        createRuleInfo("fixable", 10, 10, true),
      ];

      const result = selectOptimalRule(rules, 15, false, createTestConfig());
      expect(result).toEqual({
        selection: { ruleId: "fixable", type: "full" },
        success: true,
      });
    });

    it("uses rule ID as tiebreaker when fixability and count are same", () => {
      const rules = [
        createRuleInfo("z-rule", 10, 10, true),
        createRuleInfo("a-rule", 10, 10, true),
      ];

      const result = selectOptimalRule(rules, 15, false, createTestConfig());
      expect(result).toEqual({
        selection: { ruleId: "a-rule", type: "full" },
        success: true,
      });
    });
  });

  describe("partial selection", () => {
    it("returns partial selection when enabled and full selection not possible", () => {
      const rules = [
        createRuleInfo("rule1", 15, 10), // Exceeds limit but can be partially selected
      ] as const;
      rules[0].eligibleFiles = ["file1.ts", "file2.ts", "file3.ts"];
      rules[0].filteredViolations = {
        "file1.ts": 3,
        "file2.ts": 2,
        "file3.ts": 1,
      };

      const config = createTestConfig({ limit: { count: 2, type: "file" } });
      const result = selectOptimalRule(rules, 2, true, config);

      expect(result).toEqual({
        selection: {
          ruleId: "rule1",
          type: "partial",
          violations: { "file1.ts": 3, "file2.ts": 2 },
        },
        success: true,
      });
    });

    it("returns not successful when partial selection disabled", () => {
      const rules = [createRuleInfo("rule1", 15, 10)];

      const result = selectOptimalRule(rules, 5, false, createTestConfig());
      expect(result).toEqual({ success: false });
    });
  });

  describe("edge cases", () => {
    it("returns not successful for empty rules array", () => {
      const result = selectOptimalRule([], 10, false, createTestConfig());
      expect(result).toEqual({ success: false });
    });

    it("handles zero limit count gracefully", () => {
      const result = selectOptimalRule([], 0, false, createTestConfig());
      expect(result).toEqual({ success: false });
    });

    it("should use filtered file count for limit check with file limit type", () => {
      const todoModule = createTestTodoModuleV2({
        rule1: {
          autoFix: true,
          violations: {
            "dist/file1.js": 1,
            "dist/file2.js": 1,
            "dist/file3.js": 1,
            "dist/file4.js": 1,
            "dist/file5.js": 1,
            "src/file1.ts": 1,
            "src/file2.ts": 1,
          },
        },
      });
      const suppressions = SuppressionsJsonGenerator.fromV2(todoModule);
      const eslintConfig = createTestESLintConfig({
        rule1: { fixable: true },
      });
      // Original has 7 files (> limit 3), but filtered has only 2 files (< limit 3)
      const config = createTestConfig({
        include: {
          files: ["src/**"],
        },
        limit: {
          count: 3,
          type: "file",
        },
        partialSelection: true,
      });
      const expected = {
        selection: { ruleId: "rule1", type: "full" },
        success: true,
      };

      const result = selectRuleBasedOnLimit(suppressions, eslintConfig, config);
      expect(result).toStrictEqual(expected);
    });

    it("should use filtered violation count for limit check with violation limit type", () => {
      const todoModule = createTestTodoModuleV2({
        rule1: {
          autoFix: true,
          violations: {
            "dist/file1.js": 50,
            "dist/file2.js": 50,
            "src/file1.ts": 10,
            "src/file2.ts": 5,
          },
        },
      });
      const suppressions = SuppressionsJsonGenerator.fromV2(todoModule);
      const eslintConfig = createTestESLintConfig({
        rule1: { fixable: true },
      });
      // Original has 115 violations (> limit 20), but filtered has only 15 violations (< limit 20)
      const config = createTestConfig({
        include: {
          files: ["src/**"],
        },
        limit: {
          count: 20,
          type: "violation",
        },
        partialSelection: true,
      });
      const expected = {
        selection: { ruleId: "rule1", type: "full" },
        success: true,
      };

      const result = selectRuleBasedOnLimit(suppressions, eslintConfig, config);
      expect(result).toStrictEqual(expected);
    });
  });
});
