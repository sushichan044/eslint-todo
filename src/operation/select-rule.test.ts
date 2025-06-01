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

const createConfigBuilder =
  (global?: CorrectModeUserConfig) =>
  (correct?: CorrectModeUserConfig): CorrectModeConfig => {
    return configWithDefault({
      correct: {
        ...correct,
        ...global,
      },
    }).correct;
  };

const createESLintConfigSubset = (
  input: Partial<ESLintConfigSubset> = {},
): ESLintConfigSubset => {
  return {
    rules: {
      ...input.rules,
    },
  };
};

describe("selectRuleBasedOnLimit", () => {
  const todoModule = createTodoModuleV2({});
  const suppressions = SuppressionsJsonGenerator.fromV2(todoModule);
  const createCorrectConfig = createConfigBuilder();

  it("should call selectRuleBasedOnFilesLimit when limit type is file", () => {
    const config = createCorrectConfig({ limit: { count: 10, type: "file" } });

    const subject = selectRuleBasedOnLimit(
      suppressions,
      createESLintConfigSubset(),
      config,
    );
    const expected = selectRuleBasedOnFilesLimit(
      suppressions,
      createESLintConfigSubset(),
      config,
    );

    expect(subject).toStrictEqual(expected);
  });

  it("should call selectRuleBasedOnViolationsLimit when limit type is violation", () => {
    const config = createCorrectConfig({
      limit: { count: 10, type: "violation" },
    });

    const subject = selectRuleBasedOnLimit(
      suppressions,
      createESLintConfigSubset(),
      config,
    );
    const expected = selectRuleBasedOnViolationsLimit(
      suppressions,
      createESLintConfigSubset(),
      config,
    );

    expect(subject).toStrictEqual(expected);
  });

  it("should throw an error for unknown limit type", () => {
    const config = createCorrectConfig({
      // @ts-expect-error 意図的に型に合わない引数を渡してエラーを発生させる
      limit: { count: 10, type: "unknown" },
    });
    expect(() =>
      selectRuleBasedOnLimit(suppressions, createESLintConfigSubset(), config),
    ).toThrowError("Got unknown limit");
  });
});

describe("selectRuleBasedOnFilesLimit", () => {
  describe("when only autoFixable violations are allowed", () => {
    describe("full selection behavior", () => {
      const createCorrectConfig = createConfigBuilder();

      it("should return the rule with the most violated files lte the limit", () => {
        const todoModule = createTodoModuleV2({
          rule1: {
            autoFix: true,
            violations: {
              "file1.js": 1000,
              "file2.js": 1000,
              "file3.js": 1000,
            },
          },
          rule2: {
            autoFix: true,
            violations: {
              "file1.js": 1,
              "file2.js": 1,
              "file3.js": 1,
              "file4.js": 1,
            },
          },
        });
        const suppressions = SuppressionsJsonGenerator.fromV2(todoModule);
        const eslintConfig = createESLintConfigSubset({
          rules: {
            rule1: { fixable: true },
            rule2: { fixable: true },
          },
        });
        const config = createCorrectConfig({
          limit: {
            count: 4,
            type: "file",
          },
        });
        const expected: SelectionResult = {
          selection: { ruleId: "rule2", type: "full" },
          success: true,
        };

        const result = selectRuleBasedOnFilesLimit(
          suppressions,
          eslintConfig,
          config,
        );
        expect(result).toStrictEqual(expected);
      });

      it("should return the first rule when multiple rules meet the same limit", () => {
        const todoModule: TodoModuleV2 = createTodoModuleV2({
          rule1: {
            autoFix: true,
            violations: {
              "file1.js": 1000,
              "file2.js": 1000,
              "file3.js": 1000,
              "file4.js": 1000,
            },
          },
          rule2: {
            autoFix: true,
            violations: {
              "file1.js": 1,
              "file2.js": 1,
              "file3.js": 1,
              "file4.js": 1,
            },
          },
        });
        const suppressions = SuppressionsJsonGenerator.fromV2(todoModule);
        const eslintConfig = createESLintConfigSubset({
          rules: {
            rule1: { fixable: true },
            rule2: { fixable: true },
          },
        });
        const config = createCorrectConfig({
          limit: { count: 4, type: "file" },
        });
        const expected: SelectionResult = {
          selection: { ruleId: "rule1", type: "full" },
          success: true,
        };

        const result = selectRuleBasedOnFilesLimit(
          suppressions,
          eslintConfig,
          config,
        );
        expect(result).toStrictEqual(expected);
      });

      it("should return success: false if no rule meets the limit", () => {
        const todoModule = createTodoModuleV2({
          rule1: {
            autoFix: true,
            violations: {
              "file1.js": 1,
              "file2.js": 1,
              "file3.js": 1,
            },
          },
        });
        const suppressions = SuppressionsJsonGenerator.fromV2(todoModule);
        const eslintConfig = createESLintConfigSubset({
          rules: {
            rule1: { fixable: true },
          },
        });
        const config = createCorrectConfig({
          limit: { count: 2, type: "file" },
        });
        const expected: SelectionResult = { success: false };

        const result = selectRuleBasedOnFilesLimit(
          suppressions,
          eslintConfig,
          config,
        );
        expect(result).toStrictEqual(expected);
      });

      it("should return success: false if no rule is auto-fixable", () => {
        const todoModule = createTodoModuleV2({
          rule1: {
            autoFix: false,
            violations: {
              "file1.js": 1000,
            },
          },
        });
        const suppressions = SuppressionsJsonGenerator.fromV2(todoModule);
        const eslintConfig = createESLintConfigSubset({
          rules: {
            rule1: { fixable: false },
          },
        });
        const config = createCorrectConfig({
          limit: { count: 1, type: "file" },
        });
        const expected: SelectionResult = { success: false };

        const result = selectRuleBasedOnFilesLimit(
          suppressions,
          eslintConfig,
          config,
        );
        expect(result).toStrictEqual(expected);
      });

      it("should return success: false if todo is empty", () => {
        const todoModule = createTodoModuleV2({});
        const suppressions = SuppressionsJsonGenerator.fromV2(todoModule);
        const config = createCorrectConfig({
          limit: { count: 1, type: "file" },
        });
        const expected: SelectionResult = { success: false };

        const result = selectRuleBasedOnFilesLimit(
          suppressions,
          createESLintConfigSubset(),
          config,
        );
        expect(result).toStrictEqual(expected);
      });
    });

    describe("partial selection behavior", () => {
      const createCorrectConfig = createConfigBuilder({
        partialSelection: true,
      });

      it("should return full selection unless all rules exceeds the limit", () => {
        const todoModule = createTodoModuleV2({
          rule1: {
            autoFix: true,
            violations: {
              "file1.js": 3,
              "file2.js": 1,
              "file3.js": 2,
              "file4.js": 3,
              "file5.js": 1,
              "file6.js": 2,
            },
          },
          rule2: {
            autoFix: true,
            violations: {
              "file1.js": 1,
              "file2.js": 2,
              "file3.js": 3,
            },
          },
        });
        const suppressions = SuppressionsJsonGenerator.fromV2(todoModule);
        const eslintConfig = createESLintConfigSubset({
          rules: {
            rule1: { fixable: true },
            rule2: { fixable: true },
          },
        });
        const config = createCorrectConfig({
          limit: { count: 3, type: "file" },
        });
        const expected: SelectionResult = {
          selection: {
            ruleId: "rule2",
            type: "full",
          },
          success: true,
        };

        const result = selectRuleBasedOnFilesLimit(
          suppressions,
          eslintConfig,
          config,
        );
        expect(result).toStrictEqual(expected);
      });

      it("should return partial of the first rule with the most violated files gt the limit", () => {
        const todoModule = createTodoModuleV2({
          rule1: {
            autoFix: true,
            violations: {
              "file1.js": 3,
              "file2.js": 3,
              "file3.js": 4,
            },
          },
          rule2: {
            autoFix: true,
            violations: {
              "file4.js": 1,
              "file5.js": 1,
              "file6.js": 1,
            },
          },
        });
        const suppressions = SuppressionsJsonGenerator.fromV2(todoModule);
        const eslintConfig = createESLintConfigSubset({
          rules: {
            rule1: { fixable: true },
            rule2: { fixable: true },
          },
        });
        const config = createCorrectConfig({
          limit: { count: 2, type: "file" },
        });
        const expected: SelectionResult = {
          selection: {
            ruleId: "rule1",
            type: "partial",
            violations: {
              "file1.js": 3,
              "file2.js": 3,
            },
          },
          success: true,
        };

        const result = selectRuleBasedOnFilesLimit(
          suppressions,
          eslintConfig,
          config,
        );
        expect(result).toStrictEqual(expected);
      });

      it("should return success: false if todo is empty", () => {
        const todoModule = createTodoModuleV2({});
        const suppressions = SuppressionsJsonGenerator.fromV2(todoModule);
        const config = createCorrectConfig({
          limit: { count: 1, type: "file" },
        });
        const expected: SelectionResult = { success: false };

        const result = selectRuleBasedOnFilesLimit(
          suppressions,
          createESLintConfigSubset(),
          config,
        );
        expect(result).toStrictEqual(expected);
      });
    });
  });

  describe("when non-autoFixable violations are allowed", () => {
    describe("full selection behavior", () => {
      const createCorrectConfig = createConfigBuilder({
        autoFixableOnly: false,
      });

      it("should return the rule with the most violated files lte the limit", () => {
        const todoModule = createTodoModuleV2({
          rule1: {
            autoFix: true,
            violations: {
              "file1.js": 1000,
              "file2.js": 1000,
              "file3.js": 1000,
            },
          },
          rule2: {
            autoFix: false,
            violations: {
              "file1.js": 1,
              "file2.js": 1,
              "file3.js": 1,
              "file4.js": 1,
            },
          },
        });
        const suppressions = SuppressionsJsonGenerator.fromV2(todoModule);
        const eslintConfig = createESLintConfigSubset({
          rules: {
            rule1: { fixable: true },
            rule2: { fixable: false },
          },
        });
        const config = createCorrectConfig({
          limit: { count: 4, type: "file" },
        });
        const expected: SelectionResult = {
          selection: { ruleId: "rule2", type: "full" },
          success: true,
        };

        const result = selectRuleBasedOnFilesLimit(
          suppressions,
          eslintConfig,
          config,
        );
        expect(result).toStrictEqual(expected);
      });

      it("should return the first rule when multiple rules meet the same limit", () => {
        const todoModule = createTodoModuleV2({
          rule1: {
            autoFix: false,
            violations: {
              "file1.js": 1000,
              "file2.js": 1000,
              "file3.js": 1000,
              "file4.js": 1000,
            },
          },
          rule2: {
            autoFix: true,
            violations: {
              "file1.js": 1,
              "file2.js": 1,
              "file3.js": 1,
              "file4.js": 1,
            },
          },
        });
        const suppressions = SuppressionsJsonGenerator.fromV2(todoModule);
        const eslintConfig = createESLintConfigSubset({
          rules: {
            rule1: { fixable: false },
            rule2: { fixable: true },
          },
        });
        const config = createCorrectConfig({
          limit: { count: 4, type: "file" },
        });
        const expected: SelectionResult = {
          selection: { ruleId: "rule1", type: "full" },
          success: true,
        };

        const result = selectRuleBasedOnFilesLimit(
          suppressions,
          eslintConfig,
          config,
        );
        expect(result).toStrictEqual(expected);
      });

      it("should return success: false if no rule meets the criteria", () => {
        const todoModule = createTodoModuleV2({
          rule1: {
            autoFix: false,
            violations: {
              "file1.js": 1,
              "file2.js": 1,
              "file3.js": 1,
            },
          },
        });
        const suppressions = SuppressionsJsonGenerator.fromV2(todoModule);
        const eslintConfig = createESLintConfigSubset({
          rules: {
            rule1: { fixable: false },
          },
        });
        const config = createCorrectConfig({
          limit: { count: 2, type: "file" },
        });
        const expected: SelectionResult = { success: false };

        const result = selectRuleBasedOnFilesLimit(
          suppressions,
          eslintConfig,
          config,
        );
        expect(result).toStrictEqual(expected);
      });

      it("should return success: false if todo is empty", () => {
        const todoModule = createTodoModuleV2({});
        const suppressions = SuppressionsJsonGenerator.fromV2(todoModule);
        const config = createCorrectConfig({
          limit: { count: 1, type: "file" },
        });
        const expected: SelectionResult = { success: false };

        const result = selectRuleBasedOnFilesLimit(
          suppressions,
          createESLintConfigSubset(),
          config,
        );
        expect(result).toStrictEqual(expected);
      });
    });

    describe("partial selection behavior", () => {
      const createCorrectConfig = createConfigBuilder({
        autoFixableOnly: false,
        partialSelection: true,
      });

      it("should return full selection unless all rules exceeds the limit", () => {
        const todoModule = createTodoModuleV2({
          rule1: {
            autoFix: false,
            violations: {
              "file1.js": 3,
              "file2.js": 1,
              "file3.js": 2,
              "file4.js": 3,
              "file5.js": 1,
              "file6.js": 2,
            },
          },
          rule2: {
            autoFix: false,
            violations: {
              "file1.js": 1,
              "file2.js": 2,
              "file3.js": 3,
            },
          },
        });
        const suppressions = SuppressionsJsonGenerator.fromV2(todoModule);
        const eslintConfig = createESLintConfigSubset({
          rules: {
            rule1: { fixable: false },
            rule2: { fixable: false },
          },
        });
        const config = createCorrectConfig({
          autoFixableOnly: false,
          limit: { count: 3, type: "file" },
          partialSelection: true,
        });
        const expected: SelectionResult = {
          selection: {
            ruleId: "rule2",
            type: "full",
          },
          success: true,
        };

        const result = selectRuleBasedOnFilesLimit(
          suppressions,
          eslintConfig,
          config,
        );
        expect(result).toStrictEqual(expected);
      });

      it("should return partial of the first rule with the most violated files gt the limit", () => {
        const todoModule = createTodoModuleV2({
          rule1: {
            autoFix: false,
            violations: {
              "file1.js": 3,
              "file2.js": 3,
              "file3.js": 4,
            },
          },
          rule2: {
            autoFix: false,
            violations: {
              "file4.js": 1,
              "file5.js": 1,
              "file6.js": 1,
            },
          },
        });
        const suppressions = SuppressionsJsonGenerator.fromV2(todoModule);
        const eslintConfig = createESLintConfigSubset({
          rules: {
            rule1: { fixable: false },
            rule2: { fixable: false },
          },
        });
        const config = createCorrectConfig({
          autoFixableOnly: false,
          limit: { count: 2, type: "file" },
          partialSelection: true,
        });
        const expected: SelectionResult = {
          selection: {
            ruleId: "rule1",
            type: "partial",
            violations: {
              "file1.js": 3,
              "file2.js": 3,
            },
          },
          success: true,
        };

        const result = selectRuleBasedOnFilesLimit(
          suppressions,
          eslintConfig,
          config,
        );
        expect(result).toStrictEqual(expected);
      });

      it("should return success: false if todo is empty", () => {
        const todoModule = createTodoModuleV2({});
        const suppressions = SuppressionsJsonGenerator.fromV2(todoModule);
        const config = createCorrectConfig({
          autoFixableOnly: false,
          limit: { count: 1, type: "file" },
          partialSelection: true,
        });
        const expected: SelectionResult = { success: false };

        const result = selectRuleBasedOnFilesLimit(
          suppressions,
          createESLintConfigSubset(),
          config,
        );
        expect(result).toStrictEqual(expected);
      });
    });
  });

  describe("when exclude.rules is provided", () => {
    const createCorrectConfig = createConfigBuilder();

    it("should respect exclude.rules option", () => {
      const todoModule = createTodoModuleV2({
        "no-console": {
          autoFix: true,
          violations: {
            "app/file3.tsx": 2,
            "lib/file4.js": 1,
            "src/file1.ts": 3,
            "src/file2.ts": 2,
          },
        },
        "no-unused-vars": {
          autoFix: true,
          violations: {
            "app/file3.tsx": 1,
            "src/file1.ts": 1,
          },
        },
      });
      const suppressions = SuppressionsJsonGenerator.fromV2(todoModule);
      const eslintConfig = createESLintConfigSubset({
        rules: {
          "no-console": { fixable: true },
          "no-unused-vars": { fixable: true },
        },
      });
      const config = createCorrectConfig({
        include: { files: ["src/**/*.ts"] },
        limit: { count: 10, type: "file" },
      });
      const expected: SelectionResult = {
        selection: { ruleId: "no-console", type: "full" },
        success: true,
      };

      const result = selectRuleBasedOnFilesLimit(
        suppressions,
        eslintConfig,
        config,
      );
      expect(result).toStrictEqual(expected);
    });

    it("should respect include.rules option", () => {
      const todoModule = createTodoModuleV2({
        "no-console": {
          autoFix: true,
          violations: {
            "file1.ts": 5,
            "file2.ts": 3,
          },
        },
        "no-unused-vars": {
          autoFix: true,
          violations: {
            "file1.ts": 2,
            "file2.ts": 1,
          },
        },
      });
      const suppressions = SuppressionsJsonGenerator.fromV2(todoModule);
      const eslintConfig = createESLintConfigSubset({
        rules: {
          "no-console": { fixable: true },
          "no-unused-vars": { fixable: true },
        },
      });
      const config = createCorrectConfig({
        include: { rules: ["no-unused-vars"] },
        limit: { count: 10, type: "file" },
      });
      const expected: SelectionResult = {
        selection: { ruleId: "no-unused-vars", type: "full" },
        success: true,
      };

      const result = selectRuleBasedOnFilesLimit(
        suppressions,
        eslintConfig,
        config,
      );
      expect(result).toStrictEqual(expected);
    });

    it("should respect both include.files and include.rules", () => {
      const todoModule = createTodoModuleV2({
        "no-console": {
          autoFix: true,
          violations: {
            "app/file3.tsx": 2,
            "src/file1.ts": 3,
            "src/file2.ts": 2,
          },
        },
        "no-unused-vars": {
          autoFix: true,
          violations: {
            "app/file3.tsx": 1,
            "src/file1.ts": 1,
          },
        },
      });
      const suppressions = SuppressionsJsonGenerator.fromV2(todoModule);
      const eslintConfig = createESLintConfigSubset({
        rules: {
          "no-console": { fixable: true },
          "no-unused-vars": { fixable: true },
        },
      });
      const config = createCorrectConfig({
        include: {
          files: ["src/**/*.ts"],
          rules: ["no-unused-vars"],
        },
        limit: { count: 10, type: "file" },
      });
      const expected: SelectionResult = {
        selection: { ruleId: "no-unused-vars", type: "full" },
        success: true,
      };

      const result = selectRuleBasedOnFilesLimit(
        suppressions,
        eslintConfig,
        config,
      );
      expect(result).toStrictEqual(expected);
    });

    it("should return success: false if no files match include.files", () => {
      const todoModule = createTodoModuleV2({
        "no-console": {
          autoFix: true,
          violations: {
            "app/file1.tsx": 2,
            "lib/file2.js": 3,
          },
        },
      });
      const suppressions = SuppressionsJsonGenerator.fromV2(todoModule);
      const eslintConfig = createESLintConfigSubset({
        rules: {
          "no-console": { fixable: true },
        },
      });
      const config = createCorrectConfig({
        include: { files: ["src/**/*.ts"] },
        limit: { count: 10, type: "file" },
      });
      const expected: SelectionResult = { success: false };

      const result = selectRuleBasedOnFilesLimit(
        suppressions,
        eslintConfig,
        config,
      );
      expect(result).toStrictEqual(expected);
    });

    it("should return success: false if no rules match include.rules", () => {
      const todoModule = createTodoModuleV2({
        "no-console": {
          autoFix: true,
          violations: {
            "file1.ts": 2,
            "file2.ts": 3,
          },
        },
      });
      const suppressions = SuppressionsJsonGenerator.fromV2(todoModule);
      const eslintConfig = createESLintConfigSubset({
        rules: {
          "no-console": { fixable: true },
        },
      });
      const config = createCorrectConfig({
        include: { rules: ["no-unused-vars"] },
        limit: { count: 10, type: "file" },
      });
      const expected: SelectionResult = { success: false };

      const result = selectRuleBasedOnFilesLimit(
        suppressions,
        eslintConfig,
        config,
      );
      expect(result).toStrictEqual(expected);
    });

    it("should work with partial selection when include.files is specified", () => {
      const todoModule = createTodoModuleV2({
        "no-console": {
          autoFix: true,
          violations: {
            "app/file4.tsx": 2,
            "src/file1.ts": 3,
            "src/file2.ts": 2,
            "src/file3.ts": 1,
            "src/file4.ts": 1,
            "src/file5.ts": 1,
            "src/file6.ts": 1,
          },
        },
      });
      const suppressions = SuppressionsJsonGenerator.fromV2(todoModule);
      const eslintConfig = createESLintConfigSubset({
        rules: {
          "no-console": { fixable: true },
        },
      });
      const config = createCorrectConfig({
        include: { files: ["src/**/*.ts"] },
        limit: { count: 3, type: "file" },
        partialSelection: true,
      });
      const expected: SelectionResult = {
        selection: {
          ruleId: "no-console",
          type: "partial",
          violations: {
            "src/file1.ts": 3,
            "src/file2.ts": 2,
            "src/file3.ts": 1,
          },
        },
        success: true,
      };

      const result = selectRuleBasedOnFilesLimit(
        suppressions,
        eslintConfig,
        config,
      );
      expect(result).toStrictEqual(expected);
    });
  });

  describe("when invalid input is provided", () => {
    const createCorrectConfig = createConfigBuilder();

    it("should throw an error if limit count is lte 0", () => {
      const todoModule = createTodoModuleV2({});
      const suppressions = SuppressionsJsonGenerator.fromV2(todoModule);
      const config = createCorrectConfig({ limit: { count: 0, type: "file" } });

      expect(() =>
        selectRuleBasedOnFilesLimit(
          suppressions,
          createESLintConfigSubset(),
          config,
        ),
      ).toThrowError("The file limit must be greater than 0");
    });
  });
});

describe("selectRuleBasedOnViolationsLimit", () => {
  describe("when only autoFixable violations are allowed", () => {
    describe("full selection behavior", () => {
      const createCorrectConfig = createConfigBuilder();

      it("should return the rule with the most violations lte the limit", () => {
        const todoModule = createTodoModuleV2({
          rule1: {
            autoFix: true,
            violations: {
              "file1.js": 4,
            },
          },
          rule2: {
            autoFix: true,
            violations: {
              "file1.js": 1,
              "file2.js": 1,
              "file3.js": 1,
              "file4.js": 1,
              "file5.js": 1,
            },
          },
        });
        const suppressions = SuppressionsJsonGenerator.fromV2(todoModule);
        const eslintConfig = createESLintConfigSubset({
          rules: {
            rule1: { fixable: true },
            rule2: { fixable: true },
          },
        });
        const config = createCorrectConfig({
          limit: { count: 5, type: "violation" },
        });
        const expected: SelectionResult = {
          selection: { ruleId: "rule2", type: "full" },
          success: true,
        };

        const result = selectRuleBasedOnViolationsLimit(
          suppressions,
          eslintConfig,
          config,
        );
        expect(result).toStrictEqual(expected);
      });

      it("should return the first rule when multiple rules meet the same limit", () => {
        const todoModule = createTodoModuleV2({
          rule1: {
            autoFix: true,
            violations: {
              "file1.js": 4,
            },
          },
          rule2: {
            autoFix: true,
            violations: {
              "file1.js": 1,
              "file2.js": 2,
              "file3.js": 1,
            },
          },
        });
        const suppressions = SuppressionsJsonGenerator.fromV2(todoModule);
        const eslintConfig = createESLintConfigSubset({
          rules: {
            rule1: { fixable: true },
            rule2: { fixable: true },
          },
        });
        const config = createCorrectConfig({
          limit: { count: 4, type: "violation" },
        });
        const expected: SelectionResult = {
          selection: { ruleId: "rule1", type: "full" },
          success: true,
        };

        const result = selectRuleBasedOnViolationsLimit(
          suppressions,
          eslintConfig,
          config,
        );
        expect(result).toStrictEqual(expected);
      });

      it("should return success: false if no rule meets the criteria", () => {
        const todoModule = createTodoModuleV2({
          rule1: {
            autoFix: true,
            violations: {
              file1: 3,
              file2: 3,
            },
          },
        });
        const suppressions = SuppressionsJsonGenerator.fromV2(todoModule);
        const eslintConfig = createESLintConfigSubset({
          rules: {
            rule1: { fixable: true },
          },
        });
        const config = createCorrectConfig({
          limit: { count: 5, type: "violation" },
        });
        const expected: SelectionResult = { success: false };

        const result = selectRuleBasedOnViolationsLimit(
          suppressions,
          eslintConfig,
          config,
        );
        expect(result).toStrictEqual(expected);
      });

      it("should return success: false if no rule is auto-fixable", () => {
        const todoModule = createTodoModuleV2({
          rule1: {
            autoFix: false,
            violations: {
              file1: 3,
            },
          },
        });
        const suppressions = SuppressionsJsonGenerator.fromV2(todoModule);
        const eslintConfig = createESLintConfigSubset({
          rules: {
            rule1: { fixable: false },
          },
        });
        const config = createCorrectConfig({
          limit: { count: 4, type: "violation" },
        });
        const expected: SelectionResult = { success: false };

        const result = selectRuleBasedOnViolationsLimit(
          suppressions,
          eslintConfig,
          config,
        );
        expect(result).toStrictEqual(expected);
      });

      it("should return success: false if todo is empty", () => {
        const todoModule = createTodoModuleV2({});
        const suppressions = SuppressionsJsonGenerator.fromV2(todoModule);
        const config = createCorrectConfig({
          limit: { count: 1, type: "violation" },
        });
        const expected: SelectionResult = { success: false };

        const result = selectRuleBasedOnViolationsLimit(
          suppressions,
          createESLintConfigSubset(),
          config,
        );
        expect(result).toStrictEqual(expected);
      });
    });

    describe("partial selection behavior", () => {
      const createCorrectConfig = createConfigBuilder({
        partialSelection: true,
      });

      it("should return full selection unless all rules exceeds the limit", () => {
        const todoModule = createTodoModuleV2({
          rule1: {
            autoFix: true,
            violations: {
              "file1.js": 3,
              "file2.js": 1,
              "file3.js": 2,
              "file4.js": 3,
              "file5.js": 1,
              "file6.js": 2,
            },
          },
          rule2: {
            autoFix: true,
            violations: {
              "file1.js": 1,
              "file2.js": 1,
              "file3.js": 1,
            },
          },
        });
        const suppressions = SuppressionsJsonGenerator.fromV2(todoModule);
        const eslintConfig = createESLintConfigSubset({
          rules: {
            rule1: { fixable: true },
            rule2: { fixable: true },
          },
        });
        const config = createCorrectConfig({
          limit: { count: 3, type: "violation" },
        });
        const expected: SelectionResult = {
          selection: {
            ruleId: "rule2",
            type: "full",
          },
          success: true,
        };

        const result = selectRuleBasedOnViolationsLimit(
          suppressions,
          eslintConfig,
          config,
        );
        expect(result).toStrictEqual(expected);
      });

      it("should return partial of the first rule with the most violations gt the limit", () => {
        const todoModule = createTodoModuleV2({
          rule1: {
            autoFix: true,
            violations: {
              "file1.js": 1,
              "file2.js": 2,
              "file3.js": 3,
            },
          },
          rule2: {
            autoFix: true,
            violations: {
              "file1.js": 3,
              "file2.js": 1,
              "file3.js": 2,
            },
          },
        });
        const suppressions = SuppressionsJsonGenerator.fromV2(todoModule);
        const eslintConfig = createESLintConfigSubset({
          rules: {
            rule1: { fixable: true },
            rule2: { fixable: true },
          },
        });
        const config = createCorrectConfig({
          limit: { count: 4, type: "violation" },
        });
        const expected: SelectionResult = {
          selection: {
            ruleId: "rule1",
            type: "partial",
            violations: {
              "file1.js": 1,
              "file2.js": 2,
            },
          },
          success: true,
        };

        const result = selectRuleBasedOnViolationsLimit(
          suppressions,
          eslintConfig,
          config,
        );
        expect(result).toStrictEqual(expected);
      });

      it("should return success: false if no available partial", () => {
        const todoModule = createTodoModuleV2({
          rule1: {
            autoFix: true,
            violations: {
              "file1.js": 3,
            },
          },
        });
        const suppressions = SuppressionsJsonGenerator.fromV2(todoModule);
        const eslintConfig = createESLintConfigSubset({
          rules: {
            rule1: { fixable: true },
          },
        });
        const config = createCorrectConfig({
          limit: { count: 2, type: "violation" },
        });
        const expected: SelectionResult = { success: false };

        const result = selectRuleBasedOnViolationsLimit(
          suppressions,
          eslintConfig,
          config,
        );
        expect(result).toStrictEqual(expected);
      });

      it("should return success: false if todo is empty", () => {
        const todoModule = createTodoModuleV2({});
        const suppressions = SuppressionsJsonGenerator.fromV2(todoModule);
        const config = createCorrectConfig({
          limit: {
            count: 1,
            type: "violation",
          },
        });
        const expected: SelectionResult = { success: false };

        const result = selectRuleBasedOnViolationsLimit(
          suppressions,
          createESLintConfigSubset(),
          config,
        );
        expect(result).toStrictEqual(expected);
      });
    });
  });

  describe("when non-autoFixable violations are allowed", () => {
    describe("full selection behavior", () => {
      const createCorrectConfig = createConfigBuilder({
        autoFixableOnly: false,
      });

      it("should return the rule with the most violations lte the limit", () => {
        const todoModule = createTodoModuleV2({
          rule1: {
            autoFix: true,
            violations: {
              "file1.js": 4,
            },
          },
          rule2: {
            autoFix: false,
            violations: {
              "file1.js": 1,
              "file2.js": 1,
              "file3.js": 1,
              "file4.js": 1,
              "file5.js": 1,
            },
          },
        });
        const suppressions = SuppressionsJsonGenerator.fromV2(todoModule);
        const eslintConfig = createESLintConfigSubset({
          rules: {
            rule1: { fixable: true },
            rule2: { fixable: false },
          },
        });
        const config = createCorrectConfig({
          limit: { count: 5, type: "violation" },
        });
        const expected: SelectionResult = {
          selection: { ruleId: "rule2", type: "full" },
          success: true,
        };

        const result = selectRuleBasedOnViolationsLimit(
          suppressions,
          eslintConfig,
          config,
        );
        expect(result).toStrictEqual(expected);
      });

      it("should return the first rule when multiple rules meet the same limit", () => {
        const todoModule = createTodoModuleV2({
          rule1: {
            autoFix: false,
            violations: {
              "file1.js": 4,
            },
          },
          rule2: {
            autoFix: true,
            violations: {
              "file1.js": 1,
              "file2.js": 2,
              "file3.js": 1,
            },
          },
        });
        const suppressions = SuppressionsJsonGenerator.fromV2(todoModule);
        const eslintConfig = createESLintConfigSubset({
          rules: {
            rule1: { fixable: false },
            rule2: { fixable: true },
          },
        });
        const config = createCorrectConfig({
          limit: { count: 4, type: "violation" },
        });
        const expected: SelectionResult = {
          selection: { ruleId: "rule1", type: "full" },
          success: true,
        };

        const result = selectRuleBasedOnViolationsLimit(
          suppressions,
          eslintConfig,
          config,
        );
        expect(result).toStrictEqual(expected);
      });

      it("should return success: false if no rule meets the criteria", () => {
        const todoModule = createTodoModuleV2({
          rule1: {
            autoFix: false,
            violations: {
              "file1.js": 5,
            },
          },
        });
        const suppressions = SuppressionsJsonGenerator.fromV2(todoModule);
        const eslintConfig = createESLintConfigSubset({
          rules: {
            rule1: { fixable: false },
          },
        });
        const config = createCorrectConfig({
          limit: { count: 4, type: "violation" },
        });
        const expected: SelectionResult = { success: false };

        const result = selectRuleBasedOnViolationsLimit(
          suppressions,
          eslintConfig,
          config,
        );
        expect(result).toStrictEqual(expected);
      });

      it("should return success: false if todo is empty", () => {
        const todoModule = createTodoModuleV2({});
        const suppressions = SuppressionsJsonGenerator.fromV2(todoModule);
        const config = createCorrectConfig({
          limit: { count: 1, type: "violation" },
        });
        const expected: SelectionResult = { success: false };

        const result = selectRuleBasedOnViolationsLimit(
          suppressions,
          createESLintConfigSubset(),
          config,
        );
        expect(result).toStrictEqual(expected);
      });
    });

    describe("partial selection behavior", () => {
      const createCorrectConfig = createConfigBuilder({
        autoFixableOnly: false,
        partialSelection: true,
      });

      it("should return full selection unless all rules exceeds the limit", () => {
        const todoModule = createTodoModuleV2({
          rule1: {
            autoFix: false,
            violations: {
              "file1.js": 3,
              "file2.js": 1,
              "file3.js": 2,
              "file4.js": 3,
              "file5.js": 1,
              "file6.js": 2,
            },
          },
          rule2: {
            autoFix: false,
            violations: {
              "file1.js": 1,
              "file2.js": 1,
              "file3.js": 1,
            },
          },
        });
        const suppressions = SuppressionsJsonGenerator.fromV2(todoModule);
        const eslintConfig = createESLintConfigSubset({
          rules: {
            rule1: { fixable: false },
            rule2: { fixable: false },
          },
        });
        const config = createCorrectConfig({
          limit: { count: 3, type: "violation" },
        });
        const expected: SelectionResult = {
          selection: {
            ruleId: "rule2",
            type: "full",
          },
          success: true,
        };

        const result = selectRuleBasedOnViolationsLimit(
          suppressions,
          eslintConfig,
          config,
        );
        expect(result).toStrictEqual(expected);
      });

      it("should return partial of the first rule with the most violations gt the limit", () => {
        const todoModule = createTodoModuleV2({
          rule1: {
            autoFix: false,
            violations: {
              "file1.js": 1,
              "file2.js": 2,
              "file3.js": 3,
            },
          },
          rule2: {
            autoFix: false,
            violations: {
              "file1.js": 3,
              "file2.js": 1,
              "file3.js": 2,
            },
          },
        });
        const suppressions = SuppressionsJsonGenerator.fromV2(todoModule);
        const eslintConfig = createESLintConfigSubset({
          rules: {
            rule1: { fixable: false },
            rule2: { fixable: false },
          },
        });
        const config = createCorrectConfig({
          limit: { count: 4, type: "violation" },
        });
        const expected: SelectionResult = {
          selection: {
            ruleId: "rule1",
            type: "partial",
            violations: {
              "file1.js": 1,
              "file2.js": 2,
            },
          },
          success: true,
        };

        const result = selectRuleBasedOnViolationsLimit(
          suppressions,
          eslintConfig,
          config,
        );
        expect(result).toStrictEqual(expected);
      });

      it("should return success: false if no available partial", () => {
        const todoModule = createTodoModuleV2({
          rule1: {
            autoFix: false,
            violations: {
              "file1.js": 3,
            },
          },
        });
        const suppressions = SuppressionsJsonGenerator.fromV2(todoModule);
        const eslintConfig = createESLintConfigSubset({
          rules: {
            rule1: { fixable: false },
          },
        });
        const config = createCorrectConfig({
          limit: { count: 2, type: "violation" },
        });
        const expected: SelectionResult = { success: false };

        const result = selectRuleBasedOnViolationsLimit(
          suppressions,
          eslintConfig,
          config,
        );
        expect(result).toStrictEqual(expected);
      });

      it("should return success: false if todo is empty", () => {
        const todoModule = createTodoModuleV2({});
        const suppressions = SuppressionsJsonGenerator.fromV2(todoModule);
        const config = createCorrectConfig({
          limit: {
            count: 1,
            type: "violation",
          },
        });
        const expected: SelectionResult = { success: false };

        const result = selectRuleBasedOnViolationsLimit(
          suppressions,
          createESLintConfigSubset(),
          config,
        );
        expect(result).toStrictEqual(expected);
      });
    });
  });

  describe("when exclude.rules is provided", () => {
    const createCorrectConfig = createConfigBuilder();

    it("should respect exclude.rules option", () => {
      const todoModule = createTodoModuleV2({
        "@typescript-eslint/no-explicity-any": {
          autoFix: false,
          violations: {
            "file1.js": 3,
          },
        },
        "rule2": {
          autoFix: false,
          violations: {
            "file1.js": 1,
            "file2.js": 1,
            "file3.js": 1,
          },
        },
      });
      const suppressions = SuppressionsJsonGenerator.fromV2(todoModule);
      const eslintConfig = createESLintConfigSubset({
        rules: {
          rule1: { fixable: false },
          rule2: { fixable: false },
        },
      });
      const config = createCorrectConfig({
        autoFixableOnly: false,
        exclude: { rules: ["@typescript-eslint/no-explicity-any"] },
        limit: { count: 3, type: "violation" },
      });
      const expected: SelectionResult = {
        selection: { ruleId: "rule2", type: "full" },
        success: true,
      };

      const result = selectRuleBasedOnViolationsLimit(
        suppressions,
        eslintConfig,
        config,
      );
      expect(result).toStrictEqual(expected);
    });

    it("should return success: false if no rule satisfies the limit AND exclude.rules", () => {
      const todoModule = createTodoModuleV2({
        "@typescript-eslint/no-explicity-any": {
          autoFix: false,
          violations: {
            "file1.js": 1,
          },
        },
        "rule2": {
          autoFix: true,
          violations: {
            "file1.js": 1,
            "file2.js": 1,
          },
        },
      });
      const suppressions = SuppressionsJsonGenerator.fromV2(todoModule);
      const eslintConfig = createESLintConfigSubset({
        rules: {
          rule1: { fixable: false },
          rule2: { fixable: true },
        },
      });
      const config = createCorrectConfig({
        autoFixableOnly: false,
        exclude: { rules: ["@typescript-eslint/no-explicity-any"] },
        limit: { count: 1, type: "violation" },
      });
      const expected: SelectionResult = { success: false };

      const result = selectRuleBasedOnViolationsLimit(
        suppressions,
        eslintConfig,
        config,
      );
      expect(result).toStrictEqual(expected);
    });
  });

  describe("when invalid input is provided", () => {
    const createCorrectConfig = createConfigBuilder();

    it("should throw an error if limit count is lte 0", () => {
      const todoModule = createTodoModuleV2({});
      const suppressions = SuppressionsJsonGenerator.fromV2(todoModule);
      const config = createCorrectConfig({
        limit: { count: 0, type: "violation" },
      });

      expect(() =>
        selectRuleBasedOnViolationsLimit(
          suppressions,
          createESLintConfigSubset(),
          config,
        ),
      ).toThrowError("The violation limit must be greater than 0");
    });
  });
});

describe("exclude.files functionality", () => {
  describe("should exclude files matching exclude.files patterns", () => {
    const createCorrectConfig = createConfigBuilder();

    it("should exclude files in selectRuleBasedOnFilesLimit", () => {
      const todoModule = createTodoModuleV2({
        rule1: {
          autoFix: true,
          violations: {
            "dist/file3.js": 1,
            "src/file1.ts": 2,
            "src/file2.ts": 3,
          },
        },
        rule2: {
          autoFix: true,
          violations: {
            "dist/file5.js": 2,
            "src/file4.ts": 1,
          },
        },
      });
      const suppressions = SuppressionsJsonGenerator.fromV2(todoModule);
      const eslintConfig = createESLintConfigSubset({
        rules: {
          rule1: { fixable: true },
          rule2: { fixable: true },
        },
      });
      const config = createCorrectConfig({
        exclude: {
          files: ["dist/**"],
        },
        limit: {
          count: 100,
          type: "file",
        },
      });
      const expected: SelectionResult = {
        selection: { ruleId: "rule1", type: "full" },
        success: true,
      };

      const result = selectRuleBasedOnFilesLimit(
        suppressions,
        eslintConfig,
        config,
      );
      expect(result).toStrictEqual(expected);
    });

    it("should exclude files in selectRuleBasedOnViolationsLimit", () => {
      const todoModule = createTodoModuleV2({
        rule1: {
          autoFix: true,
          violations: {
            "dist/file3.js": 10,
            "src/file1.ts": 2,
            "src/file2.ts": 3,
          },
        },
        rule2: {
          autoFix: true,
          violations: {
            "dist/file5.js": 2,
            "src/file4.ts": 1,
          },
        },
      });
      const suppressions = SuppressionsJsonGenerator.fromV2(todoModule);
      const eslintConfig = createESLintConfigSubset({
        rules: {
          rule1: { fixable: true },
          rule2: { fixable: true },
        },
      });
      const config = createCorrectConfig({
        exclude: {
          files: ["dist/**"],
        },
        limit: {
          count: 100,
          type: "violation",
        },
      });
      const expected: SelectionResult = {
        selection: { ruleId: "rule1", type: "full" },
        success: true,
      };

      const result = selectRuleBasedOnViolationsLimit(
        suppressions,
        eslintConfig,
        config,
      );
      expect(result).toStrictEqual(expected);
    });

    it("should work with both exclude.files and include.files", () => {
      const todoModule = createTodoModuleV2({
        rule1: {
          autoFix: true,
          violations: {
            "dist/file3.js": 1,
            "src/file1.ts": 2,
            "src/file2.ts": 3,
            "test/file4.spec.ts": 5,
          },
        },
      });
      const suppressions = SuppressionsJsonGenerator.fromV2(todoModule);
      const eslintConfig = createESLintConfigSubset({
        rules: {
          rule1: { fixable: true },
        },
      });
      const config = createCorrectConfig({
        exclude: {
          files: ["**/file1.ts"],
        },
        include: {
          files: ["src/**"],
        },
        limit: {
          count: 100,
          type: "violation",
        },
      });
      const expected: SelectionResult = {
        selection: { ruleId: "rule1", type: "full" },
        success: true,
      };

      const result = selectRuleBasedOnViolationsLimit(
        suppressions,
        eslintConfig,
        config,
      );
      expect(result).toStrictEqual(expected);
    });

    it("should return no selection when all files are excluded", () => {
      const todoModule = createTodoModuleV2({
        rule1: {
          autoFix: true,
          violations: {
            "src/file1.ts": 2,
            "src/file2.ts": 3,
          },
        },
      });
      const suppressions = SuppressionsJsonGenerator.fromV2(todoModule);
      const eslintConfig = createESLintConfigSubset({
        rules: {
          rule1: { fixable: true },
        },
      });
      const config = createCorrectConfig({
        exclude: {
          files: ["**/*"],
        },
        limit: {
          count: 100,
          type: "violation",
        },
      });
      const expected: SelectionResult = {
        success: false,
      };

      const result = selectRuleBasedOnViolationsLimit(
        suppressions,
        eslintConfig,
        config,
      );
      expect(result).toStrictEqual(expected);
    });

    it("should use filtered file count for limit check in selectRuleBasedOnFilesLimit", () => {
      const todoModule = createTodoModuleV2({
        rule1: {
          autoFix: true,
          violations: {
            "dist/file1.js": 1,
            "dist/file2.js": 1,
            "dist/file3.js": 1,
            "dist/file4.js": 1,
            "dist/file5.js": 1,
            "src/file1.ts": 1,
            "src/file2.ts": 1,
          },
        },
      });
      const suppressions = SuppressionsJsonGenerator.fromV2(todoModule);
      const eslintConfig = createESLintConfigSubset({
        rules: {
          rule1: { fixable: true },
        },
      });
      // Original has 7 files (> limit 3), but filtered has only 2 files (< limit 3)
      const config = createCorrectConfig({
        include: {
          files: ["src/**"],
        },
        limit: {
          count: 3,
          type: "file",
        },
        partialSelection: true,
      });
      // Changed: should return partial selection because original count exceeds limit
      const expected: SelectionResult = {
        selection: {
          ruleId: "rule1",
          type: "partial",
          violations: {
            "src/file1.ts": 1,
            "src/file2.ts": 1,
          },
        },
        success: true,
      };

      const result = selectRuleBasedOnFilesLimit(
        suppressions,
        eslintConfig,
        config,
      );
      expect(result).toStrictEqual(expected);
    });

    it("should use filtered violation count for limit check in selectRuleBasedOnViolationsLimit", () => {
      const todoModule = createTodoModuleV2({
        rule1: {
          autoFix: true,
          violations: {
            "dist/file1.js": 50,
            "dist/file2.js": 50,
            "src/file1.ts": 10,
            "src/file2.ts": 5,
          },
        },
      });
      const suppressions = SuppressionsJsonGenerator.fromV2(todoModule);
      const eslintConfig = createESLintConfigSubset({
        rules: {
          rule1: { fixable: true },
        },
      });
      // Original has 115 violations (> limit 20), but filtered has only 15 violations (< limit 20)
      const config = createCorrectConfig({
        include: {
          files: ["src/**"],
        },
        limit: {
          count: 20,
          type: "violation",
        },
        partialSelection: true,
      });
      // Changed: should return partial selection because original count exceeds limit
      const expected: SelectionResult = {
        selection: {
          ruleId: "rule1",
          type: "partial",
          violations: {
            "src/file1.ts": 10,
            "src/file2.ts": 5,
          },
        },
        success: true,
      };

      const result = selectRuleBasedOnViolationsLimit(
        suppressions,
        eslintConfig,
        config,
      );
      expect(result).toStrictEqual(expected);
    });
  });
});

describe("filter-based limit checking", () => {
  const createCorrectConfig = createConfigBuilder();

  describe("selectRuleBasedOnFilesLimit with filtered file count", () => {
    it("should use filtered file count for limit check, not original count", () => {
      const todoModule = createTodoModuleV2({
        rule1: {
          autoFix: true,
          violations: {
            "dist/excluded1.js": 1,
            "dist/excluded2.js": 1,
            "dist/excluded3.js": 1,
            "src/included1.ts": 1,
            "src/included2.ts": 1,
          },
        },
      });
      const suppressions = SuppressionsJsonGenerator.fromV2(todoModule);
      const eslintConfig = createESLintConfigSubset({
        rules: {
          rule1: { fixable: true },
        },
      });
      const config = createCorrectConfig({
        exclude: {
          files: ["dist/**"],
        },
        limit: {
          count: 2,
          type: "file",
        },
      });
      // original file count is 5 (> limit 2), filtered file count is 2 (= limit 2)
      // should return success: false because partial selection is not enabled and original exceeds limit
      const expected: SelectionResult = {
        success: false,
      };

      const result = selectRuleBasedOnFilesLimit(
        suppressions,
        eslintConfig,
        config,
      );
      expect(result).toStrictEqual(expected);
    });

    it("should perform partial selection based on filtered files when over limit", () => {
      const todoModule = createTodoModuleV2({
        rule1: {
          autoFix: true,
          violations: {
            "dist/excluded1.js": 1,
            "dist/excluded2.js": 1,
            "src/included1.ts": 1,
            "src/included2.ts": 1,
            "src/included3.ts": 1,
          },
        },
      });
      const suppressions = SuppressionsJsonGenerator.fromV2(todoModule);
      const eslintConfig = createESLintConfigSubset({
        rules: {
          rule1: { fixable: true },
        },
      });
      const config = createCorrectConfig({
        exclude: {
          files: ["dist/**"],
        },
        limit: {
          count: 2,
          type: "file",
        },
        partialSelection: true,
      });
      // filtered file count is 3, which exceeds limit of 2
      // should perform partial selection of first 2 files
      const expected: SelectionResult = {
        selection: {
          ruleId: "rule1",
          type: "partial",
          violations: {
            "src/included1.ts": 1,
            "src/included2.ts": 1,
          },
        },
        success: true,
      };

      const result = selectRuleBasedOnFilesLimit(
        suppressions,
        eslintConfig,
        config,
      );
      expect(result).toStrictEqual(expected);
    });
  });

  describe("selectRuleBasedOnViolationsLimit with filtered violation count", () => {
    it("should use filtered violation count for limit check, not original count", () => {
      const todoModule = createTodoModuleV2({
        rule1: {
          autoFix: true,
          violations: {
            "dist/excluded1.js": 10,
            "dist/excluded2.js": 10,
            "src/included1.ts": 2,
            "src/included2.ts": 3,
          },
        },
      });
      const suppressions = SuppressionsJsonGenerator.fromV2(todoModule);
      const eslintConfig = createESLintConfigSubset({
        rules: {
          rule1: { fixable: true },
        },
      });
      const config = createCorrectConfig({
        exclude: {
          files: ["dist/**"],
        },
        limit: {
          count: 5,
          type: "violation",
        },
      });
      // original violation count is 25 (> limit 5), filtered violation count is 5 (= limit 5)
      // should return success: false because partial selection is not enabled and original exceeds limit
      const expected: SelectionResult = {
        success: false,
      };

      const result = selectRuleBasedOnViolationsLimit(
        suppressions,
        eslintConfig,
        config,
      );
      expect(result).toStrictEqual(expected);
    });

    it("should perform partial selection based on filtered violations when over limit", () => {
      const todoModule = createTodoModuleV2({
        rule1: {
          autoFix: true,
          violations: {
            "dist/excluded1.js": 20,
            "src/included1.ts": 2,
            "src/included2.ts": 3,
            "src/included3.ts": 4,
          },
        },
      });
      const suppressions = SuppressionsJsonGenerator.fromV2(todoModule);
      const eslintConfig = createESLintConfigSubset({
        rules: {
          rule1: { fixable: true },
        },
      });
      const config = createCorrectConfig({
        exclude: {
          files: ["dist/**"],
        },
        limit: {
          count: 5,
          type: "violation",
        },
        partialSelection: true,
      });
      // filtered violation count is 9 (2 + 3 + 4), which exceeds limit of 5
      // should perform partial selection of first files up to limit
      const expected: SelectionResult = {
        selection: {
          ruleId: "rule1",
          type: "partial",
          violations: {
            "src/included1.ts": 2,
            "src/included2.ts": 3,
          },
        },
        success: true,
      };

      const result = selectRuleBasedOnViolationsLimit(
        suppressions,
        eslintConfig,
        config,
      );
      expect(result).toStrictEqual(expected);
    });

    it("should return false when filtered files have no violations within limit", () => {
      const todoModule = createTodoModuleV2({
        rule1: {
          autoFix: true,
          violations: {
            "dist/excluded1.js": 1,
            "dist/excluded2.js": 1,
            "src/included1.ts": 10,
          },
        },
      });
      const suppressions = SuppressionsJsonGenerator.fromV2(todoModule);
      const eslintConfig = createESLintConfigSubset({
        rules: {
          rule1: { fixable: true },
        },
      });
      const config = createCorrectConfig({
        exclude: {
          files: ["dist/**"],
        },
        limit: {
          count: 5,
          type: "violation",
        },
        partialSelection: true,
      });
      // filtered violation count is 10, which exceeds limit of 5
      // but smallest file has 10 violations, so no partial selection possible
      const expected: SelectionResult = {
        success: false,
      };

      const result = selectRuleBasedOnViolationsLimit(
        suppressions,
        eslintConfig,
        config,
      );
      expect(result).toStrictEqual(expected);
    });

    it("should return partial selection when original violations exceed limit even if filtered violations are within limit", () => {
      const todoModule = createTodoModuleV2({
        rule1: {
          autoFix: true,
          violations: {
            "dist/excluded1.js": 100,
            "dist/excluded2.js": 100,
            "src/included1.ts": 2,
            "src/included2.ts": 3,
          },
        },
      });
      const suppressions = SuppressionsJsonGenerator.fromV2(todoModule);
      const eslintConfig = createESLintConfigSubset({
        rules: {
          rule1: { fixable: true },
        },
      });
      const config = createCorrectConfig({
        exclude: {
          files: ["dist/**"],
        },
        limit: {
          count: 10,
          type: "violation",
        },
        partialSelection: true,
      });
      // original total violations: 205 (100 + 100 + 2 + 3), exceeds limit of 10
      // filtered total violations: 5 (2 + 3), within limit
      // should return partial selection, not full, because original exceeds limit
      const expected: SelectionResult = {
        selection: {
          ruleId: "rule1",
          type: "partial",
          violations: {
            "src/included1.ts": 2,
            "src/included2.ts": 3,
          },
        },
        success: true,
      };

      const result = selectRuleBasedOnViolationsLimit(
        suppressions,
        eslintConfig,
        config,
      );
      expect(result).toStrictEqual(expected);
    });
  });

  describe("selectRuleBasedOnFilesLimit with filtered file count", () => {
    it("should return partial selection when original files exceed limit even if filtered files are within limit", () => {
      const todoModule = createTodoModuleV2({
        rule1: {
          autoFix: true,
          violations: {
            "dist/excluded1.js": 1,
            "dist/excluded2.js": 1,
            "dist/excluded3.js": 1,
            "dist/excluded4.js": 1,
            "dist/excluded5.js": 1,
            "src/included1.ts": 1,
            "src/included2.ts": 1,
          },
        },
      });
      const suppressions = SuppressionsJsonGenerator.fromV2(todoModule);
      const eslintConfig = createESLintConfigSubset({
        rules: {
          rule1: { fixable: true },
        },
      });
      const config = createCorrectConfig({
        exclude: {
          files: ["dist/**"],
        },
        limit: {
          count: 3,
          type: "file",
        },
        partialSelection: true,
      });
      // original total files: 7, exceeds limit of 3
      // filtered total files: 2, within limit
      // should return partial selection, not full, because original exceeds limit
      const expected: SelectionResult = {
        selection: {
          ruleId: "rule1",
          type: "partial",
          violations: {
            "src/included1.ts": 1,
            "src/included2.ts": 1,
          },
        },
        success: true,
      };

      const result = selectRuleBasedOnFilesLimit(
        suppressions,
        eslintConfig,
        config,
      );
      expect(result).toStrictEqual(expected);
    });
  });
});
