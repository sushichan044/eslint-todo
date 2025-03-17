# @sushichan044/eslint-todo

Simple tool to temporarily disable existing ESLint violations like `.rubocop_todo.yml` in RuboCop.

It also has a utility that helps reducing ignored violations at your pace.

> [!NOTE]
> This tool only supports ESLint Flat Config with ES Module.
>
> If you want to use this tool to supress ESLint errors when migrating to ESLint Flat Config,
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
    npx eslint-todo
    ```

## Usage

### Generate ESLint Todo file

```bash
npx eslint-todo
```

### Correct ignored errors

Add `--correct` flag to launch eslint-todo with correct mode.

In this mode, eslint-todo searches the todo file with the limit from config file or CLI.
And it removes one matching rule from the todo file.

This allows ESLint to detect that rule as a violation again. For safety, only auto-fixable rules are searched by default.

By default, it searches for rules that can be automatically fixed and have less than or equal to 100 violations.

## Configuration

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

### Configuration via CLI flags

You can also set eslint-todo by passing a flag to the CLI.
Use `npx eslint-todo --help` to see all available options.

> [!CAUTION]
> The cli flag will be destructively renamed to the same name as the property on config file in v0.1.0.

> [!WARNING]
> Config from CLI flag overwrites the one in the configuration file.
> See the [unjs/defu documentation](https://github.com/unjs/defu) for the actual overwriting behavior.

## Misc

### logging mode

> [!CAUTION]
> This feature is not implemented yet.

You can pass `--debug`, `--trace`, `--verbose` to see the debug logs.
