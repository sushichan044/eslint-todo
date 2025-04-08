import type { SelectionResult } from "../../operation/select-rule";

import { selectRuleBasedOnLimit } from "../../operation/select-rule";
import { TodoModuleV2Handler } from "../../todofile/v2";
import { defineAction } from "./index";

type Hooks = {
  "after:select-rule": (result: Readonly<SelectionResult>) => void;
  "before:select-rule": () => void;
};

export const selectRulesToFixAction = defineAction<
  never,
  SelectionResult,
  Hooks
>(async ({ config, core, hooks }) => {
  const currentModule = await core.readTodoModule();
  if (!TodoModuleV2Handler.isVersion(currentModule)) {
    throw new Error(
      "This action requires the latest version of the todo file.",
    );
  }

  await hooks.callHook("before:select-rule");
  const result = selectRuleBasedOnLimit(currentModule, config.correct);
  await hooks.callHook("after:select-rule", result);

  return result;
});
