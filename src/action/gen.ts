import { TodoModuleSerializer } from "../serializer";
import { defineAction } from "./index";

type Hooks = {
  "after:reset": () => void;
  "before:reset": () => void;

  "after:lint": () => void;
  "before:lint": () => void;

  "after:write": () => void;
  "before:write": () => void;

  "warn:todo-module-is-dirty": () => void;
};

export const genAction = defineAction<never, void, Hooks>(
  async ({ core, hooks }) => {
    const hasChanges = await core.todoModuleHasUncommittedChanges();
    if (hasChanges) {
      await hooks.callHook("warn:todo-module-is-dirty");
      return;
    }

    await hooks.callHook("before:reset");
    await core.resetTodoModule();
    await hooks.callHook("after:reset");

    await hooks.callHook("before:lint");
    const lintResults = await core.lint();
    await hooks.callHook("after:lint");

    const todo = await core.buildTodoFromLintResults(lintResults);

    await hooks.callHook("before:write");
    await core.writeTodoModule(TodoModuleSerializer.fromV2(todo));
    await hooks.callHook("after:write");
  },
);
