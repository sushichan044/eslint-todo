import { describe, expect, it } from "vitest";

import { UserConfigJsonSchema } from "./json";

describe("UserConfigJsonSchema matches snapshot", () => {
  it("should match snapshot", () => {
    // We are using unplugin-typia, so UserConfigJsonSchema will be transformed to a json schema object.

    expect(UserConfigJsonSchema).toMatchInlineSnapshot(`
      {
        "description": "Current Type: {@link UserConfig}",
        "properties": {
          "correct": {
            "description": "Options for correct mode.

      ------------------------------

      Current Type: {@link CorrectModeUserConfig}",
            "properties": {
              "autoFixableOnly": {
                "description": "Allow to select non auto-fixable rules.",
                "title": "Allow to select non auto-fixable rules",
                "type": "boolean",
              },
              "exclude": {
                "description": "Options for excluding todo items.",
                "properties": {
                  "files": {
                    "description": "Glob patterns for files to exclude from the operation.",
                    "items": {
                      "type": "string",
                    },
                    "title": "Glob patterns for files to exclude from the operation",
                    "type": "array",
                  },
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
              "include": {
                "description": "Options for including todo items.",
                "properties": {
                  "files": {
                    "description": "Glob patterns for files to include in the operation.",
                    "items": {
                      "type": "string",
                    },
                    "title": "Glob patterns for files to include in the operation",
                    "type": "array",
                  },
                  "rules": {
                    "description": "List of rules to include in the operation.",
                    "items": {
                      "type": "string",
                    },
                    "title": "List of rules to include in the operation",
                    "type": "array",
                  },
                },
                "required": [],
                "title": "Options for including todo items",
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
            "type": "object",
          },
          "root": {
            "description": "Project root.

      **This directory must contain the ESLint configuration file.**

      This also affects the default location of the ESLint todo file.",
            "title": "Project root",
            "type": "string",
          },
          "todoFile": {
            "description": "The file path to read and write the ESLint todo list.",
            "title": "The file path to read and write the ESLint todo list",
            "type": "string",
          },
        },
        "required": [],
        "type": "object",
      }
    `);
  });
});
