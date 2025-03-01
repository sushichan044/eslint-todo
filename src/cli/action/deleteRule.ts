import type { RuleSelection } from "../../operation/selectRule";

import { deleteRule } from "../../operation/deleteRule";
import { LATEST_MODULE_HANDLER } from "../../todofile";
import { defineAction } from "./index";

type Input = RuleSelection;

export const deleteRuleAction = defineAction<Input>(async ({ core }, input) => {
  const currentModule = await core.readTodoModule();
  if (!LATEST_MODULE_HANDLER.isVersion(currentModule)) {
    throw new Error(
      "This action requires the latest version of the todo file.",
    );
  }

  const newModule = deleteRule(currentModule, input);

  await core.writeTodoModule(newModule);
});
