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
