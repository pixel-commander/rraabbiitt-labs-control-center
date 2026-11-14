import { z } from "zod";

const id = z.number().int().positive().safe();
const text = z.string().trim().min(1);
const hash = z.string().regex(/^[a-f0-9]{64}$/);
const outcome = z.enum(["passed", "failed", "blocked"]);
const identity = { id, name: text, title: z.string().optional(), description: z.string().optional(), tags: z.array(z.string()).optional() };

export const evaluationCheckV1 = z.discriminatedUnion("validator", [
  z.strictObject({ name: text, validator: z.literal("search-target"), settings: z.strictObject({ ids: z.array(id).min(1), top_k: id }) }),
  z.strictObject({ name: text, validator: z.literal("search-query-style"), settings: z.strictObject({ style: z.enum(["prose", "keywords"]) }) }),
  z.strictObject({ name: text, validator: z.literal("atom-list"), settings: z.strictObject({ type: z.enum(["container", "action", "effect", "grid"]) }) }),
  z.strictObject({ name: text, validator: z.literal("tool-succeeded"), settings: z.strictObject({ id }) }),
  z.strictObject({ name: text, validator: z.literal("factory-layout"), settings: z.strictObject({
    summary_cards: z.number().int().nonnegative(), header: z.boolean(), activity: z.boolean(), registered_atoms: z.boolean(), valid_house_grid: z.boolean(),
  }) }),
  z.strictObject({ name: text, validator: z.literal("saved-composition-url") }),
]);
export const evaluationTestV1 = z.strictObject({
  ...identity, type: z.literal("evaluation-test"), schema_version: z.literal(1), version: id,
  prompt: text,
  setup: z.strictObject({ fresh_chat: z.literal(true), tool_ids: z.array(id).refine(ids => new Set(ids).size === ids.length, "Tool IDs must be unique.") }),
  limits: z.strictObject({ seconds: id, tool_calls: id, human_interventions: z.literal(0) }),
  checks: z.array(evaluationCheckV1).min(1).refine(checks => new Set(checks.map(check => check.name)).size === checks.length, "Check names must be unique."),
}).superRefine((value, ctx) => {
  value.checks.forEach((check, index) => {
    if (check.validator === "tool-succeeded" && !value.setup.tool_ids.includes(check.settings.id)) ctx.addIssue({ code: "custom", path: ["checks", index, "settings", "id"], message: "Checked tool must be present in setup.tool_ids." });
  });
});
export const evaluationRunV1 = z.strictObject({
  ...identity, type: z.literal("evaluation-run"), schema_version: z.literal(1),
  test_id: id, test_version: id, test_sha256: hash,
  model: z.strictObject({ name: text, provider: text, digest: text, harness: z.string().optional(), settings: z.record(z.string(), z.union([z.string(), z.number(), z.boolean(), z.null()])) }),
  environment: z.strictObject({ toolkit_revision: text, catalog_sha256: hash }),
  thread_id: id, date_start: z.number().int().nonnegative(), date_end: z.number().int().nonnegative(),
  status: z.enum(["complete", "error"]), outcome,
  checks: z.array(z.strictObject({ name: text, outcome, reason: z.string().optional(), run_ids: z.array(id).optional() })),
  metrics: z.strictObject({ duration_ms: z.number().int().nonnegative(), tool_calls: z.number().int().nonnegative(), tool_errors: z.number().int().nonnegative(), human_interventions: z.number().int().nonnegative(), input_tokens: z.number().int().nonnegative().nullable(), output_tokens: z.number().int().nonnegative().nullable() }),
  artifacts: z.strictObject({ composition_id: id.optional(), url: z.url().optional() }), run_ids: z.array(id),
}).refine(run => run.date_end >= run.date_start, "date_end cannot precede date_start.");

/** Immutable shape versions. Test version is separate from schema_version. */
export const schemaVersions = {
  "evaluation-test": { 1: evaluationTestV1 },
  "evaluation-run": { 1: evaluationRunV1 },
} as const;
