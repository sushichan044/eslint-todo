/* eslint-disable import-x/no-extraneous-dependencies */
import { existsSync } from "node:fs";
import { writeFile } from "node:fs/promises";
import path from "node:path";
import { ESLint } from "eslint";

type ESLintTodoEntry = {
  files: string[];
  autoFix: boolean;
};

type ESLintTodo = Record<string, ESLintTodoEntry>;

const createJsFile = (filesPerRule: ESLintTodo): string => {
  const js = `/* eslint-disable */
/**
 * Auto generated file by eslint-todo. DO NOT EDIT.
 */

const eslintTodo = ${JSON.stringify(filesPerRule, null, 2)};

export default eslintTodo;
`;
  return js;
};

const emptyTodo = async (todoFile: string): Promise<void> => {
  const todoPath = path.resolve(process.cwd(), todoFile);

  if (!existsSync(todoPath)) {
    throw new Error(`ESLint todo file not found at ${todoPath}`);
  }

  await writeFile(todoPath, createJsFile({}));
};

const main = async (): Promise<void> => {
  await emptyTodo(".eslint-todo.js");

  const eslint = new ESLint();
  const results = await eslint.lintFiles([path.resolve(process.cwd(), "**/*")]);

  const groupByRuleId = results.reduce((acc, result) => {
    result.messages.forEach((message) => {
      if (message.ruleId == null) {
        return;
      }

      if (acc[message.ruleId] == null) {
        // eslint-disable-next-line no-param-reassign
        acc[message.ruleId] = {
          autoFix: false,
          files: [],
        };
      }
      acc[message.ruleId].files.push(
        path.relative(process.cwd(), result.filePath)
      );
      // eslint-disable-next-line no-param-reassign
      acc[message.ruleId].autoFix = message.fix != null;
    });
    return acc;
  }, {} as ESLintTodo);

  // sort by key, dictionary order
  const sortedRuleId = Object.keys(groupByRuleId).sort();

  // sort each files by dictionary order
  Object.values(groupByRuleId).forEach((entry) => entry.files.sort());

  const sortedGroupByRuleId = sortedRuleId.reduce((acc, key) => {
    // eslint-disable-next-line no-param-reassign
    acc[key] = groupByRuleId[key];
    return acc;
  }, {} as ESLintTodo);

  await writeFile(
    path.resolve(process.cwd(), ".eslint-todo.js"),
    createJsFile(sortedGroupByRuleId)
  );
};

// eslint-disable-next-line no-console
main().catch(console.error);
