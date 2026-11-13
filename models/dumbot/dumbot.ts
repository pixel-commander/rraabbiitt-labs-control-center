import { fillResponse, responseTemplates } from "./responder.ts";
import connectors from "./nlp/slot-machine/lexicon/connectors.json" with { type: "json" };
import { dbPairs } from "./model/db-pairs.ts";
import type { DbPairsProps } from "./model/db-pairs.ts";
import { slotFiller, normalizeWords } from "./nlp/slot-machine/slotFiller.ts";
import type { SlotChoices } from "./nlp/slot-machine/slotFiller.ts";

const actions = ["add", "find", "list", "read", "edit", "delete", "move", "copy", "rename", "run", "stop", "validate", "refresh", "import", "export", "train", "use"];
export interface DumbotSearchProps extends DbPairsProps {
  project_slots?: SlotChoices;
  limit?: number;
}

export interface RequiredProp {
  name: string;
  title?: string;
  type?: string;
  required?: boolean;
  hint?: string;
  description?: string;
  response?: string;
  default?: unknown;
}
/** Keep filled values and ask for only the first missing required property. */
export const responder = (reqs: readonly RequiredProp[], supplied: Record<string, unknown> = {}) => {
  const values = { ...supplied };
  for (const prop of reqs) {
    if (!Object.hasOwn(values, prop.name) && Object.hasOwn(prop, "default")) values[prop.name] = prop.default;
  }
  const missing = reqs.filter(prop => prop.required && (!Object.hasOwn(values, prop.name) || values[prop.name] === null || values[prop.name] === undefined));
  const next = missing[0];
  return { values, missing: missing.map(prop => prop.name), next: next?.name ?? null,
    text: next ? next.response ?? next.hint ?? `What is ${next.title ?? next.name}?${next.description ? ` ${next.description}` : ""}`
      : "The required values are filled. Nothing has been executed." };
};

/** Deterministic question detection; this is not the Python learned classifier. */
export const classifyMessage = (message: string) => {
  const question = /\?\s*$/.test(message) || /^(?:where|what|when|why|who|whose|which|how|is|are|am|was|were|does|do|did|can|could|would|should|will|have|has)\b/i.test(message.trim());
  return { label: question ? "question" : "statement", method: "question-rule" };
};

/** Rank matching DB-pairs candidates with slot evidence. Never save grades or execute tools. */
export const dumbot = (props: DumbotSearchProps) => {
  const start = Date.now();
  const project_slots: SlotChoices = { action: actions, ...props.project_slots };
  for (const record of props.data) {
    if (typeof record.type !== "string") continue;
    if (!(record.type in project_slots)) project_slots[record.type] = [];
    if (record.name) project_slots[record.type] = [...project_slots[record.type], record.name];
  }
  const filled = slotFiller(props.query, { project_slots, target_slots: {}, chaining_slots: { connector: connectors } });
  const classifier = classifyMessage(props.query);
  const action = filled.slots.some(slot => slot.slot === "action");
  if (classifier.label !== "question" && action) classifier.label = "command";
  const assumptions = classifier.label === "question" ? [{ slot: "type", normalized: "skill", reason: "question" }] : [];
  const paths = dbPairs(props).map(record => {
    const recordText = normalizeWords([record.name, record.title, record.description, record.action_type].filter(value => typeof value === "string").join(" ")).join(" ");
    const matched_slots = filled.slots.filter(slot => slot.slot !== "connector").filter(slot => slot.slot === "type"
      ? normalizeWords(String(slot.normalized)).join(" ") === normalizeWords(record.type ?? "").join(" ")
      : (` ${recordText} `).includes(` ${normalizeWords(String(slot.normalized)).join(" ")} `));
    const slot_bonus = new Set(matched_slots.map(slot => `${slot.slot}:${slot.normalized}`)).size;
    // All bonuses apply only to candidates with positive DB-pairs evidence.
    const skill_multiplier = record.type === "skill" ? 1.1 : 1;
    const intent_multiplier = classifier.label === "question"
      ? (record.type === "skill" ? 1.2 : 1)
      : action ? (record.type === "runner" ? 1.2 : record.type === "tool" ? 1.1 : 1) : 1;
    const score = (record.score + slot_bonus) * skill_multiplier * intent_multiplier;
    return { ...record, score, matched_slots, ranking: { rank: 0, score, score_kind: "db-pairs-and-slots" },
      evidence: { ...record.evidence, db_pairs_score: record.score, slot_bonus, skill_multiplier, intent_multiplier } };
  }).sort((a, b) => b.score - a.score || a.id - b.id);
  paths.forEach((record, index) => { record.ranking.rank = index + 1; });
  const end = Date.now();
  return { message: filled.message, classifier, slots: filled.slots, assumptions,
    paths: paths.slice(0, props.limit ?? 20), summary: { count: Math.min(paths.length, props.limit ?? 20), total: paths.length },
    stats: { start, end, dur: end - start }, mode: "db-pairs", response: {}, status: {} };
};

/** Fill only explicitly labelled values; arbitrary prose is not a field value. */
export const fillContract = (message: string, reqs: readonly RequiredProp[], supplied: Record<string, unknown> = {}) => {
  const values = { ...supplied };
  for (const prop of reqs) {
    const escaped = prop.name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const label = prop.name === "name" ? "(?:named|called|name it|name\\s*[:=])" : escaped + "\\s*[:=]";
    const match = message.match(new RegExp("\\b" + label + "\\s*(?:\"([^\"]+)\"|'([^']+)'|([^\\s,;]+))", "i"));
    if (!match) continue;
    const raw = match[1] ?? match[2] ?? match[3];
    if (!prop.type || prop.type === "string") values[prop.name] = raw;
    else if (prop.type === "boolean" && /^(true|false)$/i.test(raw)) values[prop.name] = raw.toLowerCase() === "true";
    else if (["number", "integer"].includes(prop.type) && Number.isFinite(Number(raw)) && (prop.type !== "integer" || Number.isInteger(Number(raw)))) values[prop.name] = Number(raw);
  }
  return values;
};

/** Build the contract preview; the API owns confirmed tool execution. */
export const confirmContract = (title: string, reqs: readonly RequiredProp[], values: Record<string, unknown>, answer?: string) => {
  const check = responder(reqs, values);
  if (check.next) return { ...check, phase: "filling" as const, simulated: false, executed: false };
  const decision = answer?.trim().toLowerCase().replace(/[.!?]+$/, "");
  const task = /^(new|create)\s+/i.test(title) ? "make a " + title.replace(/^create\s+/i, "new ").toLowerCase() : "use “" + title + "”";
  const named = Object.hasOwn(check.values, "name") ? " named “" + String(check.values.name) + "”" : "";
  const rest = Object.entries(check.values).filter(([key]) => key !== "name").map(([key, value]) => key + ": " + JSON.stringify(value)).join(", ");
  const summary = "You want to " + task + named + (rest ? " (" + rest + ")" : "") + ".";
  if (decision === "yes") return { ...check, phase: "confirmed" as const, simulated: false, executed: false, text: "Simulation confirmed. " + summary + " Nothing was executed." };
  if (decision === "no") return { ...check, phase: "cancelled" as const, simulated: false, executed: false, text: "Cancelled. Nothing was executed." };
  return { ...check, phase: "confirming" as const, simulated: false, executed: false, text: summary + " Is that right? Yes or no?" };
};

export const executionReply = (receipts: { name?: string; status: string; error?: string; response?: Record<string, unknown> }[], request: { action?: string; type?: string; name?: unknown; path?: unknown }) => {
  const failure = receipts.find(step => step.status === "error");
  if (failure) return "Tool failed: " + (failure.error ?? "See the returned result.");
  const steps = receipts.filter(step => step.name !== "tool-loader");
  if (!steps.length || steps.some(step => step.status !== "complete")) return "The tool did not return a completed execution result.";
  const output = [...steps].reverse().map(step => step.response).find(value => value && typeof value.name === "string" && typeof value.path === "string");
  const verbs: Record<string, string> = { add: "added", delete: "removed", edit: "edited", move: "moved", copy: "copied", rename: "renamed", run: "run", stop: "stopped", validate: "validated", refresh: "refreshed", import: "imported", export: "exported", train: "trained", use: "used", find: "found", list: "listed", read: "read" };
  const action = request.action && verbs[request.action];
  const name = output?.name ?? request.name;
  const type = output?.type ?? request.type;
  const path = output?.path ?? request.path;
  if (!action || !name || !type || path === undefined) return "The tool completed. See the returned result for details.";
  return fillResponse(responseTemplates.completed, { action, type: String(type), name: String(name), path: String(path) });
};
