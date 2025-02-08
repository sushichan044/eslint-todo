import { describe, expect, it } from "vitest";

import type { TodoModuleV1 } from "./v1";
import type { TodoModuleV2 } from "./v2";

import { TodoModuleV1Handler } from "./v1";

describe("TodoModuleV1Handler", () => {
  const todoModuleV1 = {
    "no-console": {
      autoFix: false,
      files: ["file1.js"],
    },
  } satisfies TodoModuleV1;

  describe("buildDisableConfigsForESLint", () => {
    it("should build ESLint configs for v1 module", () => {
      const configs =
        TodoModuleV1Handler.buildDisableConfigsForESLint(todoModuleV1);

      expect(configs).toStrictEqual([
        {
          files: ["file1.js"],
          name: "@sushichan044/eslint-todo/todo/no-console",
          rules: {
            "no-console": "off",
          },
        },
      ]);
    });
  });

  describe("isVersion", () => {
    it("should detect v1 module", () => {
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
});
