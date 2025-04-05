// We are using internal function of `eslint/config-inspector` to read the eslint config with rule metadata.
// This is a temporary solution until we have a better way to read the eslint config with rule metadata.

declare module "@eslint/config-inspector/monkey-patch" {
  import type { RuleMetaData } from "@typescript-eslint/utils/ts-eslint";
  import type { Linter } from "eslint";

  interface FlatConfigItem extends Linter.Config {
    index: number;
  }

  interface Payload {
    configs: FlatConfigItem[];
    files?: MatchedFile[];
    meta: PayloadMeta;
    rules: Record<string, RuleInfo>;
  }

  interface PayloadMeta {
    basePath: string;
    configPath: string;
    lastUpdate: number;
    wsPort?: number;
  }

  interface RuleInfo
    extends RuleMetaData<
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      any,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      any
    > {
    /**
     * The rule may be removed
     */
    invalid?: boolean;
    name: string;
    plugin: string;
  }

  interface MatchedFile {
    /**
     * Matched configs indexes
     */
    configs: number[];
    /**
     * Filepath
     */
    filepath: string;
    /**
     * Matched globs, includes both positive and negative globs
     */
    globs: string[];
  }

  export interface ESLintConfig {
    configs: FlatConfigItem[];
    dependencies: string[];
    payload: Payload;
  }

  interface ReadConfigOptions extends ResolveConfigPathOptions {
    /**
     * Change current working directory to basePath
     * @default true
     */
    chdir?: boolean;
    /**
     * Glob file paths matched by the configs
     *
     * @default true
     */
    globMatchedFiles?: boolean;
  }

  interface ResolveConfigPathOptions {
    /**
     * Current working directory
     */
    cwd: string;
    /**
     * Override base path. When not provided, will use directory of discovered config file.
     */
    userBasePath?: string;
    /**
     * Override config file path.
     * When not provided, will try to find config file in current working directory or userBasePath if provided.
     */
    userConfigPath?: string;
  }

  export function readConfig(options: ReadConfigOptions): Promise<ESLintConfig>;
}
