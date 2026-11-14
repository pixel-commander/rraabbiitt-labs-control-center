import type { HouseKeys } from '../../../../HouseKeys.types';
export interface DiscoveryRow extends HouseKeys {
  id:number; path:string; name:string; type:string; file?:string; root?:string; date_updated?:number; size?:number;
}
export interface FileTypeCount { type:string; count:number }
export interface FolderNode {
  path:string; name:string; id?:number; children:FolderNode[]; files:DiscoveryRow[];
  file_count:number; folder_count:number; types:FileTypeCount[]; bytes:number|null;
}
export interface ImportReference { source:string; path:string; file:string; target?:string; line?:number; type?:string }
export interface ImportGraphIssue {path?:string;file?:string;error:string}
export interface DiscoveryExplorerProps { root:string; refresh_key?:number; className?:string }
