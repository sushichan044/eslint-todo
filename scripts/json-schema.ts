import * as fs from "fs-extra/esm";
import { join, resolve } from "pathe";

import { sh } from "../src/utils/command";

const importJsonSchema = async () => {
  const JSON_SCHEMA_PATH = resolve(
    process.cwd(),
    "src/generated/config/json/index.ts",
  );
  const JSON_SCHEMA_NAME = "UserConfigJsonSchema";

  if (!(await fs.pathExists(JSON_SCHEMA_PATH))) {
    throw new Error(`JSON schema file not found: ${JSON_SCHEMA_PATH}`);
  }

  const module_ = (await import(JSON_SCHEMA_PATH).then(
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-member-access
    (m) => m[JSON_SCHEMA_NAME],
  )) as Record<string, unknown>;

  return module_;
};

/**
 * Generate JSON schema and add it to the build artifacts.
 */
export const generateJsonSchemaFile = async (outputDirectory: string) => {
  await fs.ensureDir(outputDirectory);

  const outPath = join(outputDirectory, "config-schema.json");

  if (await fs.pathExists(outPath)) {
    await fs.remove(outPath);
  }

  await sh(["pnpm", "run", "generate-json-schema"]);
  const schema = await importJsonSchema();

  await fs.writeJSON(outPath, schema, { spaces: 2 });
};
