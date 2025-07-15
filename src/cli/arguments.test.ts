import { describe, expect, it } from "vitest";

import { parseArguments } from "./arguments";

describe("CLI Arguments", () => {
  describe("mode handling", () => {
    const testCases: Array<{
      input: Parameters<typeof parseArguments>[0];
      name: string;
      tAssert: (result: ReturnType<typeof parseArguments>) => void;
    }> = [
      {
        input: {
          config: {
            correct: {
              "autoFixableOnly": true,
              "exclude.files": undefined,
              "exclude.rules": undefined,
              "include.files": undefined,
              "include.rules": undefined,
              "limit.count": undefined,
              "limit.type": undefined,
              "partialSelection": undefined,
            },
            root: undefined,
            todoFile: "custom-todo.json",
          },
          mode: {
            correct: true,
            mcp: false,
          },
        },
        name: "should handle correct mode with autoFixableOnly",
        tAssert: (result) => {
          expect(result.context.mode).toBe("correct");
          expect(result.inputConfig.todoFile).toBe("custom-todo.json");
          expect(result.inputConfig.correct?.autoFixableOnly).toBe(true);
        },
      },
      {
        input: {
          config: {
            correct: {
              "autoFixableOnly": undefined,
              "exclude.files": undefined,
              "exclude.rules": undefined,
              "include.files": undefined,
              "include.rules": undefined,
              "limit.count": undefined,
              "limit.type": undefined,
              "partialSelection": undefined,
            },
            root: "/custom/root",
            todoFile: undefined,
          },
          mode: {
            correct: false,
            mcp: false,
          },
        },
        name: "should handle generate mode",
        tAssert: (result) => {
          expect(result.context.mode).toBe("generate");
          expect(result.inputConfig.root).toBe("/custom/root");
        },
      },
      {
        input: {
          config: {
            correct: {
              "autoFixableOnly": undefined,
              "exclude.files": undefined,
              "exclude.rules": undefined,
              "include.files": undefined,
              "include.rules": undefined,
              "limit.count": undefined,
              "limit.type": undefined,
              "partialSelection": undefined,
            },
            root: undefined,
            todoFile: undefined,
          },
          mode: {
            correct: false,
            mcp: true,
          },
        },
        name: "should handle mcp mode",
        tAssert: (result) => {
          expect(result.context.mode).toBe("mcp");
        },
      },
    ];

    // eslint-disable-next-line vitest/expect-expect
    it.each(testCases)("$name", ({ input, tAssert }) => {
      const result = parseArguments(input);
      tAssert(result);
    });
  });

  describe("filter options handling", () => {
    const testCases: Array<{
      input: Parameters<typeof parseArguments>[0];
      name: string;
      tAssert: (result: ReturnType<typeof parseArguments>) => void;
    }> = [
      {
        input: {
          config: {
            correct: {
              "autoFixableOnly": undefined,
              "exclude.files": undefined,
              "exclude.rules": ["no-console", "no-unused-vars"],
              "include.files": undefined,
              "include.rules": undefined,
              "limit.count": undefined,
              "limit.type": undefined,
              "partialSelection": undefined,
            },
            root: undefined,
            todoFile: undefined,
          },
          mode: {
            correct: true,
            mcp: false,
          },
        },
        name: "should handle exclude.rules",
        tAssert: (result) => {
          expect(result.context.mode).toBe("correct");
          expect(result.inputConfig.correct?.exclude?.rules).toStrictEqual([
            "no-console",
            "no-unused-vars",
          ]);
        },
      },
      {
        input: {
          config: {
            correct: {
              "autoFixableOnly": undefined,
              "exclude.files": ["dist/**", "build/**", ".cache/**"],
              "exclude.rules": undefined,
              "include.files": undefined,
              "include.rules": undefined,
              "limit.count": undefined,
              "limit.type": undefined,
              "partialSelection": undefined,
            },
            root: undefined,
            todoFile: undefined,
          },
          mode: {
            correct: true,
            mcp: false,
          },
        },
        name: "should handle exclude.files",
        tAssert: (result) => {
          expect(result.context.mode).toBe("correct");
          expect(result.inputConfig.correct?.exclude?.files).toStrictEqual([
            "dist/**",
            "build/**",
            ".cache/**",
          ]);
        },
      },
      {
        input: {
          config: {
            correct: {
              "autoFixableOnly": undefined,
              "exclude.files": undefined,
              "exclude.rules": undefined,
              "include.files": ["src/**/*.ts", "app/**/*.tsx"],
              "include.rules": undefined,
              "limit.count": undefined,
              "limit.type": undefined,
              "partialSelection": undefined,
            },
            root: undefined,
            todoFile: undefined,
          },
          mode: {
            correct: true,
            mcp: false,
          },
        },
        name: "should handle include.files",
        tAssert: (result) => {
          expect(result.context.mode).toBe("correct");
          expect(result.inputConfig.correct?.include?.files).toStrictEqual([
            "src/**/*.ts",
            "app/**/*.tsx",
          ]);
        },
      },
      {
        input: {
          config: {
            correct: {
              "autoFixableOnly": undefined,
              "exclude.files": undefined,
              "exclude.rules": undefined,
              "include.files": undefined,
              "include.rules": [
                "no-console",
                "@typescript-eslint/no-unused-vars",
              ],
              "limit.count": undefined,
              "limit.type": undefined,
              "partialSelection": undefined,
            },
            root: undefined,
            todoFile: undefined,
          },
          mode: {
            correct: true,
            mcp: false,
          },
        },
        name: "should handle include.rules",
        tAssert: (result) => {
          expect(result.context.mode).toBe("correct");
          expect(result.inputConfig.correct?.include?.rules).toStrictEqual([
            "no-console",
            "@typescript-eslint/no-unused-vars",
          ]);
        },
      },
      {
        input: {
          config: {
            correct: {
              "autoFixableOnly": undefined,
              "exclude.files": undefined,
              "exclude.rules": undefined,
              "include.files": ["src/**/*.ts", "app/**/*.tsx"],
              "include.rules": [
                "no-console",
                "@typescript-eslint/no-unused-vars",
              ],
              "limit.count": undefined,
              "limit.type": undefined,
              "partialSelection": undefined,
            },
            root: undefined,
            todoFile: undefined,
          },
          mode: {
            correct: true,
            mcp: false,
          },
        },
        name: "should handle both include.files and include.rules",
        tAssert: (result) => {
          expect(result.context.mode).toBe("correct");
          expect(result.inputConfig.correct?.include?.files).toStrictEqual([
            "src/**/*.ts",
            "app/**/*.tsx",
          ]);
          expect(result.inputConfig.correct?.include?.rules).toStrictEqual([
            "no-console",
            "@typescript-eslint/no-unused-vars",
          ]);
        },
      },
      {
        input: {
          config: {
            correct: {
              "autoFixableOnly": undefined,
              "exclude.files": ["dist/**", "node_modules/**"],
              "exclude.rules": ["no-console", "no-unused-vars"],
              "include.files": undefined,
              "include.rules": undefined,
              "limit.count": undefined,
              "limit.type": undefined,
              "partialSelection": undefined,
            },
            root: undefined,
            todoFile: undefined,
          },
          mode: {
            correct: true,
            mcp: false,
          },
        },
        name: "should handle both exclude.files and exclude.rules",
        tAssert: (result) => {
          expect(result.context.mode).toBe("correct");
          expect(result.inputConfig.correct?.exclude?.files).toStrictEqual([
            "dist/**",
            "node_modules/**",
          ]);
          expect(result.inputConfig.correct?.exclude?.rules).toStrictEqual([
            "no-console",
            "no-unused-vars",
          ]);
        },
      },
      {
        input: {
          config: {
            correct: {
              "autoFixableOnly": undefined,
              "exclude.files": ["**/*.test.ts", "**/*.spec.ts"],
              "exclude.rules": undefined,
              "include.files": ["src/**/*.ts", "app/**/*.tsx"],
              "include.rules": undefined,
              "limit.count": undefined,
              "limit.type": undefined,
              "partialSelection": undefined,
            },
            root: undefined,
            todoFile: undefined,
          },
          mode: {
            correct: true,
            mcp: false,
          },
        },
        name: "should handle both exclude.files and include.files",
        tAssert: (result) => {
          expect(result.context.mode).toBe("correct");
          expect(result.inputConfig.correct?.exclude?.files).toStrictEqual([
            "**/*.test.ts",
            "**/*.spec.ts",
          ]);
          expect(result.inputConfig.correct?.include?.files).toStrictEqual([
            "src/**/*.ts",
            "app/**/*.tsx",
          ]);
        },
      },
    ];

    // eslint-disable-next-line vitest/expect-expect
    it.each(testCases)("$name", ({ input, tAssert }) => {
      const result = parseArguments(input);
      tAssert(result);
    });
  });

  describe("parameter validation", () => {
    const testCases: Array<{
      input: Parameters<typeof parseArguments>[0];
      name: string;
      tAssert: (result: ReturnType<typeof parseArguments>) => void;
    }> = [
      {
        input: {
          config: {
            correct: {
              "autoFixableOnly": undefined,
              "exclude.files": undefined,
              "exclude.rules": undefined,
              "include.files": undefined,
              "include.rules": undefined,
              "limit.count": undefined,
              "limit.type": undefined,
              "partialSelection": undefined,
            },
            root: undefined,
            todoFile: undefined,
          },
          mode: {
            correct: false,
            mcp: false,
          },
        },
        name: "should handle default generate mode with no custom settings",
        tAssert: (result) => {
          expect(result.context.mode).toBe("generate");
        },
      },
      {
        input: {
          config: {
            correct: {
              "autoFixableOnly": undefined,
              "exclude.files": undefined,
              "exclude.rules": undefined,
              "include.files": undefined,
              "include.rules": undefined,
              "limit.count": undefined,
              "limit.type": undefined,
              "partialSelection": undefined,
            },
            root: undefined,
            todoFile: "custom.json",
          },
          mode: {
            correct: false,
            mcp: false,
          },
        },
        name: "should handle todoFile setting",
        tAssert: (result) => {
          expect(result.context.mode).toBe("generate");
          expect(result.inputConfig.todoFile).toBe("custom.json");
        },
      },
      {
        input: {
          config: {
            correct: {
              "autoFixableOnly": undefined,
              "exclude.files": undefined,
              "exclude.rules": undefined,
              "include.files": undefined,
              "include.rules": undefined,
              "limit.count": undefined,
              "limit.type": undefined,
              "partialSelection": undefined,
            },
            root: "/custom/path",
            todoFile: undefined,
          },
          mode: {
            correct: false,
            mcp: false,
          },
        },
        name: "should handle root setting",
        tAssert: (result) => {
          expect(result.context.mode).toBe("generate");
          expect(result.inputConfig.root).toBe("/custom/path");
        },
      },
      {
        input: {
          config: {
            correct: {
              "autoFixableOnly": undefined,
              "exclude.files": undefined,
              "exclude.rules": undefined,
              "include.files": undefined,
              "include.rules": undefined,
              "limit.count": undefined,
              "limit.type": undefined,
              "partialSelection": false,
            },
            root: undefined,
            todoFile: undefined,
          },
          mode: {
            correct: false,
            mcp: false,
          },
        },
        name: "should handle correct.partialSelection setting",
        tAssert: (result) => {
          expect(result.context.mode).toBe("generate");
          expect(result.inputConfig.correct?.partialSelection).toBe(false);
        },
      },
      {
        input: {
          config: {
            correct: {
              "autoFixableOnly": undefined,
              "exclude.files": undefined,
              "exclude.rules": undefined,
              "include.files": undefined,
              "include.rules": undefined,
              "limit.count": 10,
              "limit.type": undefined,
              "partialSelection": undefined,
            },
            root: undefined,
            todoFile: undefined,
          },
          mode: {
            correct: false,
            mcp: false,
          },
        },
        name: "should handle correct.limit.count setting",
        tAssert: (result) => {
          expect(result.context.mode).toBe("generate");
          expect(result.inputConfig.correct?.limit?.count).toBe(10);
        },
      },
      {
        input: {
          config: {
            correct: {
              "autoFixableOnly": undefined,
              "exclude.files": undefined,
              "exclude.rules": undefined,
              "include.files": undefined,
              "include.rules": undefined,
              "limit.count": undefined,
              "limit.type": "violation",
              "partialSelection": undefined,
            },
            root: undefined,
            todoFile: undefined,
          },
          mode: {
            correct: false,
            mcp: false,
          },
        },
        name: "should handle correct.limit.type setting",
        tAssert: (result) => {
          expect(result.context.mode).toBe("generate");
          expect(result.inputConfig.correct?.limit?.type).toBe("violation");
        },
      },
      {
        input: {
          config: {
            correct: {
              "autoFixableOnly": undefined,
              "exclude.files": undefined,
              "exclude.rules": [],
              "include.files": undefined,
              "include.rules": undefined,
              "limit.count": undefined,
              "limit.type": undefined,
              "partialSelection": undefined,
            },
            root: undefined,
            todoFile: undefined,
          },
          mode: {
            correct: false,
            mcp: false,
          },
        },
        name: "should handle empty array for exclude.rules",
        tAssert: (result) => {
          expect(result.context.mode).toBe("generate");
          expect(result.inputConfig.correct?.exclude?.rules).toStrictEqual([]);
        },
      },
    ];

    // eslint-disable-next-line vitest/expect-expect
    it.each(testCases)("$name", ({ input, tAssert }) => {
      const result = parseArguments(input);
      tAssert(result);
    });
  });
});
