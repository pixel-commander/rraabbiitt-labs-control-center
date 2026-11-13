import type { RunnersProps } from "../../Runner.types.ts";

export type RefreshWorldJsonType = "world" | "project" | "beacon" | "settings";

export interface RefreshWorldJsonProps extends RunnersProps {
  path: string;
  type: RefreshWorldJsonType;
}
