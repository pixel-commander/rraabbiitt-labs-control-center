import type { ReactNode } from "react";
import type { HouseKeys } from "../../HouseKeys.types";
import type { ToolsProps, ToolReturn, PathsProps } from "../../../toolkit/HouseKeys.types";

export type ScannerStatus = 'idle' | 'scanning' | 'complete' | 'error';
export interface ScanBranch { path: string; name: string; state: 'waiting' | 'scanning' | 'complete' | 'error'; pending: number; started?: number; ended?: number; error?: string }
export interface ScanProgress {
  branches: ScanBranch[]; root: string; directory: string; name: string; worker: number;
  state: 'scanning' | 'read' | 'error'; files: number; folders: number; errors: number;
  phase?:'discovery'|'files'|'indexing';
  directFiles: number; queued: string[]; pending: number; timestamp: number; error?: string;
  root_read?:boolean;
  workers?: {worker:number;name:string;directory:string;state:string}[];
}
export interface ScanFilesAndFoldersProps extends ToolsProps { root: string; save?: boolean; scan_id?: string }
export interface ScanFilesAndFoldersPath extends PathsProps { error?: string; size?:number }
export interface ScanFilesAndFoldersReturn extends ToolReturn {
  response: NonNullable<ToolReturn['response']> & { summary: {count:number;total:number}; paths:ScanFilesAndFoldersPath[] };
}
export interface ScannerEvent { time: number; source: string; message: string; error?: boolean }

export interface ScannerStatusUiProps extends HouseKeys {
  /** Required crawl root. The scanner never chooses an entire drive implicitly. */
  root: string;
  /** Save to the project discovery table after a successful scan. Default true. */
  save?: boolean;
  button_label?: string;
  handleComplete?: (result: ToolReturn) => void;
  children?: ReactNode;
  className?: string;
}
