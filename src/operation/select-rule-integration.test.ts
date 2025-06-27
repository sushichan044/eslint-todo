import { describe, expect, it } from "vitest";

import type {
  CorrectModeConfig,
  CorrectModeUserConfig,
} from "../config/config";
import type { ESLintConfigSubset } from "../lib/eslint";
import type { TodoModuleV2 } from "../todofile/v2";
import type { SelectionResult } from "./select-rule";

import { configWithDefault } from "../config/config";
import { SuppressionsJsonGenerator } from "../suppressions-json";
import {
  selectRuleBasedOnFilesLimit,
  selectRuleBasedOnLimit,
  selectRuleBasedOnViolationsLimit,
} from "./select-rule";

const createTodoModuleV2 = (todo: TodoModuleV2["todo"]): TodoModuleV2 => ({
  meta: { version: 2 },
  todo,
});

const createConfig = (
  overrides: CorrectModeUserConfig = {},
): CorrectModeConfig => {
  return configWithDefault({ correct: overrides }).correct;
};

const createESLintConfigSubset = (
  rules: Record<string, { fixable: boolean }> = {},
): ESLintConfigSubset => ({ rules });

describe("select-rule integration tests", () => {
  describe("selectRuleBasedOnLimit", () => {
    it("calls selectRuleBasedOnFilesLimit for file limit type", () => {
      const todoModule = createTodoModuleV2({});
      const suppressions = SuppressionsJsonGenerator.fromV2(todoModule);
      const eslintConfig = createESLintConfigSubset();
      const config = createConfig({ limit: { count: 10, type: "file" } });

      const result = selectRuleBasedOnLimit(suppressions, eslintConfig, config);
      const expected = selectRuleBasedOnFilesLimit(
        suppressions,
        eslintConfig,
        config,
      );

      expect(result).toStrictEqual(expected);
    });

    it("calls selectRuleBasedOnViolationsLimit for violation limit type", () => {
      const todoModule = createTodoModuleV2({});
      const suppressions = SuppressionsJsonGenerator.fromV2(todoModule);
      const eslintConfig = createESLintConfigSubset();
      const config = createConfig({ limit: { count: 10, type: "violation" } });

      const result = selectRuleBasedOnLimit(suppressions, eslintConfig, config);
      const expected = selectRuleBasedOnViolationsLimit(
        suppressions,
        eslintConfig,
        config,
      );

      expect(result).toStrictEqual(expected);
    });

    it("throws error for unknown limit type", () => {
      const todoModule = createTodoModuleV2({});
      const suppressions = SuppressionsJsonGenerator.fromV2(todoModule);
      const config = createConfig({
        // @ts-expect-error Testing invalid limit type
        limit: { count: 10, type: "unknown" },
      });

      expect(() =>
        selectRuleBasedOnLimit(
          suppressions,
          createESLintConfigSubset(),
          config,
        ),
      ).toThrowError("Got unknown limit");
    });
  });

  describe("major end-to-end scenarios", () => {
    const tc: Array<{
      config: CorrectModeUserConfig;
      eslintRules: ESLintConfigSubset;
      expected: SelectionResult;
      name: string;
      todo: TodoModuleV2["todo"];
    }> = [
      {
        config: {
          limit: { count: 5, type: "file" as const },
        },
        eslintRules: {
          rules: {
            rule1: { fixable: true },
            rule2: { fixable: true },
          },
        },
        expected: {
          selection: { ruleId: "rule2", type: "full" },
          success: true,
        },
        name: "file limit - basic selection",
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
        config: {
          limit: { count: 6, type: "violation" as const },
        },
        eslintRules: {
          rules: {
            rule1: { fixable: true },
            rule2: { fixable: true },
          },
        },
        expected: {
          selection: { ruleId: "rule2", type: "full" },
          success: true,
        },
        name: "violation limit - basic selection",
        todo: {
          rule1: {
            autoFix: true,
            violations: { "file1.ts": 10 },
          },
          rule2: {
            autoFix: true,
            violations: { "file1.ts": 2, "file2.ts": 3 },
          },
        },
      },
      {
        config: {
          autoFixableOnly: true,
          limit: { count: 5, type: "file" as const },
        },
        eslintRules: {
          rules: {
            rule1: { fixable: false },
            rule2: { fixable: true },
          },
        },
        expected: {
          selection: { ruleId: "rule2", type: "full" },
          success: true,
        },
        name: "autoFixableOnly filtering",
        todo: {
          rule1: {
            autoFix: false,
            violations: { "file1.ts": 1 },
          },
          rule2: {
            autoFix: true,
            violations: { "file1.ts": 1 },
          },
        },
      },
      {
        config: {
          exclude: { files: ["**/file1.ts"] },
          include: { files: ["src/**"] },
          limit: { count: 5, type: "file" as const },
        },
        eslintRules: {
          rules: {
            rule1: { fixable: true },
          },
        },
        expected: {
          selection: { ruleId: "rule1", type: "full" },
          success: true,
        },
        name: "include/exclude files filtering",
        todo: {
          rule1: {
            autoFix: true,
            violations: {
              "dist/file3.js": 1,
              "src/file1.ts": 1,
              "src/file2.ts": 1,
            },
          },
        },
      },
      {
        config: {
          limit: { count: 2, type: "file" as const },
          partialSelection: true,
        },
        eslintRules: {
          rules: {
            rule1: { fixable: true },
          },
        },
        expected: {
          selection: {
            ruleId: "rule1",
            type: "partial",
            violations: { "file1.ts": 2, "file2.ts": 3 },
          },
          success: true,
        },
        name: "partial selection",
        todo: {
          rule1: {
            autoFix: true,
            violations: {
              "file1.ts": 2,
              "file2.ts": 3,
              "file3.ts": 1,
            },
          },
        },
      },
      {
        config: {
          autoFixableOnly: true,
          limit: { count: 5, type: "file" as const },
        },
        eslintRules: {
          rules: {
            rule1: { fixable: false },
          },
        },
        expected: { success: false },
        name: "no eligible rules",
        todo: {
          rule1: {
            autoFix: false,
            violations: { "file1.ts": 1 },
          },
        },
      },
      {
        config: {
          limit: { count: 5, type: "file" as const },
        },
        eslintRules: {
          rules: {},
        },
        expected: { success: false },
        name: "empty todo",
        todo: {},
      },
      {
        config: {
          autoFixableOnly: false,
          limit: { count: 10, type: "file" as const },
        },
        eslintRules: {
          rules: {
            "fixable-rule": { fixable: true },
            "non-fixable-rule": { fixable: false },
          },
        },
        expected: {
          selection: { ruleId: "fixable-rule", type: "full" },
          success: true,
        },
        name: "prioritizes fixable rules when autoFixableOnly is false",
        todo: {
          "fixable-rule": {
            autoFix: true,
            violations: { "file1.ts": 1, "file2.ts": 1 },
          },
          "non-fixable-rule": {
            autoFix: false,
            violations: { "file1.ts": 1, "file2.ts": 1, "file3.ts": 1 },
          },
        },
      },
      {
        config: {
          autoFixableOnly: false,
          limit: { count: 10, type: "file" as const },
        },
        eslintRules: {
          rules: {
            "fixable-medium": { fixable: true },
            "non-fixable-high": { fixable: false },
          },
        },
        expected: {
          selection: { ruleId: "fixable-medium", type: "full" },
          success: true,
        },
        name: "prioritizes fixable rules even with lower violation count",
        todo: {
          "fixable-medium": {
            autoFix: true,
            violations: { "file1.ts": 1, "file2.ts": 1, "file3.ts": 1 },
          },
          "non-fixable-high": {
            autoFix: false,
            violations: {
              "file1.ts": 1,
              "file2.ts": 1,
              "file3.ts": 1,
              "file4.ts": 1,
              "file5.ts": 1,
            },
          },
        },
      },
      {
        config: {
          autoFixableOnly: false,
          limit: { count: 10, type: "file" as const },
        },
        eslintRules: {
          rules: {
            "a-fixable-rule": { fixable: true },
            "z-fixable-rule": { fixable: true },
          },
        },
        expected: {
          selection: { ruleId: "a-fixable-rule", type: "full" },
          success: true,
        },
        name: "uses rule id as tiebreaker when fixability and count are same",
        todo: {
          "a-fixable-rule": {
            autoFix: true,
            violations: { "file1.ts": 1, "file2.ts": 1 },
          },
          "z-fixable-rule": {
            autoFix: true,
            violations: { "file1.ts": 1, "file2.ts": 1 },
          },
        },
      },
    ];

    it.each(tc)("$name", ({ config, eslintRules, expected, todo }) => {
      const todoModule = createTodoModuleV2(todo);
      const suppressions = SuppressionsJsonGenerator.fromV2(todoModule);
      const eslintConfig = createESLintConfigSubset(eslintRules.rules);
      const correctConfig = createConfig(config);

      const result = selectRuleBasedOnLimit(
        suppressions,
        eslintConfig,
        correctConfig,
      );
      expect(result).toStrictEqual(expected);
    });
  });

  describe("edge cases", () => {
    const tc: Array<{
      config: CorrectModeUserConfig;
      expectError: string;
      name: string;
    }> = [
      {
        config: { limit: { count: 0, type: "file" as const } },
        expectError: "The file limit must be greater than 0",
        name: "file limit must be greater than 0",
      },
      {
        config: { limit: { count: -1, type: "violation" as const } },
        expectError: "The violation limit must be greater than 0",
        name: "violation limit must be greater than 0",
      },
    ];

    it.each(tc)("$name", ({ config, expectError }) => {
      const todoModule = createTodoModuleV2({});
      const suppressions = SuppressionsJsonGenerator.fromV2(todoModule);
      const correctConfig = createConfig(config);

      expect(() =>
        selectRuleBasedOnLimit(
          suppressions,
          createESLintConfigSubset(),
          correctConfig,
        ),
      ).toThrowError(expectError);
    });
  });
});
