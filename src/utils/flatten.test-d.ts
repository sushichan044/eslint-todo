import { describe, it } from "vitest";
import { expectTypeOf } from "vitest";

import type { FlattenObject } from "./flatten";

describe("FlattenObject", () => {
  describe("basic flattening", () => {
    it("should flatten single level nested object", () => {
      expectTypeOf<FlattenObject<{ a: { b: string } }>>().toEqualTypeOf<{
        "a.b": string;
      }>();
    });

    it("should flatten multiple properties at same level", () => {
      expectTypeOf<
        FlattenObject<{ a: { b: string; c: number } }>
      >().toEqualTypeOf<{
        "a.b": string;
        "a.c": number;
      }>();
    });

    it("should preserve primitive properties", () => {
      expectTypeOf<
        FlattenObject<{ a: string; b: number; c: boolean }>
      >().toEqualTypeOf<{
        a: string;
        b: number;
        c: boolean;
      }>();
    });

    it("should handle empty object", () => {
      // eslint-disable-next-line @typescript-eslint/no-empty-object-type
      expectTypeOf<FlattenObject<{}>>().toEqualTypeOf<{}>();
    });
  });

  describe("deep nesting", () => {
    it("should flatten 3-level nested object", () => {
      expectTypeOf<FlattenObject<{ a: { b: { c: string } } }>>().toEqualTypeOf<{
        "a.b.c": string;
      }>();
    });

    it("should flatten 4-level nested object", () => {
      expectTypeOf<
        FlattenObject<{ a: { b: { c: { d: boolean } } } }>
      >().toEqualTypeOf<{
        "a.b.c.d": boolean;
      }>();
    });

    it("should handle complex nested structure", () => {
      expectTypeOf<
        FlattenObject<{
          level1: {
            level2a: {
              level3: string;
            };
            level2b: number;
            level2c: {
              array: string[];
              nested: {
                deep: boolean;
              };
            };
          };
          simple: string;
        }>
      >().toEqualTypeOf<{
        "level1.level2a.level3": string;
        "level1.level2b": number;
        "level1.level2c.array": string[];
        "level1.level2c.nested.deep": boolean;
        "simple": string;
      }>();
    });
  });

  describe("array handling", () => {
    it("should treat arrays as terminal values", () => {
      expectTypeOf<
        FlattenObject<{ arr: string[]; nested: { arr: number[] } }>
      >().toEqualTypeOf<{
        "arr": string[];
        "nested.arr": number[];
      }>();
    });

    it("should handle readonly arrays", () => {
      expectTypeOf<
        FlattenObject<{
          readonly arr: readonly string[];
          nested: { readonly items: readonly number[] };
        }>
      >().toEqualTypeOf<{
        "arr": readonly string[];
        "nested.items": readonly number[];
      }>();
    });
  });

  describe("optional properties", () => {
    it("should handle optional properties in nested objects", () => {
      expectTypeOf<
        FlattenObject<{ a: { b?: string; c: number } }>
      >().toEqualTypeOf<{
        "a.b": string | undefined;
        "a.c": number;
      }>();
    });

    it("should handle union types with optional properties", () => {
      expectTypeOf<
        FlattenObject<{
          nested: {
            optional?: boolean;
          };
          union: {
            value: number | string;
          };
        }>
      >().toEqualTypeOf<{
        "nested.optional": boolean | undefined;
        "union.value": number | string;
      }>();
    });
  });

  describe("mixed types", () => {
    it("should handle primitive, object, and array combination", () => {
      expectTypeOf<
        FlattenObject<{
          array: boolean[];
          deepNested: { inner: { value: string } };
          nested: { value: number };
          primitive: string;
        }>
      >().toEqualTypeOf<{
        "array": boolean[];
        "deepNested.inner.value": string;
        "nested.value": number;
        "primitive": string;
      }>();
    });
  });

  describe("discriminated union", () => {
    it("should handle discriminated union", () => {
      expectTypeOf<
        FlattenObject<
          | {
              type: "bar";
              value: { bar: string };
            }
          | {
              type: "foo";
              value: { foo: string };
            }
        >
      >().toEqualTypeOf<
        | {
            "type": "bar";
            "value.bar": string;
          }
        | {
            "type": "foo";
            "value.foo": string;
          }
      >();
    });

    it("should handle discriminated union with conditional keys", () => {
      expectTypeOf<
        FlattenObject<{
          a:
            | {
                type: "bar";
              }
            | {
                type: "foo";
                value: string;
              };
        }>
      >().toEqualTypeOf<{
        "a.type": "bar" | "foo";
        "a.value": never; // Properties not present in all union branches become never
      }>();
    });
  });

  describe("negative and boundary cases", () => {
    it("should return the array type for top-level arrays", () => {
      expectTypeOf<FlattenObject<string[]>>().toEqualTypeOf<string[]>();
      expectTypeOf<FlattenObject<number[]>>().toEqualTypeOf<number[]>();
      expectTypeOf<FlattenObject<readonly boolean[]>>().toEqualTypeOf<
        readonly boolean[]
      >();
    });

    it("should return the function type for top-level functions", () => {
      expectTypeOf<FlattenObject<() => void>>().toEqualTypeOf<() => void>();
      expectTypeOf<FlattenObject<(x: string) => number>>().toEqualTypeOf<
        (x: string) => number
      >();
    });

    it("should ignore numeric-indexed keys and only flatten string keys", () => {
      expectTypeOf<FlattenObject<{ 0: string; one: number }>>().toEqualTypeOf<{
        one: number;
      }>();

      expectTypeOf<
        FlattenObject<{
          1: boolean;
          2: string;
          anotherKey: { nested: string };
          validKey: number;
        }>
      >().toEqualTypeOf<{
        "anotherKey.nested": string;
        "validKey": number;
      }>();
    });

    it("should ignore symbol keys and only flatten string keys", () => {
      const uniqueSymbol = Symbol("unique");
      type WithSymbol = {
        a: number;
        nested: {
          b: string;
          [uniqueSymbol]: boolean;
        };
        [uniqueSymbol]: string;
      };

      expectTypeOf<FlattenObject<WithSymbol>>().toEqualTypeOf<{
        "a": number;
        "nested.b": string;
      }>();
    });
  });
});
