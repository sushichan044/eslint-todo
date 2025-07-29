import type { IModule } from "dependency-cruiser";

import { cruise } from "dependency-cruiser";
import extractTSConfig from "dependency-cruiser/config-utl/extract-ts-config";
import { writeFile } from "node:fs/promises";

type ResolveOptions = {
  /**
   * path to tsconfig.json
   *
   * If you specified relative path, it will be resolved relative to the current working directory.
   *
   * @default "tsconfig.json"
   */
  tsConfig?: string;
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

export async function resolveModules(
  entrypoints: string[],
  options: ResolveOptions = {},
): Promise<ModuleResolutionResult> {
  const { tsConfig: tsConfigPath = "tsconfig.json" } = options;

  const tsConfig = extractTSConfig(tsConfigPath);
  const cruiseResult = await cruise(
    entrypoints,
    {
      combinedDependencies: true,
      detectJSDocImports: true, // we need to trace @type{import("some-module")} in JSDoc
      doNotFollow: {
        dependencyTypes: [
          // abort the search if we met external modules
          "npm",
          "npm-dev",
          "npm-peer",
          "npm-bundled",
          "npm-no-pkg",
          "npm-optional",
          "npm-unknown",
          "core",
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
        // this maybe bug of dependency-cruiser, needs more investigation
        // @ts-expect-error we need to place tsConfig here to enable `tsconfig-paths-webpack-plugin`
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
      error: "Module graph build failed",
      modules: null,
    };
  }

  return {
    error: null,
    modules: cruiseResult.output.modules,
  };
}

const main = async () => {
  const graph = await resolveModules(["src/index.ts"], {
    tsConfig: "tsconfig.json",
  });

  if (graph.error != null) {
    console.error(graph.error);
    return;
  }

  await writeFile("cruise-result.json", JSON.stringify(graph.modules, null, 2));
  if (typeof graph.modules === "string") {
    return;
  }
  const moduleMeta = graph.modules.map((module) => {
    return {
      dependencyTypes: module.dependencyTypes,
      source: module.source,
    };
  });
  await writeFile("module-names.json", JSON.stringify(moduleMeta, null, 2));
};

await main();
