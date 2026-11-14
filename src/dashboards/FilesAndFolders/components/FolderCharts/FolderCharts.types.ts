import type { FolderNode, ImportReference, FileTypeCount, ImportGraphIssue } from '../DiscoveryExplorer/DiscoveryExplorer.types';
export interface FolderChartsProps { folder:FolderNode; root:FolderNode; references:ImportReference[]; graph_status:'idle'|'loading'|'complete'|'error'; graph_error?:string; graph_issues?:ImportGraphIssue[]; onLoadGraph:()=>void; onSelectFolder:(path:string)=>void }
export interface FolderDonutProps { types:FileTypeCount[]; compact?:boolean; label:string }
