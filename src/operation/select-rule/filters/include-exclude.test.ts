import { describe, expect, it } from "vitest";

import { configWithDefault } from "../../../config/config";
import { IncludeExcludeFilter } from "./include-exclude";

// ============================================================================
// Tests
// ============================================================================

describe("IncludeExcludeFilter", () => {
  describe("autoFixableOnly filtering", () => {
    it("excludes non-fixable rules when autoFixableOnly is true", () => {
      const info = {
        meta: { isFixable: false, ruleId: "no-console" },
        violations: {
          "file1.ts": { count: 3 },
        },
      };
      const config = configWithDefault({
        correct: { autoFixableOnly: true },
      });

      const filter = new IncludeExcludeFilter({ config });
      const result = filter.run(info);

      expect(result).toEqual({
        meta: { isFixable: false, ruleId: "no-console" },
        violations: {},
      });
    });

    it("includes fixable rules when autoFixableOnly is true", () => {
      const info = {
        meta: { isFixable: true, ruleId: "prefer-const" },
        violations: {
          "file1.ts": { count: 2 },
        },
      };
      const config = configWithDefault({
        correct: { autoFixableOnly: true },
      });

      const filter = new IncludeExcludeFilter({ config });
      const result = filter.run(info);

      expect(result).toEqual({
        meta: { isFixable: true, ruleId: "prefer-const" },
        violations: {
          "file1.ts": { count: 2 },
        },
      });
    });

    it("includes all rules when autoFixableOnly is false", () => {
      const info = {
        meta: { isFixable: false, ruleId: "no-console" },
        violations: {
          "file1.ts": { count: 3 },
        },
      };
      const config = configWithDefault({
        correct: { autoFixableOnly: false },
      });

      const filter = new IncludeExcludeFilter({ config });
      const result = filter.run(info);

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
      const info = {
        meta: { isFixable: true, ruleId: "no-console" },
        violations: {
          "file1.ts": { count: 3 },
        },
      };
      const config = configWithDefault({
        correct: {
          exclude: { files: [], rules: ["no-console"] },
        },
      });

      const filter = new IncludeExcludeFilter({ config });
      const result = filter.run(info);

      expect(result).toEqual({
        meta: { isFixable: true, ruleId: "no-console" },
        violations: {},
      });
    });

    it("includes rules not in exclude.rules", () => {
      const info = {
        meta: { isFixable: true, ruleId: "prefer-const" },
        violations: {
          "file1.ts": { count: 2 },
        },
      };
      const config = configWithDefault({
        correct: {
          exclude: { files: [], rules: ["no-console"] },
        },
      });

      const filter = new IncludeExcludeFilter({ config });
      const result = filter.run(info);

      expect(result).toEqual({
        meta: { isFixable: true, ruleId: "prefer-const" },
        violations: {
          "file1.ts": { count: 2 },
        },
      });
    });

    it("includes only rules in include.rules when specified", () => {
      const info = {
        meta: { isFixable: true, ruleId: "no-console" },
        violations: {
          "file1.ts": { count: 3 },
        },
      };
      const config = configWithDefault({
        correct: {
          include: { files: [], rules: ["no-console"] },
        },
      });

      const filter = new IncludeExcludeFilter({ config });
      const result = filter.run(info);

      expect(result).toEqual({
        meta: { isFixable: true, ruleId: "no-console" },
        violations: {
          "file1.ts": { count: 3 },
        },
      });
    });

    it("excludes rules not in include.rules when specified", () => {
      const info = {
        meta: { isFixable: true, ruleId: "prefer-const" },
        violations: {
          "file1.ts": { count: 2 },
        },
      };
      const config = configWithDefault({
        correct: {
          include: { files: [], rules: ["no-console"] },
        },
      });

      const filter = new IncludeExcludeFilter({ config });
      const result = filter.run(info);

      expect(result).toEqual({
        meta: { isFixable: true, ruleId: "prefer-const" },
        violations: {},
      });
    });

    it("allows all rules when include.rules is empty", () => {
      const info = {
        meta: { isFixable: true, ruleId: "prefer-const" },
        violations: {
          "file1.ts": { count: 2 },
        },
      };
      const config = configWithDefault({
        correct: {
          include: { files: [], rules: [] },
        },
      });

      const filter = new IncludeExcludeFilter({ config });
      const result = filter.run(info);

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
      const info = {
        meta: { isFixable: true, ruleId: "no-console" },
        violations: {
          "app/file3.tsx": { count: 1 },
          "dist/file2.js": { count: 2 },
          "src/file1.ts": { count: 3 },
        },
      };
      const config = configWithDefault({
        correct: {
          exclude: { files: ["dist/**"], rules: [] },
        },
      });

      const filter = new IncludeExcludeFilter({ config });
      const result = filter.run(info);

      expect(result).toEqual({
        meta: { isFixable: true, ruleId: "no-console" },
        violations: {
          "app/file3.tsx": { count: 1 },
          "src/file1.ts": { count: 3 },
        },
      });
    });

    it("includes only files matching include.files patterns", () => {
      const info = {
        meta: { isFixable: true, ruleId: "no-console" },
        violations: {
          "app/file3.tsx": { count: 1 },
          "dist/file2.js": { count: 2 },
          "src/file1.ts": { count: 3 },
        },
      };
      const config = configWithDefault({
        correct: {
          include: { files: ["src/**"], rules: [] },
        },
      });

      const filter = new IncludeExcludeFilter({ config });
      const result = filter.run(info);

      expect(result).toEqual({
        meta: { isFixable: true, ruleId: "no-console" },
        violations: {
          "src/file1.ts": { count: 3 },
        },
      });
    });

    it("applies both exclude and include file filters", () => {
      const info = {
        meta: { isFixable: true, ruleId: "no-console" },
        violations: {
          "dist/file2.js": { count: 1 },
          "src/file1.test.ts": { count: 2 },
          "src/file1.ts": { count: 3 },
        },
      };
      const config = configWithDefault({
        correct: {
          exclude: { files: ["**/*.test.ts"], rules: [] },
          include: { files: ["src/**"], rules: [] },
        },
      });

      const filter = new IncludeExcludeFilter({ config });
      const result = filter.run(info);

      expect(result).toEqual({
        meta: { isFixable: true, ruleId: "no-console" },
        violations: {
          "src/file1.ts": { count: 3 },
        },
      });
    });

    it("returns empty violations when all files are filtered out", () => {
      const info = {
        meta: { isFixable: true, ruleId: "no-console" },
        violations: {
          "dist/file1.js": { count: 1 },
          "dist/file2.js": { count: 2 },
        },
      };
      const config = configWithDefault({
        correct: {
          exclude: { files: ["dist/**"], rules: [] },
        },
      });

      const filter = new IncludeExcludeFilter({ config });
      const result = filter.run(info);

      expect(result).toEqual({
        meta: { isFixable: true, ruleId: "no-console" },
        violations: {},
      });
    });

    it("handles empty violations input", () => {
      const info = {
        meta: { isFixable: true, ruleId: "no-console" },
        violations: {},
      };
      const config = configWithDefault();

      const filter = new IncludeExcludeFilter({ config });
      const result = filter.run(info);

      expect(result).toEqual({
        meta: { isFixable: true, ruleId: "no-console" },
        violations: {},
      });
    });
  });

  describe("combined filtering", () => {
    it("applies both rule and file filters", () => {
      const info = {
        meta: { isFixable: false, ruleId: "no-console" },
        violations: {
          "dist/file2.js": { count: 2 },
          "src/file1.ts": { count: 3 },
        },
      };
      const config = configWithDefault({
        correct: {
          autoFixableOnly: true,
          exclude: { files: ["dist/**"], rules: [] },
        },
      });

      const filter = new IncludeExcludeFilter({ config });
      const result = filter.run(info);

      expect(result).toEqual({
        meta: { isFixable: false, ruleId: "no-console" },
        violations: {},
      });
    });

    it("applies rule include filter with file exclude filter", () => {
      const info = {
        meta: { isFixable: true, ruleId: "no-console" },
        violations: {
          "dist/file1.js": { count: 1 },
          "src/file1.ts": { count: 2 },
          "src/file2.ts": { count: 3 },
        },
      };
      const config = configWithDefault({
        correct: {
          exclude: { files: ["dist/**"], rules: [] },
          include: { files: [], rules: ["no-console"] },
        },
      });

      const filter = new IncludeExcludeFilter({ config });
      const result = filter.run(info);

      expect(result).toEqual({
        meta: { isFixable: true, ruleId: "no-console" },
        violations: {
          "src/file1.ts": { count: 2 },
          "src/file2.ts": { count: 3 },
        },
      });
    });

    it("returns empty when rule is excluded even if files match", () => {
      const info = {
        meta: { isFixable: true, ruleId: "no-console" },
        violations: {
          "src/file1.ts": { count: 1 },
          "src/file2.ts": { count: 2 },
        },
      };
      const config = configWithDefault({
        correct: {
          exclude: { files: [], rules: ["no-console"] },
          include: { files: ["src/**"], rules: [] },
        },
      });

      const filter = new IncludeExcludeFilter({ config });
      const result = filter.run(info);

      expect(result).toEqual({
        meta: { isFixable: true, ruleId: "no-console" },
        violations: {},
      });
    });
  });
});
