import { table } from "table";

import type { TodoModuleLike } from "../../todofile/types";
import type { TodoModuleV2 } from "../../todofile/v2";

import { TodoModuleV2Handler } from "../../todofile/v2";
import { defineAction } from "./index";

export const listAction = defineAction(async ({ core, logger }) => {
  // v1 module should be upgraded to v2 at the entry point of CLI
  const todoModule = getTodoModuleV2(await core.readTodoModule());

  if (!todoModule) {
    throw new Error("Unsupported todo file version");
  }

  const todoTable = generateTodoInfo(todoModule).map((row) => {
    return [
      row.rule,
      row.violations.files,
      row.violations.total,
      row.autoFix ? "✔" : "",
    ];
  });

  if (todoTable.length === 0) {
    logger.success("No rules found in the todo file! Good job!");
    return;
  }

  const tableData = [["Rule", "Files", "Violations", "AutoFix"], ...todoTable];

  logger.log.raw(table(tableData));
  return;
});

const getTodoModuleV2 = (module: TodoModuleLike): TodoModuleV2 | null => {
  return TodoModuleV2Handler.isVersion(module) ? module : null;
};

type TodoInfo = {
  autoFix: boolean;
  rule: string;
  violations: {
    files: number;
    total: number;
  };
};

const generateTodoInfo = (todoModule: TodoModuleV2): TodoInfo[] => {
  const todoInfo: TodoInfo[] = [];

  for (const [rule, { autoFix, violations }] of Object.entries(
    todoModule.todo,
  )) {
    const violatedFiles = Object.keys(violations).length;
    const totalViolations = Object.values(violations).reduce(
      (sum, count) => sum + count,
      0,
    );

    todoInfo.push({
      autoFix,
      rule,
      violations: {
        files: violatedFiles,
        total: totalViolations,
      },
    });
  }

  return todoInfo;
};
