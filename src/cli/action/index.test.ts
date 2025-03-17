import type { Mock } from "vitest";

import consola from "consola";
import { Hookable } from "hookable";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { MaybePromise } from "../../utils/types";
import type { CLIAction } from "./index";

import { configWithDefault } from "../../config/config";
import { launchRemoteESLintTodoCore } from "../../remote/client";
import { defineAction, prepareAction } from "./index";

consola.mockTypes(() => vi.fn());

vi.mock("../../remote/client", () => ({
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
    RemoteESLintTodoCore: vi.fn().mockResolvedValue(mockCore),
    terminate: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (launchRemoteESLintTodoCore as Mock).mockReturnValue(mockRemoteService);
  });

  describe("Prepared Action Input and Output", () => {
    it("should not accept input if action has no input", async () => {
      const actionWithNoInputs = vi.fn<CLIAction<never>>();
      const config = configWithDefault();

      const preparedAction = prepareAction(actionWithNoInputs, {
        config,
        consola,
      });
      await preparedAction();

      expect(actionWithNoInputs).toHaveBeenCalledExactlyOnceWith({
        config,
        core: mockCore,
        // We are not testing hooks here, so we can safely assign any value to it
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        hooks: expect.any(Hookable),
        logger: consola,
      });
    });

    it("should accept input of action and return output of action", async () => {
      const actionWithInputs = vi
        .fn<CLIAction<"input", "result">>()
        .mockResolvedValue("result");
      const config = configWithDefault();

      const preparedAction = prepareAction(actionWithInputs, {
        config,
        consola,
      });

      const result = await preparedAction("input");
      expect(actionWithInputs).toHaveBeenCalledExactlyOnceWith(
        {
          config,
          core: mockCore,
          // We are not testing hooks here, so we can safely assign any value to it
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          hooks: expect.any(Hookable),
          logger: consola,
        },
        "input",
      );
      expect(result).toBe("result");
    });
  });

  describe("When action is succeed", () => {
    it("should call remoteService.terminate after action is resolved", async () => {
      const action = vi.fn<CLIAction<never, null>>().mockResolvedValue(null);

      const preparedAction = prepareAction(action, {
        config: configWithDefault(),
        consola,
      });
      await preparedAction();
      expect(mockRemoteService.terminate).toHaveBeenCalledOnce();
    });
  });

  describe("When action is failed", () => {
    it("should rethrow error and call remoteService.terminate", async () => {
      const action = vi
        .fn<CLIAction<never>>()
        .mockRejectedValue(new TestError());

      const preparedAction = prepareAction(action, {
        config: configWithDefault(),
        consola,
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

      const action = defineAction<string, number, Hooks>(
        async ({ hooks }, input) => {
          await hooks.callHook("before", input);

          const result = input.length;

          await hooks.callHook("after");
          return result;
        },
      );

      const preparedAction = prepareAction(action, {
        config: configWithDefault(),
        consola,
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
