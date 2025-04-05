import type { Linter } from "eslint";

import { beforeEach, describe, expect, it, vi } from "vitest";

import type { TodoModuleLike } from "./todofile/types";
import type { TodoModuleV2 } from "./todofile/v2";

import { configWithDefault } from "./config/config";
import { ESLintTodoCore } from "./index";
import { TodoModuleV2Handler } from "./todofile/v2";

describe("buildESLintConfig", () => {
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

  const expectedConfig = [
    {
      files: ["file1.js"],
      name: "@sushichan044/eslint-todo/off/no-console",
      rules: {
        "no-console": "off",
      },
    },
  ] satisfies Linter.Config[];

  const spyV2Builder = vi.spyOn(TodoModuleV2Handler, "buildConfigsForESLint");

  const core = new ESLintTodoCore(configWithDefault());

  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("should return ESLint configs for V2 todo module", () => {
    const result = core.buildESLintConfig(todoModuleV2, "off");

    expect(spyV2Builder).toHaveBeenCalledWith(todoModuleV2, "off");
    expect(result).toStrictEqual(expectedConfig);
  });

  it("should return null for unknown todo module", () => {
    const unknownTodoModule = {
      meta: {
        dummy: true,
      },
    } satisfies TodoModuleLike;

    // @ts-expect-error type is not correct because we are passing unsupported object.
    const result = core.buildESLintConfig(unknownTodoModule);

    expect(spyV2Builder).not.toHaveBeenCalled();
    expect(result).toStrictEqual([]);
  });
});
