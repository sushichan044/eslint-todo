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

      it("should return success: false if todo is empty", () => {
        const todoModule = createTodoModuleV2({});
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

    describe("partial selection behavior", () => {
      const operationOptions = operationOptionsWithDefault({
        allowPartialSelection: true,
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
        const limit: OperationFileLimit = { count: 3, type: "file" };
        const expected: SelectionResult = {
          selection: {
            ruleId: "rule2",
            type: "full",
          },
          success: true,
        };

        const result = selectRuleBasedOnFilesLimit(
          todoModule,
          limit,
          operationOptions,
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
        const limit: OperationFileLimit = { count: 2, type: "file" };
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
          todoModule,
          limit,
          operationOptions,
        );
        expect(result).toStrictEqual(expected);
      });

      it("should return success: false if todo is empty", () => {
        const todoModule = createTodoModuleV2({});
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

      it("should return success: false if todo is empty", () => {
        const todoModule = createTodoModuleV2({});
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

    describe("partial selection behavior", () => {
      const operationOptions = operationOptionsWithDefault({
        allowPartialSelection: true,
        autoFixableOnly: false,
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
        const limit: OperationFileLimit = { count: 3, type: "file" };
        const expected: SelectionResult = {
          selection: {
            ruleId: "rule2",
            type: "full",
          },
          success: true,
        };

        const result = selectRuleBasedOnFilesLimit(
          todoModule,
          limit,
          operationOptions,
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
        const limit: OperationFileLimit = { count: 2, type: "file" };
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
          todoModule,
          limit,
          operationOptions,
        );
        expect(result).toStrictEqual(expected);
      });

      it("should return success: false if todo is empty", () => {
        const todoModule = createTodoModuleV2({});
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

  describe("when invalid input is provided", () => {
    const operationOptions = operationOptionsWithDefault();

    it("should throw an error if limit count is lte 0", () => {
      const todoModule = createTodoModuleV2({});
      const limit: OperationFileLimit = { count: 0, type: "file" };

      expect(() =>
        selectRuleBasedOnFilesLimit(todoModule, limit, operationOptions),
      ).toThrowError("The file limit must be greater than 0");
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

      it("should return success: false if todo is empty", () => {
        const todoModule = createTodoModuleV2({});
        const limit: OperationViolationLimit = { count: 1, type: "violation" };
        const expected: SelectionResult = { success: false };

        const result = selectRuleBasedOnViolationsLimit(
          todoModule,
          limit,
          operationOptions,
        );
        expect(result).toStrictEqual(expected);
      });
    });

    describe("partial selection behavior", () => {
      const operationOptions = operationOptionsWithDefault({
        allowPartialSelection: true,
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
        const limit: OperationViolationLimit = { count: 3, type: "violation" };
        const expected: SelectionResult = {
          selection: {
            ruleId: "rule2",
            type: "full",
          },
          success: true,
        };

        const result = selectRuleBasedOnViolationsLimit(
          todoModule,
          limit,
          operationOptions,
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
        const limit: OperationViolationLimit = { count: 4, type: "violation" };
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
          todoModule,
          limit,
          operationOptions,
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
        const limit: OperationViolationLimit = { count: 2, type: "violation" };
        const expected: SelectionResult = { success: false };

        const result = selectRuleBasedOnViolationsLimit(
          todoModule,
          limit,
          operationOptions,
        );
        expect(result).toStrictEqual(expected);
      });

      it("should return success: false if todo is empty", () => {
        const todoModule = createTodoModuleV2({});
        const limit: OperationViolationLimit = { count: 1, type: "violation" };
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

      it("should return success: false if todo is empty", () => {
        const todoModule = createTodoModuleV2({});
        const limit: OperationViolationLimit = { count: 1, type: "violation" };
        const expected: SelectionResult = { success: false };

        const result = selectRuleBasedOnViolationsLimit(
          todoModule,
          limit,
          operationOptions,
        );
        expect(result).toStrictEqual(expected);
      });
    });

    describe("partial selection behavior", () => {
      const operationOptions = operationOptionsWithDefault({
        allowPartialSelection: true,
        autoFixableOnly: false,
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
        const limit: OperationViolationLimit = { count: 3, type: "violation" };
        const expected: SelectionResult = {
          selection: {
            ruleId: "rule2",
            type: "full",
          },
          success: true,
        };

        const result = selectRuleBasedOnViolationsLimit(
          todoModule,
          limit,
          operationOptions,
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
        const limit: OperationViolationLimit = { count: 4, type: "violation" };
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
          todoModule,
          limit,
          operationOptions,
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
        const limit: OperationViolationLimit = { count: 2, type: "violation" };
        const expected: SelectionResult = { success: false };

        const result = selectRuleBasedOnViolationsLimit(
          todoModule,
          limit,
          operationOptions,
        );
        expect(result).toStrictEqual(expected);
      });

      it("should return success: false if todo is empty", () => {
        const todoModule = createTodoModuleV2({});
        const limit: OperationViolationLimit = { count: 1, type: "violation" };
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

  describe("when invalid input is provided", () => {
    const operationOptions = operationOptionsWithDefault();

    it("should throw an error if limit count is lte 0", () => {
      const todoModule = createTodoModuleV2({});
      const limit: OperationViolationLimit = { count: 0, type: "violation" };

      expect(() =>
        selectRuleBasedOnViolationsLimit(todoModule, limit, operationOptions),
      ).toThrowError("The violation limit must be greater than 0");
    });
  });
});
