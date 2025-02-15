import { describe, expect, it } from "vitest";

import type { TodoModuleV1 } from "./v1";
import type { TodoModuleV2 } from "./v2";

import { TodoModuleV1Handler } from "./v1";

describe("TodoModuleV1Handler", () => {
  describe("buildConfigsForESLint", () => {
    it("should build ESLint configs for v1 module", () => {
      const todoModuleV1 = {
        "no-console": {
          autoFix: false,
          files: ["file1.js"],
        },
      } satisfies TodoModuleV1;

      const configs = TodoModuleV1Handler.buildConfigsForESLint(
        todoModuleV1,
        "off",
      );

      expect(configs).toStrictEqual([
        {
          files: ["file1.js"],
          name: "@sushichan044/eslint-todo/off/no-console",
          rules: {
            "no-console": "off",
          },
        },
      ]);
    });

    it("should escape glob characters in file paths for ESLint", () => {
      const todoModuleV1 = {
        "no-console": {
          autoFix: false,
          files: ["file*.js", "pages/[id].tsx"],
        },
      } satisfies TodoModuleV1;

      const configs = TodoModuleV1Handler.buildConfigsForESLint(
        todoModuleV1,
        "off",
      );

      expect(configs).toStrictEqual([
        {
          files: [String.raw`file\*.js`, String.raw`pages/\[id\].tsx`],
          name: "@sushichan044/eslint-todo/off/no-console",
          rules: {
            "no-console": "off",
          },
        },
      ]);
    });

    it("should generate empty array for empty module", () => {
      const todoModuleV1 = {} satisfies TodoModuleV1;

      const configs = TodoModuleV1Handler.buildConfigsForESLint(
        todoModuleV1,
        "off",
      );
      expect(configs).toStrictEqual([]);
    });

    it("does not remove duplicate files", () => {
      const todoModuleV1 = {
        "no-console": {
          autoFix: false,
          files: ["file1.js", "file1.js"],
        },
      } satisfies TodoModuleV1;

      const configs = TodoModuleV1Handler.buildConfigsForESLint(
        todoModuleV1,
        "off",
      );

      expect(configs).toStrictEqual([
        {
          files: ["file1.js", "file1.js"],
          name: "@sushichan044/eslint-todo/off/no-console",
          rules: {
            "no-console": "off",
          },
        },
      ]);
    });

    it("should build configs with off / error severity", () => {
      const todoModuleV1 = {
        "no-console": {
          autoFix: false,
          files: ["file1.js"],
        },
      } satisfies TodoModuleV1;

      const disabledConfigs = TodoModuleV1Handler.buildConfigsForESLint(
        todoModuleV1,
        "off",
      );
      const errorConfigs = TodoModuleV1Handler.buildConfigsForESLint(
        todoModuleV1,
        "error",
      );

      expect(disabledConfigs).toStrictEqual([
        {
          files: ["file1.js"],
          name: "@sushichan044/eslint-todo/off/no-console",
          rules: {
            "no-console": "off",
          },
        },
      ]);

      expect(errorConfigs).toStrictEqual([
        {
          files: ["file1.js"],
          name: "@sushichan044/eslint-todo/error/no-console",
          rules: {
            "no-console": "error",
          },
        },
      ]);
    });
  });

  describe("isVersion", () => {
    it("should detect v1 module", () => {
      const todoModuleV1 = {
        "no-console": {
          autoFix: false,
          files: ["file1.js"],
        },
      } satisfies TodoModuleV1;

      const isV1 = TodoModuleV1Handler.isVersion(todoModuleV1);
      expect(isV1).toBe(true);
    });

    it("should detect empty object as v1", () => {
      const todoModuleEmpty = {} satisfies TodoModuleV1;

      const isV1 = TodoModuleV1Handler.isVersion(todoModuleEmpty);
      expect(isV1).toBe(true);
    });

    it("should not detect v2 module as v1", () => {
      const todoModuleV2 = {
        meta: {
          version: 2,
        },
        todo: {},
      } satisfies TodoModuleV2;

      const isV1 = TodoModuleV1Handler.isVersion(todoModuleV2);
      expect(isV1).toBe(false);
    });
  });

  describe("upgradeToNextVersion", () => {
    it("can upgrade empty todo to v2 module", () => {
      const todoModuleV1 = {} satisfies TodoModuleV1;
      const todoModuleV2 =
        TodoModuleV1Handler.upgradeToNextVersion(todoModuleV1);

      expect(todoModuleV2).toStrictEqual({
        meta: {
          version: 2,
        },
        todo: {},
      });
    });

    it("can upgrade non-empty todo to v2 module", () => {
      const todoModuleV1 = {
        "no-console": {
          autoFix: false,
          files: ["file1.js"],
        },
        "no-unused-vars": {
          autoFix: false,
          files: ["file2.js"],
        },
      } satisfies TodoModuleV1;

      const todoModuleV2 =
        TodoModuleV1Handler.upgradeToNextVersion(todoModuleV1);

      expect(todoModuleV2).toStrictEqual({
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
          "no-unused-vars": {
            autoFix: false,
            violations: {
              "file2.js": 1,
            },
          },
        },
      });
    });

    it("can upgrade todo with duplicate files to v2 module", () => {
      const todoModuleV1 = {
        "no-console": {
          autoFix: false,
          files: ["file1.js", "file1.js"],
        },
        "no-unused-vars": {
          autoFix: false,
          files: ["file2.js", "file2.js", "file3.js"],
        },
      } satisfies TodoModuleV1;

      const todoModuleV2 =
        TodoModuleV1Handler.upgradeToNextVersion(todoModuleV1);

      expect(todoModuleV2).toStrictEqual({
        meta: {
          version: 2,
        },
        todo: {
          "no-console": {
            autoFix: false,
            violations: {
              "file1.js": 2,
            },
          },
          "no-unused-vars": {
            autoFix: false,
            violations: {
              "file2.js": 2,
              "file3.js": 1,
            },
          },
        },
      });
    });
  });
});
