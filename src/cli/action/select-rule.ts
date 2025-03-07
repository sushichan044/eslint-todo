import type { UserOperationOptions } from "../../operation/options";
import type { SelectionResult } from "../../operation/select-rule";
import type { OperationLimit } from "../../operation/types";

import { selectRuleBasedOnLimit } from "../../operation/select-rule";
import { LATEST_TODO_MODULE_HANDLER } from "../../todofile";
import { defineAction } from "./index";

type Input = {
  limit: OperationLimit;
  options?: UserOperationOptions;
};

export const selectRulesToFixAction = defineAction<Input, SelectionResult>(
  async ({ core, logger }, input) => {
    const { limit, options } = input;

    const currentModule = await core.readTodoModule();
    if (!LATEST_TODO_MODULE_HANDLER.isVersion(currentModule)) {
      throw new Error(
        "This action requires the latest version of the todo file.",
      );
    }

    logger.start("Refining ESLint todo file ...");

    return selectRuleBasedOnLimit(currentModule, limit, options);
  },
);
