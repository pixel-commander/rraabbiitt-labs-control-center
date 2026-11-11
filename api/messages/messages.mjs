import { DatabaseSync } from "node:sqlite";
import { readFile, stat } from "node:fs/promises";
import { resolve } from "node:path";

const fields = ["name", "title", "type", "description", "tags", "file", "path", "paths"];
const arrays = new Set(["tags", "paths"]);
const failure = (code, error, settings = {}) => ({ code, body: { return_type: "api-call", status: "error", settings, error } });

export async function messageOperation(world, action, settings) {
  if (!settings || typeof settings !== "object" || Array.isArray(settings) ||
      !Number.isSafeInteger(settings.id) || settings.id <= 0)
    return failure(400, "Supply a positive numeric House id.");
  const keys = Object.keys(settings).filter(key => key !== "id");
  if (keys.some(key => !fields.includes(key)) ||
      (["get", "delete"].includes(action) && keys.length))
    return failure(400, "Unsupported message fields.", settings);
  if (!["set", "get", "edit", "delete"].includes(action))
    return failure(400, "Invalid message action.", settings);
  for (const key of keys) {
    const value = settings[key];
    if (value !== null && (arrays.has(key) ? !Array.isArray(value) : typeof value !== "string"))
      return failure(400, `Invalid value for ${key}.`, settings);
  }
  if (action === "edit" && !keys.length) return failure(400, "Supply fields to edit.", settings);
  let db;
  try {
    const project = JSON.parse(await readFile(resolve(world.path, "rab.project.json"), "utf8"));
    const entries = project.paths?.filter(entry => entry.name === "database");
    if (entries?.length !== 1 || !entries[0].path || !entries[0].file)
      throw Error("Database registration is missing.");
    const file = resolve(world.path, entries[0].path, entries[0].file);
    if (!(await stat(file)).isFile()) throw Error("Database is not a file.");
    db = new DatabaseSync(file);
    db.exec("PRAGMA busy_timeout=1000");
    const read = () => {
      const row = db.prepare("SELECT * FROM messages WHERE id=?").get(settings.id);
      if (row) for (const key of arrays) if (row[key] !== null) row[key] = JSON.parse(row[key]);
      return row;
    };
    const value = key => arrays.has(key) && settings[key] !== null ? JSON.stringify(settings[key]) : settings[key];
    let row;
    if (action === "get") {
      row = read();
      if (!row) return failure(404, "Message not found.", settings);
    } else if (action === "set") {
      try {
        db.prepare(`INSERT INTO messages (${["id", ...keys].map(key => `"${key}"`).join(",")}) VALUES (${["id", ...keys].map(() => "?").join(",")})`)
          .run(settings.id, ...keys.map(value));
      } catch (error) {
        if (error.message.includes("UNIQUE constraint failed: messages.id"))
          return failure(409, "Message id already exists.", settings);
        throw error;
      }
      row = read();
    } else if (action === "edit") {
      const result = db.prepare(`UPDATE messages SET ${keys.map(key => `"${key}"=?`).join(",")} WHERE id=?`)
        .run(...keys.map(value), settings.id);
      if (!result.changes) return failure(404, "Message not found.", settings);
      row = read();
    } else {
      const result = db.prepare("DELETE FROM messages WHERE id=?").run(settings.id);
      if (!result.changes) return failure(404, "Message not found.", settings);
      row = { id: settings.id };
    }
    return { code: action === "set" ? 201 : 200, body: { return_type: "api-call", status: "complete", settings, response: row } };
  } catch (error) {
    return failure(503, error instanceof Error ? error.message : String(error), settings);
  } finally {
    db?.close();
  }
}

export async function handleMessages(world, req, res, url) {
  const action = url.pathname.slice("/api/messages/".length);
  const method = { set: "POST", get: "GET", edit: "PATCH", delete: "DELETE" }[action];
  const send = result => {
    res.writeHead(result.code, { "Content-Type": "application/json" });
    res.end(JSON.stringify(result.body));
  };
  if (!method) return send(failure(404, "Unknown message action."));
  if (req.method !== method) {
    res.setHeader("Allow", method);
    return send(failure(405, `Use ${method}.`));
  }
  let settings;
  if (method === "GET" || method === "DELETE") {
    const raw = url.searchParams.get("id");
    if (!raw || !/^[1-9][0-9]*$/.test(raw) || [...url.searchParams.keys()].some(key => key !== "id") || url.searchParams.getAll("id").length !== 1)
      return send(failure(400, "Supply one numeric id query parameter."));
    settings = { id: Number(raw) };
  } else {
    if (!(req.headers["content-type"] ?? "").toLowerCase().startsWith("application/json"))
      return send(failure(415, "Use application/json."));
    try {
      const chunks = [];
      let size = 0;
      for await (const chunk of req) {
        size += chunk.length;
        if (size > 65536) return send(failure(413, "Message request exceeds 64 KB."));
        chunks.push(chunk);
      }
      settings = JSON.parse(Buffer.concat(chunks).toString("utf8"));
    } catch {
      return send(failure(400, "Supply valid JSON."));
    }
  }
  send(await messageOperation(world, action, settings));
}
