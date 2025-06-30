import { createFixture } from "fs-fixture";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { isNonEmptyString } from "../../utils/string";
import { resolveConfigPath } from "./resolve";

describe("resolveConfigPath", () => {
  let fixture: Awaited<ReturnType<typeof createFixture>>;

  beforeEach(async () => {
    fixture = await createFixture({
      "another-project": {
        "eslint.config.mjs": `
          export default [];
        `,
      },
      "multiple-configs-js-first": {
        "eslint.config.js": `
          export default [];
        `,
        "eslint.config.mjs": `
          export default [];
        `,
        "eslint.config.ts": `
          export default [];
        `,
      },
      "multiple-configs-mjs-first": {
        "eslint.config.cjs": `
          module.exports = [];
        `,
        "eslint.config.cts": `
          export default [];
        `,
        "eslint.config.mjs": `
          export default [];
        `,
      },
      "multiple-parent-configs": {
        "eslint.config.ts": `
          // root config
          export default [];
        `,
        level1: {
          "eslint.config.js": `
            // level1 config
            export default [];
          `,
          level2: {
            "eslint.config.mjs": `
              // level2 config
              export default [];
            `,
            level3: {
              "file.js": "console.log('deeply nested');",
            },
          },
        },
      },
      "no-config": {
        "file.js": "console.log('no config');",
      },
      "parent-child-configs": {
        child: {
          "eslint.config.mjs": `
            // child config
            export default [];
          `,
          grandchild: {
            "file.js": "console.log('test');",
          },
        },
        "eslint.config.js": `
          // parent config
          export default [];
        `,
      },
      project: {
        deeply: {
          nested: {
            directories: {
              "file.js": "console.log('deeply nested');",
            },
          },
        },
        "eslint.config.js": `
          export default [];
        `,
        nested: {
          "file.js": "console.log('test');",
        },
      },
    });
  });

  afterEach(async () => {
    await fixture.rm();
  });

  const testCases: Array<
    | {
        cwd: string;
        expectedPathContains: string;
        name: string;
        shouldThrow: false;
      }
    | {
        cwd: string;
        name: string;
        shouldThrow: true;
      }
  > = [
    {
      cwd: "project",
      expectedPathContains: "project/eslint.config.js",
      name: "basic config resolution",
      shouldThrow: false,
    },
    {
      cwd: "another-project",
      expectedPathContains: "another-project/eslint.config.mjs",
      name: "mjs config resolution",
      shouldThrow: false,
    },
    { cwd: "no-config", name: "no config throws", shouldThrow: true },
    {
      cwd: "project/nested",
      expectedPathContains: "project/eslint.config.js",
      name: "nested directory traversal",
      shouldThrow: false,
    },
    {
      cwd: "multiple-configs-js-first",
      expectedPathContains: "multiple-configs-js-first/eslint.config.js",
      name: "js priority over other formats",
      shouldThrow: false,
    },
    {
      cwd: "multiple-configs-mjs-first",
      expectedPathContains: "multiple-configs-mjs-first/eslint.config.mjs",
      name: "mjs priority when js absent",
      shouldThrow: false,
    },
    {
      cwd: "parent-child-configs/child/grandchild",
      expectedPathContains: "parent-child-configs/child/eslint.config.mjs",
      name: "closest parent config priority",
      shouldThrow: false,
    },
    {
      cwd: "multiple-parent-configs/level1/level2/level3",
      expectedPathContains:
        "multiple-parent-configs/level1/level2/eslint.config.mjs",
      name: "nearest config priority",
      shouldThrow: false,
    },
  ];

  it.each(testCases)("$name", ({ cwd, ...testCase }) => {
    const cwdPath = fixture.getPath(cwd);

    if (testCase.shouldThrow) {
      expect(() => resolveConfigPath(cwdPath)).toThrow(
        new Error("No eslint config found"),
      );
    } else {
      const result = resolveConfigPath(cwdPath);

      expect(result).toHaveProperty("basePath");
      expect(result).toHaveProperty("fullPath");

      if (isNonEmptyString(testCase.expectedPathContains)) {
        expect(result.fullPath).toContain(testCase.expectedPathContains);
      } else {
        throw new Error(
          "expectedPathContains is required when shouldThrow is false",
        );
      }
    }
  });
});
