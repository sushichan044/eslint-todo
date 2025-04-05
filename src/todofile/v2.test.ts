import { describe, expect, it } from "vitest";

import type { TodoModuleLike } from "./types";
import type { TodoModuleV2 } from "./v2";

import { TodoModuleV2Handler } from "./v2";

describe("TodoModuleV2Handler", () => {
  const todoModuleV2 = {
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
  } satisfies TodoModuleV2;

  describe("buildDisableConfigsForESLint", () => {
    it("should build ESLint configs for v1 module", () => {
      const configs = TodoModuleV2Handler.buildConfigsForESLint(
        todoModuleV2,
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

    it("should escape glob characters in violations file paths for ESLint", () => {
      const todoModuleV2 = {
        meta: {
          version: 2,
        },
        todo: {
          "no-console": {
            autoFix: false,
            violations: {
              "file*.js": 1,
              "pages/[id].tsx": 1,
            },
          },
        },
      } satisfies TodoModuleV2;

      const configs = TodoModuleV2Handler.buildConfigsForESLint(
        todoModuleV2,
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

    it("should build configs with off / error severity", () => {
      const todoModuleV2 = {
        meta: {
          version: 2,
        },
        todo: {
          "no-console": {
            autoFix: false,
            violations: {
              "file*.js": 1,
              "pages/[id].tsx": 1,
            },
          },
        },
      } satisfies TodoModuleV2;

      const disabledConfigs = TodoModuleV2Handler.buildConfigsForESLint(
        todoModuleV2,
        "off",
      );
      const errorConfigs = TodoModuleV2Handler.buildConfigsForESLint(
        todoModuleV2,
        "error",
      );

      expect(disabledConfigs).toStrictEqual([
        {
          files: [String.raw`file\*.js`, String.raw`pages/\[id\].tsx`],
          name: "@sushichan044/eslint-todo/off/no-console",
          rules: {
            "no-console": "off",
          },
        },
      ]);

      expect(errorConfigs).toStrictEqual([
        {
          files: [String.raw`file\*.js`, String.raw`pages/\[id\].tsx`],
          name: "@sushichan044/eslint-todo/error/no-console",
          rules: {
            "no-console": "error",
          },
        },
      ]);
    });
  });

  describe("isVersion", () => {
    it("should detect v2 module", () => {
      const isV2 = TodoModuleV2Handler.isVersion(todoModuleV2);
      expect(isV2).toBe(true);
    });

    it("should not detect empty object as v2", () => {
      const todoModuleEmpty = {} satisfies TodoModuleLike;

      const isV2 = TodoModuleV2Handler.isVersion(todoModuleEmpty);
      expect(isV2).toBe(false);
    });
  });
});
