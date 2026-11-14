import type { FolderNode, DiscoveryRow } from '../DiscoveryExplorer/DiscoveryExplorer.types';
import { cityLayout } from './city.ts';
import type { CityBlock } from './city.ts';
import { pathKey } from '../DiscoveryExplorer/js/discovery-model.ts';
export type CityGrouping='folder'|'type';
export interface CitySceneBlock extends CityBlock {sourceKey?:string}
export interface CityVolume {block:CitySceneBlock;x:number;z:number;width:number;depth:number;base:number;height:number;bytes:number|null}
export interface CityRoad {path:string;parent:string;count:number;kind:'hierarchy'|'type-membership';points:[number,number,number][]}
const WORLD=120,TERRACE=1.05;
export const volumeFor=(block:CityBlock,bytes:number|null=null):CityVolume=>({block,x:(block.x+block.w/2-.5)*WORLD,z:(block.y+block.h/2-.5)*WORLD,width:Math.max(.13,block.w*WORLD),depth:Math.max(.13,block.h*WORLD),base:block.platform?block.depth*TERRACE:Math.max(0,block.depth-1)*TERRACE+.35,height:block.platform?.35:2.4+Math.log2(block.count+1)*1.85,bytes});
const sumBytes=(files:DiscoveryRow[])=>files.every(file=>typeof file.size==='number')?files.reduce((sum,file)=>sum+file.size!,0):null;
function typeDistricts(folder:FolderNode):FolderNode {
 const groups=new Map<string,DiscoveryRow[]>();const visit=(node:FolderNode)=>{for(const file of node.files){const type=file.type||'(no extension)';if(!groups.has(type))groups.set(type,[]);groups.get(type)!.push(file);}node.children.forEach(visit);};visit(folder);
 return {...folder,files:[],children:[...groups].map(([type,files])=>({path:folder.path+'/.type-district/'+encodeURIComponent(type),name:type+' files',children:[],files,file_count:files.length,folder_count:0,types:[{type,count:files.length}],bytes:sumBytes(files)})),folder_count:groups.size};
}
/** All volumes and connections derive from actual folder/type groups; no geographic map. */
export function citySceneModel(folder:FolderNode,depth:number,grouping:CityGrouping='folder'){
 const source=grouping==='type'?typeDistricts(folder):folder,blocks=cityLayout(source,grouping==='type'?1:depth),allPlatforms=blocks.filter(block=>block.platform),allBuildings=blocks.filter(block=>!block.platform&&block.count>0);
 const nodes=new Map<string,FolderNode>(),parents=new Map<string,string>();const visit=(node:FolderNode)=>{nodes.set(pathKey(node.path),node);for(const child of node.children){parents.set(pathKey(child.path),pathKey(node.path));visit(child);}};visit(source);
 const make=(block:CityBlock)=>{const node=nodes.get(pathKey(block.path));let bytes:number|null=null;if(node){if(block.platform||block.name===node.name)bytes=node.bytes;else if(block.name===block.type+' files')bytes=sumBytes(node.files.filter(file=>(file.type||'(no extension)')===block.type));else if(block.type==='other'&&block.name.endsWith(' smaller groups')){
   // Match cityLayout's exact count/name ordering and 23+remainder partition.
   const groups=node.children.map(child=>({name:child.name,count:child.file_count,bytes:child.bytes}));
   const direct=new Map<string,DiscoveryRow[]>();for(const file of node.files){const type=file.type||'(none)';if(!direct.has(type))direct.set(type,[]);direct.get(type)!.push(file);}
   for(const [type,files]of direct)groups.push({name:type+' files',count:files.length,bytes:sumBytes(files)});
   groups.sort((a,b)=>b.count-a.count||a.name.localeCompare(b.name));const rest=groups.slice(23);
   if(rest.length&&block.name===rest.length+' smaller groups')bytes=rest.every(group=>group.bytes!==null)?rest.reduce((sum,group)=>sum+group.bytes!,0):null;
  }}
  const volume=volumeFor(block,bytes);if(grouping==='type')volume.block={...block,path:folder.path,sourceKey:block.path};return volume;};
 const platforms=allPlatforms.slice(0,1600).map(make),buildings=allBuildings.slice(0,2400).map(make);
 const districts=new Map<string,CityVolume>();for(const volume of [...platforms,...buildings]){const key=pathKey(volume.block.sourceKey??volume.block.path);if(!districts.has(key))districts.set(key,volume);}
 const roads:CityRoad[]=[];
 for(const [key,child]of districts){const parentKey=parents.get(key),parent=parentKey?districts.get(parentKey):undefined;if(!parent)continue;roads.push({path:child.block.path,parent:parent.block.path,count:child.block.count,kind:grouping==='type'?'type-membership':'hierarchy',points:[[parent.x,.42,parent.z],[child.x,.42,parent.z],[child.x,.42,child.z]]});}
 return {grouping,platforms,buildings,roads,totalPlatforms:allPlatforms.length,totalBuildings:allBuildings.length,omitted:Math.max(0,allPlatforms.length-platforms.length)+Math.max(0,allBuildings.length-buildings.length),bytesAvailable:folder.bytes!==null&&buildings.every(volume=>volume.bytes!==null)};
}
