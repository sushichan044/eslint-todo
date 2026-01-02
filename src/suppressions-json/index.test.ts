import { describe, expect, it } from "vitest";

// eslint-disable-next-line @typescript-eslint/no-restricted-imports
import type { TodoModuleV1 } from "../todofile/v1";
import type { TodoModuleV2 } from "../todofile/v2";
import type { ESLintSuppressionsJson } from "./types";

import { buildESLintConfigWithSuppressionsJson, SuppressionsJsonGenerator } from "./index";

describe("SuppressionsJsonGenerator", () => {
  describe("fromV1", () => {
    it("should convert TodoModuleV1 to ESLintSuppressionsJson", () => {
      const todoModuleV1 = {
        "no-console": {
          autoFix: false,
          files: ["file1.js", "file2.js"],
        },
        "no-unused-vars": {
          autoFix: true,
          files: ["file2.js"],
        },
      } satisfies TodoModuleV1;

      const suppressionsJson = SuppressionsJsonGenerator.fromV1(todoModuleV1);

      expect(suppressionsJson).toStrictEqual({
        "file1.js": {
          "no-console": {
            count: 1,
          },
        },
        "file2.js": {
          "no-console": {
            count: 1,
          },
          "no-unused-vars": {
            count: 1,
          },
        },
      });
    });

    it("should handle duplicate files in TodoModuleV1", () => {
      const todoModuleV1 = {
        "no-console": {
          autoFix: false,
          files: ["file1.js", "file1.js"],
        },
      } satisfies TodoModuleV1;

      const suppressionsJson = SuppressionsJsonGenerator.fromV1(todoModuleV1);

      expect(suppressionsJson).toStrictEqual({
        "file1.js": {
          "no-console": {
            count: 2,
          },
        },
      });
    });

    it("should handle empty TodoModuleV1", () => {
      const todoModuleV1 = {} satisfies TodoModuleV1;

      const suppressionsJson = SuppressionsJsonGenerator.fromV1(todoModuleV1);

      expect(suppressionsJson).toStrictEqual({});
    });
  });

  describe("fromV2", () => {
    it("should convert TodoModuleV2 to ESLintSuppressionsJson", () => {
      const todoModuleV2 = {
        meta: {
          version: 2,
        },
        todo: {
          "no-console": {
            autoFix: false,
            violations: {
              "file1.js": 2,
              "file2.js": 1,
            },
          },
          "no-unused-vars": {
            autoFix: true,
            violations: {
              "file2.js": 3,
            },
          },
        },
      } satisfies TodoModuleV2;

      const suppressionsJson = SuppressionsJsonGenerator.fromV2(todoModuleV2);

      expect(suppressionsJson).toStrictEqual({
        "file1.js": {
          "no-console": {
            count: 2,
          },
        },
        "file2.js": {
          "no-console": {
            count: 1,
          },
          "no-unused-vars": {
            count: 3,
          },
        },
      });
    });

    it("should handle violations with the same rule in different files", () => {
      const todoModuleV2 = {
        meta: {
          version: 2,
        },
        todo: {
          "no-console": {
            autoFix: false,
            violations: {
              "file1.js": 1,
              "file2.js": 2,
              "file3.js": 3,
            },
          },
        },
      } satisfies TodoModuleV2;

      const suppressionsJson = SuppressionsJsonGenerator.fromV2(todoModuleV2);

      expect(suppressionsJson).toStrictEqual({
        "file1.js": {
          "no-console": {
            count: 1,
          },
        },
        "file2.js": {
          "no-console": {
            count: 2,
          },
        },
        "file3.js": {
          "no-console": {
            count: 3,
          },
        },
      });
    });

    it("should handle empty TodoModuleV2", () => {
      const todoModuleV2 = {
        meta: {
          version: 2,
        },
        todo: {},
      } satisfies TodoModuleV2;

      const suppressionsJson = SuppressionsJsonGenerator.fromV2(todoModuleV2);

      expect(suppressionsJson).toStrictEqual({});
    });
  });
});

describe("buildESLintConfigWithSuppressionsJson", () => {
  it("should build ESLint configs from suppressions JSON", () => {
    const suppressionsJson: ESLintSuppressionsJson = {
      "file1.js": {
        "no-console": {
          count: 2,
        },
      },
      "file2.js": {
        "no-console": {
          count: 1,
        },
        "no-unused-vars": {
          count: 3,
        },
      },
    };

    const configs = buildESLintConfigWithSuppressionsJson(suppressionsJson, "off");

    expect(configs).toStrictEqual([
      {
        files: ["file1.js", "file2.js"],
        name: "@sushichan044/eslint-todo/off/no-console",
        rules: {
          "no-console": "off",
        },
      },
      {
        files: ["file2.js"],
        name: "@sushichan044/eslint-todo/off/no-unused-vars",
        rules: {
          "no-unused-vars": "off",
        },
      },
    ]);
  });

  it("should handle empty suppressions JSON", () => {
    const suppressionsJson: ESLintSuppressionsJson = {};

    const configs = buildESLintConfigWithSuppressionsJson(suppressionsJson, "error");

    expect(configs).toStrictEqual([]);
  });

  it("should escape glob characters in file paths", () => {
    const suppressionsJson: ESLintSuppressionsJson = {
      "file*.js": {
        "no-console": {
          count: 1,
        },
      },
      "pages/[id].tsx": {
        "no-unused-vars": {
          count: 2,
        },
      },
    };

    const configs = buildESLintConfigWithSuppressionsJson(suppressionsJson, "off");

    expect(configs).toStrictEqual([
      {
        files: [String.raw`file\*.js`],
        name: "@sushichan044/eslint-todo/off/no-console",
        rules: {
          "no-console": "off",
        },
      },
      {
        files: [String.raw`pages/\[id\].tsx`],
        name: "@sushichan044/eslint-todo/off/no-unused-vars",
        rules: {
          "no-unused-vars": "off",
        },
      },
    ]);
  });
});
