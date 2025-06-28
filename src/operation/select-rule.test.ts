import { describe, expect, it } from "vitest";

import type { CorrectModeConfig } from "../config/config";
import type { ESLintConfigSubset } from "../lib/eslint";
import type { ESLintSuppressionsJson } from "../suppressions-json/types";

import { calculateRuleCounts } from "./select-rule";

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

describe("calculateRuleCounts", () => {
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

      const result = calculateRuleCounts(
        suppressions,
        eslintConfig,
        config,
        "file",
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
      const suppressions = createSuppressions({
        "unknown-rule": {
          "file1.ts": { count: 1 },
        },
      });

      const eslintConfig = createESLintConfig({});
      const config = createConfig();

      const result = calculateRuleCounts(
        suppressions,
        eslintConfig,
        config,
        "file",
      );

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

      const result = calculateRuleCounts(
        suppressions,
        eslintConfig,
        config,
        "file",
      );

      expect(result).toHaveLength(1);
      expect(result[0]?.ruleId).toBe("fixable-rule");
      expect(result[0]?.supportsAutoFix).toBe(true);
    });
  });
});
