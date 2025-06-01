---
attach: glob
globs:
  - "**/*.test.ts"
---

# Testing

Use vitest with explicit import.

## Points to Note When Writing Tests

- When working with discriminated unions, you may encounter TypeScript type errors if the compiler cannot correctly narrow down the specific type variant within a test.
  - In such cases, if it is clear which specific variant is being tested, you may use a `// @ts-expect-error` comment to suppress the type error.
  - However, always provide a justification in the `// @ts-expect-error` comment (e.g., `// @ts-expect-error: Testing the error case for type X`).
- Test case names must be written in English.
- Always use `strictEqual` for object assertions.

## Table Test Style Guide

Write like this for strong and consistent typing.

```ts
describe("add function", () => {
  const testCases: Array<{name: string; a:number; b:number; expected: number}> = [
    {
      name: "should return the sum of two positive numbers",
      a: 2,
      b: 3,
      expected: 5,
    },
    {
      name: "should return the sum when one number is zero",
      a: 7,
      b: 0,
      expected: 7,
    },
    {
      name: "should return the sum of two negative numbers",
      a: -2,
      b: -3,
      expected: -5,
    },
    {
      name: "should return the sum of a positive and a negative number",
      a: 5,
      b: -2,
      expected: 3,
    },
  ];

  it.each(testCases)(
    "$name",
    ({ a, b, expected }) => {
      const result = add(a, b);
      expect(result).toBe(expected);
    }
  );
});
```
