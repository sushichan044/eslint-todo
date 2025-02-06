# @sushichan044/eslint-todo

> [!WARNING]
> This tool only supports ESLint Flat Config.
>
> If you want to use this tool to migrate to ESLint Flat Config, create the Flat Config first and then run `eslint-todo`.

Simple tool to temporarily disable existing ESLint violations like `.rubocop_todo.yml` in RuboCop.

This allows existing offending files to be excluded from the check on a rule-by-rule basis, which may be helpful when making destructive changes to ESLint settings.

## Installation

```bash
pnpm install @sushichan044/eslint-todo
```

## Getting Started

1. Add `eslint-todo` config to your `eslint.config.js`.

    ``` diff
    + import { eslintConfigTodo } from '@sushichan044/eslint-todo/eslint';

    export default [
      // your existing,
    + await eslintConfigTodo(),
    ]
    ```

2. Run `eslint-todo` to generate ESLint Todo file. By default, it will generate `.eslint-todo.js` file.

    > [!NOTE]
    > Run this command at the directory where your `eslint.config.js` is located.

    ```bash
    pnpm exec eslint-todo
    ```

3. Add `.eslint-todo.js` to your ignore files like `.prettierignore`.

    ```diff
    // .prettierignore
    + .eslint-todo.js
    ```

## Configuration (CLI)

### cwd

default: `process.cwd()`

You can specify the directory where `.eslint-todo.js` will be generated.

> [!WARNING]
> You should place `eslint.config.js` on the specified directory.

### todo-file

default: `.eslint-todo.js`

You can specify the name of the ESLint Todo file.

## What is ESLint Todo File?

ESLint Todo file is like [this](./.eslint-todo.js).

This object is used to disable ESLint rules for specific files.
See more: [Ignore Files in ESLint Flat Config](https://eslint.org/docs/latest/use/configure/ignore).

> [!NOTE]
> In the future, a feature to correct only auto-fixable violations will be added.

```javascript
/* eslint-disable */
/**
 * Auto generated file by eslint-todo. DO NOT EDIT MANUALLY.
 */

export default {
  "no-undef": {
    autoFix: false,

    files: [
      "bin/eslint-todo.mjs",
      "bin/eslint-todo.mjs",
      "bin/eslint-todo.mjs"
    ]
  }
};
```
