import type { Hookable, HookKeys } from "hookable";

import defu from "defu";
import { createHooks } from "hookable";

import type { MaybePromise } from "./utils";

type ESLintTodoGeneratorHooks = {
  afterResetTodoFile: (todoFilePath: string) => MaybePromise<void>;
  beforeResetTodoFile: (todoFilePath: string) => MaybePromise<void>;

  afterESLintLinting: () => MaybePromise<void>;
  beforeESLintLinting: () => MaybePromise<void>;

  afterESLintTodoAggregation: () => MaybePromise<void>;
  beforeESLintTodoAggregation: () => MaybePromise<void>;

  afterESLintTodoGeneration: () => MaybePromise<void>;
  beforeESLintTodoGeneration: () => MaybePromise<void>;
};

export type ESLintTodoGeneratorUserHooks = Partial<ESLintTodoGeneratorHooks>;

export const initializeHooks = (
  userHooks: ESLintTodoGeneratorUserHooks
): Hookable<ESLintTodoGeneratorHooks, HookKeys<ESLintTodoGeneratorHooks>> => {
  const hooker = createHooks<ESLintTodoGeneratorHooks>();
  const resolvedHooks = hooksWithDefault(userHooks);

  hooker.addHooks(resolvedHooks);

  return hooker;
};

const hooksWithDefault = (
  userHooks: Partial<ESLintTodoGeneratorHooks>
): ESLintTodoGeneratorHooks => defu(userHooks, DEFAULT_HOOK);

// eslint-disable-next-line @typescript-eslint/no-empty-function
const NO_OP = () => {};

const DEFAULT_HOOK = {
  afterESLintLinting: NO_OP,
  afterESLintTodoAggregation: NO_OP,
  afterESLintTodoGeneration: NO_OP,
  afterResetTodoFile: NO_OP,
  beforeESLintLinting: NO_OP,
  beforeESLintTodoAggregation: NO_OP,
  beforeESLintTodoGeneration: NO_OP,
  beforeResetTodoFile: NO_OP,
} satisfies ESLintTodoGeneratorHooks;
