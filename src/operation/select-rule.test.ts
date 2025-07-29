import { describe, expect, it } from "vitest";

import type { CorrectModeConfig } from "../config/config";
import type { ESLintConfigSubset } from "../lib/eslint";
import type { TodoModuleV2 } from "../todofile/v2";
import type { RuleViolationInfo } from "./select-rule";

import { SuppressionsJsonGenerator } from "../suppressions-json";
import {
  decideOptimalRule,
  filterViolations,
  selectRuleToCorrect,
} from "./select-rule";

// ============================================================================
// Shared Test Utilities
// ============================================================================

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

const createTodoModuleV2 = (todo: TodoModuleV2["todo"]): TodoModuleV2 => ({
  meta: { version: 2 },
  todo,
});

describe("filterViolations", () => {
  describe("rule filtering", () => {
    it("excludes rules when autoFixableOnly is true and rule is not fixable", () => {
      const violationInfos: RuleViolationInfo[] = [
        {
          isFixable: false,
          ruleId: "no-console",
          violations: {
            "file1.ts": { count: 3 },
          },
        },
        {
          isFixable: true,
          ruleId: "prefer-const",
          violations: {
            "file1.ts": { count: 2 },
          },
        },
      ];
      const config = createConfig({ autoFixableOnly: true });

      const result = filterViolations(violationInfos, config);

      expect(result).toHaveLength(1);
      expect(result[0]?.ruleId).toBe("prefer-const");
    });

    it("excludes rules in exclude.rules", () => {
      const violationInfos: RuleViolationInfo[] = [
        {
          isFixable: true,
          ruleId: "no-console",
          violations: {
            "file1.ts": { count: 3 },
          },
        },
        {
          isFixable: true,
          ruleId: "prefer-const",
          violations: {
            "file1.ts": { count: 2 },
          },
        },
      ];
      const config = createConfig({
        exclude: { files: [], rules: ["no-console"] },
      });

      const result = filterViolations(violationInfos, config);

      expect(result).toHaveLength(1);
      expect(result[0]?.ruleId).toBe("prefer-const");
    });

    it("includes only rules in include.rules when specified", () => {
      const violationInfos: RuleViolationInfo[] = [
        {
          isFixable: true,
          ruleId: "no-console",
          violations: {
            "file1.ts": { count: 3 },
          },
        },
        {
          isFixable: true,
          ruleId: "prefer-const",
          violations: {
            "file1.ts": { count: 2 },
          },
        },
      ];
      const config = createConfig({
        include: { files: [], rules: ["no-console"] },
      });

      const result = filterViolations(violationInfos, config);

      expect(result).toHaveLength(1);
      expect(result[0]?.ruleId).toBe("no-console");
    });
  });

  describe("file filtering", () => {
    it("excludes files matching exclude.files patterns", () => {
      const violationInfos: RuleViolationInfo[] = [
        {
          isFixable: true,
          ruleId: "no-console",
          violations: {
            "app/file3.tsx": { count: 1 },
            "dist/file2.js": { count: 2 },
            "src/file1.ts": { count: 3 },
          },
        },
      ];
      const config = createConfig({
        exclude: { files: ["dist/**"], rules: [] },
      });

      const result = filterViolations(violationInfos, config);

      expect(result).toHaveLength(1);
      expect(result[0]?.violations).toEqual({
        "app/file3.tsx": { count: 1 },
        "src/file1.ts": { count: 3 },
      });
    });

    it("includes only files matching include.files patterns", () => {
      const violationInfos: RuleViolationInfo[] = [
        {
          isFixable: true,
          ruleId: "no-console",
          violations: {
            "app/file3.tsx": { count: 1 },
            "dist/file2.js": { count: 2 },
            "src/file1.ts": { count: 3 },
          },
        },
      ];
      const config = createConfig({
        include: { files: ["src/**"], rules: [] },
      });

      const result = filterViolations(violationInfos, config);

      expect(result).toHaveLength(1);
      expect(result[0]?.violations).toEqual({
        "src/file1.ts": { count: 3 },
      });
    });

    it("applies both exclude and include file filters", () => {
      const violationInfos: RuleViolationInfo[] = [
        {
          isFixable: true,
          ruleId: "no-console",
          violations: {
            "dist/file2.js": { count: 1 },
            "src/file1.test.ts": { count: 2 },
            "src/file1.ts": { count: 3 },
          },
        },
      ];
      const config = createConfig({
        exclude: { files: ["**/*.test.ts"], rules: [] },
        include: { files: ["src/**"], rules: [] },
      });

      const result = filterViolations(violationInfos, config);

      expect(result).toHaveLength(1);
      expect(result[0]?.violations).toEqual({
        "src/file1.ts": { count: 3 },
      });
    });
  });

  describe("combined filtering", () => {
    it("applies both rule and file filters", () => {
      const violationInfos: RuleViolationInfo[] = [
        {
          isFixable: false,
          ruleId: "no-console",
          violations: {
            "dist/file2.js": { count: 2 },
            "src/file1.ts": { count: 3 },
          },
        },
        {
          isFixable: true,
          ruleId: "prefer-const",
          violations: {
            "dist/file2.js": { count: 4 },
            "src/file1.ts": { count: 1 },
          },
        },
      ];
      const config = createConfig({
        autoFixableOnly: true,
        exclude: { files: ["dist/**"], rules: [] },
      });

      const result = filterViolations(violationInfos, config);

      expect(result).toHaveLength(1);
      expect(result[0]?.ruleId).toBe("prefer-const");
      expect(result[0]?.violations).toEqual({
        "src/file1.ts": { count: 1 },
      });
    });

    it("returns empty array when all rules are filtered out", () => {
      const violationInfos: RuleViolationInfo[] = [
        {
          isFixable: false,
          ruleId: "no-console",
          violations: {
            "src/file1.ts": { count: 3 },
          },
        },
      ];
      const config = createConfig({ autoFixableOnly: true });

      const result = filterViolations(violationInfos, config);

      expect(result).toEqual([]);
    });

    it("handles empty input array", () => {
      const violationInfos: RuleViolationInfo[] = [];
      const config = createConfig();

      const result = filterViolations(violationInfos, config);

      expect(result).toEqual([]);
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
      const violationInfos: RuleViolationInfo[] = [
        {
          isFixable: true,
          ruleId: "rule1",
          violations: {
            "file1.ts": { count: 1 },
            "file2.ts": { count: 2 },
          },
        },
        {
          isFixable: true,
          ruleId: "rule2",
          violations: {
            "file1.ts": { count: 3 },
            "file2.ts": { count: 4 },
            "file3.ts": { count: 1 },
          },
        },
      ];

      const result = decideOptimalRule(
        violationInfos,
        createConfig({ limit: { count: 10, type: "file" } }),
      );

      expect(result).toStrictEqual({
        selection: { ruleId: "rule2", type: "full" },
        success: true,
      });
    });

    it("returns not successful when all rules exceed limit and partial selection disabled", () => {
      const violationInfos = [
        {
          isFixable: true,
          ruleId: "rule1",
          violations: {
            "file1.ts": { count: 5 },
            "file2.ts": { count: 5 },
            "file3.ts": { count: 5 },
          },
        },
      ];

      const result = decideOptimalRule(
        violationInfos,
        createConfig({
          limit: { count: 2, type: "file" },
          partialSelection: false,
        }),
      );

      expect(result).toStrictEqual({ success: false });
    });
  });

  describe("auto-fixable rule prioritization", () => {
    it("prioritizes auto-fixable rules over non-fixable rules with same filtered count", () => {
      const violationInfos = [
        {
          isFixable: false,
          ruleId: "non-fixable-rule",
          violations: {
            "file1.ts": { count: 5 },
            "file2.ts": { count: 5 },
          },
        },
        {
          isFixable: true,
          ruleId: "fixable-rule",
          violations: {
            "file1.ts": { count: 5 },
            "file2.ts": { count: 5 },
          },
        },
      ];

      const result = decideOptimalRule(
        violationInfos,
        createConfig({ limit: { count: 20, type: "file" } }),
      );

      expect(result).toStrictEqual({
        selection: { ruleId: "fixable-rule", type: "full" },
        success: true,
      });
    });

    it("prioritizes auto-fixable rule even with lower filtered count", () => {
      const violationInfos: RuleViolationInfo[] = [
        {
          isFixable: false,
          ruleId: "non-fixable-rule",
          violations: {
            "file1.ts": { count: 5 },
            "file2.ts": { count: 5 },
            "file3.ts": { count: 5 },
          },
        },
        {
          isFixable: true,
          ruleId: "fixable-rule",
          violations: {
            "file1.ts": { count: 5 },
            "file2.ts": { count: 5 },
          },
        },
      ];

      const result = decideOptimalRule(
        violationInfos,
        createConfig({ limit: { count: 20, type: "file" } }),
      );

      expect(result).toStrictEqual({
        selection: { ruleId: "fixable-rule", type: "full" },
        success: true,
      });
    });

    it("uses rule id as tiebreaker when fixability and filtered count are same", () => {
      const violationInfos = [
        {
          isFixable: true,
          ruleId: "z-rule",
          violations: {
            "file1.ts": { count: 5 },
            "file2.ts": { count: 5 },
          },
        },
        {
          isFixable: true,
          ruleId: "a-rule",
          violations: {
            "file1.ts": { count: 5 },
            "file2.ts": { count: 5 },
          },
        },
      ];

      const result = decideOptimalRule(
        violationInfos,
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
      const violationInfos: RuleViolationInfo[] = [
        {
          isFixable: true,
          ruleId: "rule1",
          violations: {
            "file1.ts": { count: 3 },
            "file2.ts": { count: 2 },
            "file3.ts": { count: 1 },
            "file4.ts": { count: 4 },
            "file5.ts": { count: 2 },
          },
        },
      ];

      const result = decideOptimalRule(
        violationInfos,
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
      const violationInfos: RuleViolationInfo[] = [
        {
          isFixable: true,
          ruleId: "rule1",
          violations: {
            "file1.ts": { count: 3 },
            "file2.ts": { count: 4 },
            "file3.ts": { count: 8 },
          },
        },
      ];

      const result = decideOptimalRule(
        violationInfos,
        createConfig({
          limit: { count: 7, type: "violation" },
          partialSelection: true,
        }),
      );

      expect(result).toStrictEqual({
        selection: {
          ruleId: "rule1",
          type: "partial",
          violations: { "file1.ts": 3, "file2.ts": 4 },
        },
        success: true,
      });
    });

    it("prioritizes rules by violation count when limit type is violation", () => {
      const violationInfos: RuleViolationInfo[] = [
        {
          isFixable: true,
          ruleId: "rule1",
          violations: {
            "file1.ts": { count: 2 },
            "file2.ts": { count: 3 }, // total: 5 violations
          },
        },
        {
          isFixable: true,
          ruleId: "rule2",
          violations: {
            "file1.ts": { count: 8 }, // total: 8 violations - should be prioritized
          },
        },
      ];

      const result = decideOptimalRule(
        violationInfos,
        createConfig({
          limit: { count: 10, type: "violation" },
        }),
      );

      expect(result).toStrictEqual({
        selection: { ruleId: "rule2", type: "full" },
        success: true,
      });
    });

    it("returns not successful when no partial selectable rules exist", () => {
      const violationInfos: RuleViolationInfo[] = [];

      const result = decideOptimalRule(
        violationInfos,
        createConfig({
          limit: { count: 3, type: "file" },
          partialSelection: true,
        }),
      );

      expect(result).toStrictEqual({ success: false });
    });

    it("returns not successful when partial selection produces no violations", () => {
      const violationInfos: RuleViolationInfo[] = [
        {
          isFixable: true,
          ruleId: "rule1",
          violations: {
            "file1.ts": { count: 10 },
            "file2.ts": { count: 20 },
          },
        },
      ];

      const result = decideOptimalRule(
        violationInfos,
        createConfig({
          limit: { count: 0, type: "violation" }, // 0 limit means no violations can be selected
          partialSelection: true,
        }),
      );

      expect(result).toStrictEqual({ success: false });
    });

    it("prefers full selection when available", () => {
      const violationInfos: RuleViolationInfo[] = [
        {
          isFixable: true,
          ruleId: "rule1",
          violations: {
            "file1.ts": { count: 3 },
            "file2.ts": { count: 4 },
            "file3.ts": { count: 8 },
          },
        },
        {
          isFixable: true,
          ruleId: "rule2",
          violations: {
            "file1.ts": { count: 2 },
            "file2.ts": { count: 2 },
          },
        },
      ];

      const result = decideOptimalRule(
        violationInfos,
        createConfig({
          limit: { count: 3, type: "file" },
          partialSelection: true,
        }),
      );

      expect(result).toStrictEqual({
        selection: { ruleId: "rule1", type: "full" },
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
      const config = createConfig({
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
      const config = createConfig({
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
      const config = createConfig({
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
      const config = createConfig({
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
      const config = createConfig({
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
      const config = createConfig({
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
      const config = createConfig({
        limit: { count: 0, type: "file" as const },
      });

      expect(() =>
        selectRuleToCorrect(suppressions, createESLintConfig({}), config),
      ).toThrowError("The file limit must be greater than 0");
    });

    it("violation limit must be greater than 0", () => {
      const todoModule = createTodoModuleV2({});
      const suppressions = SuppressionsJsonGenerator.fromV2(todoModule);
      const config = createConfig({
        limit: { count: -1, type: "violation" as const },
      });

      expect(() =>
        selectRuleToCorrect(suppressions, createESLintConfig({}), config),
      ).toThrowError("The violation limit must be greater than 0");
    });
  });
});
