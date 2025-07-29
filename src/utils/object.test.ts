import { describe, expect, it } from "vitest";

import { pick } from "./object";

describe("pick", () => {
  it("should pick specified keys from an object", () => {
    const object = { a: 1, b: 2, c: 3, d: 4 };
    const result = pick(object, ["a", "c"]);

    expect(result).toEqual({ a: 1, c: 3 });
  });

  it("should return empty object when no keys provided", () => {
    const object = { a: 1, b: 2, c: 3 };
    const result = pick(object, []);

    expect(result).toEqual({});
  });

  it("should ignore non-existent keys", () => {
    const object = { a: 1, b: 2 };
    const result = pick(object, ["a", "c"] as unknown as Array<
      keyof typeof object
    >);

    expect(result).toEqual({ a: 1 });
  });

  it("should work with various value types", () => {
    const object = {
      a: 1,
      b: "string",
      c: true,
      d: null,
      e: undefined,
      f: { nested: "object" },
      g: [1, 2, 3],
    };
    const result = pick(object, ["b", "c", "f", "g"]);

    expect(result).toEqual({
      b: "string",
      c: true,
      f: { nested: "object" },
      g: [1, 2, 3],
    });
  });
});
