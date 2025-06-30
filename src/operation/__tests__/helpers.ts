import type { CorrectModeConfig, CorrectModeUserConfig } from "../../config/config";
import type { ESLintConfigSubset } from "../../lib/eslint";
import type { ESLintSuppressionsJson } from "../../suppressions-json/types";
import type { TodoModuleV2 } from "../../todofile/v2";

import { configWithDefault } from "../../config/config";
import { SuppressionsJsonGenerator } from "../../suppressions-json";

/**
 * Create a CorrectModeConfig with default values and optional overrides.
 */
export const createTestConfig = (
  overrides: CorrectModeUserConfig = {},
): CorrectModeConfig => {
  return configWithDefault({ correct: overrides }).correct;
};

/**
 * Create an ESLintConfigSubset with the given rules.
 */
export const createTestESLintConfig = (
  rules: Record<string, { fixable: boolean }> = {},
): ESLintConfigSubset => ({
  rules,
});

/**
 * Create ESLintSuppressionsJson from rule-based suppressions data.
 */
export const createTestSuppressions = (
  suppressions: Record<string, Record<string, { count: number }>> = {},
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

/**
 * Create ESLintSuppressionsJson from TodoModuleV2 format.
 */
export const createTestSuppressionsFromV2 = (
  todo: TodoModuleV2["todo"] = {},
): ESLintSuppressionsJson => {
  const todoModule = createTestTodoModuleV2(todo);
  return SuppressionsJsonGenerator.fromV2(todoModule);
};

/**
 * Create a TodoModuleV2 with the given todo data.
 */
export const createTestTodoModuleV2 = (
  todo: TodoModuleV2["todo"],
): TodoModuleV2 => ({
  meta: { version: 2 },
  todo,
});

/**
 * Common test file paths for use in tests.
 */
export const TEST_FILES = [
  "src/file1.ts",
  "src/file2.ts", 
  "app/file3.tsx",
  "dist/file4.js",
];

/**
 * Common ESLint rule configurations for testing.
 */
export const TEST_RULES = {
  FIXABLE: { "fixable-rule": { fixable: true } },
  NON_FIXABLE: { "non-fixable-rule": { fixable: false } },
  MIXED: {
    "fixable-rule": { fixable: true },
    "non-fixable-rule": { fixable: false },
  },
} as const;

/**
 * Common test scenarios for rule selection.
 */
export const TEST_SCENARIOS = {
  BASIC_FILE_LIMIT: {
    config: { limit: { count: 5, type: "file" as const } },
    description: "Basic file limit configuration",
  },
  BASIC_VIOLATION_LIMIT: {
    config: { limit: { count: 10, type: "violation" as const } },
    description: "Basic violation limit configuration", 
  },
  AUTO_FIXABLE_ONLY: {
    config: { 
      autoFixableOnly: true,
      limit: { count: 5, type: "file" as const },
    },
    description: "Auto-fixable only configuration",
  },
  PARTIAL_SELECTION: {
    config: {
      limit: { count: 2, type: "file" as const },
      partialSelection: true,
    },
    description: "Partial selection enabled",
  },
} as const;