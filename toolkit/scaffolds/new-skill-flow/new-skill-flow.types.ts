import type { HouseKeys } from "../../../HouseKeys.types.ts";
export interface NewSkillFlowProps extends HouseKeys {
  name: string;
  path: string;
  title: string;
  description: string;
  type?: string;
  instructions: string;
  file?: "use.skill.yaml" | "enhance.skill.yaml";
  intent?: "use" | "enhance";
  owner?: HouseKeys;
  implementation?: HouseKeys[];
  context?: (HouseKeys & { use?: number; reason?: string })[];
  inputs?: Record<string, unknown>;
  outputs?: Record<string, unknown>;
  checks?: unknown[];
  examples?: unknown[];
  routes?: unknown[];
  provenance?: unknown[];
  tags?: string[];
}
export type NewSkillFlowRecord = Omit<NewSkillFlowProps, "file"> & {
  id: number;
};

