import type { BuildEntry } from "unbuild";

import { globSync } from "node:fs";
import { relative } from "pathe";

const correctUnIncludedWorkerFiles = (
  entries: string[],
  workerFiles: string[],
): string[] => {
  const buildEntries = new Set(entries);

  const unIncludedWorkerFiles = workerFiles.filter(
    (workerFile) => !buildEntries.has(workerFile),
  );

  return unIncludedWorkerFiles;
};

export const checkWorkerScriptsIncludedInEntries = (
  baseDirectory: string,
  entries: BuildEntry[],
) => {
  const entryPaths = entries.map((entry) =>
    relative(baseDirectory, entry.input),
  );

  const workerFiles = globSync("src/worker/**/*.ts");

  const unIncludedWorkerFiles = correctUnIncludedWorkerFiles(
    entryPaths,
    workerFiles,
  );

  const unIncludedForPrint = unIncludedWorkerFiles.map((file) => `"${file}",`);

  if (unIncludedWorkerFiles.length > 0) {
    throw new Error(
      `You must include the following worker files in \`entries\` option of \`build.config.ts\`:\n\n${unIncludedForPrint.join(
        "\n",
      )}`,
    );
  }
};
