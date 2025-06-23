# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is `@sushichan044/eslint-todo`, a tool for temporarily disabling existing ESLint violations similar to RuboCop's `.rubocop_todo.yml`. The tool helps teams gradually fix ESLint violations and includes MCP server capabilities for AI agents.

## Development Commands

### Build and Test

- `pnpm run build` - Build the project using unbuild
- `pnpm run dev` - Development mode with stubbing
- `pnpm run test` - Run tests in watch mode using Vitest
- `pnpm run test:run` - Run tests once
- `pnpm run check` - Run full CI pipeline (build, lint, format check, typecheck, test)

### Code Quality

- `pnpm run lint` - ESLint with zero warnings tolerance
- `pnpm run format` - Format code with Prettier
- `pnpm run format:ci` - Check formatting
- `pnpm run typecheck` - TypeScript type checking

### Testing

- Use Vitest for testing
- Test files should end with `.test.ts` or `.spec.ts`
- Run single test file: `pnpm test src/path/to/file.test.ts`

## Architecture

### Core Components

1. **ESLintTodoCore** (`src/index.ts`) - Main API entrypoint with worker-based architecture
2. **Action System** (`src/action/`) - Composable action pattern for operations
3. **Config System** (`src/config/`) - Configuration handling with JSON schema validation
4. **Todo File Management** (`src/todofile/`) - Handles v1 (deprecated) and v2 todo file formats
5. **Worker System** (`src/worker/`) - Comlink-based worker for ESLint operations
6. **MCP Server** (`src/mcp/`) - ModelContextProtocol server for AI agents

### Key Design Patterns

- **Remote Workers**: ESLint operations run in workers to avoid module caching issues
- **Action-based Architecture**: Operations are defined as composable actions with hooks
- **Type-safe Configuration**: Using Zod for runtime validation and JSON schema generation
- **Multi-format Support**: Supports both programmatic API and CLI usage

### Data Flow

1. Configuration loaded from `eslint-todo.config.{js,ts}` or CLI flags
2. ESLint runs via worker to generate violation data
3. Todo file (`.eslint-todo.js`) generated/updated with suppressions
4. ESLint config integration via `@sushichan044/eslint-todo/eslint`

## Technical Details

### Build System

- Uses `unbuild` with Rollup
- TypeScript with strict mode enabled
- Typia for runtime type validation
- Worker scripts must be included in build entries (validated at build time)

### ESLint Integration

- Requires ESLint Flat Config with ES Module
- Self-hosting: uses own eslint-todo config at bottom of `eslint.config.ts`
- Custom rules for preventing deprecated imports

### Dependencies

- Core: ESLint utils, Zod, Comlink for workers
  - IMPORTANT: zod is only for ModelContextProtocol SDK. use typia for normal validation use.
- Build: unbuild, TypeScript, Typia
- Dev: Vitest, ESLint ecosystem packages

## Development Notes

### Todo File Versions

- v1 is deprecated (import restricted via ESLint rule)
- Use v2 format in `src/todofile/v2.ts`
- Serialization handled in `src/serializer.ts`

### Worker Architecture

- All ESLint operations must go through remote workers
- Direct todo module reading is unsafe (`_DO_NOT_USE_DIRECTLY_unsafeReadTodoModule`)
- Use `RemoteESLintTodoCore` for safe operations

### Testing Strategy

- Integration tests for rule selection algorithms
- Unit tests for core utilities and configuration
- File-based fixtures using fs-fixture

## CLI Usage

- Main command: `npx @sushichan044/eslint-todo`
- Correct mode: `--correct` flag to incrementally fix violations
- MCP server: `--mcp --root <path>` for AI agent integration
