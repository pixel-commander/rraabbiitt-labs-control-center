API FOLDERS

hybrid-search/  Query handling and ranker process adapter.
records/        Record read and write endpoints.
messages/       Message read and write endpoints.
file-system/   File read, save, and listing endpoint folders.

mcp/           Streamable HTTP MCP server; run npm run mcp.

The other endpoint folders remain reserved; no REST handlers are installed.
Keep database access and Python execution on the server. The browser must
send requests to that server. Do not expose a local Python path to the UI.
Define the request and response contracts before adding handlers.
