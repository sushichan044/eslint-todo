import type { CLIAction } from "../types";

import { TodoModuleV1Handler } from "../../todofile/v1";

export const updateAction: CLIAction = async (core, consola) => {
  const currentModule = await core.readTodoModule();
  if (!TodoModuleV1Handler.isVersion(currentModule)) {
    return;
  }

  consola.start(
    "Detected old version of todo file. Automatically upgrading ...",
  );

  const nextModule = TodoModuleV1Handler.upgradeToNextVersion(currentModule);
  if (nextModule === false) {
    consola.error("Upgrade failed!");
    return;
  }

  await core.writeTodoModule(nextModule);
  consola.success("Upgrade finished!");
};
