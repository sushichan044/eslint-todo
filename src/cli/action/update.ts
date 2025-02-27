// TODO: ここでは本当に TodoModuleV1Handler が必要
// eslint-disable-next-line @typescript-eslint/no-restricted-imports
import { TodoModuleV1Handler } from "../../todofile/v1";
import { defineAction } from "./index";

export const updateAction = defineAction(async ({ core, logger }) => {
  const currentModule = await core.readTodoModule();
  if (!TodoModuleV1Handler.isVersion(currentModule)) {
    return;
  }

  logger.start(
    "Detected old version of todo file. Automatically upgrading ...",
  );

  const nextModule = TodoModuleV1Handler.upgradeToNextVersion(currentModule);
  if (nextModule === false) {
    logger.error("Upgrade failed!");
    return;
  }

  await core.writeTodoModule(nextModule);
  logger.success("Upgrade finished!");
});
