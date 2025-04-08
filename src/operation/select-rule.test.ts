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
          autoFixableOnly: false,
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
        "@typescript-eslint/no-explicity-any": {
          autoFix: false,
          violations: {
            "file1.js": 1,
            "file2.js": 1,
            "file3.js": 1,
          },
        },
        "rule2": {
          autoFix: false,
          violations: {
            "file1.js": 1000,
            "file2.js": 1000,
            "file3.js": 1000,
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
        limit: { count: 3, type: "file" },
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

    it("should return success: false if no rule satisfies the limit AND exclude.rules", () => {
      const todoModule = createTodoModuleV2({
        "@typescript-eslint/no-explicity-any": {
          autoFix: false,
          violations: {
            "file1.js": 1,
            "file2.js": 1,
            "file3.js": 1,
          },
        },
        "rule2": {
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
        autoFixableOnly: false,
        exclude: { rules: ["@typescript-eslint/no-explicity-any"] },
        limit: { count: 3, type: "file" },
      });
      const expected: SelectionResult = { success: false };

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
