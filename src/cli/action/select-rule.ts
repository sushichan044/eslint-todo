import type { SelectionResult } from "../../operation/select-rule";

import { selectRuleBasedOnLimit } from "../../operation/select-rule";
import { LATEST_TODO_MODULE_HANDLER } from "../../todofile";
import { defineAction } from "./index";

type Hooks = {
  "after:select-rule": (result: Readonly<SelectionResult>) => void;
  "before:select-rule": () => void;
  "pre-condition:git-changes": (hasChanges: boolean) => void;
};

export const selectRulesToFixAction = defineAction<
  never,
  SelectionResult,
  Hooks
>(async ({ config, core, hooks }) => {
  const currentModule = await core.readTodoModule();
  if (!LATEST_TODO_MODULE_HANDLER.isVersion(currentModule)) {
    throw new Error(
      "This action requires the latest version of the todo file.",
    );
  }

  const hasChanges = await core.todoModuleHasUncommittedChanges();
  await hooks.callHook("pre-condition:git-changes", hasChanges);

  if (hasChanges) {
    return {
      success: false,
    };
  }

  await hooks.callHook("before:select-rule");
  const result = selectRuleBasedOnLimit(currentModule, config.correct);
  await hooks.callHook("after:select-rule", result);

  return result;
});
