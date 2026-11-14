import type { FolderNode } from '../../../DiscoveryExplorer/DiscoveryExplorer.types';
import { pathKey } from '../../../DiscoveryExplorer/js/discovery-model.ts';
export interface Vec3 {x:number;y:number;z:number}
export interface ClusterNode {id:string;folder:FolderNode;parent?:string;position:Vec3;radius:number;depth:number;group:string}
export function expandedToDepth(folder:FolderNode,depth:number){const expanded=new Set<string>(),queue=[{folder,depth:0}];for(let i=0;i<queue.length;i++){const item=queue[i];if(item.depth>=depth)continue;expanded.add(pathKey(item.folder.path));for(const child of item.folder.children)queue.push({folder:child,depth:item.depth+1});}return expanded;}
export function clusterModel(folder:FolderNode,expanded:Set<string>,limit=750){
 const nodes:ClusterNode[]=[],queue:ClusterNode[]=[{id:pathKey(folder.path),folder,position:{x:0,y:0,z:0},radius:2.8,depth:0,group:folder.name}],all=new Map<string,FolderNode>();
 const every=[folder];for(let i=0;i<every.length;i++){all.set(pathKey(every[i].path),every[i]);every.push(...every[i].children);}
 for(let cursor=0;cursor<queue.length&&nodes.length<limit;cursor++){
  const node=queue[cursor];nodes.push(node);if(!expanded.has(node.id))continue;
  const children=[...node.folder.children].sort((a,b)=>b.file_count-a.file_count||a.name.localeCompare(b.name)),count=children.length;
  for(let i=0;i<count;i++){const child=children[i],v=1-2*(i+.5)/count,r=Math.sqrt(Math.max(0,1-v*v)),angle=i*2.3999632297+node.depth*.9,spread=node.radius*(count>3?1:.86);
   queue.push({id:pathKey(child.path),folder:child,parent:node.id,position:{x:node.position.x+Math.cos(angle)*r*spread,y:node.position.y+v*spread,z:node.position.z+Math.sin(angle)*r*spread},radius:node.radius*.38,depth:node.depth+1,group:node.depth===0?child.name:node.group});
  }
 }
 const ids=new Set(nodes.map(node=>node.id)),edges=nodes.filter(node=>node.parent&&ids.has(node.parent)).map(node=>({from:node.parent!,to:node.id}));
 return {nodes,edges,all,total:all.size,truncated:queue.length>nodes.length};
}
export function rotate3D(point:Vec3,yaw:number,pitch:number){const x=point.x*Math.cos(yaw)+point.z*Math.sin(yaw),z=-point.x*Math.sin(yaw)+point.z*Math.cos(yaw);return{x,y:point.y*Math.cos(pitch)-z*Math.sin(pitch),z:point.y*Math.sin(pitch)+z*Math.cos(pitch)};}
export function project3D(point:Vec3,camera:{yaw:number;pitch:number;distance:number;zoom:number;target:Vec3},width:number,height:number){const rotated=rotate3D({x:point.x-camera.target.x,y:point.y-camera.target.y,z:point.z-camera.target.z},camera.yaw,camera.pitch),distance=camera.distance-rotated.z;if(distance<=.15)return null;const scale=height*.95/distance*camera.zoom;return{x:width/2+rotated.x*scale,y:height/2-rotated.y*scale,z:rotated.z,scale,depth:distance};}
export function hierarchyCurve(a:Vec3,b:Vec3,t:number):Vec3 {const dx=b.x-a.x,dy=b.y-a.y,dz=b.z-a.z,length=Math.hypot(dx,dy,dz)||1,norm=Math.hypot(dx,dz)||1,bend=Math.sin(Math.PI*t)*Math.min(.32,length*.12);return{x:a.x+dx*t-dz/norm*bend,y:a.y+dy*t,z:a.z+dz*t+dx/norm*bend};}
