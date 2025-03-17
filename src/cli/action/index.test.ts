import type { Mock } from "vitest";

import consola from "consola";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { CLIAction } from "./index";

import { configWithDefault } from "../../config/config";
import { launchRemoteESLintTodoCore } from "../../remote/client";
import { prepareAction } from "./index";

consola.mockTypes(() => vi.fn());

vi.mock("../../remote/client", () => ({
  launchRemoteESLintTodoCore: vi.fn(),
}));

describe("prepareAction", () => {
  const mockCore = {};
  const mockRemoteService = {
    RemoteESLintTodoCore: vi.fn().mockResolvedValue(mockCore),
    terminate: vi.fn(),
  };

  class TestError extends Error {
    constructor() {
      super();
      this.name = "TestError";
    }
  }

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
    it("should call consola.error and rethrow error if action throws", async () => {
      const action = vi
        .fn<CLIAction<never>>()
        .mockRejectedValue(new TestError());

      const preparedAction = prepareAction(action, {
        config: configWithDefault(),
        consola,
      });
      await expect(preparedAction()).rejects.toThrow(TestError);
      expect(consola.error).toHaveBeenCalledOnce();
    });

    it("should call remoteService.terminate after action is rejected", async () => {
      const action = vi
        .fn<CLIAction<never>>()
        .mockRejectedValue(new TestError());
      const preparedAction = prepareAction(action, {
        config: configWithDefault(),
        consola,
      });
      await preparedAction().catch(
        // eslint-disable-next-line @typescript-eslint/no-empty-function
        () => {},
      );

      expect(mockRemoteService.terminate).toHaveBeenCalledOnce();
    });
  });
});
