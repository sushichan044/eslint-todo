import { describe, expect, it } from "vitest";

import { parseArguments } from "./arguments";

describe("CLI Arguments", () => {
  it("parseArguments should handle correct mode with autoFixableOnly", () => {
    const result = parseArguments({
      correct: {
        "autoFixableOnly": true,
        "exclude.rules": undefined,
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
        "exclude.rules": undefined,
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
        "exclude.rules": undefined,
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
        "exclude.rules": "no-console,no-unused-vars,",
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
    expect(result.userConfig.correct?.exclude?.rules).toEqual([
      "no-console",
      "no-unused-vars",
    ]);
  });
});
