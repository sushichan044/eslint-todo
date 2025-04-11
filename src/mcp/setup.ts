import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

import type { MCPServerContext } from "./types";

import { delete_suppression_with_limit } from "./tools";

export interface SetupMcpServerOptions {
  onError: (error: unknown) => void;
}

/**
 * @package
 */
export const setupMcpServer = (
  server: McpServer,
  context: MCPServerContext,
  { onError }: Partial<SetupMcpServerOptions> = {},
) => {
  onError ??= (error) => {
    console.error(error);
  };

  // false positive
  // eslint-disable-next-line unicorn/prefer-add-event-listener
  server.server.onerror = onError;

  server.tool(
    delete_suppression_with_limit.name,
    delete_suppression_with_limit.description,
    delete_suppression_with_limit.schema,
    async (parameters, extra) => {
      try {
        return await delete_suppression_with_limit.handler(
          parameters,
          context,
          extra,
        );
      } catch (error) {
        console.error(error);
        return {
          content: [
            {
              text: [
                "# **Error Occurred**",
                "It looks like there was an error while communicating with the eslint-todo API.",
                "",
                "## Error Details",
                error instanceof Error ? error.message : String(error),
              ].join("\n"),
              type: "text",
            },
          ],
          isError: true,
        };
      }
    },
  );
};
