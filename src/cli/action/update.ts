// TODO: ここでは本当に TodoModuleV1Handler が必要
// eslint-disable-next-line @typescript-eslint/no-restricted-imports
import { TodoModuleV1Handler } from "../../todofile/v1";
import { defineAction } from "./index";

type Hooks = {
  "before:update": () => void;

  "after:update": () => void;
  "warn:no-upgrade-available": () => void;
};

export const updateAction = defineAction<void, void, Hooks>(
  async ({ core, hooks }) => {
    const currentModule = await core.readTodoModule();
    if (!TodoModuleV1Handler.isVersion(currentModule)) {
      return;
    }

    await hooks.callHook("before:update");

    const nextModule = TodoModuleV1Handler.upgradeToNextVersion(currentModule);
    if (nextModule === false) {
      await hooks.callHook("warn:no-upgrade-available");
      return;
    }

    await core.writeTodoModule(nextModule);
    await hooks.callHook("after:update");
  },
);
