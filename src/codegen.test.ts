import { describe, expect, it } from "vitest";

import type { TodoModuleLike } from "./todofile/types";
import type { TodoModuleV1 } from "./todofile/v1";
import type { TodoModuleV2 } from "./todofile/v2";

import { generateESLintTodoModule } from "./codegen";

describe("generateESLintTodoModule", () => {
  it("can generate a TodoModule v1 JavaScript module", () => {
    const eslintTodo: TodoModuleV1 = {
      "no-console": {
        autoFix: false,
        files: ["file1.js"],
      },
      "no-unused-vars": {
        autoFix: false,
        files: ["file2.js", "file3.js", "file3.js"],
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
          files: ["file2.js", "file3.js", "file3.js"]
        }
      };
      "
    `);
  });

  it("can generate a TodoModule v2 JavaScript module", () => {
    const eslintTodo: TodoModuleV2 = {
      meta: {
        version: 2,
      },
      todo: {
        "no-console": {
          autoFix: false,
          violations: {
            "file1.js": 1,
          },
        },
      },
    };

    const result = generateESLintTodoModule(eslintTodo);

    expect(result).toMatchInlineSnapshot(`
      "/* eslint-disable */
      /**
       * Auto generated file by eslint-todo. DO NOT EDIT MANUALLY.
       */

      export default {
        meta: {
          version: 2
        },

        todo: {
          "no-console": {
            autoFix: false,

            violations: {
              "file1.js": 1
            }
          }
        }
      };
      "
    `);
  });

  it("should generate an empty JavaScript module if the module is empty", () => {
    const eslintTodo: TodoModuleLike = {};

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
