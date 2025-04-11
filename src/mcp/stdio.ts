import type { MCPServerContext } from "./types";

import { ESLintTodoMcpServer } from "./index";
import { startStdioTransport } from "./transport/stdio";

export const startMcpServerWithStdio = async (context: MCPServerContext) => {
  const server = ESLintTodoMcpServer(context);

  return startStdioTransport(server);
};
