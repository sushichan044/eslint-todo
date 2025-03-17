import { afterEach, describe, expect, it, vi } from "vitest";

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
    const mockConfig = {
      root: "/test/path",
      todoFile: "test-todo.js",
    };
    vi.mocked(importModule.importDefault).mockResolvedValue(mockConfig);

    const result = await readConfigFile("/test");

    expect(result.success).toBe(true);
    expect(result.data).toStrictEqual(mockConfig);
    expect(importModule.importDefault).toHaveBeenCalledWith(
      "/test/eslint-todo.config",
      {},
    );
  });

  it("should successfully validate a config file with $schema property", async () => {
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
    expect(result.data).not.toHaveProperty("$schema");
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
    // eslint-disable-next-line unicorn/no-useless-undefined
    vi.mocked(importModule.importDefault).mockResolvedValue(undefined);

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
