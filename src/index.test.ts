import { describe, expect, it } from "vitest";

import type { ESLintTodo } from "./types";

import { removeDuplicateFilesFromTodo } from "./index";

describe("removeDuplicateFilesFromTodo", () => {
  it("should remove duplicate files from the ESLintTodo object", () => {
    const input = {
      "no-console": {
        autoFix: false,
        files: ["file3.ts", "file3.ts", "file4.ts"],
      },
      "no-unused-vars": {
        autoFix: false,
        files: ["file1.ts", "file2.ts", "file1.ts"],
      },
    } satisfies ESLintTodo;

    const expectedOutput = {
      "no-console": {
        autoFix: false,
        files: ["file3.ts", "file4.ts"],
      },
      "no-unused-vars": {
        autoFix: false,
        files: ["file1.ts", "file2.ts"],
      },
    } satisfies ESLintTodo;

    const result = removeDuplicateFilesFromTodo(input);
    expect(result).toStrictEqual(expectedOutput);
  });

  it("should handle an empty ESLintTodo object", () => {
    const input: ESLintTodo = {};
    const expectedOutput: ESLintTodo = {};

    const result = removeDuplicateFilesFromTodo(input);
    expect(result).toStrictEqual(expectedOutput);
  });

  it("should not do anything if there are no duplicate files", () => {
    const input: ESLintTodo = {
      "no-console": {
        autoFix: true,
        files: ["file3.ts", "file4.ts"],
      },
      "no-unused-vars": {
        autoFix: false,
        files: ["file1.ts", "file2.ts"],
      },
    };

    const expectedOutput: ESLintTodo = {
      "no-console": {
        autoFix: true,
        files: ["file3.ts", "file4.ts"],
      },
      "no-unused-vars": {
        autoFix: false,
        files: ["file1.ts", "file2.ts"],
      },
    };

    const result = removeDuplicateFilesFromTodo(input);
    expect(result).toEqual(expectedOutput);
  });
});
