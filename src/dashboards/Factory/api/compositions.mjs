import { DatabaseSync } from "node:sqlite";
import { statSync } from "node:fs";

const table = "factory_composition";
const fail = (message, status = 400) => Object.assign(new Error(message), { status });
const identity = value => {
  const number = Number(value);
  if (!Number.isSafeInteger(number) || number < 1) throw fail("A positive integer composition ID is required.");
  return number;
};

function validateComposition(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw fail("composition must be a JSON object.");
  const ids = new Set();
  const names = new Set();
  const visit = node => {
    if (!node || typeof node !== "object" || Array.isArray(node)) throw fail("Invalid composition node.");
    if (typeof node.name !== "string" || !/^[A-Za-z_][A-Za-z0-9_-]*$/.test(node.name)) throw fail("Node names must be valid CSS class names.");
    if (names.has(node.name)) throw fail("Composition node names must be unique.");
    names.add(node.name);
    if (!/^(article|aside|div|footer|header|main|nav|section|span|h[1-6]|button|a|p|strong|em|small|ul|ol|li)$/.test(node.tag)) throw fail("Invalid composition node tag.");
    if (node.id !== undefined) {
      identity(node.id);
      if (typeof node.id !== "number" || ids.has(node.id)) throw fail("Composition node IDs must be unique integers.");
      ids.add(node.id);
    }
    if (node.children !== undefined && !Array.isArray(node.children)) throw fail("Node children must be an array.");
    node.children?.forEach(visit);
  };
  visit(value.root ?? value);
}

function values(data) {
  if (!data || typeof data !== "object") throw fail("A record object is required.");
  if (typeof data.name !== "string" || !data.name.trim()) throw fail("name is required.");
  validateComposition(data.composition);
  for (const field of ["title", "type", "description", "file", "path"]) {
    if (data[field] !== undefined && data[field] !== null && typeof data[field] !== "string") throw fail(`${field} must be a string.`);
  }
  for (const field of ["tags", "paths"]) if (data[field] !== undefined && !Array.isArray(data[field])) throw fail(`${field} must be an array.`);
  return [data.name.trim(), data.title?.trim() || data.name.trim(), data.type || "composition", data.description ?? "",
    JSON.stringify(data.tags ?? []), data.file ?? null, data.path ?? null, JSON.stringify(data.paths ?? []), JSON.stringify(data.composition)];
}

const decode = row => row ? { ...row, tags: JSON.parse(row.tags ?? "[]"), paths: JSON.parse(row.paths ?? "[]"),
  ...(row.composition === undefined ? {} : { composition: JSON.parse(row.composition) }) } : undefined;

/** House metadata stays in columns; composition is JSON text only at the DB boundary. */
export function createCompositionStore(databasePath) {
  if (!statSync(databasePath).isFile()) throw Error("Factory database must be an existing file.");
  const withDb = callback => {
    const db = new DatabaseSync(databasePath);
    try { db.exec("PRAGMA busy_timeout=5000"); return callback(db); }
    finally { db.close(); }
  };
  withDb(db => {
    db.exec("BEGIN IMMEDIATE");
    try {
      const columns = db.prepare(`PRAGMA table_info(${table})`).all();
      if (!columns.length) throw Error("factory_composition must be created before starting the API.");
      if (!columns.some(column => column.name === "composition")) {
        db.exec(`ALTER TABLE ${table} ADD COLUMN composition TEXT NOT NULL DEFAULT '{}' CHECK(json_valid(composition) AND json_type(composition)='object')`);
      }
      db.exec("COMMIT");
    } catch (error) { db.exec("ROLLBACK"); throw error; }
  });
  const getFrom = (db, id) => {
    const row = db.prepare(`SELECT * FROM ${table} WHERE id=?`).get(identity(id));
    if (!row) throw fail("Composition not found.", 404);
    return decode(row);
  };
  return {
    get: id => withDb(db => getFrom(db, id)),
    list: ({ limit = 50, offset = 0 } = {}) => withDb(db => {
      if (!Number.isSafeInteger(limit) || limit < 1 || limit > 100 || !Number.isSafeInteger(offset) || offset < 0) throw fail("Use limit 1–100 and a nonnegative offset.");
      const items = db.prepare(`SELECT id,name,title,type,description,tags,file,path,paths FROM ${table} ORDER BY id DESC LIMIT ? OFFSET ?`).all(limit, offset).map(decode);
      return { items, total: db.prepare(`SELECT COUNT(*) AS total FROM ${table}`).get().total, limit, offset };
    }),
    create: data => withDb(db => {
      const record = values(data);
      db.exec("BEGIN IMMEDIATE");
      try {
        const id = data.id === undefined ? Math.max(Date.now(), Number(db.prepare(`SELECT MAX(id) AS id FROM ${table}`).get().id ?? 0) + 1) : identity(data.id);
        if (db.prepare(`SELECT 1 FROM ${table} WHERE id=?`).get(id)) throw fail("Composition ID already exists. Use PUT to update it.", 409);
        db.prepare(`INSERT INTO ${table} (id,name,title,type,description,tags,file,path,paths,composition) VALUES (?,?,?,?,?,?,?,?,?,?)`).run(id, ...record);
        const saved = getFrom(db, id); db.exec("COMMIT"); return saved;
      } catch (error) { db.exec("ROLLBACK"); throw error; }
    }),
    update: (id, data) => withDb(db => {
      id = identity(id);
      if (data.id !== undefined && identity(data.id) !== id) throw fail("Body ID must match the URL ID.");
      const record = values(data);
      const result = db.prepare(`UPDATE ${table} SET name=?,title=?,type=?,description=?,tags=?,file=?,path=?,paths=?,composition=? WHERE id=?`).run(...record, id);
      if (!result.changes) throw fail("Composition not found.", 404);
      return getFrom(db, id);
    }),
  };
}

export function compositionRequestHandler(store) {
  return async (req, res, next = () => {}) => {
    const url = new URL(req.url, "http://localhost");
    if (!/^\/api\/factory\/compositions(?:\/|$)/.test(url.pathname)) return next();
    const send = (status, value) => { res.writeHead(status, { "Content-Type": "application/json", "Cache-Control": "no-store" }); res.end(JSON.stringify(value)); };
    try {
      const route = url.pathname.match(/^\/api\/factory\/compositions(?:\/(\d+))?\/?$/);
      if (!route) throw fail("Composition route not found.", 404);
      const id = route[1];
      if (req.method === "GET") return send(200, id ? store.get(id) : store.list({ limit: Number(url.searchParams.get("limit") ?? 50), offset: Number(url.searchParams.get("offset") ?? 0) }));
      if (!((req.method === "POST" && !id) || (req.method === "PUT" && id))) return send(405, { error: "Use GET, POST on the collection, or PUT on an ID." });
      if (req.headers.origin && new URL(req.headers.origin).host !== req.headers.host) throw fail("Same-origin request required.", 403);
      let size = 0; const chunks = [];
      for await (const chunk of req) { size += chunk.length; if (size > 2000000) throw fail("Request exceeds 2 MB.", 413); chunks.push(chunk); }
      const data = JSON.parse(Buffer.concat(chunks).toString("utf8"));
      return send(req.method === "POST" ? 201 : 200, req.method === "POST" ? store.create(data) : store.update(id, data));
    } catch (error) { send(error.status ?? (error instanceof SyntaxError ? 400 : 500), { error: error.message }); }
  };
}

export const factoryCompositionsPlugin = ({ databasePath }) => {
  const install = server => { server.middlewares.use(compositionRequestHandler(createCompositionStore(databasePath))); };
  return { name: "factory-compositions", configureServer: install, configurePreviewServer: install };
};
