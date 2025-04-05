import { describe, expect, it } from "vitest";

import { UserConfigJsonSchema } from "./json";

describe("UserConfigJsonSchema matches snapshot", () => {
  it("should match snapshot", () => {
    // We are using unplugin-typia, so UserConfigJsonSchema will be transformed to a json schema object.

    expect(UserConfigJsonSchema).toMatchInlineSnapshot(`
      {
        "properties": {
          "correct": {
            "description": "Options for correct mode.",
            "properties": {
              "autoFixableOnly": {
                "description": "Allow to select non auto-fixable rules.",
                "title": "Allow to select non auto-fixable rules",
                "type": "boolean",
              },
              "exclude": {
                "description": "Options for excluding todo items.",
                "properties": {
                  "rules": {
                    "description": "List of rules to exclude from the operation. Comma-separated string.",
                    "items": {
                      "type": "string",
                    },
                    "title": "List of rules to exclude from the operation. Comma-separated string",
                    "type": "array",
                  },
                },
                "required": [],
                "title": "Options for excluding todo items",
                "type": "object",
              },
              "limit": {
                "properties": {
                  "count": {
                    "description": "Limit the number of violations or files to fix.",
                    "title": "Limit the number of violations or files to fix",
                    "type": "number",
                  },
                  "type": {
                    "description": "Type of limit to apply.",
                    "oneOf": [
                      {
                        "const": "file",
                      },
                      {
                        "const": "violation",
                      },
                    ],
                    "title": "Type of limit to apply",
                  },
                },
                "required": [],
                "type": "object",
              },
              "partialSelection": {
                "description": "Allow partial selection of violations.",
                "title": "Allow partial selection of violations",
                "type": "boolean",
              },
            },
            "required": [],
            "title": "Options for correct mode",
            "type": "object",
          },
          "root": {
            "description": "Project root.

      **This directory must contain the ESLint configuration file.**

      This also affects the default location of the ESLint todo file.",
            "title": "Project root",
            "type": "string",
          },
          "suppressionsLocation": {
            "description": "The path to the ESLint bulk suppressions file.",
            "title": "The path to the ESLint bulk suppressions file",
            "type": "string",
          },
        },
        "required": [],
        "type": "object",
      }
    `);
  });
});
