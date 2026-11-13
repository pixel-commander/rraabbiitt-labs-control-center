import { run } from "../toolkit/rab-world/runners/runner-use-tool/runner-use-tool.ts";

export const refreshSystemRunnerId = 1794537157022;
export function createWorldRefreshHandler(world, execute = run) {
  let running = false;
  return async (req, res) => {
    const send = (code, body) => { res.writeHead(code, { "Content-Type": "application/json" }); res.end(JSON.stringify(body)); };
    if (req.method !== "POST") { res.setHeader("Allow", "POST"); return send(405, { status: "error", error: "Use POST." }); }
    if (running) return send(409, { status: "error", error: "A system refresh is already running." });
    running = true;
    try {
      const results = await execute({
        id: refreshSystemRunnerId,
        content: JSON.stringify({ path: world.path, toolkits: world.toolkits }),
        toolkits: world.toolkits,
      });
      const report = results.findLast(step => step.response?.report)?.response.report;
      if (!report) throw Error(results.map(step => step.error).filter(Boolean).join("; ") || "Runner returned no refresh report.");
      send(200, { return_type: "api-call", status: report.status, response: report, results });
    } catch (error) {
      send(500, { return_type: "api-call", status: "error", error: error.message });
    } finally { running = false; }
  };
}
