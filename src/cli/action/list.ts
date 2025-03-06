import { table } from "table";

import type { TodoModuleLike } from "../../todofile/types";
import type { TodoModuleV2 } from "../../todofile/v2";

import { TodoModuleV2Handler } from "../../todofile/v2";
import { defineAction } from "./index";

export const listAction = defineAction(async ({ core, logger }) => {
  const todoModule = getTodoModuleV2(await core.readTodoModule());

  if (todoModule === false) {
    throw new Error("Unsupported todo file version");
  }

  const todoTable = generateTodoTable(todoModule);

  if (todoTable.length === 0) {
    logger.success("No rules found in the todo file! Good job!");
    return;
  }

  const tableData = [["Rule", "Files", "Violations", "AutoFix"], ...todoTable];

  logger.log.raw(table(tableData));

  return;
});

const getTodoModuleV2 = (module: TodoModuleLike): false | TodoModuleV2 => {
  if (TodoModuleV2Handler.isVersion(module)) {
    return module;
  }

  return false;
};

type TableFormat = [
  ruleId: string,
  violatedFiles: number,
  totalViolations: number,
  autoFixableEmoji: string,
];

const generateTodoTable = (todoModule: TodoModuleV2): TableFormat[] => {
  const tableData: TableFormat[] = [];

  for (const [ruleId, { autoFix, violations }] of Object.entries(
    todoModule.todo,
  )) {
    const violatedFiles = Object.keys(violations).length;
    const totalViolations = Object.values(violations).reduce(
      (sum, count) => sum + count,
      0,
    );

    const autoFixEmoji = autoFix ? "✓" : "";

    tableData.push([ruleId, violatedFiles, totalViolations, autoFixEmoji]);
  }

  return tableData;
};
