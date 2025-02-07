import { describe, expect, it } from "vitest";

import type { ESLintTodo } from "./types";

import { generateESLintTodoModule } from "./codegen";

describe("generateESLintTodoModule", () => {
  it("should generate a JavaScript module with the given ESLint todo list", () => {
    const eslintTodo: ESLintTodo = {
      "no-console": {
        autoFix: false,
        files: ["file1.js"],
      },
      "no-unused-vars": {
        autoFix: false,
        files: ["file2.js", "file3.js"],
      },
    };

    const result = generateESLintTodoModule(eslintTodo);

    expect(result).toMatchInlineSnapshot(`
      "/* eslint-disable */
      /**
       * Auto generated file by eslint-todo. DO NOT EDIT MANUALLY.
       */

      export default {
        "no-console": {
          autoFix: false,
          files: ["file1.js"]
        },

        "no-unused-vars": {
          autoFix: false,
          files: ["file2.js", "file3.js"]
        }
      };
      "
    `);
  });

  it("should generate an empty JavaScript module if the ESLint todo list is empty", () => {
    const eslintTodo: ESLintTodo = {};

    const result = generateESLintTodoModule(eslintTodo);

    expect(result).toMatchInlineSnapshot(`
      "/* eslint-disable */
      /**
       * Auto generated file by eslint-todo. DO NOT EDIT MANUALLY.
       */

      export default {};
      "
    `);
  });
});
