import typia from "typia";
import { afterEach, describe, expect, it, vi } from "vitest";

import type { UserConfig } from "./config";

import * as importModule from "../utils/import";
import { readConfigFile } from "./file";

vi.mock("../utils/import", () => ({
  importDefault: vi.fn<typeof importModule.importDefault>(),
}));

describe("readConfigFile", () => {
  afterEach(() => {
    vi.resetAllMocks();
  });

  it("should successfully load and validate a normal config file", async () => {
    const randomConfig = typia.random<UserConfig>();
    vi.mocked(importModule.importDefault).mockResolvedValue(randomConfig);

    const result = await readConfigFile("/test");

    expect(result.success).toBe(true);
    expect(result.data).toStrictEqual(randomConfig);
    expect(importModule.importDefault).toHaveBeenCalledWith("/test/eslint-todo.config", {});
  });

  it("should omit $schema property", async () => {
    const mockConfig = {
      $schema: "https://example.com/schema.json",
      root: "/test/path",
      todoFile: "test-todo.js",
    };
    vi.mocked(importModule.importDefault).mockResolvedValue(mockConfig);

    const result = await readConfigFile("/test");

    expect(result.success).toBe(true);
    expect(result.data).toStrictEqual({
      root: "/test/path",
      todoFile: "test-todo.js",
    });
  });

  it("should fail validation when config file contains extra properties", async () => {
    const mockConfig = {
      root: "/test/path",
      todoFile: "test-todo.js",
      unknownProperty: "this should cause an error",
    };
    vi.mocked(importModule.importDefault).mockResolvedValue(mockConfig);

    const result = await readConfigFile("/test");

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.errors.length).toBeGreaterThan(0);
      expect(JSON.stringify(result.errors)).toContain("unknownProperty");
    }
  });

  it("should successfully validate an empty config file", async () => {
    vi.mocked(importModule.importDefault).mockResolvedValue({});

    const result = await readConfigFile("/test");

    expect(result.success).toBe(true);
    expect(result.data).toStrictEqual({});
  });

  it("should return an empty object when config file is not found", async () => {
    vi.mocked(importModule.importDefault);

    const result = await readConfigFile("/test");

    expect(result.success).toBe(true);
    expect(result.data).toStrictEqual({});
  });

  it("should correctly validate nested properties in a valid config file", async () => {
    const mockConfig = {
      correct: {
        autoFixableOnly: true,
        exclude: {
          rules: ["no-console", "no-debugger"],
        },
        limit: {
          count: 50,
          type: "violation",
        },
        partialSelection: false,
      },
      root: "/test/path",
      todoFile: "test-todo.js",
    };
    vi.mocked(importModule.importDefault).mockResolvedValue(mockConfig);

    const result = await readConfigFile("/test");

    expect(result.success).toBe(true);
    expect(result.data).toStrictEqual(mockConfig);
  });

  it("should fail validation when nested properties contain invalid values", async () => {
    const mockConfig = {
      correct: {
        autoFixableOnly: true,
        exclude: {
          rules: ["no-console", "no-debugger"],
        },
        limit: {
          count: 50,
          type: "invalid-type", // Only "file" or "violation" are valid
        },
        partialSelection: false,
      },
      root: "/test/path",
      todoFile: "test-todo.js",
    };
    vi.mocked(importModule.importDefault).mockResolvedValue(mockConfig);

    const result = await readConfigFile("/test");

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.errors.length).toBeGreaterThan(0);
      expect(JSON.stringify(result.errors)).toContain("invalid-type");
    }
  });
});
