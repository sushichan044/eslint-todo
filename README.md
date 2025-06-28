# @sushichan044/eslint-todo

A simple tool to gradually resolve a large number of ESLint violations.
It allows you to temporarily disable violations and fix them at your own pace.

[![Ask DeepWiki](https://deepwiki.com/badge.svg)](https://deepwiki.com/sushichan044/eslint-todo)

> [!CAUTION]
> This library will be subject to destructive changes based on [ESLint bulk suppressions](https://eslint.org/blog/2025/04/introducing-bulk-suppressions/#getting-started).

## Installation

```bash
npm install --save-dev eslint @sushichan044/eslint-todo
```

Requires:

- **ES Module**
- ESLint: `^8.57.0 || ^9.0.0`
  - **Flat Config Required**
  - If you are using legacy config, you must migrate into flat config first.
    - Utilities like [@eslint/compat](https://github.com/eslint/rewrite/tree/main/packages/compat) can help you.
- Node.js: `>= 20.0.0`
  - May work in Deno, but not tested.

## Getting Started

1. Add `eslint-todo` config **at the bottom of your configs**. Do not forget `await`.

    ``` diff
    // example: eslint.config.js
    + import eslintConfigTodo from '@sushichan044/eslint-todo/eslint';

    export default [
      // your existing configs,
    + ...(await eslintConfigTodo())
    ]
    ```

2. Run `eslint-todo` to generate ESLint Todo file at the directory where `eslint.config.js` is placed.

    ```bash
    npx @sushichan044/eslint-todo
    ```

## Usage

### 1. Generate ESLint Todo file to temporarily suppress existing violations

```bash
npx @sushichan044/eslint-todo
```

### 2. Correct ignored errors

Add `--correct` flag to launch eslint-todo with correct mode.

In this mode, you can make suppressed violations detectable again according to flexible conditions.

For example, to resolve 40 violations from any rule other than `@typescript-eslint/no-explicit-any`, specify it as follows.

```bash
eslint-todo --correct \
  --correct.autoFixableOnly false \
  --correct.partialSelection \
  --correct.exclude.rules '@typescript-eslint/no-explicit-any' \
  --correct.limit.count 40 \
  --correct.limit.type violation
```

This will allow ESLint to detect the errors again, enabling you to have them fixed by AI or other tools.

## Configuration

### Configuration via CLI flags

You can config eslint-todo by passing a flag to the CLI.
Use `npx eslint-todo --help` to see all available options.

> [!WARNING]
> If you specified any config via CLI flags, your config file will be ignored completely.
>
> Exceptionally, these flags have no effect on this behavior:
>
> - `--correct`
> - `--mcp`

### Configuration File

Just create `eslint-todo.config.{js,ts}`:

```typescript
// example: eslint-todo.config.ts
import { defineConfig } from '@sushichan044/eslint-todo/config';

export default defineConfig({
  correct: {
    limit: {
      count: 30,
      type: "violation",
    },
  },
});
```

You can check all available options at [here](./src/config/config.ts).

<details>
<summary>Want to use JSON?</summary>

Sure!

```json
{
  "$schema": "node_modules/@sushichan044/eslint-todo/config-schema.json",
  "correct": {
    "limit": {
      "count": 30,
      "type": "violation"
    }
  }
}
```

</details>

## Use as MCP server (Experimental)

eslint-todo provides some useful tools to AI Agents via MCP.

You mus specify `--mcp` and `--root <root path>`.

### Setup for VSCode

update `.vscode/mcp.json` in your workspace:

```json
{
  "servers": {
    "eslint-todo": {
      "type": "stdio",
      "command": "npx",
      "args": [
        "@sushichan044/eslint-todo",
        "--mcp",
        "--root",
        "${workspaceFolder}"
      ]
    }
  }
}
```
