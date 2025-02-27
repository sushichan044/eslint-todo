# @sushichan044/eslint-todo

> [!WARNING]
> This tool only supports ESLint Flat Config with ES Module.
>
> If you want to use this tool to supress ESLint errors when migrating to ESLint Flat Config,
> you first need to create Flat Config and then use this tool. Maybe utilities like [@eslint/compat](https://github.com/eslint/rewrite/tree/main/packages/compat) can help you.

Simple tool to temporarily disable existing ESLint violations like `.rubocop_todo.yml` in RuboCop.

This allows existing offending files to be excluded from scanning on a rule-by-rule basis, which is useful when making destructive changes to ESLint settings.

It also has a utility that reduces the number of ignored rules at a pace that works for your team.

## Features

- Temporarily disable ESLint rules for specific files having existing violations with one command.
- Assistive feature to gradually eliminate ignored errors.

## Installation

```bash
pnpm install -D @sushichan044/eslint-todo
```

## Getting Started

1. Add `eslint-todo` config to your `eslint.config.js`.

    ``` diff
    + import { eslintConfigTodo } from '@sushichan044/eslint-todo/eslint';

    export default [
      // your existing configs,
    + await eslintConfigTodo()
    ]
    ```

2. Run `eslint-todo` to generate ESLint Todo file. By default, it will generate `.eslint-todo.js` file.

    > [!NOTE]
    > Run this command at the directory where your `eslint.config.js` is located.

    ```bash
    pnpm exec eslint-todo
    ```

3. Ignore `.eslint-todo.js` with some tools like Prettier as it is auto-generated module.

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

You can use `--limit`, `--limit-type`, `--no-auto-fixable-only` options to control the behavior.

Default options are: <br>
Select one rule that has a total of 100 or fewer violations from auto-fixable rules.

```bash
eslint-todo --correct --limit 100 --limit-type violation
```

Select one rule that has a total of 10 or fewer files with violations from auto-fixable rules:

```bash
eslint-todo --correct --limit 10 --limit-type file
```

Select one rule that has a total of 100 or fewer violations from all rules including non-auto-fixable rules:

```bash
eslint-todo --correct --limit 100 --limit-type violation --no-auto-fixable-only
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
