/**
 * @fileoverview Generate JSON schema and add it to the build artifacts.
 *
 * IMPORTANT:
 * This script requires `unplugin-typia` to work.
 * So you need to run this script via `pnpm run build:json-schema`.
 */

import * as fs from "fs-extra/esm";
import { join, resolve } from "pathe";

import { UserConfigJsonSchema } from "../src/config/json";

const getRepoRoot = () => {
  return resolve(import.meta.dirname, "..");
};

/**
 * Generate JSON schema and add it to the build artifacts.
 */
const generateJsonSchemaFile = async (outputDirectory: string) => {
  await fs.ensureDir(outputDirectory);

  const outPath = join(outputDirectory, "config-schema.json");

  if (await fs.pathExists(outPath)) {
    await fs.remove(outPath);
  }

  await fs.writeJSON(outPath, UserConfigJsonSchema, { spaces: 2 });

  console.log(
    `scripts/json-schema.ts: JSON schema file generated at ${outPath}`,
  );
};

await generateJsonSchemaFile(getRepoRoot());
