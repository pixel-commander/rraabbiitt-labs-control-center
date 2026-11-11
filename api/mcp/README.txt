PORTABLE HYBRID SEARCH DASHBOARD MCP

Start the site and MCP together: npm run dev (Node 24+).
Transport: Streamable HTTP. POST /mcp; GET /health.
The server binds to loopback. Read the actual host and port from rab.world.json.
The site, MCP and API routes share the host/port in rab.world.json.
SQLite is embedded in that process and needs no database port.
POST /mcp and /api/tool-usage; GET /api/mcp/health.
Optional npm run mcp starts the API alone on that same port when the site is stopped.

The project root rab.world.json is THE source of truth for paths. The launcher
locates that file relative to itself, then resolves the world root (path: .),
mcp.path + mcp.file and toolkits[].path from it. Relative registration paths
resolve against world.path. Missing registrations error; there is no HQ,
browser-storage, database or project-file fallback. Startup reloads the file.

use_tool follows the local dispatcher's existing contract:
  query              Search current tool/runner names, titles and descriptions.
  id                 Inspect current settings and adjacent usage instructions.
  id plus content    Execute using a JSON settings object string.
Client arguments cannot override the server's toolkit registrations.
The shared local runTools adapter delegates timing to runner-world-tooling.
Each tool owns its end-of-call usage report.
Search and inspection do not execute tools. No indexing or model startup runs
when the MCP server starts. Tool execution can write files as its contract permits.

Local client URL: http://<mcp.host>:<mcp.port>/mcp from the world file.
Set MCP_TOKEN in the launching process environment to require Authorization:
Bearer <token>. The token is a secret; keep it out of world files and source.

Cloud clients need a reachable HTTPS reverse proxy/tunnel. Register its URL
as mcp.url in rab.world.json and set MCP_TOKEN before restarting. That allows
the public hostname through Host/Origin validation. This server does not
create a public tunnel, change firewall rules, or configure cloud accounts.
Clients must support Streamable HTTP and, when enabled, bearer authentication.
OAuth discovery and legacy HTTP+SSE transport are not implemented.
