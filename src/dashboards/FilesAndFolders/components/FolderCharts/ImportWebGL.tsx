import { useEffect, useMemo, useRef, useState } from 'react';
import type { FolderNode, ImportReference } from '../DiscoveryExplorer/DiscoveryExplorer.types';
import { ChartTooltip } from './ChartTooltip';
import { graphData, paletteIndex } from './draw';
import { pathKey } from '../DiscoveryExplorer/js/discovery-model';

const vertex=`attribute vec3 aPosition;attribute vec3 aColor;attribute float aSize;uniform vec2 uAngle;uniform float uAspect;uniform float uZoom;uniform float uDpr;varying vec3 vColor;
void main(){float a=uAngle.x,b=uAngle.y;vec3 p=vec3(aPosition.x*cos(a)+aPosition.z*sin(a),aPosition.y,-aPosition.x*sin(a)+aPosition.z*cos(a));p=vec3(p.x,p.y*cos(b)-p.z*sin(b),p.y*sin(b)+p.z*cos(b));float d=3.6-p.z;gl_Position=vec4(p.x*uZoom/uAspect,p.y*uZoom,1.222222*d-2.222222,d);gl_PointSize=aSize*uDpr;vColor=aColor;}`;
const fragment=`precision mediump float;varying vec3 vColor;uniform bool uPoints;void main(){float alpha=0.32;if(uPoints){float d=length(gl_PointCoord-vec2(0.5));if(d>0.5)discard;alpha=smoothstep(0.5,0.15,d);}gl_FragColor=vec4(vColor,alpha);}`;

/** Native WebGL projected files and resolved module edges; no invented network links. */
export const ImportWebGL=({folder,references}:{folder:FolderNode;references:ImportReference[]})=>{
 const graph=useMemo(()=>graphData(folder,references),[folder,references]),canvas=useRef<HTMLCanvasElement>(null),[error,setError]=useState(''),[selected,setSelected]=useState<number|null>(null),select=useRef(setSelected);
 const pointer=useRef<{x:number;y:number}|null>(null),[hover,setHover]=useState<number|null>(null);
 const control=useRef<{draw:()=>void;select:(index:number|null)=>void}|null>(null),pinned=useRef<number|null>(null);select.current=setSelected;
 useEffect(()=>{control.current?.select(selected);},[selected]);
 useEffect(()=>{
  const element=canvas.current;if(!element)return;setError('');setSelected(null);pinned.current=null;
  const gl=element.getContext('webgl',{alpha:true,antialias:true});if(!gl){setError('WebGL is unavailable. The connection table below contains the same graph data.');return;}
  const shader=(type:number,source:string)=>{const value=gl.createShader(type)!;gl.shaderSource(value,source);gl.compileShader(value);if(!gl.getShaderParameter(value,gl.COMPILE_STATUS)){const error=gl.getShaderInfoLog(value);gl.deleteShader(value);throw Error(error??'Shader compilation failed.');}return value;};
  let program:WebGLProgram;const shaders:WebGLShader[]=[];
  try{shaders.push(shader(gl.VERTEX_SHADER,vertex),shader(gl.FRAGMENT_SHADER,fragment));program=gl.createProgram()!;shaders.forEach(value=>gl.attachShader(program,value));gl.linkProgram(program);if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw Error('WebGL linking failed.');}
  catch(error){shaders.forEach(value=>gl.deleteShader(value));setError(error instanceof Error?error.message:String(error));return;}
  const position=gl.getAttribLocation(program,'aPosition'),color=gl.getAttribLocation(program,'aColor'),size=gl.getAttribLocation(program,'aSize');
  const buffers=[gl.createBuffer()!,gl.createBuffer()!,gl.createBuffer()!];let angle=[.4,-.2],zoom=2.7,chosen:number|null=null,frame=0,drag:{x:number;y:number;startX:number;startY:number;moved:boolean;id:number}|null=null;
  const points=graph.nodes.map((node,index)=>{
    // Hierarchical branches form repeated local clusters in 3D; each real file is one node.
    const rel=node.path.slice(folder.path.length).replace(/^[/\\]/,''),branch=rel.split('/')[0],hash=[...branch].reduce((h,c)=>(h*31+c.charCodeAt(0))>>>0,0),base=(hash%360)/180*Math.PI;
    const t=index*2.399963,local=.18+Math.sqrt(index/Math.max(1,graph.nodes.length))*.4;
    return [Math.cos(base)*.5+Math.cos(t)*local,Math.sin(t*.73)*local,Math.sin(base)*.5+Math.sin(t)*local];
  });
  const byPath=new Map(graph.nodes.map((node,index)=>[pathKey(node.path),index]));
  const edgeIndices=graph.edges.flatMap(edge=>{const a=byPath.get(edge.from),b=byPath.get(edge.to);return a===undefined||b===undefined?[]:[a,b];});
  const resolveColor=(value:string)=>{const tiny=document.createElement('canvas');tiny.width=tiny.height=1;const ctx=tiny.getContext('2d')!;ctx.fillStyle=value;ctx.fillRect(0,0,1,1);return [...ctx.getImageData(0,0,1,1).data].slice(0,3).map(n=>n/255);};
  const draw=()=>{frame=0;const bounds=element.getBoundingClientRect();if(!bounds.width||!bounds.height||gl.isContextLost())return;const dpr=Math.min(devicePixelRatio||1,3);element.width=Math.round(bounds.width*dpr);element.height=Math.round(bounds.height*dpr);gl.viewport(0,0,element.width,element.height);gl.clearColor(0,0,0,0);gl.clear(gl.COLOR_BUFFER_BIT);gl.useProgram(program);gl.enable(gl.BLEND);gl.blendFunc(gl.SRC_ALPHA,gl.ONE_MINUS_SRC_ALPHA);
    gl.uniform2fv(gl.getUniformLocation(program,'uAngle'),angle);gl.uniform1f(gl.getUniformLocation(program,'uAspect'),bounds.width/bounds.height);gl.uniform1f(gl.getUniformLocation(program,'uZoom'),zoom);gl.uniform1f(gl.getUniformLocation(program,'uDpr'),dpr);
    const style=getComputedStyle(element),palette=['--color-primary','--color-primary-alt','--status-success','--status-warning','--status-error','--color-muted','--color-tertiary-neg'].map(name=>resolveColor(style.getPropertyValue(name).trim()));
    const upload=(values:number[],buffer:WebGLBuffer,attribute:number,dimensions:number)=>{gl.bindBuffer(gl.ARRAY_BUFFER,buffer);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(values),gl.STATIC_DRAW);gl.enableVertexAttribArray(attribute);gl.vertexAttribPointer(attribute,dimensions,gl.FLOAT,false,0,0);};
    upload(edgeIndices.flatMap(index=>points[index]),buffers[0],position,3);upload(edgeIndices.flatMap(()=>palette[0]),buffers[1],color,3);upload(edgeIndices.map(()=>1),buffers[2],size,1);gl.uniform1i(gl.getUniformLocation(program,'uPoints'),0);gl.drawArrays(gl.LINES,0,edgeIndices.length);
    upload(points.flat(),buffers[0],position,3);upload(graph.nodes.flatMap(node=>palette[paletteIndex(node.path.split('.').at(-1)??'')]),buffers[1],color,3);upload(graph.nodes.map((node,index)=>Math.min(20,6+Math.sqrt(node.incoming+node.outgoing)*2)+(index===chosen?9:0)),buffers[2],size,1);gl.uniform1i(gl.getUniformLocation(program,'uPoints'),1);gl.drawArrays(gl.POINTS,0,points.length);
  };
  const schedule=()=>{if(!frame)frame=requestAnimationFrame(draw);};
  const pick=(x:number,y:number)=>{const box=element.getBoundingClientRect(),aspect=box.width/box.height;let found:number|null=null,best=16;points.forEach((point,index)=>{const a=angle[0],b=angle[1],rx=point[0]*Math.cos(a)+point[2]*Math.sin(a),rz=-point[0]*Math.sin(a)+point[2]*Math.cos(a),ry=point[1]*Math.cos(b)-rz*Math.sin(b),z=point[1]*Math.sin(b)+rz*Math.cos(b),d=3.6-z,px=(rx*zoom/aspect/d+1)*box.width/2,py=(1-ry*zoom/d)*box.height/2,dist=Math.hypot(px-x,py-y);if(dist<best){best=dist;found=index;}});return found;};
  const down=(event:PointerEvent)=>{if(event.button!==0)return;drag={x:event.clientX,y:event.clientY,startX:event.clientX,startY:event.clientY,moved:false,id:event.pointerId};element.setPointerCapture(event.pointerId);};
  const move=(event:PointerEvent)=>{pointer.current={x:event.clientX,y:event.clientY};const box=element.getBoundingClientRect();setHover(drag?null:pick(event.clientX-box.left,event.clientY-box.top));if(drag){drag.moved ||= Math.hypot(event.clientX-drag.startX,event.clientY-drag.startY)>4;angle=[angle[0]+(event.clientX-drag.x)*.008,Math.max(-1.4,Math.min(1.4,angle[1]+(event.clientY-drag.y)*.008))];drag.x=event.clientX;drag.y=event.clientY;schedule();}else if(pinned.current===null){const rect=element.getBoundingClientRect();select.current(pick(event.clientX-rect.left,event.clientY-rect.top));}};
  const up=(event:PointerEvent)=>{if(drag&&!drag.moved&&event.type==='pointerup'){const rect=element.getBoundingClientRect();pinned.current=pick(event.clientX-rect.left,event.clientY-rect.top);select.current(pinned.current);}drag=null;};const leave=()=>{setHover(null);if(!drag)select.current(pinned.current);};
  const wheel=(event:WheelEvent)=>{event.preventDefault();zoom=Math.max(1,Math.min(6,zoom*Math.exp(-event.deltaY*.001)));schedule();};
  const key=(event:KeyboardEvent)=>{if(['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','+','-','Home','Escape'].includes(event.key)){event.preventDefault();if(event.key==='Escape'){pinned.current=null;select.current(null);}else if(event.key==='Home'){angle=[.4,-.2];zoom=2.7;}else if(event.key==='+'||event.key==='-')zoom=Math.max(1,Math.min(6,zoom+(event.key==='+'?.2:-.2)));else if(event.key==='ArrowLeft'||event.key==='ArrowRight')angle[0]+=event.key==='ArrowLeft'?-.1:.1;else angle[1]+=event.key==='ArrowUp'?-.1:.1;schedule();}};
  const lost=(event:Event)=>{event.preventDefault();setError('WebGL context was lost. Use the graph table below, or reopen this view.');};
  control.current={draw:schedule,select:index=>{chosen=index;schedule();}};
  const resize=new ResizeObserver(schedule);resize.observe(element);const theme=new MutationObserver(schedule);for(let parent:Element|null=element;parent;parent=parent.parentElement)theme.observe(parent,{attributes:true,attributeFilter:['data-theme','style','class']});
  element.addEventListener('pointerdown',down);element.addEventListener('pointermove',move);element.addEventListener('pointerup',up);element.addEventListener('pointercancel',up);element.addEventListener('lostpointercapture',up);element.addEventListener('pointerleave',leave);element.addEventListener('wheel',wheel,{passive:false});element.addEventListener('keydown',key);element.addEventListener('webglcontextlost',lost);window.addEventListener('resize',schedule);schedule();
  return()=>{resize.disconnect();theme.disconnect();cancelAnimationFrame(frame);control.current=null;for(const buffer of buffers)gl.deleteBuffer(buffer);gl.deleteProgram(program);shaders.forEach(value=>gl.deleteShader(value));element.removeEventListener('pointerdown',down);element.removeEventListener('pointermove',move);element.removeEventListener('pointerup',up);element.removeEventListener('pointercancel',up);element.removeEventListener('lostpointercapture',up);element.removeEventListener('pointerleave',leave);element.removeEventListener('wheel',wheel);element.removeEventListener('keydown',key);element.removeEventListener('webglcontextlost',lost);window.removeEventListener('resize',schedule);};
 },[graph,folder.path]);
 const node=selected===null?null:graph.nodes[selected],hovered=hover===null?null:graph.nodes[hover];
 return <div className="folder-webgl"><canvas ref={canvas} tabIndex={0} role="img" aria-label={`3D import graph: ${graph.nodes.length} visible file nodes and ${graph.edges.length} module references. Drag or use arrow keys to rotate, plus and minus to zoom, Home to reset. The table below provides file details.`} />
   <ChartTooltip targetRef={canvas} positionRef={pointer} title={hovered?.path.split('/').at(-1)} disabled={!hovered} rows={[{label:'Path',value:hovered?.path},{label:'Incoming',value:hovered?.incoming},{label:'Outgoing',value:hovered?.outgoing}]}/>
   {!graph.nodes.length&&<p>No resolved module connections inside this folder. Select a larger folder to inspect cross-folder links.</p>}
   {error&&<p role="status">{error}</p>}<p className="folder-charts__hint">Drag to orbit · scroll / + − to zoom · Home to reset · click a node to pin · Escape to clear. Every edge is a resolved module reference.</p>
   <p className="folder-webgl__selection" aria-live="polite">{node?`${node.path} · ${node.incoming} incoming · ${node.outgoing} outgoing`:'Hover a node or select a file below to inspect connections.'}</p>
   <details><summary>Graph data · {graph.nodes.length}/{graph.total_nodes} files · {graph.edges.length}/{graph.total_edges} references</summary><table><thead><tr><th>File</th><th>In</th><th>Out</th></tr></thead><tbody>{graph.nodes.map((item,index)=><tr key={item.path}><td><button type="button" className="action-main" aria-pressed={selected===index} onClick={()=>{pinned.current=index;setSelected(index);}}>{item.path}</button></td><td>{item.incoming}</td><td>{item.outgoing}</td></tr>)}</tbody></table></details>
 </div>;
};
