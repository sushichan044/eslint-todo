import { describe, expect, it } from "vitest";

import { configWithDefault } from "./config/config";
import { resolveTodoModulePath } from "./path";

describe("resolveTodoFilePath", () => {
  it("should resolve the correct absolute and relative paths", () => {
    const config = configWithDefault({
      root: "/home/sushi/workspace",
      suppressionsLocation: "eslint-suppressions.json",
    });

    const result = resolveTodoModulePath(config);

    expect(result).toStrictEqual({
      absolute: "/home/sushi/workspace/eslint-suppressions.json",
      relative: "eslint-suppressions.json",
    });
  });

  it("should handle nested suppressionsLocation paths", () => {
    const config = configWithDefault({
      root: "/home/sushi/workspace",
      suppressionsLocation: "./nested/eslint-suppressions.json",
    });
    const result = resolveTodoModulePath(config);

    expect(result).toStrictEqual({
      absolute: "/home/sushi/workspace/nested/eslint-suppressions.json",
      relative: "nested/eslint-suppressions.json",
    });
  });

  it("should handle absolute suppressionsLocation paths", () => {
    const config = configWithDefault({
      root: "/home/sushi/workspace",
      suppressionsLocation: "/home/sushi/eslint-suppressions.json",
    });

    const result = resolveTodoModulePath(config);

    expect(result).toStrictEqual({
      absolute: "/home/sushi/eslint-suppressions.json",
      relative: "../eslint-suppressions.json",
    });
  });
});
