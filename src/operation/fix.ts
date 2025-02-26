import type { TodoModuleV2 } from "../todofile/v2";
import type { OperationOptions, OperationViolationLimit } from "./types";

// TODO: この操作の本質は TodoModule から最も条件に適したルールを抜いて返すことではないか？
// なぜなら、そうすればあとは Core に修正を依頼するだけである。

type SelectionResult =
  | {
      ruleId: string;
      success: true;
      todoModule: TodoModuleV2;
    }
  | {
      success: false;
      todoModule: TodoModuleV2;
    };

/**
 * Selects the rule with the most violations that can be auto-fixed and is below the specified limit.
 *
 * @param todoModule - The TodoModuleV2 object.
 * @param limit - The upper limit for the number of violations.
 * @returns The rule ID with the most violations that can be auto-fixed and is below the limit, or null if no such rule exists.
 */
export function selectRuleWithMostViolations(
  todoModule: TodoModuleV2,
  limit: OperationViolationLimit,
  options: OperationOptions = {},
): SelectionResult {
  const { count: limitCount } = limit;
  const { autoFixableOnly = true } = options;

  let selectedRule: string | null = null;
  let maxViolations = 0;

  for (const [ruleId, entry] of Object.entries(todoModule.todo)) {
    if (autoFixableOnly && !entry.autoFix) {
      continue;
    }

    const totalViolations = Object.values(entry.violations).reduce(
      (sum, count) => sum + count,
      0,
    );
    if (totalViolations > maxViolations && totalViolations < limitCount) {
      maxViolations = totalViolations;
      selectedRule = ruleId;
    }
  }

  if (selectedRule === null) {
    return { success: false, todoModule };
  }

  const newTodoModule = { ...todoModule };
  newTodoModule.todo[selectedRule] = {
    ...newTodoModule.todo[selectedRule],
    violations: {},
  };

  return {
    ruleId: selectedRule,
    success: true,
    todoModule: newTodoModule,
  };
}
