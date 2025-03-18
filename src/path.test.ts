import { describe, expect, it } from "vitest";

import { configWithDefault } from "./config/config";
import { resolveTodoModulePath } from "./path";

describe("resolveTodoFilePath", () => {
  it("should resolve the correct absolute and relative paths", () => {
    const config = configWithDefault({
      root: "/home/sushi/workspace",
      todoFile: ".eslint-challenger.js",
    });

    const result = resolveTodoModulePath(config);

    expect(result).toStrictEqual({
      absolute: "/home/sushi/workspace/.eslint-challenger.js",
      relative: ".eslint-challenger.js",
    });
  });

  it("should handle nested todoFile paths", () => {
    const config = configWithDefault({
      root: "/home/sushi/workspace",
      todoFile: "./nested/.eslint-challenger.js",
    });
    const result = resolveTodoModulePath(config);

    expect(result).toStrictEqual({
      absolute: "/home/sushi/workspace/nested/.eslint-challenger.js",
      relative: "nested/.eslint-challenger.js",
    });
  });

  it("should handle absolute todoFile paths", () => {
    const config = configWithDefault({
      root: "/home/sushi/workspace",
      todoFile: "/home/sushi/.eslint-challenger.js",
    });

    const result = resolveTodoModulePath(config);

    expect(result).toStrictEqual({
      absolute: "/home/sushi/.eslint-challenger.js",
      relative: "../.eslint-challenger.js",
    });
  });
});
