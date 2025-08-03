import { describe, expect, it } from "vitest";

import type { RuleViolationInfo } from "..";
import type { UserConfig } from "../../../config/config";

import { applyViolationFilters } from ".";
import { configWithDefault } from "../../../config/config";
import { IncludeExcludeFilter } from "./include-exclude";

// ============================================================================
// Tests
// ============================================================================

describe("IncludeExcludeFilter", () => {
  describe("autoFixableOnly filtering", () => {
    const autoFixableTestCases: Array<{
      configCorrect: UserConfig["correct"];
      expected: RuleViolationInfo;
      input: RuleViolationInfo;
      name: string;
    }> = [
      {
        configCorrect: { autoFixableOnly: true },
        expected: {
          meta: { isFixable: false, ruleId: "no-console" },
          violations: {},
        },
        input: {
          meta: { isFixable: false, ruleId: "no-console" },
          violations: {
            "file1.ts": { count: 3 },
          },
        },
        name: "excludes non-fixable rules when autoFixableOnly is true",
      },
      {
        configCorrect: { autoFixableOnly: true },
        expected: {
          meta: { isFixable: true, ruleId: "prefer-const" },
          violations: {
            "file1.ts": { count: 2 },
          },
        },
        input: {
          meta: { isFixable: true, ruleId: "prefer-const" },
          violations: {
            "file1.ts": { count: 2 },
          },
        },
        name: "includes fixable rules when autoFixableOnly is true",
      },
      {
        configCorrect: { autoFixableOnly: false },
        expected: {
          meta: { isFixable: false, ruleId: "no-console" },
          violations: {
            "file1.ts": { count: 3 },
          },
        },
        input: {
          meta: { isFixable: false, ruleId: "no-console" },
          violations: {
            "file1.ts": { count: 3 },
          },
        },
        name: "includes all rules when autoFixableOnly is false",
      },
    ];

    it.each(autoFixableTestCases)(
      "$name",
      async ({ configCorrect, expected, input: info }) => {
        const config = configWithDefault({ correct: configCorrect });
        const filter = new IncludeExcludeFilter({ config });
        const result = await applyViolationFilters([info], [filter], config);

        expect(result.at(0)).toEqual(expected);
      },
    );
  });

  describe("rule filtering", () => {
    const ruleFilteringTestCases: Array<{
      configCorrect: UserConfig["correct"];
      expected: RuleViolationInfo;
      input: RuleViolationInfo;
      name: string;
    }> = [
      {
        configCorrect: {
          exclude: { files: [], rules: ["no-console"] },
        },
        expected: {
          meta: { isFixable: true, ruleId: "no-console" },
          violations: {},
        },
        input: {
          meta: { isFixable: true, ruleId: "no-console" },
          violations: {
            "file1.ts": { count: 3 },
          },
        },
        name: "excludes rules in exclude.rules",
      },
      {
        configCorrect: {
          exclude: { files: [], rules: ["no-console"] },
        },
        expected: {
          meta: { isFixable: true, ruleId: "prefer-const" },
          violations: {
            "file1.ts": { count: 2 },
          },
        },
        input: {
          meta: { isFixable: true, ruleId: "prefer-const" },
          violations: {
            "file1.ts": { count: 2 },
          },
        },
        name: "includes rules not in exclude.rules",
      },
      {
        configCorrect: {
          include: { files: [], rules: ["no-console"] },
        },
        expected: {
          meta: { isFixable: true, ruleId: "no-console" },
          violations: {
            "file1.ts": { count: 3 },
          },
        },
        input: {
          meta: { isFixable: true, ruleId: "no-console" },
          violations: {
            "file1.ts": { count: 3 },
          },
        },
        name: "includes only rules in include.rules when specified",
      },
      {
        configCorrect: {
          include: { files: [], rules: ["no-console"] },
        },
        expected: {
          meta: { isFixable: true, ruleId: "prefer-const" },
          violations: {},
        },
        input: {
          meta: { isFixable: true, ruleId: "prefer-const" },
          violations: {
            "file1.ts": { count: 2 },
          },
        },
        name: "excludes rules not in include.rules when specified",
      },
      {
        configCorrect: {
          include: { files: [], rules: [] },
        },
        expected: {
          meta: { isFixable: true, ruleId: "prefer-const" },
          violations: {
            "file1.ts": { count: 2 },
          },
        },
        input: {
          meta: { isFixable: true, ruleId: "prefer-const" },
          violations: {
            "file1.ts": { count: 2 },
          },
        },
        name: "allows all rules when include.rules is empty",
      },
    ];

    it.each(ruleFilteringTestCases)(
      "$name",
      async ({ configCorrect, expected, input }) => {
        const config = configWithDefault({ correct: configCorrect });
        const filter = new IncludeExcludeFilter({ config });
        const result = await applyViolationFilters([input], [filter], config);

        expect(result.at(0)).toEqual(expected);
      },
    );
  });

  describe("file filtering", () => {
    const fileFilteringTestCases: Array<{
      configCorrect: UserConfig["correct"];
      expected: RuleViolationInfo;
      input: RuleViolationInfo;
      name: string;
    }> = [
      {
        configCorrect: {
          exclude: { files: ["dist/**"], rules: [] },
        },
        expected: {
          meta: { isFixable: true, ruleId: "no-console" },
          violations: {
            "app/file3.tsx": { count: 1 },
            "src/file1.ts": { count: 3 },
          },
        },
        input: {
          meta: { isFixable: true, ruleId: "no-console" },
          violations: {
            "app/file3.tsx": { count: 1 },
            "dist/file2.js": { count: 2 },
            "src/file1.ts": { count: 3 },
          },
        },
        name: "excludes files matching exclude.files patterns",
      },
      {
        configCorrect: {
          include: { files: ["src/**"], rules: [] },
        },
        expected: {
          meta: { isFixable: true, ruleId: "no-console" },
          violations: {
            "src/file1.ts": { count: 3 },
          },
        },
        input: {
          meta: { isFixable: true, ruleId: "no-console" },
          violations: {
            "app/file3.tsx": { count: 1 },
            "dist/file2.js": { count: 2 },
            "src/file1.ts": { count: 3 },
          },
        },
        name: "includes only files matching include.files patterns",
      },
      {
        configCorrect: {
          exclude: { files: ["**/*.test.ts"], rules: [] },
          include: { files: ["src/**"], rules: [] },
        },
        expected: {
          meta: { isFixable: true, ruleId: "no-console" },
          violations: {
            "src/file1.ts": { count: 3 },
          },
        },
        input: {
          meta: { isFixable: true, ruleId: "no-console" },
          violations: {
            "dist/file2.js": { count: 1 },
            "src/file1.test.ts": { count: 2 },
            "src/file1.ts": { count: 3 },
          },
        },
        name: "applies both exclude and include file filters",
      },
      {
        configCorrect: {
          exclude: { files: ["dist/**"], rules: [] },
        },
        expected: {
          meta: { isFixable: true, ruleId: "no-console" },
          violations: {},
        },
        input: {
          meta: { isFixable: true, ruleId: "no-console" },
          violations: {
            "dist/file1.js": { count: 1 },
            "dist/file2.js": { count: 2 },
          },
        },
        name: "returns empty violations when all files are filtered out",
      },
      {
        configCorrect: {},
        expected: {
          meta: { isFixable: true, ruleId: "no-console" },
          violations: {},
        },
        input: {
          meta: { isFixable: true, ruleId: "no-console" },
          violations: {},
        },
        name: "handles empty violations input",
      },
    ];

    it.each(fileFilteringTestCases)(
      "$name",
      async ({ configCorrect, expected, input: info }) => {
        const config = configWithDefault({ correct: configCorrect });
        const filter = new IncludeExcludeFilter({ config });
        const result = await applyViolationFilters([info], [filter], config);

        expect(result.at(0)).toEqual(expected);
      },
    );
  });

  describe("combined filtering", () => {
    const combinedFilteringTestCases: Array<{
      configCorrect: UserConfig["correct"];
      expected: RuleViolationInfo;
      input: RuleViolationInfo;
      name: string;
    }> = [
      {
        configCorrect: {
          autoFixableOnly: true,
          exclude: { files: ["dist/**"], rules: [] },
        },
        expected: {
          meta: { isFixable: false, ruleId: "no-console" },
          violations: {},
        },
        input: {
          meta: { isFixable: false, ruleId: "no-console" },
          violations: {
            "dist/file2.js": { count: 2 },
            "src/file1.ts": { count: 3 },
          },
        },
        name: "applies both rule and file filters",
      },
      {
        configCorrect: {
          exclude: { files: ["dist/**"], rules: [] },
          include: { files: [], rules: ["no-console"] },
        },
        expected: {
          meta: { isFixable: true, ruleId: "no-console" },
          violations: {
            "src/file1.ts": { count: 2 },
            "src/file2.ts": { count: 3 },
          },
        },
        input: {
          meta: { isFixable: true, ruleId: "no-console" },
          violations: {
            "dist/file1.js": { count: 1 },
            "src/file1.ts": { count: 2 },
            "src/file2.ts": { count: 3 },
          },
        },
        name: "applies rule include filter with file exclude filter",
      },
      {
        configCorrect: {
          exclude: { files: [], rules: ["no-console"] },
          include: { files: ["src/**"], rules: [] },
        },
        expected: {
          meta: { isFixable: true, ruleId: "no-console" },
          violations: {},
        },
        input: {
          meta: { isFixable: true, ruleId: "no-console" },
          violations: {
            "src/file1.ts": { count: 1 },
            "src/file2.ts": { count: 2 },
          },
        },
        name: "returns empty when rule is excluded even if files match",
      },
    ];

    it.each(combinedFilteringTestCases)(
      "$name",
      async ({ configCorrect, expected, input: info }) => {
        const config = configWithDefault({ correct: configCorrect });
        const filter = new IncludeExcludeFilter({ config });
        const result = await applyViolationFilters([info], [filter], config);

        expect(result.at(0)).toEqual(expected);
      },
    );
  });
});
