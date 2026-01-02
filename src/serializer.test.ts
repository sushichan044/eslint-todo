import { describe, expect, it } from "vitest";

import type { TodoModuleV1 } from "./todofile/v1";
import type { TodoModuleV2 } from "./todofile/v2";

import { TodoModuleSerializer } from "./serializer";

describe("TodoModuleSerializer", () => {
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

    const result = TodoModuleSerializer.fromV1(eslintTodo);

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

    const result = TodoModuleSerializer.fromV2(eslintTodo);

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
});
