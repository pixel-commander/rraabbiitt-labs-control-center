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
  Result = unknown | undefined,
  Props = HouseKeys & { [key: string]: unknown },
> = (data?: Data, type?: Type, props?: Props) => Result;



export interface HouseHandlers {
  handleClick?: HandlerKey<any>;
  handleChange?: HandlerKey<any>;
  handleSubmit?: HandlerKey<any>;
  handleSave?: HandlerKey<any>;
  handleCancel?: HandlerKey<any>;
}
