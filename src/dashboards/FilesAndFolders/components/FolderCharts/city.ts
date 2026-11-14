import type {FolderNode} from '../DiscoveryExplorer/DiscoveryExplorer.types';
import type {CanvasDraw} from './hooks/useThemedCanvas';
export interface CityBlock {path:string;name:string;type:string;count:number;x:number;y:number;w:number;h:number;depth:number;platform:boolean}
export interface CityHit {block:CityBlock;polygon:[number,number][]}
const hash=(name:string)=>[...name].reduce((h,c)=>(h*31+c.charCodeAt(0))>>>0,0)%7;

/** Hierarchical area partition. Every child district stays on its own parent platform. */
export function cityLayout(root:FolderNode,maxDepth=3):CityBlock[]{
 const blocks:CityBlock[]=[];
 const visit=(folder:FolderNode,x:number,y:number,w:number,h:number,depth:number)=>{
  blocks.push({path:folder.path,name:folder.name,type:folder.types[0]?.type??'folder',count:folder.file_count,x,y,w,h,depth,platform:true});
  const items:{folder?:FolderNode;name:string;type:string;count:number;path:string}[]=folder.children.map(child=>({folder:child,name:child.name,type:child.types[0]?.type??'folder',count:child.file_count,path:child.path}));
  const direct=new Map<string,number>();for(const file of folder.files)direct.set(file.type||'(none)',(direct.get(file.type||'(none)')??0)+1);
  for(const [type,count] of direct)items.push({name:`${type} files`,type,count,path:folder.path});
  items.sort((a,b)=>b.count-a.count||a.name.localeCompare(b.name));
  if(items.length>24){const rest=items.splice(23);items.push({name:`${rest.length} smaller groups`,type:'other',count:rest.reduce((sum,item)=>sum+item.count,0),path:folder.path});}
  if(!items.length)return;
  const gap=Math.min(w,h)*.035,inner={x:x+gap,y:y+gap,w:w-gap*2,h:h-gap*2};
  const partition=(list:typeof items,rect:typeof inner)=>{
   if(list.length===1){const item=list[0],pad=Math.min(rect.w,rect.h)*.055,r={x:rect.x+pad,y:rect.y+pad,w:rect.w-pad*2,h:rect.h-pad*2};
    if(item.folder&&depth<maxDepth&&blocks.length<2000)visit(item.folder,r.x,r.y,r.w,r.h,depth+1);
    else blocks.push({...r,path:item.path,name:item.name,type:item.type,count:item.count,depth:depth+1,platform:false});
    return;
   }
   const weights=list.map(item=>Math.sqrt(Math.max(1,item.count))),total=weights.reduce((a,b)=>a+b,0);let sum=0,split=1;
   for(let i=0;i<list.length-1;i++){sum+=weights[i];split=i+1;if(sum>=total/2)break;}
   const ratio=sum/total,vertical=rect.w>=rect.h;
   const first=vertical?{...rect,w:rect.w*ratio}:{...rect,h:rect.h*ratio};
   const second=vertical?{...rect,x:rect.x+first.w,w:rect.w-first.w}:{...rect,y:rect.y+first.h,h:rect.h-first.h};
   partition(list.slice(0,split),first);partition(list.slice(split),second);
  };partition(items,inner);
 };visit(root,0,0,1,1,0);return blocks;
}
export function drawLayeredCity({context:c,width,height,palette:p}:CanvasDraw,blocks:CityBlock[],options:{yaw:number;tilt:number;active?:string;wire:boolean}):CityHit[]{
 const yaw=options.yaw*Math.PI/180,tilt=options.tilt*Math.PI/180,max=Math.max(1,...blocks.filter(b=>!b.platform).map(b=>b.count));
 const top=(b:CityBlock)=>b.depth*.035+(b.platform?.022:.025+Math.sqrt(b.count/max)*.34),base=(b:CityBlock)=>b.depth*.035;
 const world=(x:number,y:number,z:number):[number,number]=>{const a=(x-.5)*Math.cos(yaw)-(y-.5)*Math.sin(yaw),b=(x-.5)*Math.sin(yaw)+(y-.5)*Math.cos(yaw);return [a,b*Math.sin(tilt)-z*Math.cos(tilt)];};
 const raw=blocks.flatMap(b=>[world(b.x,b.y,top(b)),world(b.x+b.w,b.y,top(b)),world(b.x+b.w,b.y+b.h,top(b)),world(b.x,b.y+b.h,top(b)),world(b.x,b.y,base(b))]);
 const minX=Math.min(...raw.map(v=>v[0])),maxX=Math.max(...raw.map(v=>v[0])),minY=Math.min(...raw.map(v=>v[1])),maxY=Math.max(...raw.map(v=>v[1]));
 const scale=Math.min((width-70)/(maxX-minX),(height-90)/(maxY-minY)),ox=(width-(maxX-minX)*scale)/2-minX*scale,oy=(height-(maxY-minY)*scale)/2-minY*scale;
 const project=(x:number,y:number,z:number):[number,number]=>{const [a,b]=world(x,y,z);return [ox+a*scale,oy+b*scale];};
 const polygon=(points:[number,number][],color:string,shade=0,stroke=false)=>{c.beginPath();points.forEach((q,i)=>i?c.lineTo(...q):c.moveTo(...q));c.closePath();c.fillStyle=color;c.fill();if(shade){c.globalAlpha=shade;c.fillStyle=p.background;c.fill();c.globalAlpha=1;}if(stroke){c.strokeStyle=p.border;c.lineWidth=.6;c.stroke();}};
 // Ground lattice and service streets give the nested platforms a stable reference plane.
 c.strokeStyle=p.border;c.globalAlpha=.25;c.lineWidth=.5;for(let i=0;i<=20;i++){const v=i/20;c.beginPath();c.moveTo(...project(v,0,0));c.lineTo(...project(v,1,0));c.moveTo(...project(0,v,0));c.lineTo(...project(1,v,0));c.stroke();}c.globalAlpha=1;
 const hits:CityHit[]=[];
 const drawBlock=(b:CityBlock)=>{
  const z=top(b),bottom=base(b),color=p.colors[hash(b.type)],points=[project(b.x,b.y,z),project(b.x+b.w,b.y,z),project(b.x+b.w,b.y+b.h,z),project(b.x,b.y+b.h,z)];
  const corners=[[b.x,b.y],[b.x+b.w,b.y],[b.x+b.w,b.y+b.h],[b.x,b.y+b.h]];
  // Back-to-front faces, sorted by projected depth, handle every orbit orientation.
  const faces=corners.map((q,i)=>{const next=corners[(i+1)%4];return {points:[project(q[0],q[1],bottom),project(next[0],next[1],bottom),points[(i+1)%4],points[i]],depth:(world(q[0],q[1],0)[1]+world(next[0],next[1],0)[1])/2,index:i};}).sort((a,b)=>a.depth-b.depth);
  for(const face of faces)polygon(face.points,b.platform?p.border:color,b.platform?.5:.4+face.index*.08,options.wire);
  polygon(points,b.platform?p.colors[hash(b.path)]:color,b.platform?.79:.08,true);
  if(b.platform){c.strokeStyle=color;c.globalAlpha=.3;c.lineWidth=1;c.beginPath();points.forEach((q,i)=>i?c.lineTo(...q):c.moveTo(...q));c.closePath();c.stroke();c.globalAlpha=1;}
  if(options.active===b.path){c.strokeStyle=p.foreground;c.lineWidth=1.5;c.beginPath();points.forEach((q,i)=>i?c.lineTo(...q):c.moveTo(...q));c.closePath();c.stroke();}
  const size=Math.min(b.w,b.h)*scale;
  if(b.platform&&size>60){const [x,y]=project(b.x+b.w*.5,b.y+b.h*.5,z);c.fillStyle=p.muted;c.font=`${b.depth===0?11:9}px ui-monospace,monospace`;c.textAlign='center';c.fillText(b.name.length>20?b.name.slice(0,19)+'…':b.name,x,y,Math.max(20,b.w*scale*.8));}
  if(!b.platform&&size>28){const [x,y]=project(b.x+b.w/2,b.y+b.h/2,z);c.fillStyle=p.foreground;c.font='9px ui-monospace,monospace';c.textAlign='center';c.fillText(b.count.toLocaleString(),x,y+3);}
  // Terrace roof outlines repeat at each hierarchy depth; towers expose their actual count floors.
  if(!b.platform&&size>16&&b.count>3){const levels=Math.min(10,Math.ceil(Math.sqrt(b.count)));c.strokeStyle=p.foreground;c.globalAlpha=.13;c.lineWidth=.6;for(let i=1;i<levels;i++){const level=bottom+(z-bottom)*i/levels;const a=project(b.x+b.w,b.y+b.h,level),back=project(b.x,b.y+b.h,level),side=project(b.x+b.w,b.y,level);c.beginPath();c.moveTo(...back);c.lineTo(...a);c.lineTo(...side);c.stroke();}c.globalAlpha=1;}
  hits.push({block:b,polygon:points});
 };
 const platforms=blocks.filter(b=>b.platform).sort((a,b)=>a.depth-b.depth||world(a.x+a.w/2,a.y+a.h/2,0)[1]-world(b.x+b.w/2,b.y+b.h/2,0)[1]);
 platforms.forEach(drawBlock);
 blocks.filter(b=>!b.platform).sort((a,b)=>world(a.x+a.w/2,a.y+a.h/2,0)[1]-world(b.x+b.w/2,b.y+b.h/2,0)[1]).forEach(drawBlock);
 c.fillStyle=p.muted;c.font='10px ui-monospace,monospace';c.textAlign='left';c.fillText('DISTRICT AREA / HEIGHT · √ FILE COUNT   /   TERRACE · FOLDER DEPTH',16,height-18);
 return hits;
}
export function cityPick(hits:CityHit[],x:number,y:number):CityBlock|undefined{
 return [...hits].reverse().find(hit=>{let inside=false;const p=hit.polygon;for(let i=0,j=p.length-1;i<p.length;j=i++){if((p[i][1]>y)!==(p[j][1]>y)&&x<(p[j][0]-p[i][0])*(y-p[i][1])/(p[j][1]-p[i][1])+p[i][0])inside=!inside;}return inside;})?.block;
}
