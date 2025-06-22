import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

describe("MCP Server", () => {
  it("should initialize without errors", () => {
    expect(() => {
      new McpServer({
        name: "notify-agent",
        version: "1.0.0",
      });
    }).not.toThrow();
  });
});
