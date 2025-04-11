import type { RequestHandlerExtra } from "@modelcontextprotocol/sdk/shared/protocol.js";
import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import type { z, ZodRawShape, ZodTypeAny } from "zod";

import type { Config } from "../config";
import type { ESLintConfigSubset } from "../lib/eslint";
import type { MaybePromise } from "../utils/types";

/**
 * @package
 */
export interface MCPServerContext {
  config: Config;
  eslintConfig: ESLintConfigSubset;
}

/**
 * @package
 */
export const defineTool = <T extends ZodRawShape>(tool: MCPTool<T>) => tool;

interface MCPTool<P extends ZodRawShape | undefined = undefined> {
  description: string;
  handler: ToolCallback<P>;
  name: string;
  schema: P;
}

type ToolCallback<P extends ZodRawShape | undefined = undefined> =
  P extends ZodRawShape
    ? (
        parameters: z.objectOutputType<P, ZodTypeAny>,
        context: MCPServerContext,
        extras: RequestHandlerExtra,
      ) => MaybePromise<CallToolResult>
    : (
        context: MCPServerContext,
        extra: RequestHandlerExtra,
      ) => MaybePromise<CallToolResult>;
