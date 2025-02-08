import { describe, expect, it } from "vitest";

import { isNonEmptyString } from "./string";

describe("isNonEmptyString", () => {
  it("should return true for a non-empty string", () => {
    expect(isNonEmptyString("hello")).toBe(true);
  });

  it("should return false for an empty string", () => {
    expect(isNonEmptyString("")).toBe(false);
  });

  it("should return false for null", () => {
    expect(isNonEmptyString(null)).toBe(false);
  });

  it("should return false for undefined", () => {
    expect(isNonEmptyString(undefined)).toBe(false);
  });

  it("should return true for a string with spaces", () => {
    expect(isNonEmptyString(" ")).toBe(true);
  });
});
