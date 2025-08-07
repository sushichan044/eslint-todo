import type { IModule } from "dependency-cruiser";

import { cruise } from "dependency-cruiser";
import extractTSConfig from "dependency-cruiser/config-utl/extract-ts-config";
import { cwd } from "node:process";
import { resolve } from "pathe";

type ResolveOptions = {
  /**
   * path to tsconfig.json
   *
   * If you specified relative path, it will be resolved relative to the current working directory.
   *
   * @default "tsconfig.json"
   */
  tsConfig?: string;

  /**
   * root directory of the project
   *
   * @default process.cwd()
   */
  baseDir?: string;
};

type ModuleResolutionResult =
  | {
      error: null;
      modules: IModule[];
    }
  | {
      error: string;
      modules: null;
    };

// Dependency types that should be excluded (matches doNotFollow configuration)
const EXCLUDED_DEPENDENCY_TYPES = [
  "core",
  "npm",
  "npm-bundled",
  "npm-dev",
  "npm-no-pkg",
  "npm-optional",
  "npm-peer",
  "npm-unknown",
] as const;

/**
 * Check if a module should be excluded based on its dependency types
 * @param dependencyTypes - Array of dependency types from IModule
 * @returns true if module should be excluded
 */
export function shouldExcludeModule(dependencyTypes: string[]): boolean {
  return dependencyTypes.some((type) =>
    (EXCLUDED_DEPENDENCY_TYPES as readonly string[]).includes(type),
  );
}

export async function resolveModules(
  entrypoints: string[],
  options: ResolveOptions = {},
): Promise<ModuleResolutionResult> {
  if (entrypoints.length === 0) {
    return {
      error: "At least one entrypoint must be provided",
      modules: null,
    };
  }

  const {
    // eslint-disable-next-line unicorn/prevent-abbreviations
    baseDir = cwd(),
    tsConfig: tsConfigPath = resolve(baseDir, "tsconfig.json"),
  } = options;

  const tsConfig = extractTSConfig(tsConfigPath);
  const cruiseResult = await cruise(
    entrypoints,
    {
      baseDir,
      combinedDependencies: true,
      detectJSDocImports: true, // we need to trace @type{import("some-module")} in JSDoc
      doNotFollow: {
        dependencyTypes: [
          // spread required to avoid type error...
          ...EXCLUDED_DEPENDENCY_TYPES,
        ],
        path: "node_modules",
      },
      enhancedResolveOptions: {
        conditionNames: ["import", "require", "node", "default"],
        exportsFields: ["exports"],
        mainFields: ["main", "types", "typings"],
      },
      exclude: {
        path: "node_modules", // exclude external modules in node_modules
      },
      parser: "tsc",
      ruleSet: {
        forbidden: [
          {
            comment:
              "Circular dependencies lead to initialization problems and make code harder to maintain",
            from: {},
            name: "no-circular",
            severity: "error",
            to: { circular: true },
          },
        ],
        // Workaround: dependency-cruiser requires tsConfig in options to enable tsconfig-paths-webpack-plugin
        // @ts-expect-error - dependency-cruiser types don't reflect this requirement
        options: {
          tsConfig: {
            fileName: tsConfigPath,
          },
        },
      },
      tsConfig: { fileName: tsConfigPath },
      tsPreCompilationDeps: true, // we need to trace type imports
    },
    {},
    {
      tsConfig,
    },
  );

  if (typeof cruiseResult.output === "string") {
    return {
      error: `Module graph build failed: ${cruiseResult.output}`,
      modules: null,
    };
  }

  return {
    error: null,
    modules: cruiseResult.output.modules,
  };
}
