import type { ToolsProps, ToolReturn, PathsProps } from '../../../../toolkit/HouseKeys.types';
export interface FinderSettings extends ToolsProps { root:string; db?:boolean; mode?:'ast'|'text'; kind?:string; limit?:number; offset?:number }
export interface FinderRow extends PathsProps { size?:number; error?:string; line?:number; column?:number; kind?:string; code?:string }
export interface FinderReport { paths:FinderRow[]; count:number; total:number; errors:FinderRow[]; detail?:Record<string,unknown> }
export type { ToolReturn };
