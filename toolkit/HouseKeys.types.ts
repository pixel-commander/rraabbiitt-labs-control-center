import type { ReactNode } from "react";

/** Numeric house identifier, typically generated from a timestamp using Date.now(). */
export type HouseIdProps = number;
/** Numeric timestamp used by the house date fields. */
export type HouseTimestampFormat = number;

/** Shared identity, descriptive, path and timestamp fields. */
export interface HouseKeys {
  /** Identifier for this record. */
  id?: HouseIdProps;
  /** Short name may contain hyphens. */
  name?: string;
  /** Short descriptive title for displays with more space than a name allows. */
  title?: string;
  /** Longer explanation for a full-detail display. */
  description?: string;
  /** Site URL, including its configured port and optional route. */
  url?: string;

  /** Single location used by the receiving capability; its contract defines resolution. */
  path?: string;
  /** Output destination directory when the capability accepts saving. */
  save_path?: string;
  /** Output filename, without directory separators, when the capability accepts saving. */
  save_file?: string;
  /** Multiple location records, optionally including file metadata. */
  paths?: PathsProps[];

  /** Timestamp when the record was added. */
  date_added?: HouseTimestampFormat;
  /** Timestamp of the record's most recent update. */
  date_updated?: HouseTimestampFormat;
  /** Timestamp when the record or capability was last used. */
  date_used?: HouseTimestampFormat;
  /** General-purpose timestamp whose meaning is defined by the caller. */
  date?: HouseTimestampFormat;
  /** Timestamp when the represented activity started. */
  date_start?: HouseTimestampFormat;
  /** Timestamp when the represented activity ended. */
  date_end?: HouseTimestampFormat;
}

/** Location record with optional file and identity metadata. */
export interface PathsProps {
  /** Location of the record; file-based callers typically use the containing folder. */
  path?: string;
  /** Filename, including its extension when present. */
  file?: string;
  /** Record name; file finders typically use the filename without its extension. */
  name?: string;
  /** Record classification; file finders typically use the extension without a dot. */
  type?: string;
  /** House identifier associated with this location record, when available. */
  id?: HouseIdProps;
}

export type HandlerKey<
  Data = unknown,
  Type extends string = string,
  Result = unknown,
  Props = HouseKeys & { [key: string]: unknown },
> = (data?: Data, type?: Type, props?: Props) => Result;

export interface HouseHandlers {
  handleClick?: HandlerKey<any>;
  handleChange?: HandlerKey<any>;
  handleSubmit?: HandlerKey<any>;
  handleSave?: HandlerKey<any>;
  handleCancel?: HandlerKey<any>;
}

/** Shared incoming settings bag. Capability-specific fields remain in the bag. */
export interface ToolsProps
  extends HouseKeys, PathsProps, Record<string, unknown> {
  refresh?: boolean;
  query?: string;
  tags?: string[];
  grid?: string;
  class_name?: string;
  styles?: string;
  content?: string;
  name_prefix?: string;
  save_as_text?: boolean;
}

export interface StatusProps {
  status: "waiting" | "complete" | "error";
}

export interface ErrorProps {
  error?: string;
}

export interface SummaryProps {
  count?: number;
  total?: number;
  average?: number;
  high?: number;
  low?: number;
}

export interface ResponseProps extends HouseKeys, PathsProps {
  /** Presentation hint, independent of the returned record's type. */
  response_type?: string;
  /** Domain payload kind when a tool returns a typed document or record. */
  type?: string;
  /** React elements stay in the frontend; JSON transports use serializable body values. */
  body?: ReactNode;
  /** Original ranking evidence retained when body presents a skill's text. */
  evidence?: ReactNode;
  code?: string;
  summary?: SummaryProps;
  paths?: PathsProps[];
}

export interface ToolReturn extends HouseKeys, StatusProps, ErrorProps {
  return_type:
    "settings" | "summary" | "results" | "api-call" | "scaffold" | "skill";
  /** Effective incoming props, not the tool's registration/settings declaration. */
  settings: Record<string, unknown>;
  response?: ResponseProps;
}

export type Tool = (props: ToolsProps) => ToolReturn | Promise<ToolReturn>;

/** A tool invocation or an LLM instruction. Neither creates another tracker. */
export interface RunProps extends HouseKeys {
  type: "tool" | "llm" | "runner";
  /** Runner entries put their child RunProps[] in settings.runs. */
  settings: Record<string, unknown>;
}

export interface RunnerSettings {
  runs: RunProps[];
}

/** Timing belongs to this execution owner, not the called tool. */
export interface RunResponse extends ToolReturn {
  type: RunProps["type"];
  date_start?: number;
  date_end?: number;
}

export interface RunnerOptions {
  /** Best-effort persistence of the finished, unchanged run array. */
  complete?: (run: readonly RunResponse[]) => Promise<void> | void;
  /** Best-effort completion sink. Failure never changes execution outcomes. */
  record?: (response: Readonly<RunResponse>) => Promise<void> | void;
  /** Optional workflow producer. Called after the queued work completes; null finishes. */
  next?: (
    responses: readonly RunResponse[],
  ) => Promise<RunProps | null> | RunProps | null;
  /** Resolve/execute the requested tool or LLM work in the host. */
  execute: (
    run: RunProps,
    responses: readonly RunResponse[],
  ) => Promise<ToolReturn> | ToolReturn;
  /** Receive the current ordered array for tracking/UI. Must not mutate it. */
  update?: (responses: readonly RunResponse[]) => Promise<void> | void;
}

/** Composed runners supply their own executor to the shared tracking owner. */
export type RunnerCallbacks = Omit<RunnerOptions, "execute">;
export type RunnersProps = ToolsProps;
export type RunnerReturn = RunResponse[];
export type Runner = (
  props: RunnersProps,
  options?: RunnerCallbacks,
) => Promise<RunnerReturn>;
