import type { DiscoveryRow, FolderNode } from '../DiscoveryExplorer.types';
export const cleanPath=(value:string)=>value.replaceAll('\\','/').replace(/\/+$/,'')||'/';
export const pathKey=(value:string)=>/^[a-z]:/i.test(value)||value.includes('\\')||value.startsWith('//')?cleanPath(value).toLowerCase():cleanPath(value);
export const isWithin=(root:string,path:string)=>{const parent=pathKey(root),child=pathKey(path);return child===parent||child.startsWith(parent==='/'?'/':parent+'/');};
export const parentPath=(value:string)=>{const path=cleanPath(value),index=path.lastIndexOf('/');return index<0?path:index===0?'/':path.slice(0,index);};
export const filePath=(row:Pick<DiscoveryRow,'path'|'file'|'name'>)=>cleanPath(row.path).replace(/\/$/,'')+'/'+(row.file??row.name);
const basename=(value:string)=>cleanPath(value).split('/').at(-1)||value;

/** Build once per saved inventory. Folder selection, expansion and charts do not crawl disk. */
export function buildFolderModel(rootPath:string,rows:DiscoveryRow[]){
  const root=cleanPath(rootPath),nodes=new Map<string,FolderNode>(),seenFiles=new Set<string>();
  const make=(path:string):FolderNode=>{const key=pathKey(path);let node=nodes.get(key);if(!node){node={path:cleanPath(path),name:basename(path),children:[],files:[],file_count:0,folder_count:0,types:[],bytes:null};nodes.set(key,node);}return node;};
  const ensure=(path:string)=>{let current=cleanPath(path),child:FolderNode|undefined;while(isWithin(root,current)){const node=make(current);if(child&&!node.children.includes(child))node.children.push(child);child=node;if(pathKey(current)===pathKey(root))break;const parent=parentPath(current);if(parent===current)break;current=parent;}return make(path);};
  const tree=make(root);
  for(const row of rows){if(!row.path||!isWithin(root,row.path))continue;if(row.type==='folder'&&!row.file){const node=ensure(row.path);node.name=row.name||node.name;node.id=row.id;}else{const full=pathKey(filePath(row));if(seenFiles.has(full))continue;seenFiles.add(full);ensure(row.path).files.push(row);}}
  const ordered=[...nodes.values()].sort((a,b)=>b.path.length-a.path.length);
  for(const node of ordered){
    const types=new Map<string,number>();let bytes=0,known=true;
    node.files.sort((a,b)=>a.name.localeCompare(b.name));node.children.sort((a,b)=>a.name.localeCompare(b.name));
    node.file_count=node.files.length;node.folder_count=node.children.length;
    for(const file of node.files){const type=file.type||'(no extension)';types.set(type,(types.get(type)??0)+1);if(typeof file.size==='number')bytes+=file.size;else known=false;}
    for(const child of node.children){node.file_count+=child.file_count;node.folder_count+=child.folder_count;for(const item of child.types)types.set(item.type,(types.get(item.type)??0)+item.count);if(child.bytes===null&&child.file_count)known=false;else bytes+=child.bytes??0;}
    node.bytes=known?bytes:null;node.types=[...types].map(([type,count])=>({type,count})).sort((a,b)=>b.count-a.count||a.type.localeCompare(b.type));
  }
  return {tree,nodes};
}
