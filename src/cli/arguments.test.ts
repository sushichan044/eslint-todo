import { describe, expect, it } from "vitest";

import { parseArguments } from "./arguments";

describe("CLI Arguments", () => {
  it("parseArguments should handle correct mode with autoFixableOnly", () => {
    const result = parseArguments({
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
      mode: {
        correct: true,
        mcp: false,
      },
      root: undefined,
      todoFile: "custom-todo.json",
    });

    expect(result.context.mode).toBe("correct");
    expect(result.userConfig.todoFile).toBe("custom-todo.json");
    expect(result.userConfig.correct?.autoFixableOnly).toBe(true);
  });

  it("parseArguments should handle generate mode", () => {
    const result = parseArguments({
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
      mode: {
        correct: false,
        mcp: false,
      },
      root: "/custom/root",
      todoFile: undefined,
    });

    expect(result.context.mode).toBe("generate");
    expect(result.userConfig.root).toBe("/custom/root");
  });

  it("parseArguments should handle mcp mode", () => {
    const result = parseArguments({
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
      mode: {
        correct: false,
        mcp: true,
      },
      root: undefined,
      todoFile: undefined,
    });

    expect(result.context.mode).toBe("mcp");
  });

  it("parseArguments should handle exclude.rules", () => {
    const result = parseArguments({
      correct: {
        "autoFixableOnly": undefined,
        "exclude.files": undefined,
        "exclude.rules": "no-console,no-unused-vars,",
        "include.files": undefined,
        "include.rules": undefined,
        "limit.count": undefined,
        "limit.type": undefined,
        "partialSelection": undefined,
      },
      mode: {
        correct: true,
        mcp: false,
      },
      root: undefined,
      todoFile: undefined,
    });

    expect(result.context.mode).toBe("correct");
    expect(result.userConfig.correct?.exclude?.rules).toStrictEqual([
      "no-console",
      "no-unused-vars",
    ]);
  });

  it("parseArguments should handle exclude.files", () => {
    const result = parseArguments({
      correct: {
        "autoFixableOnly": undefined,
        "exclude.files": "dist/**,build/**,.cache/**,",
        "exclude.rules": undefined,
        "include.files": undefined,
        "include.rules": undefined,
        "limit.count": undefined,
        "limit.type": undefined,
        "partialSelection": undefined,
      },
      mode: {
        correct: true,
        mcp: false,
      },
      root: undefined,
      todoFile: undefined,
    });

    expect(result.context.mode).toBe("correct");
    expect(result.userConfig.correct?.exclude?.files).toStrictEqual([
      "dist/**",
      "build/**",
      ".cache/**",
    ]);
  });

  it("parseArguments should handle include.files", () => {
    const result = parseArguments({
      correct: {
        "autoFixableOnly": undefined,
        "exclude.files": undefined,
        "exclude.rules": undefined,
        "include.files": "src/**/*.ts,app/**/*.tsx,",
        "include.rules": undefined,
        "limit.count": undefined,
        "limit.type": undefined,
        "partialSelection": undefined,
      },
      mode: {
        correct: true,
        mcp: false,
      },
      root: undefined,
      todoFile: undefined,
    });

    expect(result.context.mode).toBe("correct");
    expect(result.userConfig.correct?.include?.files).toStrictEqual([
      "src/**/*.ts",
      "app/**/*.tsx",
    ]);
  });

  it("parseArguments should handle include.rules", () => {
    const result = parseArguments({
      correct: {
        "autoFixableOnly": undefined,
        "exclude.files": undefined,
        "exclude.rules": undefined,
        "include.files": undefined,
        "include.rules": "no-console,@typescript-eslint/no-unused-vars,",
        "limit.count": undefined,
        "limit.type": undefined,
        "partialSelection": undefined,
      },
      mode: {
        correct: true,
        mcp: false,
      },
      root: undefined,
      todoFile: undefined,
    });

    expect(result.context.mode).toBe("correct");
    expect(result.userConfig.correct?.include?.rules).toStrictEqual([
      "no-console",
      "@typescript-eslint/no-unused-vars",
    ]);
  });

  it("parseArguments should handle both include.files and include.rules", () => {
    const result = parseArguments({
      correct: {
        "autoFixableOnly": undefined,
        "exclude.files": undefined,
        "exclude.rules": undefined,
        "include.files": "src/**/*.ts,app/**/*.tsx",
        "include.rules": "no-console,@typescript-eslint/no-unused-vars",
        "limit.count": undefined,
        "limit.type": undefined,
        "partialSelection": undefined,
      },
      mode: {
        correct: true,
        mcp: false,
      },
      root: undefined,
      todoFile: undefined,
    });

    expect(result.context.mode).toBe("correct");
    expect(result.userConfig.correct?.include?.files).toStrictEqual([
      "src/**/*.ts",
      "app/**/*.tsx",
    ]);
    expect(result.userConfig.correct?.include?.rules).toStrictEqual([
      "no-console",
      "@typescript-eslint/no-unused-vars",
    ]);
  });

  it("parseArguments should handle both exclude.files and exclude.rules", () => {
    const result = parseArguments({
      correct: {
        "autoFixableOnly": undefined,
        "exclude.files": "dist/**,node_modules/**",
        "exclude.rules": "no-console,no-unused-vars",
        "include.files": undefined,
        "include.rules": undefined,
        "limit.count": undefined,
        "limit.type": undefined,
        "partialSelection": undefined,
      },
      mode: {
        correct: true,
        mcp: false,
      },
      root: undefined,
      todoFile: undefined,
    });

    expect(result.context.mode).toBe("correct");
    expect(result.userConfig.correct?.exclude?.files).toStrictEqual([
      "dist/**",
      "node_modules/**",
    ]);
    expect(result.userConfig.correct?.exclude?.rules).toStrictEqual([
      "no-console",
      "no-unused-vars",
    ]);
  });

  it("parseArguments should handle both exclude.files and include.files", () => {
    const result = parseArguments({
      correct: {
        "autoFixableOnly": undefined,
        "exclude.files": "**/*.test.ts,**/*.spec.ts",
        "exclude.rules": undefined,
        "include.files": "src/**/*.ts,app/**/*.tsx",
        "include.rules": undefined,
        "limit.count": undefined,
        "limit.type": undefined,
        "partialSelection": undefined,
      },
      mode: {
        correct: true,
        mcp: false,
      },
      root: undefined,
      todoFile: undefined,
    });

    expect(result.context.mode).toBe("correct");
    expect(result.userConfig.correct?.exclude?.files).toStrictEqual([
      "**/*.test.ts",
      "**/*.spec.ts",
    ]);
    expect(result.userConfig.correct?.include?.files).toStrictEqual([
      "src/**/*.ts",
      "app/**/*.tsx",
    ]);
  });
});
