import { describe, expect, it } from "vitest";

import type {
  CorrectModeConfig,
  CorrectModeUserConfig,
} from "../config/config";
import type { ESLintConfigSubset } from "../lib/eslint";
import type { ESLintSuppressionsJson } from "../suppressions-json/types";
import type { TodoModuleV2 } from "../todofile/v2";
import type { RuleCountInfo } from "./select-rule";

import { configWithDefault } from "../config/config";
import { SuppressionsJsonGenerator } from "../suppressions-json";
import {
  applyRuleAndFileFilters,
  collectCandidateRules,
  decideOptimalRule,
  selectRuleToCorrect,
} from "./select-rule";

// ============================================================================
// Shared Test Utilities
// ============================================================================

const createSuppressions = (
  suppressions: Record<string, Record<string, { count: number }>>,
): ESLintSuppressionsJson => {
  const result: ESLintSuppressionsJson = {};

  // Convert rule-based suppressions to file-based suppressions
  for (const [ruleId, files] of Object.entries(suppressions)) {
    for (const [filePath, data] of Object.entries(files)) {
      result[filePath] ??= {};
      result[filePath][ruleId] = data;
    }
  }

  return result;
};

const createESLintConfig = (
  rules: Record<string, { fixable: boolean }>,
): ESLintConfigSubset => ({ rules });

const createConfig = (
  overrides: Partial<CorrectModeConfig> = {},
): CorrectModeConfig => ({
  autoFixableOnly: false,
  exclude: { files: [], rules: [] },
  include: { files: [], rules: [] },
  limit: { count: 100, type: "file" },
  partialSelection: false,
  ...overrides,
});

const createUserConfig = (
  overrides: CorrectModeUserConfig = {},
): CorrectModeConfig => {
  return configWithDefault({ correct: overrides }).correct;
};

const createRuleCountInfo = (
  ruleId: string,
  originalCount: number,
  filteredCount: number,
  filteredFiles: string[] = [],
  filteredViolations: Record<string, number> = {},
  isFixable = false,
): RuleCountInfo => ({
  eligibleCount: filteredCount,
  eligibleFiles: filteredFiles,
  filteredViolations,
  ruleId,
  supportsAutoFix: isFixable,
  totalCount: originalCount,
});

const createTodoModuleV2 = (todo: TodoModuleV2["todo"]): TodoModuleV2 => ({
  meta: { version: 2 },
  todo,
});

describe("collectCandidateRules", () => {
  describe("isFixable field", () => {
    it("sets isFixable correctly based on ESLint config", () => {
      const suppressions = createSuppressions({
        "fixable-rule": {
          "file1.ts": { count: 3 },
          "file2.ts": { count: 2 },
        },
        "non-fixable-rule": {
          "file1.ts": { count: 1 },
        },
      });

      const eslintConfig = createESLintConfig({
        "fixable-rule": { fixable: true },
        "non-fixable-rule": { fixable: false },
      });

      const config = createConfig();

      const result = collectCandidateRules(suppressions, eslintConfig, config);

      expect(result).toHaveLength(2);

      const fixableRule = result.find((r) => r.ruleId === "fixable-rule");
      const nonFixableRule = result.find(
        (r) => r.ruleId === "non-fixable-rule",
      );

      expect(fixableRule?.supportsAutoFix).toBe(true);
      expect(nonFixableRule?.supportsAutoFix).toBe(false);
    });

    it("defaults to false for unknown rules", () => {
      const suppressions = createSuppressions({
        "unknown-rule": {
          "file1.ts": { count: 1 },
        },
      });

      const eslintConfig = createESLintConfig({});
      const config = createConfig();

      const result = collectCandidateRules(suppressions, eslintConfig, config);

      expect(result).toHaveLength(1);
      expect(result[0]?.supportsAutoFix).toBe(false);
    });

    it("filters out rules when autoFixableOnly is true", () => {
      const suppressions = createSuppressions({
        "fixable-rule": {
          "file1.ts": { count: 3 },
        },
        "non-fixable-rule": {
          "file1.ts": { count: 1 },
        },
      });

      const eslintConfig = createESLintConfig({
        "fixable-rule": { fixable: true },
        "non-fixable-rule": { fixable: false },
      });

      const config = createConfig({ autoFixableOnly: true });

      const result = collectCandidateRules(suppressions, eslintConfig, config);

      expect(result).toHaveLength(1);
      expect(result[0]?.ruleId).toBe("fixable-rule");
      expect(result[0]?.supportsAutoFix).toBe(true);
    });
  });
});

// ============================================================================
// decideOptimalRule Tests
// ============================================================================

describe("applyRuleAndFileFilters", () => {
  const testFiles = [
    "src/file1.ts",
    "src/file2.ts",
    "app/file3.tsx",
    "dist/file4.js",
  ];

  describe("rule eligibility filtering", () => {
    it("excludes non-fixable rule when autoFixableOnly is true", () => {
      const config = createUserConfig({ autoFixableOnly: true });
      const eslintConfig = createESLintConfig({
        "no-console": { fixable: false },
      });

      const result = applyRuleAndFileFilters(
        "no-console",
        testFiles,
        eslintConfig,
        config,
      );

      expect(result).toStrictEqual({ isEligible: false });
    });

    it("includes non-fixable rule when autoFixableOnly is false", () => {
      const config = createUserConfig({ autoFixableOnly: false });
      const eslintConfig = createESLintConfig({
        "no-console": { fixable: false },
      });

      const result = applyRuleAndFileFilters(
        "no-console",
        testFiles,
        eslintConfig,
        config,
      );

      expect(result).toStrictEqual({
        eligibleFiles: testFiles,
        isEligible: true,
      });
    });

    it("includes fixable rule when autoFixableOnly is true", () => {
      const config = createUserConfig({ autoFixableOnly: true });
      const eslintConfig = createESLintConfig({
        "no-console": { fixable: true },
      });

      const result = applyRuleAndFileFilters(
        "no-console",
        testFiles,
        eslintConfig,
        config,
      );

      expect(result).toStrictEqual({
        eligibleFiles: testFiles,
        isEligible: true,
      });
    });
  });

  describe("rule exclude/include filtering", () => {
    it("excludes rule in exclude.rules", () => {
      const config = createUserConfig({
        exclude: { rules: ["no-console"] },
      });
      const eslintConfig = createESLintConfig({
        "no-console": { fixable: true },
      });

      const result = applyRuleAndFileFilters(
        "no-console",
        testFiles,
        eslintConfig,
        config,
      );

      expect(result).toStrictEqual({ isEligible: false });
    });

    it("includes rule not in exclude.rules", () => {
      const config = createUserConfig({
        exclude: { rules: ["no-console"] },
      });
      const eslintConfig = createESLintConfig({
        "no-unused-vars": { fixable: true },
      });

      const result = applyRuleAndFileFilters(
        "no-unused-vars",
        testFiles,
        eslintConfig,
        config,
      );

      expect(result).toStrictEqual({
        eligibleFiles: testFiles,
        isEligible: true,
      });
    });

    it("includes rule in include.rules when include filter is set", () => {
      const config = createUserConfig({
        include: { rules: ["no-console"] },
      });
      const eslintConfig = createESLintConfig({
        "no-console": { fixable: true },
      });

      const result = applyRuleAndFileFilters(
        "no-console",
        testFiles,
        eslintConfig,
        config,
      );

      expect(result).toStrictEqual({
        eligibleFiles: testFiles,
        isEligible: true,
      });
    });

    it("excludes rule not in include.rules when include filter is set", () => {
      const config = createUserConfig({
        include: { rules: ["no-console"] },
      });
      const eslintConfig = createESLintConfig({
        "no-unused-vars": { fixable: true },
      });

      const result = applyRuleAndFileFilters(
        "no-unused-vars",
        testFiles,
        eslintConfig,
        config,
      );

      expect(result).toStrictEqual({ isEligible: false });
    });
  });

  describe("file filtering", () => {
    it("excludes files matching exclude.files patterns", () => {
      const config = createUserConfig({
        exclude: { files: ["dist/**"] },
      });
      const eslintConfig = createESLintConfig({
        "no-console": { fixable: true },
      });

      const result = applyRuleAndFileFilters(
        "no-console",
        testFiles,
        eslintConfig,
        config,
      );

      expect(result).toStrictEqual({
        eligibleFiles: ["src/file1.ts", "src/file2.ts", "app/file3.tsx"],
        isEligible: true,
      });
    });

    it("includes only files matching include.files patterns", () => {
      const config = createUserConfig({
        include: { files: ["src/**"] },
      });
      const eslintConfig = createESLintConfig({
        "no-console": { fixable: true },
      });

      const result = applyRuleAndFileFilters(
        "no-console",
        testFiles,
        eslintConfig,
        config,
      );

      expect(result).toStrictEqual({
        eligibleFiles: ["src/file1.ts", "src/file2.ts"],
        isEligible: true,
      });
    });

    it("applies both exclude and include filters", () => {
      const config = createUserConfig({
        exclude: { files: ["**/file1.ts"] },
        include: { files: ["src/**"] },
      });
      const eslintConfig = createESLintConfig({
        "no-console": { fixable: true },
      });

      const result = applyRuleAndFileFilters(
        "no-console",
        testFiles,
        eslintConfig,
        config,
      );

      expect(result).toStrictEqual({
        eligibleFiles: ["src/file2.ts"],
        isEligible: true,
      });
    });

    it("returns not eligible when all files are filtered out", () => {
      const config = createUserConfig({
        include: { files: ["test/**"] },
      });
      const eslintConfig = createESLintConfig({
        "no-console": { fixable: true },
      });

      const result = applyRuleAndFileFilters(
        "no-console",
        testFiles,
        eslintConfig,
        config,
      );

      expect(result).toStrictEqual({ isEligible: false });
    });
  });
});

describe("decideOptimalRule", () => {
  describe("empty input", () => {
    it("returns not successful when no rules provided", () => {
      const result = decideOptimalRule([], createConfig());
      expect(result).toStrictEqual({ success: false });
    });
  });

  describe("full selection", () => {
    it("selects rule with highest filtered count within limit", () => {
      const ruleCounts = [
        createRuleCountInfo("rule1", 5, 3),
        createRuleCountInfo("rule2", 8, 8), // Best option
        createRuleCountInfo("rule3", 6, 2),
      ];

      const result = decideOptimalRule(
        ruleCounts,
        createConfig({ limit: { count: 10, type: "file" } }),
      );

      expect(result).toStrictEqual({
        selection: { ruleId: "rule2", type: "full" },
        success: true,
      });
    });

    it("returns not successful when all rules exceed limit and partial selection disabled", () => {
      const ruleCounts = [
        createRuleCountInfo("rule1", 15, 10),
        createRuleCountInfo("rule2", 20, 8),
      ];

      const result = decideOptimalRule(
        ruleCounts,
        createConfig({
          limit: { count: 5, type: "file" },
          partialSelection: false,
        }),
      );

      expect(result).toStrictEqual({ success: false });
    });
  });

  describe("auto-fixable rule prioritization", () => {
    it("prioritizes auto-fixable rules over non-fixable rules with same filtered count", () => {
      const ruleCounts = [
        createRuleCountInfo("non-fixable-rule", 5, 10, [], {}, false),
        createRuleCountInfo("fixable-rule", 5, 10, [], {}, true),
      ];

      const result = decideOptimalRule(
        ruleCounts,
        createConfig({ limit: { count: 20, type: "file" } }),
      );

      expect(result).toStrictEqual({
        selection: { ruleId: "fixable-rule", type: "full" },
        success: true,
      });
    });

    it("prioritizes auto-fixable rule even with lower filtered count", () => {
      const ruleCounts = [
        createRuleCountInfo("non-fixable-rule", 5, 15, [], {}, false),
        createRuleCountInfo("fixable-rule", 5, 10, [], {}, true),
      ];

      const result = decideOptimalRule(
        ruleCounts,
        createConfig({ limit: { count: 20, type: "file" } }),
      );

      expect(result).toStrictEqual({
        selection: { ruleId: "fixable-rule", type: "full" },
        success: true,
      });
    });

    it("uses rule id as tiebreaker when fixability and filtered count are same", () => {
      const ruleCounts = [
        createRuleCountInfo("z-rule", 5, 10, [], {}, true),
        createRuleCountInfo("a-rule", 5, 10, [], {}, true),
      ];

      const result = decideOptimalRule(
        ruleCounts,
        createConfig({ limit: { count: 20, type: "file" } }),
      );

      expect(result).toStrictEqual({
        selection: { ruleId: "a-rule", type: "full" },
        success: true,
      });
    });
  });

  describe("partial selection enabled", () => {
    it("returns partial selection for file limit type", () => {
      const ruleCounts = [
        createRuleCountInfo(
          "rule1",
          15, // exceeds limit
          10,
          ["file1.ts", "file2.ts", "file3.ts", "file4.ts", "file5.ts"],
          {
            "file1.ts": 3,
            "file2.ts": 2,
            "file3.ts": 1,
            "file4.ts": 4,
            "file5.ts": 2,
          },
        ),
      ];

      const result = decideOptimalRule(
        ruleCounts,
        createConfig({
          limit: { count: 3, type: "file" },
          partialSelection: true,
        }),
      );

      expect(result).toStrictEqual({
        selection: {
          ruleId: "rule1",
          type: "partial",
          violations: { "file1.ts": 3, "file2.ts": 2, "file3.ts": 1 },
        },
        success: true,
      });
    });

    it("returns partial selection up to violation limit", () => {
      const ruleCounts = [
        createRuleCountInfo(
          "rule1",
          20, // exceeds limit
          15,
          ["file1.ts", "file2.ts", "file3.ts"],
          { "file1.ts": 3, "file2.ts": 4, "file3.ts": 8 }, // total: 15
        ),
      ];

      const result = decideOptimalRule(
        ruleCounts,
        createConfig({
          limit: { count: 7, type: "violation" },
          partialSelection: true,
        }),
      );

      expect(result).toStrictEqual({
        selection: {
          ruleId: "rule1",
          type: "partial",
          violations: { "file1.ts": 3, "file2.ts": 4 }, // total: 7
        },
        success: true,
      });
    });

    it("prefers full selection when available", () => {
      const ruleCounts = [
        createRuleCountInfo("rule1", 15, 10), // exceeds limit
        createRuleCountInfo("rule2", 3, 8), // within limit - should be selected
      ];

      const result = decideOptimalRule(
        ruleCounts,
        createConfig({
          limit: { count: 5, type: "file" },
          partialSelection: true,
        }),
      );

      expect(result).toStrictEqual({
        selection: { ruleId: "rule2", type: "full" },
        success: true,
      });
    });
  });
});

describe("selectRuleToCorrect integration", () => {
  describe("key end-to-end scenarios", () => {
    it("file limit - basic selection", () => {
      const todo = {
        rule1: {
          autoFix: true,
          violations: { "file1.ts": 1, "file2.ts": 1 },
        },
        rule2: {
          autoFix: true,
          violations: { "file1.ts": 1, "file2.ts": 1, "file3.ts": 1 },
        },
      };

      const todoModule = createTodoModuleV2(todo);
      const suppressions = SuppressionsJsonGenerator.fromV2(todoModule);
      const eslintConfig = createESLintConfig({
        rule1: { fixable: true },
        rule2: { fixable: true },
      });
      const config = createUserConfig({
        limit: { count: 5, type: "file" as const },
      });

      const result = selectRuleToCorrect(suppressions, eslintConfig, config);

      expect(result).toStrictEqual({
        selection: { ruleId: "rule2", type: "full" },
        success: true,
      });
    });

    it("violation limit - basic selection", () => {
      const todo = {
        rule1: {
          autoFix: true,
          violations: { "file1.ts": 10 },
        },
        rule2: {
          autoFix: true,
          violations: { "file1.ts": 2, "file2.ts": 3 },
        },
      };

      const todoModule = createTodoModuleV2(todo);
      const suppressions = SuppressionsJsonGenerator.fromV2(todoModule);
      const eslintConfig = createESLintConfig({
        rule1: { fixable: true },
        rule2: { fixable: true },
      });
      const config = createUserConfig({
        limit: { count: 6, type: "violation" as const },
      });

      const result = selectRuleToCorrect(suppressions, eslintConfig, config);

      expect(result).toStrictEqual({
        selection: { ruleId: "rule2", type: "full" },
        success: true,
      });
    });

    it("autoFixableOnly filtering", () => {
      const todo = {
        rule1: {
          autoFix: false,
          violations: { "file1.ts": 1 },
        },
        rule2: {
          autoFix: true,
          violations: { "file1.ts": 1 },
        },
      };

      const todoModule = createTodoModuleV2(todo);
      const suppressions = SuppressionsJsonGenerator.fromV2(todoModule);
      const eslintConfig = createESLintConfig({
        rule1: { fixable: false },
        rule2: { fixable: true },
      });
      const config = createUserConfig({
        autoFixableOnly: true,
        limit: { count: 5, type: "file" as const },
      });

      const result = selectRuleToCorrect(suppressions, eslintConfig, config);

      expect(result).toStrictEqual({
        selection: { ruleId: "rule2", type: "full" },
        success: true,
      });
    });

    it("partial selection", () => {
      const todo = {
        rule1: {
          autoFix: true,
          violations: {
            "file1.ts": 2,
            "file2.ts": 3,
            "file3.ts": 1,
          },
        },
      };

      const todoModule = createTodoModuleV2(todo);
      const suppressions = SuppressionsJsonGenerator.fromV2(todoModule);
      const eslintConfig = createESLintConfig({
        rule1: { fixable: true },
      });
      const config = createUserConfig({
        limit: { count: 2, type: "file" as const },
        partialSelection: true,
      });

      const result = selectRuleToCorrect(suppressions, eslintConfig, config);

      expect(result).toStrictEqual({
        selection: {
          ruleId: "rule1",
          type: "partial",
          violations: { "file1.ts": 2, "file2.ts": 3 },
        },
        success: true,
      });
    });

    it("prioritizes fixable rules when autoFixableOnly is false", () => {
      const todo = {
        "fixable-rule": {
          autoFix: true,
          violations: { "file1.ts": 1, "file2.ts": 1 },
        },
        "non-fixable-rule": {
          autoFix: false,
          violations: { "file1.ts": 1, "file2.ts": 1, "file3.ts": 1 },
        },
      };

      const todoModule = createTodoModuleV2(todo);
      const suppressions = SuppressionsJsonGenerator.fromV2(todoModule);
      const eslintConfig = createESLintConfig({
        "fixable-rule": { fixable: true },
        "non-fixable-rule": { fixable: false },
      });
      const config = createUserConfig({
        autoFixableOnly: false,
        limit: { count: 10, type: "file" as const },
      });

      const result = selectRuleToCorrect(suppressions, eslintConfig, config);

      expect(result).toStrictEqual({
        selection: { ruleId: "fixable-rule", type: "full" },
        success: true,
      });
    });

    it("no eligible rules", () => {
      const todo = {
        rule1: {
          autoFix: false,
          violations: { "file1.ts": 1 },
        },
      };

      const todoModule = createTodoModuleV2(todo);
      const suppressions = SuppressionsJsonGenerator.fromV2(todoModule);
      const eslintConfig = createESLintConfig({
        rule1: { fixable: false },
      });
      const config = createUserConfig({
        autoFixableOnly: true,
        limit: { count: 5, type: "file" as const },
      });

      const result = selectRuleToCorrect(suppressions, eslintConfig, config);

      expect(result).toStrictEqual({ success: false });
    });
  });

  describe("edge cases", () => {
    it("file limit must be greater than 0", () => {
      const todoModule = createTodoModuleV2({});
      const suppressions = SuppressionsJsonGenerator.fromV2(todoModule);
      const config = createUserConfig({
        limit: { count: 0, type: "file" as const },
      });

      expect(() =>
        selectRuleToCorrect(suppressions, createESLintConfig({}), config),
      ).toThrowError("The file limit must be greater than 0");
    });

    it("violation limit must be greater than 0", () => {
      const todoModule = createTodoModuleV2({});
      const suppressions = SuppressionsJsonGenerator.fromV2(todoModule);
      const config = createUserConfig({
        limit: { count: -1, type: "violation" as const },
      });

      expect(() =>
        selectRuleToCorrect(suppressions, createESLintConfig({}), config),
      ).toThrowError("The violation limit must be greater than 0");
    });
  });
});
