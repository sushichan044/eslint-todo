import { createFixture } from "fs-fixture";
import typia from "typia";
import { describe, expect, it } from "vitest";

import type { UserConfig } from "./config";

import { readConfigFile } from "./file";

describe("readConfigFile", () => {
  it("should successfully load and validate a normal config file", async () => {
    const randomConfig = typia.random<UserConfig>();
    await using fixture = await createFixture({
      "eslint-todo.config.ts": `export default ${JSON.stringify(randomConfig)}`,
    });

    const result = await readConfigFile(fixture.path);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toEqual(randomConfig);
    }
  });

  it("should omit $schema property", async () => {
    const mockConfig = {
      $schema: "https://example.com/schema.json",
      root: "/test/path",
      todoFile: "test-todo.js",
    };
    await using fixture = await createFixture({
      "eslint-todo.config.json": JSON.stringify(mockConfig),
    });

    const result = await readConfigFile(fixture.path);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toEqual({
        root: "/test/path",
        todoFile: "test-todo.js",
      });
    }
  });

  it("should fail validation when config file contains extra properties", async () => {
    const mockConfig = {
      root: "/test/path",
      todoFile: "test-todo.js",
      unknownProperty: "this should cause an error",
    };
    await using fixture = await createFixture({
      "eslint-todo.config.json": JSON.stringify(mockConfig),
    });

    const result = await readConfigFile(fixture.path);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.errors.length).toBeGreaterThan(0);
      expect(JSON.stringify(result.errors)).toContain("unknownProperty");
    }
  });

  it("should successfully validate an empty config file", async () => {
    await using fixture = await createFixture({
      "eslint-todo.config.json": JSON.stringify({}),
    });

    const result = await readConfigFile(fixture.path);

    expect(result.success).toBe(true);
    expect(result.data).toStrictEqual({});
  });

  it("should return an empty object when config file is not found", async () => {
    await using fixture = await createFixture({});

    const result = await readConfigFile(fixture.path);

    expect(result.success).toBe(true);
    expect(result.data).toEqual({});
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
    await using fixture = await createFixture({
      "eslint-todo.config.ts": `export default ${JSON.stringify(mockConfig)}`,
    });

    const result = await readConfigFile(fixture.path);

    expect(result.success).toBe(true);
    expect(result.data).toEqual(mockConfig);
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
    await using fixture = await createFixture({
      "eslint-todo.config.ts": `export default ${JSON.stringify(mockConfig)}`,
    });

    const result = await readConfigFile(fixture.path);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.errors.length).toBeGreaterThan(0);
      expect(JSON.stringify(result.errors)).toContain("invalid-type");
    }
  });
});
