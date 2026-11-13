import { factorySavePlugin } from "./src/dashboards/Factory/api/save-component.mjs";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { loadWorld } from "./scripts/world.mjs";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
const world = await loadWorld();
const attachMcp = async server => {
  // A Vite restart must load current tracking code rather than Node's cached handler.
  const handlerUrl = pathToFileURL(resolve(world.path, world.mcp.path, world.mcp.file));
  handlerUrl.searchParams.set("v", String(Date.now()));
  const { createRequestHandler } = await import(handlerUrl.href);
  const handler = await createRequestHandler();
  server.middlewares.use((req, res, next) => {
    const pathname = new URL(req.url, "http://localhost").pathname;
    if (pathname !== "/mcp" && !pathname.startsWith("/api/")) return next();
    void handler(req, res).catch(error => {
      if (!res.headersSent) res.writeHead(500, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: error.message }));
    });
  });
  server.httpServer?.once("close", () => handler.close());
};
export default defineConfig({
  root: world.path,
  // This app has no PostCSS plugins; do not inherit a parent workspace config.
  css: { postcss: { plugins: [] } },
  plugins: [react(), factorySavePlugin({ path: "src/components", projectRoot: world.path, toolkitRoot: resolve(world.path, world.toolkits[0].path) }), { name: "labs-mcp", configureServer: attachMcp, configurePreviewServer: attachMcp }],
  server: {
    host: world.mcp.host, port: world.mcp.port, strictPort: true,
    fs: { allow: [world.path] },
    watch: { ignored: ["**/.tmp/**", "**/.venv/**"] },
  },
  preview: { host: world.mcp.host, port: world.mcp.port, strictPort: true },
});
