import type { SelectionResult } from "../../operation/select-rule";

import { selectRuleBasedOnLimit } from "../../operation/select-rule";
import { LATEST_TODO_MODULE_HANDLER } from "../../todofile";
import { defineAction } from "./index";

export const selectRulesToFixAction = defineAction<never, SelectionResult>(
  async ({ config, core, logger }) => {
    const currentModule = await core.readTodoModule();
    if (!LATEST_TODO_MODULE_HANDLER.isVersion(currentModule)) {
      throw new Error(
        "This action requires the latest version of the todo file.",
      );
    }

    logger.start("Refining ESLint todo file ...");

    return selectRuleBasedOnLimit(currentModule, config.correct);
  },
);
