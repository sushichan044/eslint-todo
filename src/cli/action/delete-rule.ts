import type { RuleSelection } from "../../operation/select-rule";

import { deleteRule } from "../../operation/delete-rule";
import { LATEST_TODO_MODULE_HANDLER } from "../../todofile";
import { defineAction } from "./index";

type Input = RuleSelection;

type Hooks = {
  "after:delete-and-write": () => void;
  "before:delete-and-write": () => void;

  "warn:todo-module-is-dirty": () => void;
};

export const deleteRuleAction = defineAction<Input, void, Hooks>(
  async ({ core, hooks }, input) => {
    const currentModule = await core.readTodoModule();
    if (!LATEST_TODO_MODULE_HANDLER.isVersion(currentModule)) {
      throw new Error(
        "This action requires the latest version of the todo file.",
      );
    }

    const hasChanges = await core.todoModuleHasUncommittedChanges();
    if (hasChanges) {
      await hooks.callHook("warn:todo-module-is-dirty");
      return;
    }

    await hooks.callHook("before:delete-and-write");

    const newModule = deleteRule(currentModule, input);
    await core.writeTodoModule(newModule);

    await hooks.callHook("after:delete-and-write");
  },
);
