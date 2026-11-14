import type { FolderNode } from '../../DiscoveryExplorer/DiscoveryExplorer.types';
export interface FolderBarsProps {folder:FolderNode;root:FolderNode;onSelectFolder:(path:string)=>void}
