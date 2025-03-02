import { describe, expect, it } from "vitest";

import type { TodoModuleV2 } from "../todofile/v2";
import type { SelectionResult } from "./selectRule";
import type { OperationFileLimit, OperationViolationLimit } from "./types";

import { operationOptionsWithDefault } from "./options";
import {
  selectRuleBasedOnFilesLimit,
  selectRuleBasedOnLimit,
  selectRuleBasedOnViolationsLimit,
} from "./selectRule";

const createTodoModuleV2 = (todo: TodoModuleV2["todo"]): TodoModuleV2 => ({
  meta: { version: 2 },
  todo,
});

describe("selectRuleBasedOnLimit", () => {
  const todoModule = createTodoModuleV2({});
  const operationOptions = operationOptionsWithDefault();

  it("should call selectRuleBasedOnFilesLimit when limit type is file", () => {
    const limit: OperationFileLimit = { count: 10, type: "file" };

    const subject = selectRuleBasedOnLimit(todoModule, limit);
    const expected = selectRuleBasedOnFilesLimit(
      todoModule,
      limit,
      operationOptions,
    );

    expect(subject).toStrictEqual(expected);
  });

  it("should call selectRuleBasedOnViolationsLimit when limit type is violation", () => {
    const limit: OperationViolationLimit = { count: 10, type: "violation" };

    const subject = selectRuleBasedOnLimit(todoModule, limit);
    const expected = selectRuleBasedOnViolationsLimit(
      todoModule,
      limit,
      operationOptions,
    );

    expect(subject).toStrictEqual(expected);
  });

  it("should throw an error for unknown limit type", () => {
    const limit = { count: 10, type: "unknown" } as unknown;

    expect(() =>
      // @ts-expect-error 意図的に型に合わない引数を渡してエラーを発生させる
      selectRuleBasedOnLimit(todoModule, limit),
    ).toThrowError("Got unknown limit");
  });
});

describe("selectRuleBasedOnFilesLimit", () => {
  describe("when only autoFixable violations are allowed", () => {
    describe("full selection behavior", () => {
      const operationOptions = operationOptionsWithDefault();

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
        const limit: OperationFileLimit = { count: 4, type: "file" };
        const expected: SelectionResult = {
          selection: { ruleId: "rule2", type: "full" },
          success: true,
        };

        const result = selectRuleBasedOnFilesLimit(
          todoModule,
          limit,
          operationOptions,
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
        const limit: OperationFileLimit = { count: 4, type: "file" };
        const expected: SelectionResult = {
          selection: { ruleId: "rule1", type: "full" },
          success: true,
        };

        const result = selectRuleBasedOnFilesLimit(
          todoModule,
          limit,
          operationOptions,
        );
        expect(result).toStrictEqual(expected);
      });

      it("should return success: false if no rule meets the criteria", () => {
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
        const limit: OperationFileLimit = { count: 2, type: "file" };
        const expected: SelectionResult = { success: false };

        const result = selectRuleBasedOnFilesLimit(
          todoModule,
          limit,
          operationOptions,
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
        const limit: OperationFileLimit = { count: 1, type: "file" };
        const expected: SelectionResult = { success: false };

        const result = selectRuleBasedOnFilesLimit(
          todoModule,
          limit,
          operationOptions,
        );
        expect(result).toStrictEqual(expected);
      });
    });
  });

  describe("when non-autoFixable violations are allowed", () => {
    describe("full selection behavior", () => {
      const operationOptions = operationOptionsWithDefault({
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
        const limit: OperationFileLimit = { count: 4, type: "file" };
        const expected: SelectionResult = {
          selection: { ruleId: "rule2", type: "full" },
          success: true,
        };

        const result = selectRuleBasedOnFilesLimit(
          todoModule,
          limit,
          operationOptions,
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
        const limit: OperationFileLimit = { count: 4, type: "file" };
        const expected: SelectionResult = {
          selection: { ruleId: "rule1", type: "full" },
          success: true,
        };

        const result = selectRuleBasedOnFilesLimit(
          todoModule,
          limit,
          operationOptions,
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
        const limit: OperationFileLimit = { count: 2, type: "file" };
        const expected: SelectionResult = { success: false };

        const result = selectRuleBasedOnFilesLimit(
          todoModule,
          limit,
          operationOptions,
        );
        expect(result).toStrictEqual(expected);
      });
    });
  });
});

describe("selectRuleBasedOnViolationsLimit", () => {
  describe("when only autoFixable violations are allowed", () => {
    describe("full selection behavior", () => {
      const operationOptions = operationOptionsWithDefault();

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
        const limit: OperationViolationLimit = { count: 5, type: "violation" };
        const expected: SelectionResult = {
          selection: { ruleId: "rule2", type: "full" },
          success: true,
        };

        const result = selectRuleBasedOnViolationsLimit(
          todoModule,
          limit,
          operationOptions,
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
        const limit: OperationViolationLimit = { count: 4, type: "violation" };
        const expected: SelectionResult = {
          selection: { ruleId: "rule1", type: "full" },
          success: true,
        };

        const result = selectRuleBasedOnViolationsLimit(
          todoModule,
          limit,
          operationOptions,
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
        const limit: OperationViolationLimit = { count: 5, type: "violation" };
        const expected: SelectionResult = { success: false };

        const result = selectRuleBasedOnViolationsLimit(
          todoModule,
          limit,
          operationOptions,
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
        const limit: OperationViolationLimit = { count: 4, type: "violation" };
        const expected: SelectionResult = { success: false };

        const result = selectRuleBasedOnViolationsLimit(
          todoModule,
          limit,
          operationOptions,
        );
        expect(result).toStrictEqual(expected);
      });
    });
  });

  describe("when non-autoFixable violations are allowed", () => {
    describe("full selection behavior", () => {
      const operationOptions = operationOptionsWithDefault({
        autoFixableOnly: false,
      });

      it("should return the rule with the most violations below the limit", () => {
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
        const limit: OperationViolationLimit = { count: 5, type: "violation" };
        const expected: SelectionResult = {
          selection: { ruleId: "rule2", type: "full" },
          success: true,
        };

        const result = selectRuleBasedOnViolationsLimit(
          todoModule,
          limit,
          operationOptions,
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
        const limit: OperationViolationLimit = { count: 4, type: "violation" };
        const expected: SelectionResult = {
          selection: { ruleId: "rule1", type: "full" },
          success: true,
        };

        const result = selectRuleBasedOnViolationsLimit(
          todoModule,
          limit,
          operationOptions,
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
        const limit: OperationViolationLimit = { count: 4, type: "violation" };
        const expected: SelectionResult = { success: false };

        const result = selectRuleBasedOnViolationsLimit(
          todoModule,
          limit,
          operationOptions,
        );
        expect(result).toStrictEqual(expected);
      });
    });
  });
});
