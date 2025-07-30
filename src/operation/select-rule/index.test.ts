import { describe, expect, it } from "vitest";

import type { Config, CorrectModeConfig } from "../../config/config";
import type { ESLintConfigSubset } from "../../lib/eslint";
import type { TodoModuleV2 } from "../../todofile/v2";

import { SuppressionsJsonGenerator } from "../../suppressions-json";
import { selectRuleToCorrect } from "./index";

// ============================================================================
// Shared Test Utilities
// ============================================================================

const createESLintConfig = (
  rules: Record<string, { fixable: boolean }>,
): ESLintConfigSubset => ({ rules });

const createConfig = (overrides: Partial<CorrectModeConfig> = {}): Config => ({
  correct: {
    autoFixableOnly: false,
    exclude: { files: [], rules: [] },
    include: { files: [], rules: [] },
    limit: { count: 100, type: "file" },
    partialSelection: false,
    strategy: { type: "normal" },
    ...overrides,
  },
  root: ".",
  todoFile: ".eslint-todo.js",
});

const createTodoModuleV2 = (todo: TodoModuleV2["todo"]): TodoModuleV2 => ({
  meta: { version: 2 },
  todo,
});

describe("selectRuleToCorrect integration", () => {
  describe("key integration scenarios", () => {
    it("file limit - basic selection", async () => {
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

      const result = await selectRuleToCorrect(
        suppressions,
        eslintConfig,
        config,
      );

      expect(result).toStrictEqual({
        selection: { ruleId: "rule2", type: "full" },
        success: true,
      });
    });

    it("violation limit - basic selection", async () => {
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

      const result = await selectRuleToCorrect(
        suppressions,
        eslintConfig,
        config,
      );

      expect(result).toStrictEqual({
        selection: { ruleId: "rule2", type: "full" },
        success: true,
      });
    });

    it("autoFixableOnly filtering", async () => {
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

      const result = await selectRuleToCorrect(
        suppressions,
        eslintConfig,
        config,
      );

      expect(result).toStrictEqual({
        selection: { ruleId: "rule2", type: "full" },
        success: true,
      });
    });

    it("partial selection", async () => {
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

      const result = await selectRuleToCorrect(
        suppressions,
        eslintConfig,
        config,
      );

      expect(result).toStrictEqual({
        selection: {
          ruleId: "rule1",
          type: "partial",
          violations: { "file1.ts": 2, "file2.ts": 3 },
        },
        success: true,
      });
    });

    it("prioritizes fixable rules when autoFixableOnly is false", async () => {
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

      const result = await selectRuleToCorrect(
        suppressions,
        eslintConfig,
        config,
      );

      expect(result).toStrictEqual({
        selection: { ruleId: "fixable-rule", type: "full" },
        success: true,
      });
    });

    it("no eligible rules", async () => {
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
        limit: { count: 5, type: "file" },
      });

      const result = await selectRuleToCorrect(
        suppressions,
        eslintConfig,
        config,
      );

      expect(result).toStrictEqual({ success: false });
    });

    it("works with filters in partial selection scenario", async () => {
      const todo = {
        "should-be-excluded": {
          autoFix: true,
          violations: {
            "file1.ts": 10,
            "file2.ts": 10,
            "file3.ts": 10,
          },
        },
        "should-be-selected": {
          autoFix: true,
          violations: {
            "file1.ts": 5,
            "file2.ts": 5,
            "file3.ts": 5,
          },
        },
      };

      const todoModule = createTodoModuleV2(todo);
      const suppressions = SuppressionsJsonGenerator.fromV2(todoModule);
      const eslintConfig = createESLintConfig({
        "should-be-excluded": { fixable: true },
        "should-be-selected": { fixable: true },
      });
      const config = createConfig({
        exclude: { files: [], rules: ["should-be-excluded"] },
        limit: { count: 2, type: "file" },
        partialSelection: true,
      });

      const result = await selectRuleToCorrect(
        suppressions,
        eslintConfig,
        config,
      );

      expect(result).toStrictEqual({
        selection: {
          ruleId: "should-be-selected",
          type: "partial",
          violations: { "file1.ts": 5, "file2.ts": 5 },
        },
        success: true,
      });
    });

    it("partial selection stops when violation limit would be exceeded", async () => {
      const todo = {
        rule1: {
          autoFix: true,
          violations: {
            "file1.ts": 3,
            "file2.ts": 4,
            "file3.ts": 5,
          },
        },
      };

      const todoModule = createTodoModuleV2(todo);
      const suppressions = SuppressionsJsonGenerator.fromV2(todoModule);
      const eslintConfig = createESLintConfig({
        rule1: { fixable: true },
      });
      const config = createConfig({
        limit: { count: 6, type: "violation" as const },
        partialSelection: true,
      });

      const result = await selectRuleToCorrect(
        suppressions,
        eslintConfig,
        config,
      );

      expect(result).toStrictEqual({
        selection: {
          ruleId: "rule1",
          type: "partial",
          violations: { "file1.ts": 3 },
        },
        success: true,
      });
    });
  });

  describe("edge cases", () => {
    it("file limit must be greater than 0", async () => {
      const todoModule = createTodoModuleV2({});
      const suppressions = SuppressionsJsonGenerator.fromV2(todoModule);
      const config = createConfig({
        limit: { count: 0, type: "file" as const },
      });

      await expect(
        selectRuleToCorrect(suppressions, createESLintConfig({}), config),
      ).rejects.toThrowError("The file limit must be greater than 0");
    });

    it("violation limit must be greater than 0", async () => {
      const todoModule = createTodoModuleV2({});
      const suppressions = SuppressionsJsonGenerator.fromV2(todoModule);
      const config = createConfig({
        limit: { count: -1, type: "violation" as const },
      });

      await expect(
        selectRuleToCorrect(suppressions, createESLintConfig({}), config),
      ).rejects.toThrowError("The violation limit must be greater than 0");
    });
  });
});
