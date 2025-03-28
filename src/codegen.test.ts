import { describe, expect, it } from "vitest";

import type { TodoModuleLike } from "./todofile/types";
// TODO: ここでは本当に TodoModuleV1Handler が必要
// eslint-disable-next-line @typescript-eslint/no-restricted-imports
import type { TodoModuleV1 } from "./todofile/v1";
import type { TodoModuleV2 } from "./todofile/v2";

import { generateTodoModuleCode } from "./codegen";

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

    const result = generateTodoModuleCode(eslintTodo);

    expect(result).toMatchInlineSnapshot(`
      "/* eslint-disable */
      /**
       * Auto generated file by eslint-todo. DO NOT EDIT MANUALLY.
       */

      /* prettier-ignore */
      // biome-ignore format: this is an auto-generated file
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

    const result = generateTodoModuleCode(eslintTodo);

    expect(result).toMatchInlineSnapshot(`
      "/* eslint-disable */
      /**
       * Auto generated file by eslint-todo. DO NOT EDIT MANUALLY.
       */

      /* prettier-ignore */
      // biome-ignore format: this is an auto-generated file
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

    const result = generateTodoModuleCode(eslintTodo);

    expect(result).toMatchInlineSnapshot(`
      "/* eslint-disable */
      /**
       * Auto generated file by eslint-todo. DO NOT EDIT MANUALLY.
       */

      /* prettier-ignore */
      // biome-ignore format: this is an auto-generated file
      export default {};
      "
    `);
  });
});
