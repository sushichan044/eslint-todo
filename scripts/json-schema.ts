import * as fs from "fs-extra/esm";
import { cwd } from "node:process";
import { join } from "pathe";

import { UserConfigJsonSchema } from "../src/config/json";

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

await generateJsonSchemaFile(cwd());
