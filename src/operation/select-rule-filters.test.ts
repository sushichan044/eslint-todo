import { describe, expect, it } from "vitest";

import type { CorrectModeConfig } from "../config/config";
import type { ESLintConfigSubset } from "../lib/eslint";

import { configWithDefault } from "../config/config";
import { applyRuleAndFileFilters } from "./select-rule";

const createDefaultConfig = () => configWithDefault({}).correct;

const createESLintConfig = (
  rules: Record<string, { fixable: boolean }>,
): ESLintConfigSubset => ({ rules });

describe("applyRuleAndFileFilters", () => {
  const testFiles = [
    "src/file1.ts",
    "src/file2.ts",
    "app/file3.tsx",
    "dist/file4.js",
  ];

  describe("rule eligibility filtering", () => {
    const tc: Array<{
      config: CorrectModeConfig;
      eslintConfig: ESLintConfigSubset;
      expected: { correctableFiles?: string[]; isEligible: boolean };
      name: string;
      ruleId: string;
    }> = [
      {
        config: { ...createDefaultConfig(), autoFixableOnly: true },
        eslintConfig: createESLintConfig({ "no-console": { fixable: false } }),
        expected: { isEligible: false },
        name: "excludes non-fixable rule when autoFixableOnly is true",
        ruleId: "no-console",
      },
      {
        config: { ...createDefaultConfig(), autoFixableOnly: false },
        eslintConfig: createESLintConfig({ "no-console": { fixable: false } }),
        expected: { correctableFiles: testFiles, isEligible: true },
        name: "includes non-fixable rule when autoFixableOnly is false",
        ruleId: "no-console",
      },
      {
        config: { ...createDefaultConfig(), autoFixableOnly: true },
        eslintConfig: createESLintConfig({ "no-console": { fixable: true } }),
        expected: { correctableFiles: testFiles, isEligible: true },
        name: "includes fixable rule when autoFixableOnly is true",
        ruleId: "no-console",
      },
    ];

    it.each(tc)("$name", ({ config, eslintConfig, expected, ruleId }) => {
      const result = applyRuleAndFileFilters(
        ruleId,
        testFiles,
        eslintConfig,
        config,
      );

      if (expected.isEligible) {
        expect(result).toStrictEqual({
          correctableFiles: expected.correctableFiles,
          isEligible: true,
        });
      } else {
        expect(result).toStrictEqual({ isEligible: false });
      }
    });
  });

  describe("rule exclude/include filtering", () => {
    const tc: Array<{
      config: CorrectModeConfig;
      expected: { correctableFiles?: string[]; isEligible: boolean };
      name: string;
      ruleId: string;
    }> = [
      {
        config: {
          ...createDefaultConfig(),
          exclude: { ...createDefaultConfig().exclude, rules: ["no-console"] },
        },
        expected: { isEligible: false },
        name: "excludes rule in exclude.rules",
        ruleId: "no-console",
      },
      {
        config: {
          ...createDefaultConfig(),
          exclude: { ...createDefaultConfig().exclude, rules: ["no-console"] },
        },
        expected: { correctableFiles: testFiles, isEligible: true },
        name: "includes rule not in exclude.rules",
        ruleId: "no-unused-vars",
      },
      {
        config: {
          ...createDefaultConfig(),
          include: { ...createDefaultConfig().include, rules: ["no-console"] },
        },
        expected: { correctableFiles: testFiles, isEligible: true },
        name: "includes rule in include.rules when include filter is set",
        ruleId: "no-console",
      },
      {
        config: {
          ...createDefaultConfig(),
          include: { ...createDefaultConfig().include, rules: ["no-console"] },
        },
        expected: { isEligible: false },
        name: "excludes rule not in include.rules when include filter is set",
        ruleId: "no-unused-vars",
      },
    ];

    it.each(tc)("$name", ({ config, expected, ruleId }) => {
      const eslintConfig = createESLintConfig({ [ruleId]: { fixable: true } });
      const result = applyRuleAndFileFilters(
        ruleId,
        testFiles,
        eslintConfig,
        config,
      );

      if (expected.isEligible) {
        expect(result).toStrictEqual({
          correctableFiles: expected.correctableFiles,
          isEligible: true,
        });
      } else {
        expect(result).toStrictEqual({ isEligible: false });
      }
    });
  });

  describe("file filtering", () => {
    const tc: Array<{
      config: CorrectModeConfig;
      expected: { correctableFiles?: string[]; isEligible: boolean };
      name: string;
    }> = [
      {
        config: {
          ...createDefaultConfig(),
          exclude: { ...createDefaultConfig().exclude, files: ["dist/**"] },
        },
        expected: {
          correctableFiles: ["src/file1.ts", "src/file2.ts", "app/file3.tsx"],
          isEligible: true,
        },
        name: "excludes files matching exclude.files patterns",
      },
      {
        config: {
          ...createDefaultConfig(),
          include: { ...createDefaultConfig().include, files: ["src/**"] },
        },
        expected: {
          correctableFiles: ["src/file1.ts", "src/file2.ts"],
          isEligible: true,
        },
        name: "includes only files matching include.files patterns",
      },
      {
        config: {
          ...createDefaultConfig(),
          exclude: { ...createDefaultConfig().exclude, files: ["**/file1.ts"] },
          include: { ...createDefaultConfig().include, files: ["src/**"] },
        },
        expected: { correctableFiles: ["src/file2.ts"], isEligible: true },
        name: "applies both exclude and include filters",
      },
      {
        config: {
          ...createDefaultConfig(),
          include: { ...createDefaultConfig().include, files: ["test/**"] },
        },
        expected: { isEligible: false },
        name: "returns not eligible when all files are filtered out",
      },
    ];

    it.each(tc)("$name", ({ config, expected }) => {
      const eslintConfig = createESLintConfig({
        "no-console": { fixable: true },
      });
      const result = applyRuleAndFileFilters(
        "no-console",
        testFiles,
        eslintConfig,
        config,
      );

      if (expected.isEligible) {
        expect(result).toStrictEqual({
          correctableFiles: expected.correctableFiles,
          isEligible: true,
        });
      } else {
        expect(result).toStrictEqual({ isEligible: false });
      }
    });
  });
});
