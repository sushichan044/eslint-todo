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
    expect(result.inputConfig.todoFile).toBe("custom-todo.json");
    expect(result.inputConfig.correct?.autoFixableOnly).toBe(true);
    expect(result.isDirty).toBe(true);
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
    expect(result.inputConfig.root).toBe("/custom/root");
    expect(result.isDirty).toBe(true);
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
    expect(result.isDirty).toBe(true);
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
    expect(result.inputConfig.correct?.exclude?.rules).toStrictEqual([
      "no-console",
      "no-unused-vars",
    ]);
    expect(result.isDirty).toBe(true);
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
    expect(result.inputConfig.correct?.exclude?.files).toStrictEqual([
      "dist/**",
      "build/**",
      ".cache/**",
    ]);
    expect(result.isDirty).toBe(true);
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
    expect(result.inputConfig.correct?.include?.files).toStrictEqual([
      "src/**/*.ts",
      "app/**/*.tsx",
    ]);
    expect(result.isDirty).toBe(true);
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
    expect(result.inputConfig.correct?.include?.rules).toStrictEqual([
      "no-console",
      "@typescript-eslint/no-unused-vars",
    ]);
    expect(result.isDirty).toBe(true);
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
    expect(result.inputConfig.correct?.include?.files).toStrictEqual([
      "src/**/*.ts",
      "app/**/*.tsx",
    ]);
    expect(result.inputConfig.correct?.include?.rules).toStrictEqual([
      "no-console",
      "@typescript-eslint/no-unused-vars",
    ]);
    expect(result.isDirty).toBe(true);
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
    expect(result.inputConfig.correct?.exclude?.files).toStrictEqual([
      "dist/**",
      "node_modules/**",
    ]);
    expect(result.inputConfig.correct?.exclude?.rules).toStrictEqual([
      "no-console",
      "no-unused-vars",
    ]);
    expect(result.isDirty).toBe(true);
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
    expect(result.inputConfig.correct?.exclude?.files).toStrictEqual([
      "**/*.test.ts",
      "**/*.spec.ts",
    ]);
    expect(result.inputConfig.correct?.include?.files).toStrictEqual([
      "src/**/*.ts",
      "app/**/*.tsx",
    ]);
    expect(result.isDirty).toBe(true);
  });

  describe("isDirty checks", () => {
    it("should return isDirty=false for default generate mode with no custom settings", () => {
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
        root: undefined,
        todoFile: undefined,
      });

      expect(result.context.mode).toBe("generate");
      expect(result.isDirty).toBe(false);
    });

    it("should return isDirty=true when only todoFile is set", () => {
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
        root: undefined,
        todoFile: "custom.json",
      });

      expect(result.context.mode).toBe("generate");
      expect(result.isDirty).toBe(true);
    });

    it("should return isDirty=true when only root is set", () => {
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
        root: "/custom/path",
        todoFile: undefined,
      });

      expect(result.context.mode).toBe("generate");
      expect(result.isDirty).toBe(true);
    });

    it("should return isDirty=true when only correct.partialSelection is set", () => {
      const result = parseArguments({
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
        mode: {
          correct: false,
          mcp: false,
        },
        root: undefined,
        todoFile: undefined,
      });

      expect(result.context.mode).toBe("generate");
      expect(result.isDirty).toBe(true);
    });

    it("should return isDirty=true when only correct.limit.count is set", () => {
      const result = parseArguments({
        correct: {
          "autoFixableOnly": undefined,
          "exclude.files": undefined,
          "exclude.rules": undefined,
          "include.files": undefined,
          "include.rules": undefined,
          "limit.count": "10",
          "limit.type": undefined,
          "partialSelection": undefined,
        },
        mode: {
          correct: false,
          mcp: false,
        },
        root: undefined,
        todoFile: undefined,
      });

      expect(result.context.mode).toBe("generate");
      expect(result.inputConfig.correct?.limit?.count).toBe(10);
      expect(result.isDirty).toBe(true);
    });

    it("should return isDirty=true when only correct.limit.type is set", () => {
      const result = parseArguments({
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
        mode: {
          correct: false,
          mcp: false,
        },
        root: undefined,
        todoFile: undefined,
      });

      expect(result.context.mode).toBe("generate");
      expect(result.inputConfig.correct?.limit?.type).toBe("violation");
      expect(result.isDirty).toBe(true);
    });

    it("should return isDirty=true when empty string is provided for exclude.rules", () => {
      const result = parseArguments({
        correct: {
          "autoFixableOnly": undefined,
          "exclude.files": undefined,
          "exclude.rules": "",
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
        root: undefined,
        todoFile: undefined,
      });

      expect(result.context.mode).toBe("generate");
      expect(result.inputConfig.correct?.exclude?.rules).toStrictEqual([]);
      expect(result.isDirty).toBe(true);
    });
  });

  describe("limit validation", () => {
    it("should throw error for invalid limit.count", () => {
      expect(() => {
        parseArguments({
          correct: {
            "autoFixableOnly": undefined,
            "exclude.files": undefined,
            "exclude.rules": undefined,
            "include.files": undefined,
            "include.rules": undefined,
            "limit.count": "invalid",
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
      }).toThrowError("limit must be a number");
    });

    it("should throw error for invalid limit.type", () => {
      expect(() => {
        parseArguments({
          correct: {
            "autoFixableOnly": undefined,
            "exclude.files": undefined,
            "exclude.rules": undefined,
            "include.files": undefined,
            "include.rules": undefined,
            "limit.count": undefined,
            "limit.type": "invalid",
            "partialSelection": undefined,
          },
          mode: {
            correct: true,
            mcp: false,
          },
          root: undefined,
          todoFile: undefined,
        });
      }).toThrowError(
        "limit-type must be either 'violation' or 'file', got invalid",
      );
    });
  });
});
