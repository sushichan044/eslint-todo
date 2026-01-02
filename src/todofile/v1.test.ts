import { describe, expect, it } from "vitest";

import type { TodoModuleV1 } from "./v1";
import type { TodoModuleV2 } from "./v2";

import { TodoModuleV1Handler } from "./v1";

describe("TodoModuleV1Handler", () => {
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
      const todoModuleV2 = TodoModuleV1Handler.upgradeToNextVersion(todoModuleV1);

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

      const todoModuleV2 = TodoModuleV1Handler.upgradeToNextVersion(todoModuleV1);

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

      const todoModuleV2 = TodoModuleV1Handler.upgradeToNextVersion(todoModuleV1);

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
