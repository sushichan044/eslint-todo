import { getCLIExecutor } from "./commands";

export const run = async (argv: string[]): Promise<void> => {
  await getCLIExecutor(argv);
};
