import { describe, expect, it } from "vitest";

import type {
  ESLintSuppressionsJson,
  InternalRuleBasedSuppressionsJson,
} from "./types";

import { toESLintSuppressionsJson, toRuleBasedSuppression } from "./rule-based";

describe("suppresions-json rule-based", () => {
  describe("toRuleBasedSuppression", () => {
    it("should convert ESLintSuppressionsJson to RuleBasedSuppression", () => {
      const suppressionsJson: ESLintSuppressionsJson = {
        "file1.js": {
          "no-console": {
            count: 2,
          },
        },
        "file2.js": {
          "no-console": {
            count: 1,
          },
          "no-unused-vars": {
            count: 3,
          },
        },
      };

      const ruleBased = toRuleBasedSuppression(suppressionsJson);

      expect(ruleBased).toStrictEqual({
        "no-console": {
          "file1.js": {
            count: 2,
          },
          "file2.js": {
            count: 1,
          },
        },
        "no-unused-vars": {
          "file2.js": {
            count: 3,
          },
        },
      });
    });

    it("should handle empty ESLintSuppressionsJson", () => {
      const suppressionsJson: ESLintSuppressionsJson = {};

      const ruleBased = toRuleBasedSuppression(suppressionsJson);

      expect(ruleBased).toStrictEqual({});
    });
  });

  describe("toESLintSuppressionsJson", () => {
    it("should convert RuleBasedSuppression to ESLintSuppressionsJson", () => {
      const ruleBased: InternalRuleBasedSuppressionsJson = {
        "no-console": {
          "file1.js": {
            count: 2,
          },
          "file2.js": {
            count: 1,
          },
        },
        "no-unused-vars": {
          "file2.js": {
            count: 3,
          },
        },
      };

      const suppressionsJson = toESLintSuppressionsJson(ruleBased);

      expect(suppressionsJson).toStrictEqual({
        "file1.js": {
          "no-console": {
            count: 2,
          },
        },
        "file2.js": {
          "no-console": {
            count: 1,
          },
          "no-unused-vars": {
            count: 3,
          },
        },
      });
    });

    it("should handle empty RuleBasedSuppression", () => {
      const ruleBased: InternalRuleBasedSuppressionsJson = {};

      const suppressionsJson = toESLintSuppressionsJson(ruleBased);

      expect(suppressionsJson).toStrictEqual({});
    });
  });

  it("should convert back and forth without data loss", () => {
    const original: ESLintSuppressionsJson = {
      "file1.js": {
        "no-console": {
          count: 2,
        },
      },
      "file2.js": {
        "no-console": {
          count: 1,
        },
        "no-unused-vars": {
          count: 3,
        },
      },
    };

    const ruleBased = toRuleBasedSuppression(original);
    const roundTrip = toESLintSuppressionsJson(ruleBased);

    expect(roundTrip).toStrictEqual(original);
  });
});
