import { describe, expect, it } from "vitest";

import type { Config } from "../../../config/config";
import type { RuleViolationInfo } from "../index";

import { includeExcludeFilter } from "./include-exclude";

// ============================================================================
// Test Utilities
// ============================================================================

const createConfig = (overrides: Partial<Config["correct"]> = {}): Config => ({
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

const createRuleViolationInfo = (
  ruleId: string,
  isFixable: boolean,
  violations: { [file: string]: { count: number } },
): RuleViolationInfo => ({
  meta: {
    isFixable,
    ruleId,
  },
  violations,
});

// ============================================================================
// Tests
// ============================================================================

describe("includeExcludeFilter", () => {
  describe("autoFixableOnly filtering", () => {
    it("excludes non-fixable rules when autoFixableOnly is true", () => {
      const info = createRuleViolationInfo("no-console", false, {
        "file1.ts": { count: 3 },
      });
      const config = createConfig({ autoFixableOnly: true });

      const result = includeExcludeFilter(info, config);

      expect(result).toEqual({
        meta: { isFixable: false, ruleId: "no-console" },
        violations: {},
      });
    });

    it("includes fixable rules when autoFixableOnly is true", () => {
      const info = createRuleViolationInfo("prefer-const", true, {
        "file1.ts": { count: 2 },
      });
      const config = createConfig({ autoFixableOnly: true });

      const result = includeExcludeFilter(info, config);

      expect(result).toEqual({
        meta: { isFixable: true, ruleId: "prefer-const" },
        violations: {
          "file1.ts": { count: 2 },
        },
      });
    });

    it("includes all rules when autoFixableOnly is false", () => {
      const info = createRuleViolationInfo("no-console", false, {
        "file1.ts": { count: 3 },
      });
      const config = createConfig({ autoFixableOnly: false });

      const result = includeExcludeFilter(info, config);

      expect(result).toEqual({
        meta: { isFixable: false, ruleId: "no-console" },
        violations: {
          "file1.ts": { count: 3 },
        },
      });
    });
  });

  describe("rule filtering", () => {
    it("excludes rules in exclude.rules", () => {
      const info = createRuleViolationInfo("no-console", true, {
        "file1.ts": { count: 3 },
      });
      const config = createConfig({
        exclude: { files: [], rules: ["no-console"] },
      });

      const result = includeExcludeFilter(info, config);

      expect(result).toEqual({
        meta: { isFixable: true, ruleId: "no-console" },
        violations: {},
      });
    });

    it("includes rules not in exclude.rules", () => {
      const info = createRuleViolationInfo("prefer-const", true, {
        "file1.ts": { count: 2 },
      });
      const config = createConfig({
        exclude: { files: [], rules: ["no-console"] },
      });

      const result = includeExcludeFilter(info, config);

      expect(result).toEqual({
        meta: { isFixable: true, ruleId: "prefer-const" },
        violations: {
          "file1.ts": { count: 2 },
        },
      });
    });

    it("includes only rules in include.rules when specified", () => {
      const info = createRuleViolationInfo("no-console", true, {
        "file1.ts": { count: 3 },
      });
      const config = createConfig({
        include: { files: [], rules: ["no-console"] },
      });

      const result = includeExcludeFilter(info, config);

      expect(result).toEqual({
        meta: { isFixable: true, ruleId: "no-console" },
        violations: {
          "file1.ts": { count: 3 },
        },
      });
    });

    it("excludes rules not in include.rules when specified", () => {
      const info = createRuleViolationInfo("prefer-const", true, {
        "file1.ts": { count: 2 },
      });
      const config = createConfig({
        include: { files: [], rules: ["no-console"] },
      });

      const result = includeExcludeFilter(info, config);

      expect(result).toEqual({
        meta: { isFixable: true, ruleId: "prefer-const" },
        violations: {},
      });
    });

    it("allows all rules when include.rules is empty", () => {
      const info = createRuleViolationInfo("prefer-const", true, {
        "file1.ts": { count: 2 },
      });
      const config = createConfig({
        include: { files: [], rules: [] },
      });

      const result = includeExcludeFilter(info, config);

      expect(result).toEqual({
        meta: { isFixable: true, ruleId: "prefer-const" },
        violations: {
          "file1.ts": { count: 2 },
        },
      });
    });
  });

  describe("file filtering", () => {
    it("excludes files matching exclude.files patterns", () => {
      const info = createRuleViolationInfo("no-console", true, {
        "app/file3.tsx": { count: 1 },
        "dist/file2.js": { count: 2 },
        "src/file1.ts": { count: 3 },
      });
      const config = createConfig({
        exclude: { files: ["dist/**"], rules: [] },
      });

      const result = includeExcludeFilter(info, config);

      expect(result).toEqual({
        meta: { isFixable: true, ruleId: "no-console" },
        violations: {
          "app/file3.tsx": { count: 1 },
          "src/file1.ts": { count: 3 },
        },
      });
    });

    it("includes only files matching include.files patterns", () => {
      const info = createRuleViolationInfo("no-console", true, {
        "app/file3.tsx": { count: 1 },
        "dist/file2.js": { count: 2 },
        "src/file1.ts": { count: 3 },
      });
      const config = createConfig({
        include: { files: ["src/**"], rules: [] },
      });

      const result = includeExcludeFilter(info, config);

      expect(result).toEqual({
        meta: { isFixable: true, ruleId: "no-console" },
        violations: {
          "src/file1.ts": { count: 3 },
        },
      });
    });

    it("applies both exclude and include file filters", () => {
      const info = createRuleViolationInfo("no-console", true, {
        "dist/file2.js": { count: 1 },
        "src/file1.test.ts": { count: 2 },
        "src/file1.ts": { count: 3 },
      });
      const config = createConfig({
        exclude: { files: ["**/*.test.ts"], rules: [] },
        include: { files: ["src/**"], rules: [] },
      });

      const result = includeExcludeFilter(info, config);

      expect(result).toEqual({
        meta: { isFixable: true, ruleId: "no-console" },
        violations: {
          "src/file1.ts": { count: 3 },
        },
      });
    });

    it("returns empty violations when all files are filtered out", () => {
      const info = createRuleViolationInfo("no-console", true, {
        "dist/file1.js": { count: 1 },
        "dist/file2.js": { count: 2 },
      });
      const config = createConfig({
        exclude: { files: ["dist/**"], rules: [] },
      });

      const result = includeExcludeFilter(info, config);

      expect(result).toEqual({
        meta: { isFixable: true, ruleId: "no-console" },
        violations: {},
      });
    });

    it("handles empty violations input", () => {
      const info = createRuleViolationInfo("no-console", true, {});
      const config = createConfig();

      const result = includeExcludeFilter(info, config);

      expect(result).toEqual({
        meta: { isFixable: true, ruleId: "no-console" },
        violations: {},
      });
    });
  });

  describe("combined filtering", () => {
    it("applies both rule and file filters", () => {
      const info = createRuleViolationInfo("no-console", false, {
        "dist/file2.js": { count: 2 },
        "src/file1.ts": { count: 3 },
      });
      const config = createConfig({
        autoFixableOnly: true,
        exclude: { files: ["dist/**"], rules: [] },
      });

      const result = includeExcludeFilter(info, config);

      expect(result).toEqual({
        meta: { isFixable: false, ruleId: "no-console" },
        violations: {},
      });
    });

    it("applies rule include filter with file exclude filter", () => {
      const info = createRuleViolationInfo("no-console", true, {
        "dist/file1.js": { count: 1 },
        "src/file1.ts": { count: 2 },
        "src/file2.ts": { count: 3 },
      });
      const config = createConfig({
        exclude: { files: ["dist/**"], rules: [] },
        include: { files: [], rules: ["no-console"] },
      });

      const result = includeExcludeFilter(info, config);

      expect(result).toEqual({
        meta: { isFixable: true, ruleId: "no-console" },
        violations: {
          "src/file1.ts": { count: 2 },
          "src/file2.ts": { count: 3 },
        },
      });
    });

    it("returns empty when rule is excluded even if files match", () => {
      const info = createRuleViolationInfo("no-console", true, {
        "src/file1.ts": { count: 1 },
        "src/file2.ts": { count: 2 },
      });
      const config = createConfig({
        exclude: { files: [], rules: ["no-console"] },
        include: { files: ["src/**"], rules: [] },
      });

      const result = includeExcludeFilter(info, config);

      expect(result).toEqual({
        meta: { isFixable: true, ruleId: "no-console" },
        violations: {},
      });
    });
  });
});
