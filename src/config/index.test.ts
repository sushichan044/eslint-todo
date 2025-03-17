import typia from "typia";
import { describe, expect, it } from "vitest";

import type { UserConfig } from "./index";

import { defineConfig } from "./index";

describe("defineConfig", () => {
  it("should just return the input config", () => {
    const input = typia.random<UserConfig>();

    const config = defineConfig(input);
    expect(config).toStrictEqual(input);
  });
});
