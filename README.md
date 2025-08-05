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
- Node.js: `^20.12.0 || ^22.0.0 || >=24.0.0`
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

#### 2.1. Rule-based and File-based Filtering (Default)

The default strategy allows you to filter violations by rules and file patterns.

For example, to resolve 40 violations from any rule other than `@typescript-eslint/no-explicit-any`, specify it as follows:

```bash
eslint-todo --correct \
  --correct.autoFixableOnly false \
  --correct.partialSelection \
  --correct.exclude.rules '@typescript-eslint/no-explicit-any' \
  --correct.limit.count 40 \
  --correct.limit.type violation
```

#### 2.2. Import Graph Strategy

The import graph strategy uses dependency analysis to target only the files that are reachable from specified entrypoints. This is useful when you want to focus on fixing violations in code that is actually being used in your project.

```bash
eslint-todo --correct \
  --correct.strategy.type import-graph \
  --correct.strategy.entrypoints src/pages/HomePage.tsx \
  --correct.limit.count 20 \
  --correct.limit.type violation
```

In this example:

- Only files reachable from `src/pages/HomePage.tsx` will be considered
- This targets a specific page and all its dependencies (components, hooks, utilities)
- External modules (node_modules) are automatically excluded
- Up to 20 violations will be made detectable again
- Perfect for testing the feature on a single page before expanding

You can combine import graph strategy with other filters:

```bash
eslint-todo --correct \
  --correct.strategy.type import-graph \
  --correct.strategy.entrypoints src/pages/settings.tsx \
  --correct.exclude.rules 'no-console,react/button-has-type' \
  --correct.autoFixableOnly \
  --correct.limit.count 15
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
    // Use default rule-based and file-based filtering
    strategy: {
      type: "normal",
    },
  },
});
```

You can also use the import graph strategy to target only files reachable from specific entrypoints:

```typescript
// example: eslint-todo.config.ts with import graph strategy
import { defineConfig } from '@sushichan044/eslint-todo/config';

export default defineConfig({
  correct: {
    strategy: {
      type: "import-graph",
      entrypoints: ["src/pages/HomePage.tsx", "src/pages/AboutPage.tsx"],
    },
    limit: {
      count: 25,
      type: "violation",
    },
    exclude: {
      rules: ["no-console", "react/no-unescaped-entities"],
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
    "strategy": {
      "type": "normal"
    },
    "limit": {
      "count": 30,
      "type": "violation"
    }
  }
}
```

Or with import graph strategy:

```json
{
  "$schema": "node_modules/@sushichan044/eslint-todo/config-schema.json",
  "correct": {
    "strategy": {
      "type": "import-graph",
      "entrypoints": ["src/pages/HomePage.tsx", "src/pages/AboutPage.tsx"]
    },
    "limit": {
      "count": 25,
      "type": "violation"
    },
    "exclude": {
      "rules": ["no-console", "react/no-unescaped-entities"]
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
