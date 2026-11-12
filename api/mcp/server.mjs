import { handleFavorites } from "../favorites/favorites.mjs";
import { stopSearchWorkers } from "../../toolkit/hybrid-seat-ranking/tools/search-worker.ts";
import { createServer } from "node:http";
import { loadWorld } from "../../scripts/world.mjs";
import { timingSafeEqual } from "node:crypto";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { McpServer } from "@modelcontextprotocol/server";
import {
  NodeStreamableHTTPServerTransport,
  hostHeaderValidation,
  originValidation,
} from "@modelcontextprotocol/node";
import { z } from "zod/v4";
import { handleMessages } from "../messages/messages.mjs";
import { handleSearchRecords } from "../search-records/search-records.mjs";
import { run } from "../../toolkit/rab-world/runners/runner-use-tool/runner-use-tool.ts";

const inputSchema = z
  .object({
    query: z.string().trim().min(1).max(2000).optional(),
    id: z.number().int().positive().optional(),
    content: z.string().optional(),
  })
  .strict()
  .superRefine((input, context) => {
    if ((input.query !== undefined) === (input.id !== undefined))
      context.addIssue({
        code: "custom",
        message: "Supply either query or id.",
      });
    if (input.content !== undefined && input.id === undefined)
      context.addIssue({
        code: "custom",
        message: "Execution content requires id.",
      });
  });

async function readWorld() {
  const world = await loadWorld();
  return { ...world, toolkits: world.toolkits.map(entry => ({
    ...entry, path: resolve(world.path, entry.path),
  })) };
}

export async function createRequestHandler() {
  return buildRequestHandler(await readWorld());
}

async function buildRequestHandler(world) {
  const { host, port } = world.mcp;
  if (
    host !== "127.0.0.1" ||
    !Number.isInteger(port) ||
    port < 1 ||
    port > 65535
  )
    throw new Error(
      "mcp.host must be 127.0.0.1 and mcp.port must be a valid port.",
    );
  const publicUrl = world.mcp.url ? new URL(world.mcp.url) : undefined;
  const token = process.env.MCP_TOKEN;
  if (publicUrl && (publicUrl.protocol !== "https:" || !token))
    throw new Error("mcp.url requires HTTPS and MCP_TOKEN.");
  const hosts = [
    "localhost",
    "127.0.0.1",
    ...(publicUrl ? [publicUrl.hostname] : []),
  ];
  const validateHost = hostHeaderValidation(hosts);
  const validateOrigin = originValidation(hosts);
  const apiEntry = world.paths?.find(entry => entry.name === "api");
  let usage;
  if (apiEntry) {
    const apiFolder = resolve(world.path, apiEntry.path);
    const beacon = JSON.parse(await readFile(resolve(apiFolder, apiEntry.file), "utf8"));
    const leaf = beacon.paths.find(entry => entry.name === "tool-usage");
    if (leaf) {
      const folder = resolve(apiFolder, leaf.path);
      const registration = JSON.parse(await readFile(resolve(folder, "rab.settings.json"), "utf8"));
      const { recordUsage } = await import(pathToFileURL(resolve(folder, registration.file)).href);
      usage = { folder, registration, recordUsage };
    }
  }
  const connections = new Set();
  const send = (res, status, value) => {
    res.writeHead(status, { "Content-Type": "application/json" });
    res.end(JSON.stringify(value));
  };
  const handler = async (req, res) => {
    if (!validateHost(req, res) || !validateOrigin(req, res)) return;
    if (token) {
      const supplied = Buffer.from(req.headers.authorization ?? "");
      const expected = Buffer.from(`Bearer ${token}`);
      if (
        supplied.length !== expected.length ||
        !timingSafeEqual(supplied, expected)
      ) {
        res.setHeader("WWW-Authenticate", "Bearer");
        send(res, 401, { error: "Bearer token required." });
        return;
      }
    }
    const pathname = new URL(req.url, `http://${host}:${port}`).pathname;
    if (pathname === "/api/search-records" || pathname.startsWith("/api/search-records/")) {
      await handleSearchRecords(world, req, res, new URL(req.url, `http://${host}:${port}`));
      return;
    }
    if (pathname.startsWith("/api/favorites/")) {
      await handleFavorites(world, req, res, new URL(req.url, `http://${host}:${port}`));
      return;
    }
    if (pathname.startsWith("/api/messages/")) {
      await handleMessages(world, req, res, new URL(req.url, `http://${host}:${port}`));
      return;
    }
    if (pathname === "/api/tool-usage" && usage) {
      if (req.method !== "POST") {
        res.setHeader("Allow", "POST");
        send(res, 405, { return_type: "api-call", status: "error", settings: {}, error: "Use POST." });
        return;
      }
      let settings;
      try {
        let body = "";
        for await (const chunk of req) {
          body += chunk;
          if (Buffer.byteLength(body) > 8192) {
            send(res, 413, { return_type: "api-call", status: "error", settings: {}, error: "Usage request exceeds 8 KB." });
            return;
          }
        }
        settings = JSON.parse(body);
      } catch {
        send(res, 400, { return_type: "api-call", status: "error", settings: {}, error: "Supply valid JSON." });
        return;
      }
      const result = await usage.recordUsage(world, settings, usage.registration, usage.folder);
      send(res, result.code, result.body);
      return;
    }
    if (["/health", "/api/mcp/health"].includes(pathname) && req.method === "GET") {
      send(res, 200, {
        status: "ok",
        name: world.name,
        transport: "streamable-http",
      });
      return;
    }
    if (pathname !== "/mcp") {
      send(res, 404, { error: "Not found." });
      return;
    }
    if (req.method !== "POST") {
      res.setHeader("Allow", "POST");
      send(res, 405, { error: "This stateless MCP endpoint accepts POST." });
      return;
    }
    // Each request owns its server and transport, including concurrent clients.
    const server = new McpServer({
      name: world.name,
      title: world.title,
      version: "1.0.0",
    });
    server.registerTool(
      "use_tool",
      {
        title: "Search, inspect and run registered dashboard tools",
        description:
          "query searches registered local tools and runners. id reads the current registration and adjacent usage skill. After inspection, id and content (a JSON settings object string) execute it. Toolkit paths come from the root world file.",
        inputSchema,
        annotations: {
          readOnlyHint: false,
          destructiveHint: true,
          openWorldHint: false,
        },
      },
      async (input) => {
        const result = await run({ ...input, toolkits: world.toolkits });
        return {
          content: [{ type: "text", text: JSON.stringify(result) }],
          isError: result.some((step) => step.status === "error"),
        };
      },
    );
    const transport = new NodeStreamableHTTPServerTransport({
      sessionIdGenerator: undefined,
      enableJsonResponse: true,
    });
    connections.add(server);
    res.once("close", () => {
      connections.delete(server);
      void server.close();
    });
    try {
      await server.connect(transport);
      await transport.handleRequest(req, res);
    } catch (error) {
      console.error("[labs-mcp]", error.message);
      if (!res.headersSent) send(res, 500, { error: "MCP request failed." });
      else res.end();
    }
  };
  handler.close = () => {
    stopSearchWorkers();
    for (const server of connections) void server.close();
  };
  return handler;
}

export async function start() {
  const world = await readWorld();
  const { host, port } = world.mcp;
  const handler = await buildRequestHandler(world);
  const http = createServer(handler);
  await new Promise((resolve, reject) => {
    http.once("error", reject);
    http.listen(port, host, resolve);
  });
  console.log(`${world.title} MCP: http://${host}:${port}/mcp`);
  const close = () => {
    handler.close();
    http.close();
    http.closeAllConnections();
  };
  process.once("SIGINT", close);
  process.once("SIGTERM", close);
  return http;
}
