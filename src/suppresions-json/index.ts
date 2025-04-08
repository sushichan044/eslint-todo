// eslint-disable-next-line @typescript-eslint/no-restricted-imports
import type { TodoModuleV1 } from "../todofile/v1";
import type { TodoModuleV2 } from "../todofile/v2";
import type { ESLintSuppressionsJson } from "./types";

interface SuppressionsJsonGenerator {
  fromV1(v1: TodoModuleV1): ESLintSuppressionsJson;

  fromV2(v2: TodoModuleV2): ESLintSuppressionsJson;
}

export const SuppressionsJsonGenerator: SuppressionsJsonGenerator = {
  fromV1(v1: TodoModuleV1): ESLintSuppressionsJson {
    const suppressionsJson: ESLintSuppressionsJson = {};

    for (const [ruleId, entry] of Object.entries(v1)) {
      for (const filePath of entry.files) {
        suppressionsJson[filePath] ??= {};

        if (Object.hasOwn(suppressionsJson[filePath], ruleId)) {
          // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
          suppressionsJson[filePath][ruleId]!.count++;
          continue;
        }
        suppressionsJson[filePath][ruleId] = { count: 1 };
      }
    }

    return suppressionsJson;
  },

  fromV2(v2: TodoModuleV2): ESLintSuppressionsJson {
    const suppressionsJson: ESLintSuppressionsJson = {};

    for (const [ruleId, entry] of Object.entries(v2.todo)) {
      for (const [filePath, count] of Object.entries(entry.violations)) {
        suppressionsJson[filePath] ??= {};

        if (Object.hasOwn(suppressionsJson[filePath], ruleId)) {
          // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
          suppressionsJson[filePath][ruleId]!.count += count;
          continue;
        }

        suppressionsJson[filePath][ruleId] = { count };
      }
    }

    return suppressionsJson;
  },
};
