import type { z } from "zod";
import type { HouseKeys, ToolsProps, ResponseProps, ToolReturn } from "../HouseKeys.types.ts";
import type { evaluationTestV1, evaluationRunV1, evaluationCheckV1 } from "./schema-versions.ts";

export type EvaluationCheckV1 = z.infer<typeof evaluationCheckV1>;
export type EvaluationTestV1 = HouseKeys & z.infer<typeof evaluationTestV1>;
export type EvaluationRunV1 = HouseKeys & z.infer<typeof evaluationRunV1>;
export type EvaluationDocument = EvaluationTestV1 | EvaluationRunV1;
export interface GenerateReactTestsSettings extends ToolsProps {
  name: string;
  save_path: string;
  prompt?: string;
  schema_version?: 1;
  version?: number;
  setup?: EvaluationTestV1["setup"];
  limits?: EvaluationTestV1["limits"];
  checks?: EvaluationCheckV1[];
}
export interface NewReactTestSettings extends ToolsProps {
  name: string;
  save_path: string;
  test: EvaluationTestV1;
}

export interface RunReactTestsSettings extends ToolsProps {
  /** External test folder or parent containing test folders. */
  path: string;
  models: string[];
  repetitions?: number;
  /** Local Ollama URL. */
  url?: string;
  options?: Record<string, string | number | boolean>;
}
export interface EvaluationResponse extends ResponseProps {
  result: EvaluationRunV1;
}
export interface EvaluationReturn extends ToolReturn {
  response?: EvaluationResponse;
}
