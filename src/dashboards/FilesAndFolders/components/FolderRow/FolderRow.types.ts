import type { FolderNode } from '../DiscoveryExplorer/DiscoveryExplorer.types';
export interface FolderRowProps {folder:FolderNode;selected:string;expanded:Set<string>;visible:Set<string>|null;query_active:boolean;onToggle:(path:string)=>void;onSelect:(path:string)=>void}
