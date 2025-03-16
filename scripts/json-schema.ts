import * as fs from "fs-extra/esm";
import { spawn } from "node:child_process";
import { join, resolve } from "pathe";

const sh = async (cmd: string, ...arguments_: string[]) => {
  const proc = spawn(cmd, arguments_, { stdio: "inherit" });
  return new Promise<void>((resolve, reject) => {
    proc.on("exit", (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`Exit code: ${code}`));
      }
    });
  });
};

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

  await sh("pnpm", "run", "generate-json-schema");
  const schema = await importJsonSchema();

  const outputPath = join(outputDirectory, "config-schema.json");
  await fs.writeJSON(outputPath, schema, { spaces: 2 });
};
