import type { IValidation } from "@samchon/openapi";

import { describe, expect, it, vi } from "vitest";

import type { UserConfig } from "./config";

import * as fileModule from "./file";
import { resolveConfig } from "./resolve";

vi.mock("./file", () => ({
  readConfigFile: vi.fn(),
}));

// mock configWithDefault to always use /test/path as value of root
vi.mock("./config", async (importActual) => {
  // eslint-disable-next-line @typescript-eslint/consistent-type-imports
  const actual = await importActual<typeof import("./config")>();
  return {
    ...actual,
    configWithDefault: vi.fn((config) => {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      const result = actual.configWithDefault(config);
      result.root = "/test/path";
      return result;
    }),
  };
});

describe("resolveConfig", () => {
  it("should apply default values when no config is provided", async () => {
    vi.mocked(fileModule.readConfigFile).mockResolvedValueOnce({
      data: {},
      errors: [],
      success: false,
    } as IValidation<UserConfig>);

    const config = await resolveConfig("/test/path");

    expect(config).toStrictEqual({
      correct: {
        autoFixableOnly: true,
        exclude: {
          rules: [],
        },
        limit: {
          count: 100,
          type: "violation",
        },
        partialSelection: false,
      },
      root: "/test/path",
      suppressionsLocation: "eslint-suppressions.json",
    });
  });

  it("should merge config from file with default values", async () => {
    const configFromFile: UserConfig = {
      correct: {
        autoFixableOnly: false,
      },
      suppressionsLocation: "custom-suppressions.json",
    };

    vi.mocked(fileModule.readConfigFile).mockResolvedValueOnce({
      data: configFromFile,
      success: true,
    } as IValidation<UserConfig>);

    const config = await resolveConfig("/test/path");

    expect(config).toStrictEqual({
      correct: {
        autoFixableOnly: false,
        exclude: {
          rules: [],
        },
        limit: {
          count: 100,
          type: "violation",
        },
        partialSelection: false,
      },
      root: "/test/path",
      suppressionsLocation: "custom-suppressions.json",
    });
  });

  it("should override config from file with user config", async () => {
    const configFromFile: UserConfig = {
      correct: {
        autoFixableOnly: false,
        limit: {
          count: 50,
        },
      },
      suppressionsLocation: "file-suppressions.json",
    };

    const userConfig: UserConfig = {
      correct: {
        limit: {
          count: 200,
          type: "file",
        },
      },
      suppressionsLocation: "user-suppressions.json",
    };

    vi.mocked(fileModule.readConfigFile).mockResolvedValueOnce({
      data: configFromFile,
      success: true,
    } as IValidation<UserConfig>);

    const config = await resolveConfig("/test/path", userConfig);

    expect(config).toStrictEqual({
      correct: {
        autoFixableOnly: false,
        exclude: {
          rules: [],
        },
        limit: {
          count: 200,
          type: "file",
        },
        partialSelection: false,
      },
      root: "/test/path",
      suppressionsLocation: "user-suppressions.json",
    });
  });

  it("should handle empty config file and apply user config with defaults", async () => {
    const userConfig: UserConfig = {
      correct: {
        exclude: {
          rules: ["no-console"],
        },
      },
    };

    vi.mocked(fileModule.readConfigFile).mockResolvedValueOnce({
      data: {},
      success: true,
    } as IValidation<UserConfig>);

    const config = await resolveConfig("/test/path", userConfig);

    expect(config).toStrictEqual({
      correct: {
        autoFixableOnly: true,
        exclude: {
          rules: ["no-console"],
        },
        limit: {
          count: 100,
          type: "violation",
        },
        partialSelection: false,
      },
      root: "/test/path",
      suppressionsLocation: "eslint-suppressions.json",
    });
  });

  it("should handle nested overrides correctly", async () => {
    const configFromFile: UserConfig = {
      correct: {
        exclude: {
          rules: ["rule1", "rule2"],
        },
        limit: {
          count: 50,
          type: "violation",
        },
      },
    };

    const userConfig: UserConfig = {
      correct: {
        exclude: {
          rules: ["rule3"],
        },
        limit: {
          count: 25,
        },
      },
    };

    vi.mocked(fileModule.readConfigFile).mockResolvedValueOnce({
      data: configFromFile,
      success: true,
    } as IValidation<UserConfig>);

    const config = await resolveConfig("/test/path", userConfig);

    // defu merges arrays, so rules will be ["rule3", "rule1", "rule2"]
    expect(config).toStrictEqual({
      correct: {
        autoFixableOnly: true,
        exclude: {
          rules: ["rule3", "rule1", "rule2"],
        },
        limit: {
          count: 25,
          type: "violation",
        },
        partialSelection: false,
      },
      root: "/test/path",
      suppressionsLocation: "eslint-suppressions.json",
    });
  });
});
