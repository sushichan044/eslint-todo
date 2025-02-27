import type { Linter } from "eslint";

import { beforeEach, describe, expect, it, vi } from "vitest";

import type { TodoModuleLike } from "../todofile/types";
// TODO: ここでは本当に TodoModuleV1Handler が必要
// eslint-disable-next-line @typescript-eslint/no-restricted-imports
import type { TodoModuleV1 } from "../todofile/v1";
import type { TodoModuleV2 } from "../todofile/v2";

// TODO: ここでは本当に TodoModuleV1Handler が必要
// eslint-disable-next-line @typescript-eslint/no-restricted-imports
import { TodoModuleV1Handler } from "../todofile/v1";
import { TodoModuleV2Handler } from "../todofile/v2";
import { buildESLintConfigForModule } from "./build";

describe("buildESLintConfigForModule", () => {
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
      name: "@sushichan044/eslint-todo/off/no-console",
      rules: {
        "no-console": "off",
      },
    },
  ] satisfies Linter.Config[];

  const spyV1Builder = vi.spyOn(TodoModuleV1Handler, "buildConfigsForESLint");
  const spyV2Builder = vi.spyOn(TodoModuleV2Handler, "buildConfigsForESLint");

  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("should return ESLint configs for V1 todo module", () => {
    const result = buildESLintConfigForModule(todoModuleV1, "off");

    expect(spyV1Builder).toHaveBeenCalledWith(todoModuleV1, "off");
    expect(result).toStrictEqual(expectedConfig);
  });

  it("should return ESLint configs for empty object as v1 todo module", () => {
    const todoModuleEmpty = {} satisfies TodoModuleV1;

    const result = buildESLintConfigForModule(todoModuleEmpty, "off");

    expect(spyV1Builder).toHaveBeenCalledWith(todoModuleEmpty, "off");
    expect(result).toStrictEqual([]);
  });

  it("should return ESLint configs for V2 todo module", () => {
    const result = buildESLintConfigForModule(todoModuleV2, "off");

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
    const result = buildESLintConfigForModule(unknownTodoModule);

    expect(spyV1Builder).not.toHaveBeenCalled();
    expect(spyV2Builder).not.toHaveBeenCalled();
    expect(result).toBeNull();
  });
});
