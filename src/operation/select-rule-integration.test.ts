import { describe, expect, it } from "vitest";

import {
  createTestConfig,
  createTestESLintConfig,
  createTestSuppressionsFromV2,
  TEST_SCENARIOS,
} from "./__tests__/helpers";
import { selectRuleBasedOnLimit } from "./select-rule";

describe("select-rule integration tests", () => {
  describe("major end-to-end scenarios", () => {
    const integrationTestCases = [
      {
        ...TEST_SCENARIOS.BASIC_FILE_LIMIT,
        eslintRules: { rule1: { fixable: true }, rule2: { fixable: true } },
        expected: {
          selection: { ruleId: "rule2", type: "full" },
          success: true,
        },
        name: "file limit - selects rule with most files",
        todo: {
          rule1: {
            autoFix: true,
            violations: { "file1.ts": 1, "file2.ts": 1 },
          },
          rule2: {
            autoFix: true,
            violations: { "file1.ts": 1, "file2.ts": 1, "file3.ts": 1 },
          },
        },
      },
      {
        ...TEST_SCENARIOS.BASIC_VIOLATION_LIMIT,
        eslintRules: { rule1: { fixable: true }, rule2: { fixable: true } },
        expected: {
          selection: { ruleId: "rule2", type: "full" },
          success: true,
        },
        name: "violation limit - selects rule within violation count",
        todo: {
          rule1: { autoFix: true, violations: { "file1.ts": 15 } }, // Exceeds limit
          rule2: {
            autoFix: true,
            violations: { "file1.ts": 2, "file2.ts": 3 },
          }, // Within limit
        },
      },
      {
        ...TEST_SCENARIOS.AUTO_FIXABLE_ONLY,
        eslintRules: { rule1: { fixable: false }, rule2: { fixable: true } },
        expected: {
          selection: { ruleId: "rule2", type: "full" },
          success: true,
        },
        name: "autoFixableOnly - filters out non-fixable rules",
        todo: {
          rule1: { autoFix: false, violations: { "file1.ts": 1 } },
          rule2: { autoFix: true, violations: { "file1.ts": 1 } },
        },
      },
      {
        ...TEST_SCENARIOS.PARTIAL_SELECTION,
        eslintRules: { rule1: { fixable: true } },
        expected: {
          selection: {
            ruleId: "rule1",
            type: "partial",
            violations: { "file1.ts": 2, "file2.ts": 3 },
          },
          success: true,
        },
        name: "partial selection - returns subset of files when enabled",
        todo: {
          rule1: {
            autoFix: true,
            violations: { "file1.ts": 2, "file2.ts": 3, "file3.ts": 1 },
          },
        },
      },
    ] as const;

    it.each(integrationTestCases)(
      "$name",
      ({ config, eslintRules, expected, todo }) => {
        const suppressions = createTestSuppressionsFromV2(todo);
        const eslintConfig = createTestESLintConfig(eslintRules);
        const correctConfig = createTestConfig(config);

        const result = selectRuleBasedOnLimit(
          suppressions,
          eslintConfig,
          correctConfig,
        );
        expect(result).toStrictEqual(expected);
      },
    );
  });

  describe("configuration combinations", () => {
    it("applies include/exclude file filters correctly", () => {
      const config = createTestConfig({
        exclude: { files: ["**/file1.ts"], rules: [] },
        include: { files: ["src/**"], rules: [] },
        limit: { count: 5, type: "file" },
      });

      const suppressions = createTestSuppressionsFromV2({
        rule1: {
          autoFix: true,
          violations: {
            "dist/file3.js": 1, // Excluded by include filter
            "src/file1.ts": 1, // Excluded by exclude filter
            "src/file2.ts": 1, // Should be included
          },
        },
      });

      const result = selectRuleBasedOnLimit(
        suppressions,
        createTestESLintConfig({ rule1: { fixable: true } }),
        config,
      );

      expect(result).toEqual({
        selection: { ruleId: "rule1", type: "full" },
        success: true,
      });
    });

    it("applies rule include/exclude filters correctly", () => {
      const config = createTestConfig({
        exclude: { files: [], rules: ["excluded-rule"] },
        include: { files: [], rules: ["included-rule"] },
        limit: { count: 5, type: "file" },
      });

      const suppressions = createTestSuppressionsFromV2({
        "excluded-rule": { autoFix: true, violations: { "file1.ts": 1 } },
        "included-rule": { autoFix: true, violations: { "file1.ts": 1 } },
        "other-rule": { autoFix: true, violations: { "file1.ts": 1 } },
      });

      const result = selectRuleBasedOnLimit(
        suppressions,
        createTestESLintConfig({
          "excluded-rule": { fixable: true },
          "included-rule": { fixable: true },
          "other-rule": { fixable: true },
        }),
        config,
      );

      expect(result).toEqual({
        selection: { ruleId: "included-rule", type: "full" },
        success: true,
      });
    });
  });

  describe("prioritization logic", () => {
    it("prioritizes fixable rules over non-fixable with same count", () => {
      const suppressions = createTestSuppressionsFromV2({
        "fixable-rule": {
          autoFix: true,
          violations: { "file1.ts": 1, "file2.ts": 1 },
        },
        "non-fixable-rule": {
          autoFix: false,
          violations: { "file1.ts": 1, "file2.ts": 1, "file3.ts": 1 },
        },
      });

      const result = selectRuleBasedOnLimit(
        suppressions,
        createTestESLintConfig({
          "fixable-rule": { fixable: true },
          "non-fixable-rule": { fixable: false },
        }),
        createTestConfig({
          autoFixableOnly: false,
          limit: { count: 10, type: "file" },
        }),
      );

      expect(result).toEqual({
        selection: { ruleId: "fixable-rule", type: "full" },
        success: true,
      });
    });

    it("uses rule ID as tiebreaker for equal priority rules", () => {
      const suppressions = createTestSuppressionsFromV2({
        "a-rule": {
          autoFix: true,
          violations: { "file1.ts": 1, "file2.ts": 1 },
        },
        "z-rule": {
          autoFix: true,
          violations: { "file1.ts": 1, "file2.ts": 1 },
        },
      });

      const result = selectRuleBasedOnLimit(
        suppressions,
        createTestESLintConfig({
          "a-rule": { fixable: true },
          "z-rule": { fixable: true },
        }),
        createTestConfig({ limit: { count: 10, type: "file" } }),
      );

      expect(result).toEqual({
        selection: { ruleId: "a-rule", type: "full" },
        success: true,
      });
    });
  });

  describe("partial selection workflows", () => {
    it("prefers full selection when available over partial selection", () => {
      const suppressions = createTestSuppressionsFromV2({
        "large-rule": {
          autoFix: true,
          violations: {
            "file1.ts": 1,
            "file2.ts": 1,
            "file3.ts": 1,
            "file4.ts": 1,
            "file5.ts": 1,
          },
        },
        "small-rule": {
          autoFix: true,
          violations: { "file1.ts": 1, "file2.ts": 1 },
        },
      });

      const result = selectRuleBasedOnLimit(
        suppressions,
        createTestESLintConfig({
          "large-rule": { fixable: true },
          "small-rule": { fixable: true },
        }),
        createTestConfig({
          limit: { count: 3, type: "file" },
          partialSelection: true,
        }),
      );

      // Should prefer full selection of small-rule over partial selection of large-rule
      expect(result).toEqual({
        selection: { ruleId: "small-rule", type: "full" },
        success: true,
      });
    });

    it("handles violation limit partial selection", () => {
      const suppressions = createTestSuppressionsFromV2({
        rule1: {
          autoFix: true,
          violations: { "file1.ts": 3, "file2.ts": 4, "file3.ts": 8 }, // Total: 15
        },
      });

      const result = selectRuleBasedOnLimit(
        suppressions,
        createTestESLintConfig({ rule1: { fixable: true } }),
        createTestConfig({
          limit: { count: 7, type: "violation" },
          partialSelection: true,
        }),
      );

      expect(result).toEqual({
        selection: {
          ruleId: "rule1",
          type: "partial",
          violations: { "file1.ts": 3, "file2.ts": 4 }, // Total: 7
        },
        success: true,
      });
    });
  });

  describe("failure scenarios", () => {
    it("returns failure when no eligible rules", () => {
      const suppressions = createTestSuppressionsFromV2({
        "non-fixable-rule": { autoFix: false, violations: { "file1.ts": 1 } },
      });

      const result = selectRuleBasedOnLimit(
        suppressions,
        createTestESLintConfig({ "non-fixable-rule": { fixable: false } }),
        createTestConfig({ autoFixableOnly: true }),
      );

      expect(result).toEqual({ success: false });
    });

    it("returns failure for empty suppressions", () => {
      const result = selectRuleBasedOnLimit(
        createTestSuppressionsFromV2({}),
        createTestESLintConfig(),
        createTestConfig(),
      );

      expect(result).toEqual({ success: false });
    });

    it("returns failure when partial selection disabled and all rules exceed limit", () => {
      const suppressions = createTestSuppressionsFromV2({
        rule1: {
          autoFix: true,
          violations: {
            "file1.ts": 1,
            "file2.ts": 1,
            "file3.ts": 1,
            "file4.ts": 1,
            "file5.ts": 1,
          },
        },
      });

      const result = selectRuleBasedOnLimit(
        suppressions,
        createTestESLintConfig({ rule1: { fixable: true } }),
        createTestConfig({
          limit: { count: 3, type: "file" },
          partialSelection: false, // Disabled
        }),
      );

      expect(result).toEqual({ success: false });
    });
  });

  describe("edge cases", () => {
    it("throws error for unknown limit type", () => {
      const suppressions = createTestSuppressionsFromV2({});
      const config = createTestConfig({
        // @ts-expect-error Testing invalid limit type
        limit: { count: 10, type: "unknown" },
      });

      expect(() =>
        selectRuleBasedOnLimit(suppressions, createTestESLintConfig(), config),
      ).toThrowError("Got unknown limit");
    });

    it("throws error for zero file limit", () => {
      const suppressions = createTestSuppressionsFromV2({});
      const config = createTestConfig({ limit: { count: 0, type: "file" } });

      expect(() =>
        selectRuleBasedOnLimit(suppressions, createTestESLintConfig(), config),
      ).toThrowError("The file limit must be greater than 0");
    });

    it("throws error for negative violation limit", () => {
      const suppressions = createTestSuppressionsFromV2({});
      const config = createTestConfig({
        limit: { count: -1, type: "violation" },
      });

      expect(() =>
        selectRuleBasedOnLimit(suppressions, createTestESLintConfig(), config),
      ).toThrowError("The violation limit must be greater than 0");
    });
  });
});
