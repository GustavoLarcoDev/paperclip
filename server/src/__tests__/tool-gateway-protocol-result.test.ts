import express from "express";
import request from "supertest";
import { describe, expect, it } from "vitest";
import { mcpGatewayProtocolRoutes } from "../routes/tool-gateway.js";
import type { ToolGatewayService } from "../services/tool-gateway.js";

async function callTool(executeResult: unknown) {
  const gateway = {
    executeTool: async () => ({ result: executeResult }),
  } as unknown as ToolGatewayService;
  const app = express();
  app.use(express.json());
  app.use(mcpGatewayProtocolRoutes(gateway));
  const response = await request(app)
    .post("/mcp/gateways/gw_protocol_result")
    .set("authorization", "Bearer pcgw_protocol_result")
    .send({ jsonrpc: "2.0", id: 1, method: "tools/call", params: { name: "browser_navigate", arguments: {} } })
    .expect(200);
  return response.body.result as Record<string, unknown>;
}

describe("named gateway tools/call result", () => {
  // MCP clients validate structuredContent as an object when present; a null
  // value makes them reject the whole result and hide the tool's text.
  it("omits structuredContent when the tool produced no structured data", async () => {
    const result = await callTool({ content: "Browser is already in use" });
    expect(result.content).toEqual([{ type: "text", text: "Browser is already in use" }]);
    expect(result).not.toHaveProperty("structuredContent");
  });

  it("passes structured data through as an object", async () => {
    const data = { content: [{ type: "text", text: "ok" }], structuredContent: { ok: true }, isError: false };
    const result = await callTool({ content: "ok", data });
    expect(result.content).toEqual([{ type: "text", text: "ok" }]);
    expect(result.structuredContent).toEqual(data);
  });
});
