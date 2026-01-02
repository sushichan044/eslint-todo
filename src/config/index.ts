import defu from "defu";

import type { Config, UserConfig } from "./config";

export const defineConfig = (config: UserConfig): UserConfig => {
  return config;
};

export const mergeUserConfig = (base: UserConfig, override: UserConfig): UserConfig =>
  defu(override, base);

export const mergeConfig = (base: Config, override: UserConfig): Config => defu(override, base);

export type { Config, UserConfig } from "./config";
