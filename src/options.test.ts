import { cwd } from "node:process";
import { describe, expect, it } from "vitest";

import type { Options } from "./options";

import { optionsWithDefault } from "./options";

describe("optionsWithDefault", () => {
  it("should return default options when no user options are provided", () => {
    const result = optionsWithDefault();
    const expected: Options = {
      cwd: cwd(),
      todoFile: ".eslint-todo.js",
    };
    expect(result).toStrictEqual(expected);
  });

  it("should override default options with user options", () => {
    const userOptions = {
      todoFile: "custom-todo.js",
    };
    const result = optionsWithDefault(userOptions);
    const expected: Options = {
      cwd: cwd(),
      todoFile: "custom-todo.js",
    };
    expect(result).toStrictEqual(expected);
  });

  it("should handle partial user options", () => {
    const userOptions = {
      cwd: "/custom/path",
    };
    const result = optionsWithDefault(userOptions);
    const expected: Options = {
      cwd: "/custom/path",
      todoFile: ".eslint-todo.js",
    };
    expect(result).toStrictEqual(expected);
  });

  it("should respect all user options", () => {
    const userOptions = {
      cwd: "/custom/path",
      todoFile: "custom-todo.js",
    };
    const result = optionsWithDefault(userOptions);
    const expected: Options = {
      cwd: "/custom/path",
      todoFile: "custom-todo.js",
    };
    expect(result).toStrictEqual(expected);
  });
});
