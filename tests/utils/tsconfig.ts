import type { TSConfig } from "pkg-types";

import defu from "defu";

/**
 * Creates a TypeScript configuration object with sensible defaults.
 *
 * @param overrides - Partial TSConfig to merge with defaults
 * @returns Complete TSConfig object
 */
export const createTSConfig = (overrides: Partial<TSConfig> = {}): TSConfig => {
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
