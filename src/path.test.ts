import { describe, expect, it } from "vitest";

import { configWithDefault } from "./config/config";
import { resolveTodoModulePath } from "./path";

describe("resolveTodoFilePath", () => {
  it("should resolve the correct absolute and relative paths", () => {
    const config = configWithDefault({
      root: "/home/sushi/workspace",
      todoFile: ".eslint-todo.js",
    });

    const result = resolveTodoModulePath(config);

    expect(result).toStrictEqual({
      absolute: "/home/sushi/workspace/.eslint-todo.js",
      relative: ".eslint-todo.js",
    });
  });

  it("should handle nested todoFile paths", () => {
    const config = configWithDefault({
      root: "/home/sushi/workspace",
      todoFile: "./nested/.eslint-todo.js",
    });
    const result = resolveTodoModulePath(config);

    expect(result).toStrictEqual({
      absolute: "/home/sushi/workspace/nested/.eslint-todo.js",
      relative: "nested/.eslint-todo.js",
    });
  });

  it("should handle absolute todoFile paths", () => {
    const config = configWithDefault({
      root: "/home/sushi/workspace",
      todoFile: "/home/sushi/.eslint-todo.js",
    });

    const result = resolveTodoModulePath(config);

    expect(result).toStrictEqual({
      absolute: "/home/sushi/.eslint-todo.js",
      relative: "../.eslint-todo.js",
    });
  });
});
