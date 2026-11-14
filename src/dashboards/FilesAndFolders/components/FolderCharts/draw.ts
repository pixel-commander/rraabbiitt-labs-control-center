import type { CanvasDraw } from './hooks/useThemedCanvas';
import type { FileTypeCount, FolderNode, ImportReference } from '../DiscoveryExplorer/DiscoveryExplorer.types';
import { cleanPath, isWithin, pathKey } from '../DiscoveryExplorer/js/discovery-model';

export const paletteIndex=(name:string)=>[...name].reduce((hash,char)=>(hash*31+char.charCodeAt(0))>>>0,0)%7;
export const short=(text:string,max=20)=>text.length>max?text.slice(0,max-1)+'…':text;
const text=(c:CanvasRenderingContext2D,value:string,x:number,y:number,color:string,size=12,align:CanvasTextAlign='left')=>{c.fillStyle=color;c.font=`${size}px ui-monospace, monospace`;c.textAlign=align;c.fillText(value,x,y);};

/** Projected translucent glass wedges with separately lit outer/inner walls and polished rims. */
export function drawDonut({context:c,width,height,palette:p}:CanvasDraw,types:FileTypeCount[],compact=false,activeType?:string){
 const total=types.reduce((sum,row)=>sum+row.count,0),cx=width/2,cy=height*.40,r=Math.min(width*.41,height*.43),ry=r*.62,inner=r*.57,depth=compact?4:Math.max(13,r*.22);
 const point=(angle:number,radius:number,y=cy)=>({x:cx+Math.cos(angle)*radius,y:y+Math.sin(angle)*radius*.62});
 const face=(start:number,end:number)=>{c.beginPath();c.ellipse(cx,cy,r,ry,0,start,end);c.ellipse(cx,cy,inner,inner*.62,0,end,start,true);c.closePath();};
 const rim=(radius:number,y:number,alpha:number,weight:number)=>{c.beginPath();c.ellipse(cx,y,radius,radius*.62,0,0,Math.PI*2);c.strokeStyle=p.foreground;c.globalAlpha=alpha;c.lineWidth=weight;c.stroke();c.globalAlpha=1;};
 if(!total){c.strokeStyle=p.border;c.lineWidth=compact?3:10;c.beginPath();c.ellipse(cx,cy,r*.8,ry*.8,0,0,Math.PI*2);c.stroke();if(!compact)text(c,'No indexed files',cx,height*.8,p.muted,12,'center');return;}
 c.save();c.shadowColor=p.colors[0];c.shadowBlur=compact?5:24;c.globalAlpha=.13;c.fillStyle=p.colors[0];c.beginPath();c.ellipse(cx,cy+depth+5,r*.92,ry*.82,0,0,Math.PI*2);c.fill();c.restore();
 const wedges:{start:number;end:number;color:string;row:FileTypeCount}[]=[];let angle=-Math.PI/2;
 for(const row of types){const end=angle+row.count/total*Math.PI*2,gap=Math.min(compact?.008:.012,(end-angle)*.1);wedges.push({start:angle+gap,end:end-gap,color:p.colors[paletteIndex(row.type)],row});angle=end;}
 // Glass walls: the near exterior and far interior expose depth around the hole.
 for(const wedge of wedges){
  const dim=activeType&&activeType!==wedge.row.type?.55:1;
  for(const radius of [r,inner]){
   const steps=Math.max(2,Math.ceil((wedge.end-wedge.start)*28));
   for(let i=0;i<steps;i++){
    const a=wedge.start+(wedge.end-wedge.start)*i/steps,b=wedge.start+(wedge.end-wedge.start)*(i+1)/steps,near=Math.sin((a+b)/2)>=0;
    if(radius===r&&!near||radius===inner&&near)continue;
    const topA=point(a,radius),topB=point(b,radius),bottomA=point(a,radius,cy+depth),bottomB=point(b,radius,cy+depth);
    const shade=c.createLinearGradient(0,cy,0,cy+depth+ry);shade.addColorStop(0,wedge.color);shade.addColorStop(.65,wedge.color);shade.addColorStop(1,p.background);
    c.beginPath();c.moveTo(topA.x,topA.y);c.lineTo(topB.x,topB.y);c.lineTo(bottomB.x,bottomB.y);c.lineTo(bottomA.x,bottomA.y);c.closePath();c.fillStyle=shade;c.globalAlpha=(radius===r?.5:.24)*dim;c.fill();c.globalAlpha=1;
   }
  }
  // The cut ends have a faint colored glass thickness rather than opaque black seams.
  for(const a of [wedge.start,wedge.end]){const outer=point(a,r),inside=point(a,inner);c.beginPath();c.moveTo(outer.x,outer.y);c.lineTo(inside.x,inside.y);c.lineTo(inside.x,inside.y+depth);c.lineTo(outer.x,outer.y+depth);c.closePath();c.fillStyle=wedge.color;c.globalAlpha=.18*dim;c.fill();c.globalAlpha=1;}
 }
 rim(r,cy+depth,.18,compact?.5:1);rim(inner,cy+depth,.12,compact?.4:.7);
 for(const wedge of wedges){
  const selected=activeType===wedge.row.type,dim=activeType&&!selected?.46:1;
  face(wedge.start,wedge.end);c.fillStyle=wedge.color;c.globalAlpha=(selected?.72:.46)*dim;c.fill();c.globalAlpha=1;
  const surface=c.createLinearGradient(cx-r,cy-ry,cx+r,cy+ry);surface.addColorStop(0,p.foreground);surface.addColorStop(.4,'transparent');surface.addColorStop(1,p.foreground);face(wedge.start,wedge.end);c.fillStyle=surface;c.globalAlpha=(selected?.35:.19)*dim;c.fill();c.globalAlpha=1;
  face(wedge.start,wedge.end);c.strokeStyle=p.foreground;c.globalAlpha=(selected?.85:.3)*dim;c.lineWidth=compact?.5:.75;c.stroke();c.globalAlpha=1;
 }
 // Soft reflected light across the entire glass surface, clipped away from the center.
 c.save();c.beginPath();c.ellipse(cx,cy,r,ry,0,0,Math.PI*2);c.ellipse(cx,cy,inner,inner*.62,0,0,Math.PI*2,true);c.clip('evenodd');
 const reflection=c.createLinearGradient(cx-r,cy-ry,cx+r*.5,cy+ry);reflection.addColorStop(0,'transparent');reflection.addColorStop(.36,'transparent');reflection.addColorStop(.46,p.foreground);reflection.addColorStop(.56,'transparent');reflection.addColorStop(.75,'transparent');reflection.addColorStop(.82,p.foreground);reflection.addColorStop(1,'transparent');c.fillStyle=reflection;c.globalAlpha=compact?.16:.21;c.fillRect(cx-r,cy-ry,r*2,ry*2);c.restore();
 rim(r,cy,.42,compact?.65:1.25);rim(inner,cy,.48,compact?.5:1);
 c.save();c.beginPath();c.ellipse(cx,cy,r*.99,ry*.99,0,Math.PI*1.05,Math.PI*1.78);c.strokeStyle=p.foreground;c.globalAlpha=.8;c.lineWidth=compact?.8:1.7;c.shadowColor=p.colors[1];c.shadowBlur=compact?2:6;c.stroke();c.restore();
 if(!compact){text(c,total.toLocaleString(),cx,cy+3,p.foreground,26,'center');text(c,'FILES',cx,cy+22,p.muted,10,'center');}
}

export function drawGauge({context:c,width,height,palette:p}:CanvasDraw,files:number,total:number){
 const ratio=total?Math.min(1,files/total):0,cx=width/2,cy=height*.66,r=Math.min(width*.4,height*.55),stroke=Math.max(10,r*.14);
 c.lineWidth=stroke;c.lineCap='round';c.strokeStyle=p.border;c.beginPath();c.arc(cx,cy,r,Math.PI,Math.PI*2);c.stroke();
 if(ratio){c.strokeStyle=p.colors[0];c.shadowColor=p.colors[0];c.shadowBlur=10;c.beginPath();c.arc(cx,cy,r,Math.PI,Math.PI+ratio*Math.PI);c.stroke();c.shadowBlur=0;}
 const angle=Math.PI+ratio*Math.PI,x=cx+Math.cos(angle)*r*.79,y=cy+Math.sin(angle)*r*.79;
 c.lineWidth=2;c.strokeStyle=p.foreground;c.beginPath();c.moveTo(cx,cy);c.lineTo(x,y);c.stroke();c.fillStyle=p.foreground;c.beginPath();c.arc(cx,cy,4,0,Math.PI*2);c.fill();
 text(c,`${(ratio*100).toFixed(1)}%`,cx,cy-15,p.foreground,24,'center');text(c,'OF ROOT FILES',cx,cy+27,p.muted,10,'center');
}

export function graphData(folder:FolderNode,references:ImportReference[]){
 const relevant=references.filter(ref=>isWithin(folder.path,ref.path+'/'+ref.file)),counts=new Map<string,{path:string;incoming:number;outgoing:number}>(),edges:{from:string;to:string}[]=[];
 const add=(path:string)=>{const key=pathKey(path);if(!counts.has(key))counts.set(key,{path:cleanPath(path),incoming:0,outgoing:0});return counts.get(key)!;};
 for(const ref of relevant){const from=ref.path+'/'+ref.file;if(!ref.target||!isWithin(folder.path,ref.target))continue;const a=add(from),b=add(ref.target);a.outgoing++;b.incoming++;edges.push({from:pathKey(from),to:pathKey(ref.target)});}
 const nodes=[...counts.values()].sort((a,b)=>(b.incoming+b.outgoing)-(a.incoming+a.outgoing)||a.path.localeCompare(b.path)).slice(0,120),visible=new Set(nodes.map(row=>pathKey(row.path)));
 return {nodes,edges:edges.filter(edge=>visible.has(edge.from)&&visible.has(edge.to)),total_nodes:counts.size,total_edges:edges.length};
}
