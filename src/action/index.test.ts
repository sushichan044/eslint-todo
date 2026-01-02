import type { Mock } from "vitest";

import { Hookable } from "hookable";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { MaybePromise } from "../utils/types";
import type { Action } from "./index";

import { configWithDefault } from "../config/config";
import { launchRemoteESLintTodoCore } from "../worker/core/client";
import { defineAction, prepareAction } from "./index";

vi.mock("../worker/core/client", () => ({
  launchRemoteESLintTodoCore: vi.fn(),
}));

class TestError extends Error {
  constructor() {
    super("Test Error");
    this.name = "TestError";
  }
}

describe("prepareAction", () => {
  const mockCore = {};
  const mockRemoteService = {
    // https://vitest.dev/guide/migration.html#spyon-and-fn-support-constructors
    // eslint-disable-next-line @typescript-eslint/promise-function-async
    RemoteESLintTodoCore: vi.fn().mockImplementation(function () {
      return Promise.resolve(mockCore);
    }),
    terminate: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (launchRemoteESLintTodoCore as Mock).mockReturnValue(mockRemoteService);
  });

  describe("Prepared Action Input and Output", () => {
    it("should not accept input if action has no input", async () => {
      const actionWithNoInputs = vi.fn<Action<never>>();
      const config = configWithDefault();

      const preparedAction = prepareAction(actionWithNoInputs, {
        config,
        eslintConfig: { rules: {} },
      });
      await preparedAction();

      expect(actionWithNoInputs).toHaveBeenCalledExactlyOnceWith({
        config,
        core: mockCore,
        eslintConfig: { rules: {} },
        // We are not testing hooks here, so we can safely assign any value to it
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        hooks: expect.any(Hookable),
      });
    });

    it("should accept input of action and return output of action", async () => {
      const actionWithInputs = vi.fn<Action<"input", "result">>().mockResolvedValue("result");
      const config = configWithDefault();

      const preparedAction = prepareAction(actionWithInputs, {
        config,
        eslintConfig: { rules: {} },
      });

      const result = await preparedAction("input");
      expect(actionWithInputs).toHaveBeenCalledExactlyOnceWith(
        {
          config,
          core: mockCore,
          eslintConfig: { rules: {} },
          // We are not testing hooks here, so we can safely assign any value to it
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          hooks: expect.any(Hookable),
        },
        "input",
      );
      expect(result).toBe("result");
    });
  });

  describe("When action is succeed", () => {
    it("should call remoteService.terminate after action is resolved", async () => {
      const action = vi.fn<Action<never, null>>().mockResolvedValue(null);

      const preparedAction = prepareAction(action, {
        config: configWithDefault(),
        eslintConfig: { rules: {} },
      });
      await preparedAction();
      expect(mockRemoteService.terminate).toHaveBeenCalledOnce();
    });
  });

  describe("When action is failed", () => {
    it("should rethrow error and call remoteService.terminate", async () => {
      const action = vi.fn<Action<never>>().mockRejectedValue(new TestError());

      const preparedAction = prepareAction(action, {
        config: configWithDefault(),
        eslintConfig: { rules: {} },
      });
      await expect(preparedAction()).rejects.toThrow(TestError);
      expect(mockRemoteService.terminate).toHaveBeenCalledOnce();
    });
  });

  describe("Hooks", () => {
    it("should call user defined hooks", async () => {
      const beforeHook = vi.fn();
      const afterHook = vi.fn();

      type Hooks = {
        after: () => MaybePromise<void>;
        before: (input: string) => MaybePromise<void>;
      };

      const action = defineAction<string, number, Hooks>(async ({ hooks }, input) => {
        await hooks.callHook("before", input);

        const result = input.length;

        await hooks.callHook("after");
        return result;
      });

      const preparedAction = prepareAction(action, {
        config: configWithDefault(),
        eslintConfig: { rules: {} },
        hooks: {
          after: afterHook,
          before: beforeHook,
        },
      });

      const result = await preparedAction("test");

      expect(beforeHook).toHaveBeenCalledWith("test");
      expect(afterHook).toHaveBeenCalled();
      expect(result).toBe(4);
    });
  });
});
