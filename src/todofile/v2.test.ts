import { describe, expect, it } from "vitest";

import type { TodoModuleLike } from "./types";
import type { TodoModuleV1 } from "./v1";
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

  describe("isVersion", () => {
    it("should detect v2 module", () => {
      const isV2 = TodoModuleV2Handler.isVersion(todoModuleV2);
      expect(isV2).toBe(true);
    });

    it("should not detect v1 module as v2", () => {
      const todoModuleV1 = {
        "no-console": {
          autoFix: false,
          files: ["file1.js"],
        },
      } satisfies TodoModuleV1;

      const isV2 = TodoModuleV2Handler.isVersion(todoModuleV1);
      expect(isV2).toBe(false);
    });

    it("should not detect empty object as v2", () => {
      const todoModuleEmpty = {} satisfies TodoModuleLike;

      const isV2 = TodoModuleV2Handler.isVersion(todoModuleEmpty);
      expect(isV2).toBe(false);
    });
  });
});
