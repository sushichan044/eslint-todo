import { describe, expect, it } from "vitest";

import type { TodoModuleV2 } from "../todofile/v2";
import type { RuleSelection } from "./selectRule";

import { deleteRule } from "./deleteRule";

describe("deleteRule", () => {
  it("should delete the specified rule from the todo module", () => {
    const currentModule: TodoModuleV2 = {
      meta: {
        version: 2,
      },
      todo: {
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
      },
    };
    const ruleSelection = {
      ruleId: "no-console",
      type: "full",
    } satisfies RuleSelection;

    const newModule = deleteRule(currentModule, ruleSelection);

    expect(newModule).toStrictEqual({
      meta: {
        version: 2,
      },
      todo: {
        "no-unused-vars": {
          autoFix: false,
          violations: {
            "src/index.js": 3,
          },
        },
      },
    });
  });

  it("should not modify the todo module if the rule does not exist", () => {
    const currentModule: TodoModuleV2 = {
      meta: {
        version: 2,
      },
      todo: {
        "no-console": {
          autoFix: false,
          violations: {
            "src/index.js": 1,
          },
        },
      },
    };
    const ruleSelection = {
      ruleId: "no-unused-vars",
      type: "full",
    } satisfies RuleSelection;

    const newModule = deleteRule(currentModule, ruleSelection);

    expect(newModule).toStrictEqual(currentModule);
  });
});
