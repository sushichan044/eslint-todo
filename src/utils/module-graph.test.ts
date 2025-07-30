import type { TSConfig } from "pkg-types";

import defu from "defu";
import { createFixture } from "fs-fixture";
import { describe, expect, it } from "vitest";

import { resolveModules, shouldExcludeModule } from "./module-graph";

describe("shouldExcludeModule", () => {
  it("should exclude core modules", () => {
    expect(shouldExcludeModule(["core", "import"])).toBe(true);
  });

  it("should exclude npm modules", () => {
    expect(shouldExcludeModule(["npm", "import"])).toBe(true);
  });

  it("should exclude npm-dev modules", () => {
    expect(shouldExcludeModule(["npm-dev", "import"])).toBe(true);
  });

  it("should exclude npm-peer modules", () => {
    expect(shouldExcludeModule(["npm-peer", "import"])).toBe(true);
  });

  it("should include local modules", () => {
    expect(shouldExcludeModule(["local", "import"])).toBe(false);
  });

  it("should include modules with unknown dependency types", () => {
    expect(shouldExcludeModule(["unknown-type", "import"])).toBe(false);
  });

  it("should return false for empty dependency types", () => {
    expect(shouldExcludeModule([])).toBe(false);
  });
});

const createTSConfig = (overrides: Partial<TSConfig> = {}): TSConfig => {
  return defu(
    {
      compilerOptions: {
        allowUnreachableCode: false,
        esModuleInterop: true,
        exactOptionalPropertyTypes: true,
        forceConsistentCasingInFileNames: true,
        isolatedModules: true,
        module: "nodenext",
        noFallthroughCasesInSwitch: true,
        noImplicitOverride: true,
        noImplicitReturns: true,
        noPropertyAccessFromIndexSignature: true,
        noUncheckedIndexedAccess: true,
        noUncheckedSideEffectImports: true,
        resolveJsonModule: true,
        skipLibCheck: true,
        strict: true,
        strictNullChecks: true,
        target: "esnext",
        verbatimModuleSyntax: true,
      },
    },
    overrides,
  );
};

describe("resolveModules", () => {
  it("should return error if no entrypoints are provided", async () => {
    const result = await resolveModules([]);
    expect(result.error).toBe("At least one entrypoint must be provided");
  });

  it("should resolve basic import chain", async () => {
    await using fixture = await createFixture({
      "package.json": JSON.stringify({
        name: "test-project",
        type: "module",
      }),
      "src": {
        "config.js": `export const config = { name: "test-config" };`,
        "entry.js": `import { helper } from "./utils/helper.js";
export const main = helper;`,
        "utils": {
          "helper.js": `import { config } from "../config.js";
export const helper = config.name;`,
        },
      },
      "tsconfig.json": JSON.stringify(
        createTSConfig({
          compilerOptions: {
            checkJs: true, // js only project
          },
          exclude: ["node_modules"],
          include: ["**/*.js", "**/*.ts"],
        }),
      ),
    });

    const result = await resolveModules(["src/entry.js"], {
      baseDir: fixture.getPath("."),
    });

    expect(result.error).toBeNull();
    expect(result.modules).toBeDefined();

    if (result.modules) {
      const sources = result.modules.map((m) => m.source);
      expect(sources).toContain("src/entry.js");
      expect(sources).toContain("src/utils/helper.js");
      expect(sources).toContain("src/config.js");
    }
  });

  it("should handle TypeScript files", async () => {
    await using fixture = await createFixture({
      "package.json": JSON.stringify({
        name: "test-ts-project",
        type: "module",
      }),
      "src": {
        "entry.ts": `import { helper } from "./helper";
console.log(helper);`,
        "helper.ts": `export const helper: string = "typescript-helper";`,
      },
      "tsconfig.json": JSON.stringify(
        createTSConfig({
          exclude: ["node_modules"],
          include: ["**/*.js", "**/*.ts"],
        }),
      ),
    });

    const result = await resolveModules(["src/entry.ts"], {
      baseDir: fixture.getPath("."),
    });

    expect(result.error).toBeNull();
    expect(result.modules).toBeDefined();

    if (result.modules) {
      const sources = result.modules.map((m) => m.source);
      expect(sources).toContain("src/entry.ts");
      expect(sources).toContain("src/helper.ts");
    }
  });

  it("should throw error when file does not exist", async () => {
    // TODO: better error message
    await expect(resolveModules(["nonexistent-file.js"])).rejects.toThrow();
  });

  it("should resolve TypeScript paths alias", async () => {
    await using fixture = await createFixture({
      "package.json": JSON.stringify({
        name: "test-alias-project",
        type: "module",
      }),
      "src": {
        "config.ts": `export const config = { name: "alias-config" };`,
        "entry.ts": `import { config } from "@/config";
import { helper } from "@/utils/helper";
export const main = { config, helper };`,
        "utils": {
          "helper.ts": `import { config } from "@/config";
export const helper = \`Helper with \${config.name}\`;`,
        },
      },
      "tsconfig.json": JSON.stringify(
        createTSConfig({
          compilerOptions: {
            baseUrl: ".",
            paths: {
              "@/*": ["src/*"],
            },
          },
          exclude: ["node_modules"],
          include: ["**/*.js", "**/*.ts"],
        }),
      ),
    });

    const result = await resolveModules(["src/entry.ts"], {
      baseDir: fixture.getPath("."),
    });

    expect(result.error).toBeNull();
    expect(result.modules).toBeDefined();

    if (result.modules) {
      const sources = result.modules.map((m) => m.source);
      expect(sources).toContain("src/entry.ts");
      expect(sources).toContain("src/config.ts");
      expect(sources).toContain("src/utils/helper.ts");
    }
  });

  it("should resolve multiple path aliases", async () => {
    await using fixture = await createFixture({
      "package.json": JSON.stringify({
        name: "test-multi-alias-project",
        type: "module",
      }),
      "src": {
        "api": {
          "client.ts": `import { Logger } from "#utils/logger";
export class ApiClient {
  constructor(private logger: Logger) {}
}`,
        },
        "entry.ts": `import { ApiClient } from "~api/client";
import { Logger } from "#utils/logger";
export const main = new ApiClient(new Logger());`,
        "utils": {
          "logger.ts": `export class Logger {
  log(message: string) {
    console.log(message);
  }
}`,
        },
      },
      "tsconfig.json": JSON.stringify(
        createTSConfig({
          compilerOptions: {
            baseUrl: ".",
            paths: {
              "#utils/*": ["src/utils/*"],
              "~api/*": ["src/api/*"],
            },
          },
          exclude: ["node_modules"],
          include: ["**/*.js", "**/*.ts"],
        }),
      ),
    });

    const result = await resolveModules(["src/entry.ts"], {
      baseDir: fixture.getPath("."),
    });

    expect(result.error).toBeNull();
    expect(result.modules).toBeDefined();

    if (result.modules) {
      const sources = result.modules.map((m) => m.source);
      expect(sources).toContain("src/entry.ts");
      expect(sources).toContain("src/api/client.ts");
      expect(sources).toContain("src/utils/logger.ts");
    }
  });

  it("should preserve non-js / ts like imports (e.g. svg)", async () => {
    await using fixture = await createFixture({
      "package.json": JSON.stringify({
        name: "test-svg-project",
        type: "module",
      }),
      "src": {
        "entry.ts": `import logo from "./logo.svg";
console.log(logo);`,
        "logo.svg": `<svg width="100" height="100" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
<circle cx="50" cy="50" r="49" stroke="black" stroke-width="2" />
</svg>`,
      },
      "tsconfig.json": JSON.stringify(
        createTSConfig({
          exclude: ["node_modules"],
          include: ["**/*.js", "**/*.ts"],
        }),
      ),
    });

    const result = await resolveModules(["src/entry.ts"], {
      baseDir: fixture.getPath("."),
    });

    expect(result.error).toBeNull();
    expect(result.modules).toBeDefined();

    if (result.modules) {
      const sources = result.modules.map((m) => m.source);
      expect(sources).toContain("src/entry.ts");
      expect(sources).toContain("src/logo.svg");
    }
  });
});
