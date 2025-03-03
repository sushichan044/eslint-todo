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
    + import { eslintConfigTodo } from '@sushichan044/eslint-todo/eslint';

    export default [
      // your existing configs,
    + await eslintConfigTodo()
    ]
    ```

2. Run `eslint-todo` to generate ESLint Todo file at the directory where `eslint.config.js` is placed.

    ```bash
    npx eslint-todo
    ```

3. Ignore generated `.eslint-todo.js` in some tools if  you needed.

    ```diff
    // example: .prettierignore
    + .eslint-todo.js
    ```

## Usage

### Generate ESLint Todo file

```bash
eslint-todo
```

### Reduce ignored errors

Add `--correct` flag to launch eslint-todo with error reduction mode.

In this mode, eslint-todo searches the todo file with the limit from CLI and removes one matching rule from the todo file.
This allows ESLint to detect that rule as a violation again. For safety, only auto-fixable rules are searched by default.

You can use `--limit`, `--limit-type`, `--auto-fixable-only` options to control the behavior.

Default options are: <br>
Select one rule that has a total of 100 or fewer violations from **auto-fixable** rules.

```bash
eslint-todo --correct --limit 100 --limit-type violation
```

Select one rule that has a total of 10 or fewer files with violations from auto-fixable rules:

```bash
eslint-todo --correct --limit 10 --limit-type file
```

Select one rule that has a total of 100 or fewer violations from **all rules including non-auto-fixable** rules:

```bash
eslint-todo --correct --limit 100 --limit-type violation --auto-fixable-only false
```

## Configuration (CLI)

### cwd

default: `process.cwd()`

You can pass `--cwd` to specify the directory where `.eslint-todo.js` will be generated.

> [!WARNING]
> You should place `eslint.config.js` on the specified directory.

### todo-file

default: `.eslint-todo.js`

You can pass `--todo-file` to specify the name of the ESLint Todo file.

### logging mode

> [!CAUTION]
> This feature is not working properly yet.

You can pass `--debug`, `--trace`, `--verbose` to see the debug logs.
