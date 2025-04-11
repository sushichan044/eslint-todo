import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

import type { SetupMcpServerOptions } from "./setup";
import type { MCPServerContext } from "./types";

import {
  name as packageName,
  version as packageVersion,
} from "../../package.json";
import { setupMcpServer } from "./setup";

export const ESLintTodoMcpServer = (
  context: MCPServerContext,
  options: Partial<SetupMcpServerOptions> = {},
): McpServer => {
  const server = new McpServer({
    name: packageName,
    version: packageVersion,
  });

  setupMcpServer(server, context, options);
  return server;
};
