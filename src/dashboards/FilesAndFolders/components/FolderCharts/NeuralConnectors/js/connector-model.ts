import type { FolderNode, ImportReference } from '../../../DiscoveryExplorer/DiscoveryExplorer.types';
import { cleanPath, isWithin, pathKey } from '../../../DiscoveryExplorer/js/discovery-model.ts';
export interface ConnectorNode {id:string;path:string;name:string;group:string;incoming:number;outgoing:number;layer:number;external:boolean}
export interface ConnectorEdge {from:string;to:string;count:number;references:ImportReference[]}
export function connectorModel(folder:FolderNode,references:ImportReference[],boundary=false,limit=60,focus?:string){
 const allNodes=new Map<string,ConnectorNode>(),edgeMap=new Map<string,ConnectorEdge>();
 const add=(path:string)=>{const full=cleanPath(path),id=pathKey(full);if(!allNodes.has(id)){const internal=isWithin(folder.path,full),relative=internal?full.slice(cleanPath(folder.path).length).replace(/^\//,''):full;allNodes.set(id,{id,path:full,name:full.split('/').at(-1)||full,group:internal?(relative.includes('/')?relative.split('/')[0]:'(direct)'):'external',incoming:0,outgoing:0,layer:0,external:!internal});}return allNodes.get(id)!;};
 for(const reference of references){if(!reference.target)continue;const source=cleanPath(reference.path)+'/'+reference.file,target=reference.target,sourceInside=isWithin(folder.path,source),targetInside=isWithin(folder.path,target);if(boundary?(!sourceInside&&!targetInside):(!sourceInside||!targetInside))continue;
  const from=add(source),to=add(target),key=from.id+'\0'+to.id;let edge=edgeMap.get(key);if(!edge){edge={from:from.id,to:to.id,count:0,references:[]};edgeMap.set(key,edge);}edge.count++;edge.references.push(reference);from.outgoing++;to.incoming++;
 }
 const allEdges=[...edgeMap.values()],ranked=[...allNodes.values()].sort((a,b)=>(b.incoming+b.outgoing)-(a.incoming+a.outgoing)||a.path.localeCompare(b.path)),priority=new Set<string>();
 if(focus&&allNodes.has(focus)){priority.add(focus);for(const edge of allEdges)if(edge.from===focus||edge.to===focus){priority.add(edge.from);priority.add(edge.to);}}
 const nodes=[...ranked].sort((a,b)=>(b.id===focus?2:Number(priority.has(b.id)))-(a.id===focus?2:Number(priority.has(a.id)))).slice(0,limit),visible=new Set(nodes.map(node=>node.id)),edges=allEdges.filter(edge=>visible.has(edge.from)&&visible.has(edge.to)),adj=new Map(nodes.map(node=>[node.id,[] as string[]]));
 for(const edge of edges)adj.get(edge.from)!.push(edge.to);
 // Collapse cycles before assigning actual import-direction layers.
 let index=0;const indices=new Map<string,number>(),low=new Map<string,number>(),stack:string[]=[],stacked=new Set<string>(),components:string[][]=[];
 const visit=(id:string)=>{indices.set(id,index);low.set(id,index++);stack.push(id);stacked.add(id);for(const target of adj.get(id)??[]){if(!indices.has(target)){visit(target);low.set(id,Math.min(low.get(id)!,low.get(target)!));}else if(stacked.has(target))low.set(id,Math.min(low.get(id)!,indices.get(target)!));}if(low.get(id)===indices.get(id)){const members:string[]=[];let value:string;do{value=stack.pop()!;stacked.delete(value);members.push(value);}while(value!==id);components.push(members);}};
 for(const node of nodes)if(!indices.has(node.id))visit(node.id);
 const owner=new Map<string,number>();components.forEach((members,index)=>members.forEach(id=>owner.set(id,index)));
 const outgoing=components.map(()=>new Set<number>()),incoming=components.map(()=>0),layers=components.map(()=>0);
 for(const edge of edges){const a=owner.get(edge.from)!,b=owner.get(edge.to)!;if(a!==b&&!outgoing[a].has(b)){outgoing[a].add(b);incoming[b]++;}}
 const queue=incoming.flatMap((count,index)=>count===0?[index]:[]);for(let i=0;i<queue.length;i++){const component=queue[i];for(const target of outgoing[component]){layers[target]=Math.max(layers[target],layers[component]+1);if(--incoming[target]===0)queue.push(target);}}
 for(const node of nodes)node.layer=Math.min(7,layers[owner.get(node.id)!]);
 const columns=new Map<number,ConnectorNode[]>();for(const node of nodes){if(!columns.has(node.layer))columns.set(node.layer,[]);columns.get(node.layer)!.push(node);}for(const column of columns.values())column.sort((a,b)=>a.group.localeCompare(b.group)||(b.incoming+b.outgoing)-(a.incoming+a.outgoing)||a.name.localeCompare(b.name));
 // A semantic dependency layer can occupy several presentation lanes. Fan-in
 // stays compact vertically without changing any node's dependency layer.
 const laneRows=12,laneWidth=230,positions=new Map<string,{x:number;y:number;w:number;h:number}>(),bands=new Map<number,{x:number;width:number;lanes:number;rows:number}>();let bandX=35,maxRows=0;
 for(const [layer,column] of [...columns].sort(([a],[b])=>a-b)){
  const lanes=Math.max(1,Math.ceil(column.length/laneRows)),rows=Math.min(laneRows,column.length),width=lanes*laneWidth+10;
  bands.set(layer,{x:bandX,width,lanes,rows});maxRows=Math.max(maxRows,rows);
  column.forEach((node,index)=>positions.set(node.id,{x:bandX+16+Math.floor(index/laneRows)*laneWidth,y:95+(index%laneRows)*68,w:188,h:44}));
  bandX+=width+55;
 }
 return {nodes,edges,allNodes:ranked,allEdges,positions,columns,bands,width:Math.max(700,bandX+25),height:Math.max(400,maxRows*68+140),cycle_groups:components.filter(group=>group.length>1||edges.some(edge=>edge.from===group[0]&&edge.to===group[0])).length,folded_layers:Math.max(0,...layers)>7};
}
