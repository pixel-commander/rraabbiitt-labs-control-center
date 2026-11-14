import type { FolderNode, FileTypeCount } from '../../../DiscoveryExplorer/DiscoveryExplorer.types';
export interface BarRow {key:string;label:string;path?:string;count:number;types:FileTypeCount[]}
export function barRows(folder:FolderNode,mode:'folders'|'types'):BarRow[]{
 if(mode==='types')return folder.types.map(row=>({key:row.type,label:row.type||'(no extension)',count:row.count,types:[row]}));
 const rows=folder.children.map(node=>({key:node.path,label:node.name,path:node.path,count:node.file_count,types:node.types}));
 if(folder.files.length){const types=new Map<string,number>();for(const row of folder.files)types.set(row.type||'(no extension)',(types.get(row.type||'(no extension)')??0)+1);rows.push({key:folder.path+'::direct',label:'Direct files',path:folder.path,count:folder.files.length,types:[...types].map(([type,count])=>({type,count})).sort((a,b)=>b.count-a.count)});}
 return rows;
}
export function niceCeiling(value:number){const raw=Math.max(1,value/5),power=10**Math.floor(Math.log10(raw)),step=Math.ceil(([1,1.2,1.5,2,2.5,3,4,5,10].find(n=>n>=raw/power)??10)*power);return step*5;}
