import type { Linter } from "eslint";

import { beforeEach, describe, expect, it, vi } from "vitest";

import type { TodoModuleLike } from "../todofile/types";
import type { TodoModuleV1 } from "../todofile/v1";
import type { TodoModuleV2 } from "../todofile/v2";

import { TodoModuleV1Handler } from "../todofile/v1";
import { TodoModuleV2Handler } from "../todofile/v2";
import { buildESLintFlatConfig } from "./build";

describe("buildESLintFlatConfig", () => {
  const todoModuleV1 = {
    "no-console": {
      autoFix: false,
      files: ["file1.js"],
    },
  } satisfies TodoModuleV1;

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
      name: "@sushichan044/eslint-todo/todo/off/no-console",
      rules: {
        "no-console": "off",
      },
    },
  ] satisfies Linter.Config[];

  const spyV1Builder = vi.spyOn(
    TodoModuleV1Handler,
    "buildDisableConfigsForESLint",
  );
  const spyV2Builder = vi.spyOn(
    TodoModuleV2Handler,
    "buildDisableConfigsForESLint",
  );

  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("should return ESLint configs for V1 todo module", () => {
    const result = buildESLintFlatConfig(todoModuleV1);

    expect(spyV1Builder).toHaveBeenCalledWith(todoModuleV1);
    expect(result).toStrictEqual(expectedConfig);
  });

  it("should return ESLint configs for empty object as v1 todo module", () => {
    const todoModuleEmpty = {} satisfies TodoModuleV1;

    const result = buildESLintFlatConfig(todoModuleEmpty);

    expect(spyV1Builder).toHaveBeenCalledWith(todoModuleEmpty);
    expect(result).toStrictEqual([]);
  });

  it("should return ESLint configs for V2 todo module", () => {
    const result = buildESLintFlatConfig(todoModuleV2);

    expect(spyV2Builder).toHaveBeenCalledWith(todoModuleV2);
    expect(result).toStrictEqual(expectedConfig);
  });

  it("should return null for unknown todo module", () => {
    const unknownTodoModule = {
      meta: {
        dummy: true,
      },
    } satisfies TodoModuleLike;

    // @ts-expect-error type is not correct because we are passing unsupported object.
    const result = buildESLintFlatConfig(unknownTodoModule);

    expect(spyV1Builder).not.toHaveBeenCalled();
    expect(spyV2Builder).not.toHaveBeenCalled();
    expect(result).toBeNull();
  });
});
