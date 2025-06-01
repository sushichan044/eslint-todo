---
attach: always
---

# Project Guide

<workflow-after-edit>
1. Run tsc: `pnpm run build && pnpm run typecheck`
2. Run Linters: `pnpm run lint --fix && pnpm run format`
3. Run Test: `pnpm run test:run`
</workflow-after-edit>

<workflow-just-before-ending>
Run `pnpm run check`
</workflow-just-before-ending>

## Command Guide

- USE `pnpm run test:run`, NOT `pnpm run test`
  - `run test` will not exit automatically, so the process will hang.

## package scope isolation by eslint-plugin-import-access

docs: <https://github.com/uhyo/eslint-plugin-import-access>

同じディレクトリからのみ import 可能であるべき export は、jsdoc で `@package` とアノテーションすると ESLint により不正な import が規制されます。
詳しくは、@@eslint-plugin-import-access を読んでみてください。
