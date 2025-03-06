import { describe, expect, it } from "vitest";

import type { TodoModuleV2 } from "../todofile/v2";
import type { RuleSelection } from "./select-rule";

import { deleteRule } from "./delete-rule";

const createTodoModuleV2 = (todo: TodoModuleV2["todo"]): TodoModuleV2 => ({
  meta: {
    version: 2,
  },
  todo,
});

describe("deleteRule", () => {
  describe("full selection", () => {
    it("should delete the specified rule from the todo module", () => {
      const currentModule = createTodoModuleV2({
        "no-console": {
          autoFix: false,
          violations: {
            "src/index.js": 1,
          },
        },
        "no-unused-vars": {
          autoFix: false,
          violations: {
            "src/index.js": 3,
          },
        },
      });
      const ruleSelection: RuleSelection = {
        ruleId: "no-console",
        type: "full",
      };
      const expected = createTodoModuleV2({
        "no-unused-vars": {
          autoFix: false,
          violations: {
            "src/index.js": 3,
          },
        },
      });

      const newModule = deleteRule(currentModule, ruleSelection);
      expect(newModule).toStrictEqual(expected);
    });

    it("should not modify the todo module if the rule does not exist", () => {
      const currentModule = createTodoModuleV2({
        "no-console": {
          autoFix: false,
          violations: {
            "src/index.js": 1,
          },
        },
      });
      const ruleSelection: RuleSelection = {
        ruleId: "no-unused-vars",
        type: "full",
      };

      const newModule = deleteRule(currentModule, ruleSelection);

      expect(newModule).toStrictEqual(currentModule);
    });
  });

  describe("partial selection", () => {
    it("should delete the specified violations from the rule", () => {
      const currentModule = createTodoModuleV2({
        "no-console": {
          autoFix: false,
          violations: {
            "src/baz.js": 1,
            "src/foo.js": 2,
            "src/index.js": 1,
          },
        },
      });
      const selection: RuleSelection = {
        ruleId: "no-console",
        type: "partial",
        violations: {
          "src/foo.js": 2,
        },
      };
      const expected = createTodoModuleV2({
        "no-console": {
          autoFix: false,
          violations: {
            "src/baz.js": 1,
            "src/index.js": 1,
          },
        },
      });

      const newModule = deleteRule(currentModule, selection);
      expect(newModule).toStrictEqual(expected);
    });

    it("should not modify the todo module if the rule does not exist", () => {
      const currentModule = createTodoModuleV2({
        "no-console": {
          autoFix: false,
          violations: {
            "src/foo.js": 2,
            "src/index.js": 1,
          },
        },
      });
      const selection: RuleSelection = {
        ruleId: "no-unused-vars",
        type: "partial",
        violations: {
          "src/foo.js": 2,
        },
      };

      const newModule = deleteRule(currentModule, selection);
      expect(newModule).toStrictEqual(currentModule);
    });

    it("should not modify the todo module if the file does not exist", () => {
      const currentModule = createTodoModuleV2({
        "no-console": {
          autoFix: false,
          violations: {
            "src/foo.js": 2,
            "src/index.js": 1,
          },
        },
      });
      const selection: RuleSelection = {
        ruleId: "no-console",
        type: "partial",
        violations: {
          "src/bar.js": 2,
        },
      };

      const newModule = deleteRule(currentModule, selection);
      expect(newModule).toStrictEqual(currentModule);
    });

    it("should not modify the todo module if the violation count does not match", () => {
      const currentModule = createTodoModuleV2({
        "no-console": {
          autoFix: false,
          violations: {
            "src/foo.js": 2,
            "src/index.js": 1,
          },
        },
      });
      const selection: RuleSelection = {
        ruleId: "no-console",
        type: "partial",
        violations: {
          "src/foo.js": 3,
        },
      };

      const newModule = deleteRule(currentModule, selection);
      expect(newModule).toStrictEqual(currentModule);
    });
  });
});
