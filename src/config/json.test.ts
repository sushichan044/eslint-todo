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
              "importGraph": {
                "description": "Import graph configuration for dependency-based file filtering.",
                "properties": {
                  "dependencyDepth": {
                    "description": "Maximum dependency depth to traverse.
      If not specified, will traverse the entire dependency tree.",
                    "title": "Maximum dependency depth to traverse",
                    "type": "number",
                  },
                  "enabled": {
                    "description": "Whether to enable import graph-based file filtering.",
                    "title": "Whether to enable import graph-based file filtering",
                    "type": "boolean",
                  },
                  "entryPoints": {
                    "description": "Entry point files to start the dependency analysis from.
      These can be glob patterns or specific file paths.",
                    "items": {
                      "type": "string",
                    },
                    "title": "Entry point files to start the dependency analysis from",
                    "type": "array",
                  },
                  "mode": {
                    "description": "Mode for selecting files based on the import graph.
      - 'dependents': Files that depend on the entry points (upstream)
      - 'dependencies': Files that the entry points depend on (downstream)
      - 'connected': All files connected to the entry points (both directions)",
                    "oneOf": [
                      {
                        "const": "connected",
                      },
                      {
                        "const": "dependencies",
                      },
                      {
                        "const": "dependents",
                      },
                    ],
                    "title": "Mode for selecting files based on the import graph",
                  },
                },
                "required": [],
                "title": "Import graph configuration for dependency-based file filtering",
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
