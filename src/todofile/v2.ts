import type { ESLintRuleId, TodoFile } from "./types";

type ESLintTodoEntryV2 = {
  /**
   * Whether rule can be auto fixed.
   */
  autoFix: boolean;
  /**
   * Files violating the rule.
   */
  violations: {
    [filePath: string]: number;
  };
};

export type ESLintTodoV2 = {
  meta: {
    VERSION: 2;
  };
  todo: Record<ESLintRuleId, ESLintTodoEntryV2>;
};

// eslint-disable-next-line @typescript-eslint/no-unused-vars
interface ITodoFileV2 extends TodoFile<ESLintTodoV2> {
  meta: {
    VERSION: 2;
  };
}
