import { searchDumbot } from "./dumbot.mjs";
import { DatabaseSync } from "node:sqlite";
import {
  readFile,
  readdir,
  mkdir,
  writeFile,
  rename,
  unlink,
} from "node:fs/promises";
import { resolve, join } from "node:path";
import { randomUUID } from "node:crypto";
import { run as useTool } from "../../toolkit/runners/runner-use-tool/runner-use-tool.ts";

const grades = { up: 1, part: 0.5, down: 0 };
const lessonPath = "learning/learned-on-site/search-results/lessons";
const rephrasePath = "learning/learned-on-site/question-rephrasing/lessons";
const keyOf = (row) =>
  String(JSON.parse(row.data || "{}").record_key ?? row.id);
const queryKey = (query) => query.trim().toLowerCase();
const failure = (code, error, settings = {}) => ({
  code,
  body: { return_type: "api-call", status: "error", settings, error },
});
class InputError extends Error {}
class CapacityError extends Error {}
let feedbackQueue = Promise.resolve();

async function database(world) {
  const project = JSON.parse(
    await readFile(resolve(world.path, "rab.world.json"), "utf8"),
  );
  const entries = project.paths?.filter((entry) => entry.name === "database");
  if (entries?.length !== 1 || !entries[0].path || !entries[0].file)
    throw Error("Database registration is missing.");
  return new DatabaseSync(
    resolve(world.path, entries[0].path, entries[0].file),
    { readOnly: true },
  );
}

function context(db, settings) {
  if (
    !settings ||
    typeof settings !== "object" ||
    Array.isArray(settings) ||
    typeof settings.query !== "string" ||
    !settings.query.trim() ||
    settings.query.trim().length > 2000 ||
    !Number.isSafeInteger(settings.message) ||
    settings.message <= 0
  )
    throw new InputError(
      "Supply query and a saved numeric message ID in message.",
    );
  const message = db
    .prepare("SELECT * FROM messages WHERE id=?")
    .get(settings.message);
  if (
    !message ||
    message.type !== "user" ||
    message.description?.trim() !== settings.query.trim()
  )
    throw new InputError("The query must match the saved user message.");
  return message;
}

export async function readLessons(world) {
  const rows = [];
  for (const path of [lessonPath, rephrasePath]) {
    const folder = resolve(world.path, path);
    let names;
    try {
      names = await readdir(folder);
    } catch (error) {
      if (error.code === "ENOENT") continue;
      throw error;
    }
    for (const name of names
      .filter((name) => name.startsWith("message-") && name.endsWith(".json"))
      .sort()) {
      const row = JSON.parse(await readFile(join(folder, name), "utf8"));
      if (
        row.approved === true &&
        row.name === "all" &&
        Object.hasOwn(grades, row.content?.vote)
      )
        rows.push(row);
    }
  }
  return rows.sort((a, b) => a.date - b.date || a.sequence - b.sequence);
}

async function atomicJson(file, value) {
  const temporary = `${file}.${randomUUID()}.tmp`;
  try {
    await writeFile(temporary, JSON.stringify(value, null, 2) + "\n", {
      flag: "wx",
    });
    await rename(temporary, file);
  } finally {
    await unlink(temporary).catch((error) => {
      if (error.code !== "ENOENT") throw error;
    });
  }
}

export async function searchRecords(world, settings) {
  let db;
  try {
    db = await database(world);
    context(db, settings);
    const limit = settings.limit ?? 20;
    if (!Number.isInteger(limit) || limit < 1 || limit > 100)
      throw new InputError("limit must be 1 to 100.");
    const receipts = await useTool({
      id: 1793154927345,
      content: JSON.stringify({
        query: settings.query.trim(),
        path: world.path,
        message: settings.message,
      }),
      toolkits: world.toolkits.map(entry => ({
        ...entry, path: resolve(world.path, entry.path),
      })),
    });
    const result = receipts.at(-1);
    if (!result) throw new Error("Hybrid search returned no runner result.");
    if (result.status !== "complete")
      throw new Error(result.error || "Hybrid search failed.");
    if (!Array.isArray(result.response?.paths))
      throw new Error("Hybrid search returned no ranked result list.");
    const latest = new Map();
    for (const event of await readLessons(world)) {
      if (queryKey(event.query) === queryKey(settings.query))
        latest.set(event.id, event);
    }
    // Preserve the established engine's ordering and scores. No separate score boost.
    const paths = result.response.paths.slice(0, limit).map((record) => {
      if (!Number.isFinite(record.ranking?.score))
        throw new Error("Hybrid result is missing its ranking score.");
      return {
        ...record,
        hybrid_score: record.ranking.score,
        score: record.ranking.score,
        mode: "hybrid",
        message: settings.message,
      };
    });
    const feedback = paths.flatMap((record) => {
      const event = latest.get(record.id);
      return event
        ? [
            {
              record_key: record.record_key,
              field: "all",
              vote: event.content.vote,
            },
          ]
        : [];
    });
    const response = {
      ...result.response,
      return_type: result.return_type,
      paths,
      feedback,
      mode: "hybrid",
      message: settings.message,
      summary: {
        ...result.response.summary,
        count: paths.length,
        feedback_scope: "query-result",
        neural: true,
        neural_training: false,
      },
      ...(result.error ? { warnings: [result.error] } : {}),
    };
    return {
      code: 200,
      body: {
        return_type: result.return_type === "skill" ? "skill" : "api-call",
        status: "complete",
        settings,
        response,
      },
    };
  } catch (error) {
    return failure(
      error instanceof InputError ? 400 : 503,
      error.message,
      settings,
    );
  } finally {
    db?.close();
  }
}

async function saveLesson(world, settings, rephrase) {
  let db;
  try {
    if (
      settings &&
      typeof settings === "object" &&
      Object.keys(settings).some(
        (key) =>
          !["query", "message", "id", "path", "name", "content"].includes(key),
      )
    )
      throw new InputError(
        "Lessons write learned-on-site only. Custom destinations and phases are not accepted.",
      );
    db = await database(world);
    const message = context(db, settings);
    const content =
      typeof settings.content === "string"
        ? JSON.parse(settings.content)
        : settings.content;
    if (
      !Number.isSafeInteger(settings.id) ||
      settings.id <= 0 ||
      settings.name !== "all" ||
      typeof settings.path !== "string" ||
      !content ||
      Array.isArray(content) ||
      !Object.hasOwn(grades, content.vote) ||
      (content.origin !== undefined && content.origin !== "user") ||
      (content.review_status !== undefined &&
        content.review_status !== "approved")
    )
      throw new InputError(
        "Supply record id, path=record_key, name=all and explicit content.vote up/part/down.",
      );
    const record = db
      .prepare("SELECT * FROM records WHERE id=?")
      .get(settings.id);
    if (!record || keyOf(record) !== settings.path)
      throw new InputError("Record ID and record key do not match.");
    const query = settings.query.trim();
    let sourceMessage;
    if (rephrase) {
      if (
        content.vote !== "up" ||
        typeof content.rephrase !== "string" ||
        content.rephrase.trim() !== query ||
        !content.source ||
        !Number.isInteger(content.source.rank) ||
        content.source.rank < 1
      )
        throw new InputError(
          "A rephrase requires the saved new question, an up vote and the original selected-result context.",
        );
      sourceMessage = context(db, {
        query: content.source.query,
        message: content.source.message,
      });
      if (sourceMessage.id === message.id)
        throw new InputError("Submit the rephrased wording as a new message.");
      if (
        content.source.rank > 1 &&
        queryKey(sourceMessage.description) === queryKey(query)
      )
        throw new InputError(
          "Enter different wording that makes the lower-ranked result correct.",
        );
    } else if (
      Object.keys(content).some(
        (key) => !["vote", "origin", "review_status"].includes(key),
      )
    ) {
      throw new InputError("Use the rephrase endpoint to teach new wording.");
    }
    const previous = await readLessons(world);
    const distinct = new Set(
      previous.map((row) => `${queryKey(row.query)}\0${row.id}`),
    );
    distinct.add(`${queryKey(query)}\0${record.id}`);
    if (distinct.size > 50)
      throw new CapacityError(
        "The current established evidence interface supports 50 distinct question/result lessons. Consolidation is required before adding another; no lesson was discarded or saved.",
      );
    const event = {
      schema: 1,
      date: Date.now(),
      sequence: previous.length + 1,
      message: settings.message,
      query,
      id: record.id,
      record_key: keyOf(record),
      name: "all",
      content: { ...content },
      approved: true,
      origin: "user",
      scope: "query-result",
      lesson_type: rephrase
        ? "selected-result-rephrase"
        : "whole-result-relevance",
      grade: grades[content.vote],
      ...(rephrase ? { original_query_not_relabelled: true } : {}),
      source: {
        message: { ...message },
        record: { ...record, data: JSON.parse(record.data || "{}") },
        ...(sourceMessage
          ? {
              original_message: { ...sourceMessage },
              original_rank: content.source.rank,
            }
          : {}),
      },
      original: { ...settings },
    };
    const path = rephrase ? rephrasePath : lessonPath;
    const root = resolve(world.path, path);
    const processing = join(root, "processing-state");
    await mkdir(join(processing, "receipts"), { recursive: true });
    const filename = `message-${settings.message}-${event.date}-${randomUUID()}.json`;
    await atomicJson(join(root, filename), event);
    const receipt = {
      file: filename,
      message: settings.message,
      id: record.id,
      grade: event.grade,
      lesson_type: event.lesson_type,
      ...(sourceMessage ? { original_message: sourceMessage.id, query } : {}),
      mode: "hybrid",
      scope: "query-result",
      learning: "established-supervised-evidence",
      neural_training: false,
    };
    const warnings = [];
    try {
      await atomicJson(join(processing, "receipts", filename), receipt);
    } catch {
      warnings.push("Lesson saved; processing receipt could not be written.");
    }
    return {
      code: 200,
      body: {
        return_type: "api-call",
        status: "complete",
        settings,
        response: { ...receipt, path, warnings },
      },
    };
  } catch (error) {
    return failure(
      error instanceof CapacityError
        ? 409
        : error instanceof InputError || error instanceof SyntaxError
          ? 400
          : 503,
      error.message,
      settings,
    );
  } finally {
    db?.close();
  }
}

const enqueue = (action) => {
  const pending = feedbackQueue.then(action);
  feedbackQueue = pending.catch(() => {});
  return pending;
};
export const recordFeedback = (world, settings) =>
  enqueue(() => saveLesson(world, settings, false));
export const recordRephrase = (world, settings) =>
  enqueue(() => saveLesson(world, settings, true));

export async function handleSearchRecords(world, req, res, url) {
  const pathname =
    url?.pathname ?? new URL(req.url, "http://localhost").pathname;
  const send = (result) => {
    res.writeHead(result.code, { "Content-Type": "application/json" });
    res.end(JSON.stringify(result.body));
  };
  if (
    ![
      "/api/search-records",
      "/api/search-records/dumbot",
      "/api/search-records/feedback",
      "/api/search-records/rephrase",
    ].includes(pathname)
  )
    return send(failure(404, "Unknown search route."));
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return send(failure(405, "Use POST."));
  }
  if (
    !(req.headers["content-type"] ?? "")
      .toLowerCase()
      .startsWith("application/json")
  )
    return send(failure(415, "Use application/json."));
  let settings;
  try {
    const chunks = [];
    let size = 0;
    for await (const chunk of req) {
      size += chunk.length;
      if (size > 65536) return send(failure(413, "Request exceeds 64 KB."));
      chunks.push(chunk);
    }
    settings = JSON.parse(Buffer.concat(chunks).toString("utf8"));
  } catch {
    return send(failure(400, "Supply valid JSON."));
  }
  const action = pathname.endsWith("/dumbot") ? searchDumbot : pathname.endsWith("/rephrase")
    ? recordRephrase
    : pathname.endsWith("/feedback")
      ? recordFeedback
      : searchRecords;
  send(await action(world, settings));
}

import { searchDumbot } from "./dumbot.mjs";

/** Tool entry for the master runner. Uses the deterministic dumbot search path. */
export const run = async (props) => {
  const settings = props.settings ?? props;
  const world = props.world ?? props;
  const result = await searchDumbot(world, settings);
  return {
    return_type: "results",
    status: result.code >= 200 && result.code < 300 ? "complete" : "error",
    settings,
    response: result.body?.response,
    error: result.body?.error,
  };
};
