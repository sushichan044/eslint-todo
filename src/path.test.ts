import { describe, expect, it } from "vitest";

import type { Options } from "./options";

import { resolveTodoModulePath } from "./path";

describe("resolveTodoFilePath", () => {
  it("should resolve the correct absolute and relative paths", () => {
    const options: Options = {
      cwd: "/home/sushi/workspace",
      todoFile: ".eslint-todo.js",
    };

    const result = resolveTodoModulePath(options);

    expect(result).toStrictEqual({
      absolute: "/home/sushi/workspace/.eslint-todo.js",
      relative: ".eslint-todo.js",
    });
  });

  it("should handle nested todoFile paths", () => {
    const options: Options = {
      cwd: "/home/sushi/workspace",
      todoFile: "nested/.eslint-todo.js",
    };

    const result = resolveTodoModulePath(options);

    expect(result).toStrictEqual({
      absolute: "/home/sushi/workspace/nested/.eslint-todo.js",
      relative: "nested/.eslint-todo.js",
    });
  });

  it("should handle absolute todoFile paths", () => {
    const options: Options = {
      cwd: "/home/sushi/workspace",
      todoFile: "/home/sushi/.eslint-todo.js",
    };

    const result = resolveTodoModulePath(options);

    expect(result).toStrictEqual({
      absolute: "/home/sushi/.eslint-todo.js",
      relative: "../.eslint-todo.js",
    });
  });
});
