import type { Mock } from "vitest";

import consola from "consola";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { launchRemoteESLintTodoCore } from "../../remote/client";
import { runAction } from "./index";

consola.mockTypes(() => vi.fn());

vi.mock("../../remote/client", () => ({
  launchRemoteESLintTodoCore: vi.fn(),
}));

describe("runAction", () => {
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

  it("should not pass input to action if input is not provided", async () => {
    const action = vi.fn();
    await runAction(action, { consola, options: {} });

    expect(action).toHaveBeenCalledExactlyOnceWith({
      core: mockCore,
      logger: consola,
    });
  });

  describe("When action is succeed", () => {
    it("should return action result", async () => {
      const action = vi.fn().mockResolvedValue("result");

      const result = await runAction<"result">(action, {
        consola,
        options: {},
      });
      expect(result).toBe("result");
    });

    it("should call remoteService.terminate after action is resolved", async () => {
      const action = vi.fn().mockResolvedValue(undefined);

      await runAction(action, { consola, options: {} });
      expect(mockRemoteService.terminate).toHaveBeenCalledOnce();
    });
  });

  describe("When action is failed", () => {
    it("should call consola.error and rethrow error if action throws", async () => {
      const action = vi.fn().mockRejectedValue(new TestError());

      await expect(runAction(action, { consola, options: {} })).rejects.toThrow(
        TestError,
      );
      expect(consola.error).toHaveBeenCalledOnce();
    });

    it("should call remoteService.terminate after action is rejected", async () => {
      const action = vi.fn().mockRejectedValue(new TestError());
      // eslint-disable-next-line @typescript-eslint/no-empty-function
      await runAction(action, { consola, options: {} }).catch(() => {});

      expect(mockRemoteService.terminate).toHaveBeenCalledOnce();
    });
  });
});
