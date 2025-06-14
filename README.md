# @sushichan044/eslint-todo

[![Ask DeepWiki](https://deepwiki.com/badge.svg)](https://deepwiki.com/sushichan044/eslint-todo)

> [!CAUTION]
> This library will soon be subject to destructive changes based on [ESLint bulk suppressions](https://eslint.org/blog/2025/04/introducing-bulk-suppressions/#getting-started).

Simple tool to temporarily disable existing ESLint violations like `.rubocop_todo.yml` in RuboCop.

It also has a utility that helps reducing ignored violations at your pace.

This tool is designed to work with AI Agents such as [Devin](https://devin.ai/).

And now eslint-todo also provides MCP server! [See: Use as MCP server](#use-as-mcp-server-experimental)

> [!NOTE]
> This tool only supports ESLint Flat Config with ES Module.
>
> If you want to use this tool to supress ESLint errors when migrating to ESLint Flat Config,
>
> you first need to create Flat Config and then use this tool. Maybe utilities like [@eslint/compat](https://github.com/eslint/rewrite/tree/main/packages/compat) can help you.

## Installation

```bash
npm install --save-dev eslint @sushichan044/eslint-todo
```

Requires:

- **ES Module**
- ESLint: `^8.57.0 || ^9.0.0`
  - **Flat Config**
- Node.js: `>= 20.0.0`
  - May work in Deno, but not tested.

## Getting Started

1. Add `eslint-todo` config **at the bottom of your configs**. Do not forget `await`.

    ``` diff
    // example: eslint.config.js
    + import eslintConfigTodo from '@sushichan044/eslint-todo/eslint';

    export default [
      // your existing configs,
    + await eslintConfigTodo()
    ]
    ```

2. Run `eslint-todo` to generate ESLint Todo file at the directory where `eslint.config.js` is placed.

    ```bash
    npx @sushichan044/eslint-todo
    ```

## Usage

### Generate ESLint Todo file

```bash
npx @sushichan044/eslint-todo
```

### Correct ignored errors

Add `--correct` flag to launch eslint-todo with correct mode.

In this mode, eslint-todo searches the todo file with the limit from config file or CLI.
And it removes one matching rule from the todo file.

This allows ESLint to detect that rule as a violation again. For safety, only auto-fixable rules are searched by default.

By default, it searches for rules that can be automatically fixed and have less than or equal to 100 violations.

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

### Configuration File (recommended)

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
