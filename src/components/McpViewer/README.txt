McpViewer

Prop-free, application-owned MCP status button. Render <McpViewer />.
Reads only mcp from the project root rab.world.json. Shows the MCP health state.
Open displays those settings in the local FloatWindow; drag its header, resize
its corner, close with the close button or Escape. Focus returns to the opener.
No form, editing or persistence. Popup geometry/visibility belong to useMcpViewer.

Skin is composed from action-light and the existing atoms stylesheet. Structure
is in css/mcp-viewer.css. External CSS may target .mcp-viewer and its parts.
--mcp-viewer-z-index controls the portal layer; action-light theme tokens control
button skin, --status-success/warning/error control connection state.
There are no supplied props, callbacks or part-class props.

Health uses /api/mcp/health on the same origin as the site. Vite dev and preview
host MCP and the API on the port configured in root rab.world.json.
An unavailable server shows Disconnected.
