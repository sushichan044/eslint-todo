import { describe, expect, it } from "vitest";

import type { TodoModuleV2 } from "../todofile/v2";
import type { OperationFileLimit, OperationViolationLimit } from "./types";

import {
  selectRuleBasedOnFilesLimit,
  selectRuleBasedOnLimit,
  selectRuleBasedOnViolationsLimit,
} from "./selectRule";

describe("selectRuleBasedOnLimit", () => {
  const todoModule: TodoModuleV2 = { meta: { version: 2 }, todo: {} };

  it("should call selectRuleBasedOnFilesLimit when limit type is file", () => {
    const limit: OperationFileLimit = { count: 10, type: "file" };

    const subject = selectRuleBasedOnLimit(todoModule, limit);
    const expected = selectRuleBasedOnFilesLimit(todoModule, limit);

    expect(subject).toStrictEqual(expected);
  });

  it("should call selectRuleBasedOnViolationsLimit when limit type is violation", () => {
    const limit: OperationViolationLimit = { count: 10, type: "violation" };

    const subject = selectRuleBasedOnLimit(todoModule, limit);
    const expected = selectRuleBasedOnViolationsLimit(todoModule, limit);

    expect(subject).toStrictEqual(expected);
  });

  it("should throw an error for unknown limit type", () => {
    const limit = { count: 10, type: "unknown" } as unknown;

    expect(() =>
      // @ts-expect-error 意図的にエラーを発生させる
      selectRuleBasedOnLimit(todoModule, limit),
    ).toThrowError("Got unknown limit");
  });
});

describe("selectRuleBasedOnFilesLimit", () => {
  describe("When autoFixableOnly: true", () => {
    it("should return the first rule that meets the criteria", () => {
      const todoModule: TodoModuleV2 = {
        meta: { version: 2 },
        todo: {
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
            autoFix: false,
            violations: {
              "file2000.js": 1,
            },
          },
          // rule 3 is one of the rules that meets the criteria, but it's not the first one
          rule3: {
            autoFix: true,
            violations: {
              "file1.js": 1,
              "file2.js": 1,
              "file3.js": 1,
              "file4.js": 1,
            },
          },
        },
      };
      const limit: OperationFileLimit = { count: 4, type: "file" };

      const result = selectRuleBasedOnFilesLimit(todoModule, limit);
      expect(result).toStrictEqual({ ruleId: "rule1", success: true });
    });

    it("should return success: false if no rule meets the criteria", () => {
      const todoModule: TodoModuleV2 = {
        meta: { version: 2 },
        todo: {
          rule1: {
            autoFix: true,
            violations: {
              "file1.js": 1,
              "file2.js": 1,
              "file3.js": 1,
            },
          },
        },
      };
      const limit: OperationFileLimit = { count: 2, type: "file" };

      const result = selectRuleBasedOnFilesLimit(todoModule, limit);
      expect(result).toStrictEqual({ success: false });
    });

    it("should return success: false if no rule is auto-fixable", () => {
      const todoModule: TodoModuleV2 = {
        meta: { version: 2 },
        todo: {
          rule1: {
            autoFix: false,
            violations: {
              "file1.js": 1000,
            },
          },
        },
      };
      const limit: OperationFileLimit = { count: 1, type: "file" };

      const result = selectRuleBasedOnFilesLimit(todoModule, limit);
      expect(result).toStrictEqual({ success: false });
    });
  });

  describe("When autoFixableOnly: false", () => {
    it("should return the first rule that meets the criteria", () => {
      const todoModule: TodoModuleV2 = {
        meta: { version: 2 },
        todo: {
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
            autoFix: false,
            violations: {
              "file2000.js": 1,
            },
          },
          // rule 3 is one of the rules that meets the criteria, but it's not the first one
          rule3: {
            autoFix: true,
            violations: {
              "file1.js": 1,
              "file2.js": 1,
              "file3.js": 1,
              "file4.js": 1,
            },
          },
        },
      };
      const limit: OperationFileLimit = { count: 4, type: "file" };

      const result = selectRuleBasedOnFilesLimit(todoModule, limit, {
        autoFixableOnly: false,
      });
      expect(result).toStrictEqual({ ruleId: "rule1", success: true });
    });

    it("should return success: false if no rule meets the criteria", () => {
      const todoModule: TodoModuleV2 = {
        meta: { version: 2 },
        todo: {
          rule1: {
            autoFix: false,
            violations: {
              "file1.js": 1,
              "file2.js": 1,
              "file3.js": 1,
            },
          },
        },
      };
      const limit: OperationFileLimit = { count: 2, type: "file" };

      const result = selectRuleBasedOnFilesLimit(todoModule, limit, {
        autoFixableOnly: false,
      });
      expect(result).toStrictEqual({ success: false });
    });
  });
});

describe("selectRuleBasedOnViolationsLimit", () => {
  describe("When autoFixableOnly: true", () => {
    it("should return the rule with the most violations below the limit", () => {
      const todoModule: TodoModuleV2 = {
        meta: { version: 2 },
        todo: {
          rule1: {
            autoFix: true,
            violations: {
              "file1.js": 5,
            },
          },
          // rule2 is one of the rules that meets the criteria, but it's not the first one
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
        },
      };
      const limit: OperationViolationLimit = { count: 5, type: "violation" };

      const result = selectRuleBasedOnViolationsLimit(todoModule, limit);
      expect(result).toStrictEqual({ ruleId: "rule1", success: true });
    });

    it("should return success: false if no rule meets the criteria", () => {
      const todoModule: TodoModuleV2 = {
        meta: { version: 2 },
        todo: {
          rule1: {
            autoFix: true,
            violations: {
              file1: 3,
              file2: 3,
            },
          },
        },
      };
      const limit: OperationViolationLimit = { count: 5, type: "violation" };

      const result = selectRuleBasedOnViolationsLimit(todoModule, limit);
      expect(result).toEqual({ success: false });
    });

    it("should return success: false if no rule is auto-fixable", () => {
      const todoModule: TodoModuleV2 = {
        meta: { version: 2 },
        todo: {
          rule1: {
            autoFix: false,
            violations: {
              file1: 3,
            },
          },
        },
      };
      const limit: OperationViolationLimit = { count: 4, type: "violation" };

      const result = selectRuleBasedOnViolationsLimit(todoModule, limit);
      expect(result).toEqual({ success: false });
    });
  });

  describe("When autoFixableOnly: false", () => {
    it("should return the rule with the most violations below the limit", () => {
      const todoModule: TodoModuleV2 = {
        meta: { version: 2 },
        todo: {
          rule1: {
            autoFix: false,
            violations: {
              "file1.js": 5,
            },
          },
          // rule2 is one of the rules that meets the criteria, but it's not the first one
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
        },
      };
      const limit: OperationViolationLimit = { count: 5, type: "violation" };

      const result = selectRuleBasedOnViolationsLimit(todoModule, limit, {
        autoFixableOnly: false,
      });
      expect(result).toStrictEqual({ ruleId: "rule1", success: true });
    });

    it("should return success: false if no rule meets the criteria", () => {
      const todoModule: TodoModuleV2 = {
        meta: { version: 2 },
        todo: {
          rule1: {
            autoFix: false,
            violations: {
              "file1.js": 5,
            },
          },
        },
      };
      const limit: OperationViolationLimit = { count: 4, type: "violation" };

      const result = selectRuleBasedOnViolationsLimit(todoModule, limit, {
        autoFixableOnly: false,
      });
      expect(result).toEqual({ success: false });
    });
  });
});
