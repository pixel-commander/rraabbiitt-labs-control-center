import { stopSearchWorkers } from "../../toolkit/hybrid-seat-ranking/tools/search-worker.ts";
import { createServer } from "node:http";
import { loadWorld } from "../../scripts/world.mjs";
import { timingSafeEqual } from "node:crypto";
import { resolve } from "node:path";
import { McpServer } from "@modelcontextprotocol/server";
import {
  NodeStreamableHTTPServerTransport,
  hostHeaderValidation,
  originValidation,
} from "@modelcontextprotocol/node";
import { z } from "zod/v4";
import { run } from "../../toolkit/runners/runner-use-tool/runner-use-tool.ts";

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
  return {
    ...world,
    toolkits: world.toolkits.map((entry) => ({
      ...entry,
      path: resolve(world.path, entry.path),
    })),
  };
}

export async function createRequestHandler() {
  return buildRequestHandler(await readWorld());
}

export async function warmSearch() {
  const world = await readWorld();
  const { warmProject } = await import("../../toolkit/hybrid-seat-ranking/tools/project-search.ts");
  return warmProject({ query: "warm up", path: world.path });
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
    throw new Error("Public MCP requires HTTPS and MCP_TOKEN.");

  const activity = [];
  const connections = new Set();

  function validateHost(req, res) {
    if (!hostHeaderValidation(req, host, port)) {
      send(res, 400, { error: "Invalid Host header." });
      return false;
    }
    return true;
  }

  function validateOrigin(req, res) {
    if (!originValidation(req, publicUrl)) {
      send(res, 403, { error: "Origin not allowed." });
      return false;
    }
    return true;
  }

  function send(res, code, body) {
    res.writeHead(code, { "Content-Type": "application/json" });
    res.end(JSON.stringify(body));
  }

  return async function handle(req, res) {
    if (!validateHost(req, res) || !validateOrigin(req, res)) return;

    if (token) {
      const auth = req.headers.authorization ?? "";
      const expected = `Bearer ${token}`;
      if (
        auth.length !== expected.length ||
        !timingSafeEqual(Buffer.from(auth), Buffer.from(expected))
      ) {
        send(res, 401, { error: "Unauthorized." });
        return;
      }
    }

    const pathname = new URL(req.url, `http://${host}:${port}`).pathname;

    // Domain routes the UI still calls. Each goes through the master runner.
    const domainRoutes = {
      "/api/favorites": 1794444448187,
      "/api/messages": null,
      "/api/search-records": null,
      "/api/tool-usage": null,
    };
    for (const [prefix, id] of Object.entries(domainRoutes)) {
      if (pathname === prefix || pathname.startsWith(prefix + "/")) {
        if (req.method !== "POST" && req.method !== "GET") {
          send(res, 405, { error: "Method not allowed." });
          return;
        }
        // For now delegate to the existing handler modules so the UI keeps working.
        // Tracking still happens if they call through use_tool.
        try {
          if (prefix === "/api/favorites") {
            const { handleFavorites } = await import("../favorites/favorites.mjs");
            await handleFavorites(world, req, res, new URL(req.url, `http://${host}:${port}`));
            return;
          }
          if (prefix === "/api/messages") {
            const { handleMessages } = await import("../messages/messages.mjs");
            await handleMessages(world, req, res, new URL(req.url, `http://${host}:${port}`));
            return;
          }
          if (prefix === "/api/search-records") {
            const { handleSearchRecords } = await import("../search-records/search-records.mjs");
            const requestUrl = new URL(req.url, `http://${host}:${port}`);
            // Feedback and rephrase save lessons only; searches run tools and are tracked.
            const tracked = req.method === "POST" && !/\/(feedback|rephrase)$/.test(pathname);
            if (!tracked) {
              await handleSearchRecords(world, req, res, requestUrl);
              return;
            }
            const requestEvent = {
              time: new Date().toISOString(),
              method: "POST",
              tool: pathname.endsWith("/dumbot") ? "dumbot-search" : "search-records",
              status: "running",
              runs: [],
            };
            activity.push(requestEvent);
            if (activity.length > 50) activity.shift();
            res.once("finish", () => {
              requestEvent.status = res.statusCode < 400 ? "complete" : "error";
              if (res.statusCode >= 400) requestEvent.error = `HTTP ${res.statusCode}`;
            });
            await handleSearchRecords(world, req, res, requestUrl, {
              update: (steps) => {
                requestEvent.runs = steps.map((step) => ({
                  id: step.id,
                  name: step.name,
                  status: step.status,
                  date_start: step.date_start,
                  date_end: step.date_end,
                  error: step.error,
                }));
                requestEvent.toolId ??= steps.at(-1)?.id;
              },
              complete: async (steps) => {
                try {
                  const { saveRun } = await import("../../toolkit/runners/save-run/save-run.mjs");
                  await saveRun(world, steps);
                } catch (e) { console.warn("saveRun failed:", e.message); }
              },
            });
            return;
          }
          if (prefix === "/api/tool-usage") {
            const { readUsage, recordUsage } = await import("../tool-usage/endpoint.mjs");
            if (req.method === "GET") {
              const result = await readUsage(world);
              send(res, result.code ?? 200, result.body ?? result);
              return;
            }
            if (req.method === "POST") {
              const chunks = [];
              for await (const chunk of req) chunks.push(chunk);
              const settings = JSON.parse(Buffer.concat(chunks).toString("utf8") || "{}");
              const result = await recordUsage(world, settings);
              send(res, result.code ?? 200, result.body ?? result);
              return;
            }
          }
        } catch (error) {
          send(res, 500, { error: error.message });
          return;
        }
      }
    }

    // Refresh world button: goes through the master runner so it gets tracked.
    if (pathname === "/api/world/refresh" && req.method === "POST") {
      const requestEvent = {
        time: new Date().toISOString(),
        method: "POST",
        tool: "refresh-world",
        toolId: 1794537157022,
        status: "running",
        runs: [],
      };
      activity.push(requestEvent);
      if (activity.length > 50) activity.shift();
      try {
        const results = await run(
          {
            id: 1794537157022,
            content: JSON.stringify({ path: world.path, toolkits: world.toolkits }),
            toolkits: world.toolkits,
          },
          {
            update: (steps) => {
              requestEvent.runs = steps.map((step) => ({
                id: step.id,
                name: step.name,
                status: step.status,
                date_start: step.date_start,
                date_end: step.date_end,
                error: step.error,
              }));
            },
            complete: async (steps) => {
              try {
                const { saveRun } = await import("../../toolkit/runners/save-run/save-run.mjs");
                await saveRun(world, steps);
              } catch (e) { console.warn("saveRun failed:", e.message); }
            },
          },
        );
        requestEvent.status = "complete";
        const report = results.findLast?.(s => s.response?.report)?.response?.report
          ?? results.at(-1)?.response?.report;
        send(res, 200, { return_type: "api-call", status: "complete", response: report ?? {}, results });
      } catch (error) {
        requestEvent.status = "error";
        requestEvent.error = error.message;
        send(res, 500, { return_type: "api-call", status: "error", error: error.message });
      }
      return;
    }

    // Thin transport only: health + MCP. All domain work goes through the master runner.
    if (["/health", "/api/mcp/health"].includes(pathname) && req.method === "GET") {
      send(res, 200, {
        status: "ok",
        name: world.name,
        transport: "streamable-http",
        activity: [...activity].reverse(),
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

    let requestEvent;
    const server = new McpServer({
      name: world.name,
      title: world.title,
      version: "1.0.0",
    });

    server.registerTool(
      "use_tool",
      {
        title: "Search, inspect and run registered tools and runners",
        description:
          "query searches registered local tools and runners. id reads the current registration and adjacent usage skill. After inspection, id and content (a JSON settings object string) execute it. All execution goes through the master runner so every step is tracked with timing.",
        inputSchema,
        annotations: {
          readOnlyHint: false,
          destructiveHint: true,
          openWorldHint: false,
        },
      },
      async (input) => {
        requestEvent = {
          time: new Date().toISOString(),
          method: "tools/call",
          tool: "use_tool",
          toolId: input?.id,
          status: "running",
          runs: [],
        };
        activity.push(requestEvent);
        if (activity.length > 50) activity.shift();
        const result = await run(
          { ...input, toolkits: world.toolkits },
          {
            update: (steps) => {
              if (requestEvent)
                requestEvent.runs = steps.map((step) => ({
                  id: step.id,
                  name: step.name,
                  status: step.status,
                  date_start: step.date_start,
                  date_end: step.date_end,
                  error: step.error,
                }));
            },
            complete: async (steps) => {
              try {
                const { saveRun } = await import("../../toolkit/runners/save-run/save-run.mjs");
                await saveRun(world, steps);
              } catch (error) {
                console.warn("saveRun failed:", error instanceof Error ? error.message : String(error));
              }
            },
          },
        );
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
      const chunks = [];
      let size = 0;
      for await (const chunk of req) {
        size += chunk.length;
        if (size > 1024 * 1024) {
          send(res, 413, { error: "Request body too large." });
          return;
        }
        chunks.push(chunk);
      }
      const body = Buffer.concat(chunks).toString("utf8");
      await transport.handleRequest(req, res, JSON.parse(body));
    } catch (error) {
      console.error(error);
      if (!res.headersSent) send(res, 500, { error: "MCP request failed." });
    }
  };
}

export function start() {
  createRequestHandler()
    .then((handler) => {
      const server = createServer(handler);
      // host/port should come from world; this is a fallback for direct start
      const { host, port } = { host: "127.0.0.1", port: 3000 };
      server.listen(port, host, () => {
        console.log(`MCP server listening on http://${host}:${port}/mcp`);
      });
      process.on("SIGINT", () => {
        stopSearchWorkers();
        server.close();
        process.exit(0);
      });
    })
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}
