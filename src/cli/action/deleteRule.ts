import { deleteRule } from "../../operation/deleteRule";
import { LATEST_MODULE_HANDLER } from "../../todofile";
import { defineAction } from "./index";

type Input = {
  ruleId: string;
};

export const deleteRuleAction = defineAction<Input>(
  async ({ core, logger }, input) => {
    const { ruleId } = input;

    const currentModule = await core.readTodoModule();
    if (!LATEST_MODULE_HANDLER.isVersion(currentModule)) {
      throw new Error(
        "This action requires the latest version of the todo file.",
      );
    }

    logger.info(`Deleting rule ${ruleId} from the todo file ...`);

    const newModule = deleteRule(currentModule, ruleId);

    await core.writeTodoModule(newModule);
  },
);
