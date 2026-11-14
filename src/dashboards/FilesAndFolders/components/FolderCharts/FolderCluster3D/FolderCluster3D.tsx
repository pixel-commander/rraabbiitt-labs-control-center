import { useEffect, useMemo, useRef, useState } from 'react';
import type { ForceGraph3DInstance, NodeObject, LinkObject } from '3d-force-graph';
import type { Group } from 'three';
import type { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import type { FolderCluster3DProps } from './FolderCluster3D.types';
import type { FolderNode } from '../../DiscoveryExplorer/DiscoveryExplorer.types';
import { clusterModel, expandedToDepth } from './js/cluster-model';
import { pathKey } from '../../DiscoveryExplorer/js/discovery-model';
import { paletteIndex } from '../draw';
import { ChartTooltip } from '../ChartTooltip';
import './css/folder-force3d.css';

type GraphNode=NodeObject&{id:string;folder:FolderNode;depth:number;group:string;radius:number;parent?:string};
type GraphLink=LinkObject<GraphNode>&{from:string;to:string};
type Instance=ForceGraph3DInstance<GraphNode,GraphLink>;
const sphereSize=(node:GraphNode)=>Math.min(20,3.2+Math.log2(node.folder.file_count+1)*1.15);

/** The chosen upstream 3d-force-graph renderer, fed only the real discovery hierarchy. */
export const FolderCluster3D=({folder,onSelectFolder}:FolderCluster3DProps)=>{
 const [expanded,setExpanded]=useState(()=>expandedToDepth(folder,Infinity)),[selected,setSelected]=useState(pathKey(folder.path)),[hover,setHover]=useState<string|undefined>(),[orbit,setOrbit]=useState(true),[signals,setSignals]=useState(true),[bloom,setBloom]=useState(true),[limit,setLimit]=useState(1500),[query,setQuery]=useState(''),[ready,setReady]=useState(0),[loading,setLoading]=useState(true),[error,setError]=useState('');
 const model=useMemo(()=>clusterModel(folder,expanded,limit),[folder,expanded,limit]),host=useRef<HTMLDivElement>(null),graph=useRef<Instance|null>(null),pointer=useRef<{x:number;y:number}|null>(null),cache=useRef(new Map<string,GraphNode>()),objects=useRef(new Map<string,Group>()),initialFit=useRef(true),runtime=useRef<{style:()=>void;motion:()=>void;wake:()=>void;data:()=>void}|null>(null);
 const latest=useRef({model,expanded,selected,hover,orbit,signals,bloom});latest.current={model,expanded,selected,hover,orbit,signals,bloom};
 const actions=useRef({toggle:(_id:string)=>{},fly:(_id:string)=>{}});
 const toggle=(id:string)=>{if(!latest.current.model.all.get(id)?.children.length)return;setExpanded(previous=>{const next=new Set(previous);if(next.has(id))next.delete(id);else next.add(id);return next;});setSelected(id);};
 const fly=(id:string)=>{const node=cache.current.get(id),view=graph.current;if(!node||!view)return;setSelected(id);const x=node.x??0,y=node.y??0,z=node.z??0,current=view.cameraPosition(),distance=Math.max(75,node.radius*105),dx=current.x-x,dy=current.y-y,dz=current.z-z,length=Math.hypot(dx,dy,dz)||1;view.resumeAnimation().cameraPosition({x:x+dx/length*distance,y:y+dy/length*distance,z:z+dz/length*distance},{x,y,z},matchMedia('(prefers-reduced-motion: reduce)').matches?0:850);runtime.current?.wake();};
 actions.current={toggle,fly};
 const overview=()=>{const view=graph.current;if(!view)return;view.resumeAnimation().zoomToFit(matchMedia('(prefers-reduced-motion: reduce)').matches?0:750,28);runtime.current?.wake();};
 useEffect(()=>{setExpanded(expandedToDepth(folder,Infinity));setSelected(pathKey(folder.path));setHover(undefined);setQuery('');},[folder.path]);

 useEffect(()=>{
  const element=host.current;if(!element)return;let cancelled=false,cleanup=()=>{};setLoading(true);setError('');cache.current.clear();objects.current.clear();initialFit.current=true;
  void Promise.all([import('3d-force-graph'),import('three'),import('three/addons/postprocessing/UnrealBloomPass.js'),import('three/addons/postprocessing/OutputPass.js')]).then(([module,THREE,{UnrealBloomPass},{OutputPass}])=>{
   if(cancelled)return;
   // Upstream's constructor fixes its generic defaults; our graphData owns the stronger node/link shape.
   const view=new module.default(element,{controlType:'orbit',rendererConfig:{antialias:true,alpha:true,powerPreference:'high-performance'}}) as unknown as Instance;graph.current=view;
   const geometry=new THREE.SphereGeometry(1,14,10),materials=new Map<string,InstanceType<typeof THREE.MeshStandardMaterial>>(),glows=new Map<string,InstanceType<typeof THREE.SpriteMaterial>>();
   const mask=document.createElement('canvas');mask.width=mask.height=64;const context=mask.getContext('2d')!,gradient=context.createRadialGradient(32,32,0,32,32,32);gradient.addColorStop(0,'rgba(255,255,255,.55)');gradient.addColorStop(.3,'rgba(255,255,255,.12)');gradient.addColorStop(1,'rgba(255,255,255,0)');context.fillStyle=gradient;context.fillRect(0,0,64,64);const texture=new THREE.CanvasTexture(mask);
   const readTheme=()=>{const style=getComputedStyle(element),token=(key:string)=>style.getPropertyValue(key).trim();return{background:token('--color-main'),foreground:token('--color-main-neg'),muted:token('--color-muted'),colors:['--color-primary','--color-primary-alt','--status-success','--status-warning','--status-error'].map(token)};};
   let palette=readTheme(),inView=true,idle:ReturnType<typeof setTimeout>|undefined,forceActive=true;
   const motion=matchMedia('(prefers-reduced-motion: reduce)'),visible=()=>inView&&!document.hidden;
   const color=(group:string)=>palette.colors[paletteIndex(group)%palette.colors.length];
   const focus=()=>latest.current.hover??latest.current.selected;
   const active=(link:GraphLink)=>link.from===focus()||link.to===focus();
   const pass=new UnrealBloomPass(new THREE.Vector2(element.clientWidth,element.clientHeight),1.05,.7,.32);
   const output=new OutputPass();view.postProcessingComposer().addPass(pass);view.postProcessingComposer().addPass(output);view.renderer().toneMapping=THREE.ACESFilmicToneMapping;view.renderer().toneMappingExposure=1.05;
   view.width(Math.max(1,element.clientWidth)).height(Math.max(1,element.clientHeight)).showNavInfo(false).nodeLabel(()=> '').linkLabel(()=> '').enableNodeDrag(false).nodeOpacity(1)
    .nodeVal(node=>1+Math.log2(node.folder.file_count+1)).nodeResolution(14).nodeThreeObject(node=>{
      let object=objects.current.get(node.id);if(object)return object;
      let material=materials.get(node.group),glow=glows.get(node.group);
      if(!material){material=new THREE.MeshStandardMaterial({color:new THREE.Color(color(node.group)).multiplyScalar(.18),emissive:color(node.group),emissiveIntensity:1.15,metalness:.45,roughness:.3});materials.set(node.group,material);}
      if(!glow){glow=new THREE.SpriteMaterial({map:texture,color:color(node.group),transparent:true,opacity:.25,blending:THREE.AdditiveBlending,depthWrite:false});glows.set(node.group,glow);}
      object=new THREE.Group();object.add(new THREE.Mesh(geometry,material));const sprite=new THREE.Sprite(glow);sprite.scale.setScalar(5);object.add(sprite);object.scale.setScalar(sphereSize(node));objects.current.set(node.id,object);return object;
    }).linkColor(link=>active(link)?palette.colors[0]:color(cache.current.get(link.to)?.group??'')).linkOpacity(.58).linkWidth(link=>active(link)?1.8:.85).linkCurvature(.07).linkDirectionalParticles(1).linkDirectionalParticleSpeed(.003).linkDirectionalParticleWidth(1.25).linkDirectionalParticleColor(()=>palette.colors[1]).linkResolution(4).cooldownTicks(motion.matches?0:200).d3AlphaDecay(.025).d3VelocityDecay(.3)
    .onNodeHover(node=>{setHover(node?.id);element.style.cursor=node?'pointer':'grab';})
    .onNodeClick((node,event)=>{setSelected(node.id);if(event.shiftKey||event.altKey)actions.current.fly(node.id);else actions.current.toggle(node.id);})
    .onBackgroundClick(()=>setHover(undefined))
    .onEngineStop(()=>{forceActive=false;if(initialFit.current){initialFit.current=false;view.zoomToFit(motion.matches?0:800,28);}if(motion.matches||!latest.current.orbit&&!latest.current.signals){clearTimeout(idle);idle=setTimeout(()=>view.pauseAnimation(),motion.matches?50:850);}});
   view.renderer().setPixelRatio(Math.min(devicePixelRatio||1,1.6));
   view.d3Force('charge')?.strength(-38);view.d3Force('link')?.distance((link:GraphLink)=>{const target=typeof link.target==='object'?link.target:cache.current.get(String(link.target));return target?.depth===1?95:45;});
   const controls=view.controls() as OrbitControls;controls.enableDamping=!motion.matches;controls.dampingFactor=.08;controls.autoRotate=latest.current.orbit&&!motion.matches;controls.autoRotateSpeed=.5;
   const wake=()=>{if(!visible())return;clearTimeout(idle);view.resumeAnimation();if(motion.matches||!forceActive&&!latest.current.orbit&&!latest.current.signals)idle=setTimeout(()=>view.pauseAnimation(),motion.matches?140:900);};
   const applyMotion=()=>{controls.autoRotate=latest.current.orbit&&!motion.matches;controls.enableDamping=!motion.matches;view.linkDirectionalParticles(latest.current.signals&&!motion.matches?1:0).cooldownTicks(motion.matches?0:200);pass.enabled=latest.current.bloom&&!motion.matches;if(!visible())view.pauseAnimation();else wake();};
   const applyTheme=()=>{palette=readTheme();view.backgroundColor(palette.background);
    // RenderPass must paint an opaque, explicitly color-managed scene background.
    // A transparent clear through the bloom composer can expose the containing surface.
    const background=new THREE.Color().setStyle(palette.background,THREE.SRGBColorSpace);
    view.scene().background=background;view.scene().backgroundIntensity=1;
    view.renderer().outputColorSpace=THREE.SRGBColorSpace;view.renderer().setClearColor(background,1);
    for(const [group,material] of materials){material.color.set(color(group)).multiplyScalar(.18);material.emissive.set(color(group));}for(const [group,material] of glows)material.color.set(color(group));view.linkColor(view.linkColor()).linkDirectionalParticleColor(()=>palette.colors[1]);pass.enabled=latest.current.bloom&&!motion.matches;wake();};
   runtime.current={style:()=>{for(const [id,object] of objects.current){const node=cache.current.get(id);if(node)object.scale.setScalar(sphereSize(node)*(id===focus()?1.35:1));}view.linkWidth(view.linkWidth()).linkColor(view.linkColor());applyMotion();},motion:applyMotion,wake,data:()=>{forceActive=!motion.matches;}};
   const resize=new ResizeObserver(()=>{view.width(Math.max(1,element.clientWidth)).height(Math.max(1,element.clientHeight));wake();});resize.observe(element);
   const theme=new MutationObserver(applyTheme);for(let parent:Element|null=element;parent;parent=parent.parentElement)theme.observe(parent,{attributes:true,attributeFilter:['data-theme','style','class']});
   const intersection=new IntersectionObserver(entries=>{inView=entries[0]?.isIntersecting??true;applyMotion();});intersection.observe(element);
   const visibility=()=>applyMotion(),motionChanged=()=>{forceActive=!motion.matches;applyMotion();if(!motion.matches)view.d3ReheatSimulation();};
   const lost=(event:Event)=>{event.preventDefault();setError('The WebGL context was lost. Reopen this view to restore it; the folder list remains available.');};
   element.addEventListener('pointerdown',wake);element.addEventListener('pointermove',wake);element.addEventListener('wheel',wake,{passive:true});element.addEventListener('keydown',wake);element.addEventListener('webglcontextlost',lost,true);document.addEventListener('visibilitychange',visibility);motion.addEventListener('change',motionChanged);
   applyTheme();applyMotion();setReady(value=>value+1);setLoading(false);
   cleanup=()=>{clearTimeout(idle);resize.disconnect();theme.disconnect();intersection.disconnect();element.removeEventListener('pointerdown',wake);element.removeEventListener('pointermove',wake);element.removeEventListener('wheel',wake);element.removeEventListener('keydown',wake);element.removeEventListener('webglcontextlost',lost,true);document.removeEventListener('visibilitychange',visibility);motion.removeEventListener('change',motionChanged);runtime.current=null;graph.current=null;view._destructor();geometry.dispose();texture.dispose();materials.forEach(value=>value.dispose());glows.forEach(value=>value.dispose());pass.dispose();output.dispose();objects.current.clear();element.replaceChildren();};
  }).catch(error=>{if(!cancelled){setLoading(false);setError(error instanceof Error?error.message:String(error));}});
  return()=>{cancelled=true;cleanup();};
 },[folder.path]);

 useEffect(()=>{
  const view=graph.current;if(!view)return;
  const firstData=cache.current.size===0;
  const nodes=model.nodes.map(item=>{let node=cache.current.get(item.id);if(!node){const parent=!firstData&&item.parent?cache.current.get(item.parent):undefined;node={id:item.id,folder:item.folder,depth:item.depth,group:item.group,radius:item.radius,parent:item.parent,x:parent?.x??item.position.x*65,y:parent?.y??item.position.y*65,z:parent?.z??item.position.z*65};if(item.depth===0){node.fx=0;node.fy=0;node.fz=0;}cache.current.set(item.id,node);}else Object.assign(node,{folder:item.folder,depth:item.depth,group:item.group,radius:item.radius});return node;});
  const links=model.edges.map(edge=>({source:edge.from,target:edge.to,from:edge.from,to:edge.to}));
  runtime.current?.data();view.resumeAnimation().graphData({nodes,links}).d3ReheatSimulation();runtime.current?.style();
 },[model,ready]);
 useEffect(()=>{runtime.current?.style();},[hover,selected,orbit,signals,bloom]);
 const focus=hover??selected,chosen=model.all.get(focus)??folder,visible=model.nodes.some(node=>node.id===focus),search=[...model.all].filter(([,node])=>!query||node.path.toLowerCase().includes(query.toLowerCase())).slice(0,100);
 return <section className="folder-force3d" aria-label="Expandable WebGL discovery clusters">
  <header className="folder-force3d__header"><div><p>3D FORCE GRAPH / DISCOVERY HIERARCHY</p><h3>Living folder network</h3></div><div><strong>{model.nodes.length.toLocaleString()}</strong><span>of {model.total.toLocaleString()} real folders</span></div></header>
  <div className="folder-force3d__controls"><label><input type="checkbox" checked={orbit} onChange={event=>setOrbit(event.target.checked)}/>Auto orbit</label><label><input type="checkbox" checked={signals} onChange={event=>setSignals(event.target.checked)}/>Signal particles</label><label><input type="checkbox" checked={bloom} onChange={event=>setBloom(event.target.checked)}/>Bloom</label><label>Visible cap<select value={limit} onChange={event=>setLimit(Number(event.target.value))}><option value="500">500</option><option value="1500">1,500</option><option value="4000">4,000</option></select></label><button type="button" className="action-outline" onClick={()=>{setExpanded(expandedToDepth(folder,3));setSelected(pathKey(folder.path));}}>Three layers</button><button type="button" className="action-outline" onClick={()=>setExpanded(expandedToDepth(folder,Infinity))}>Expand all</button><button type="button" className="action-main" onClick={()=>{setExpanded(new Set([pathKey(folder.path)]));setSelected(pathKey(folder.path));}}>Collapse</button><button type="button" className="action-main" onClick={overview}>Fit graph</button></div>
  {loading&&<p role="status">Loading the 3d-force-graph WebGL engine…</p>}{error&&<p role="alert" className="container-outline pad">{error}</p>}
  <div className="folder-force3d__scene"><div ref={host} className="folder-force3d__host" tabIndex={0} role="img" aria-label={`Real WebGL force graph: ${model.nodes.length} folder nodes and ${model.edges.length} actual parent-child links. Drag to orbit, wheel to zoom, click to expand/collapse, Shift-click to fly to a folder. Native folder controls and searchable list follow.`} onPointerMoveCapture={event=>{pointer.current={x:event.clientX,y:event.clientY};}} onPointerLeave={()=>{pointer.current=null;setHover(undefined);}} onKeyDown={event=>{if(event.key==='Enter'){event.preventDefault();toggle(selected);}else if(event.key.toLowerCase()==='f'){event.preventDefault();fly(selected);}else if(event.key==='Home'){event.preventDefault();overview();}}}/><div className="folder-force3d__caption"><span>REAL FOLDERS · ACTUAL HIERARCHY LINKS</span><span>Drag orbit · wheel zoom · click expand · Shift-click fly</span></div></div>
  <ChartTooltip targetRef={host} positionRef={pointer} title={chosen.name} disabled={!hover||!pointer.current} rows={[{label:'Path',value:chosen.path},{label:'Descendant files',value:chosen.file_count.toLocaleString()},{label:'Direct child folders',value:chosen.children.length.toLocaleString()},{label:'State',value:chosen.children.length?(expanded.has(focus)?'Expanded · click to collapse':'Collapsed · click to expand'):'Leaf folder'}]}/>
  {model.truncated&&<p className="folder-force3d__hint">The visible-node cap is active. Collapse branches or increase the cap to reveal more of the saved hierarchy.</p>}
  <div className="folder-force3d__inspector container-main"><div><span>CLUSTER INSPECTOR</span><h4>{chosen.name}</h4><code>{chosen.path}</code></div><dl><div><dt>Descendant files</dt><dd>{chosen.file_count.toLocaleString()}</dd></div><div><dt>Child folders</dt><dd>{chosen.children.length.toLocaleString()}</dd></div><div><dt>Direct files</dt><dd>{chosen.files.length.toLocaleString()}</dd></div></dl><div className="folder-force3d__actions"><button type="button" className="action-outline" disabled={!chosen.children.length} onClick={()=>toggle(focus)}>{expanded.has(focus)?'Collapse cluster':'Expand cluster'}</button><button type="button" className="action-outline" disabled={!visible} onClick={()=>fly(focus)}>Fly to folder</button>{onSelectFolder&&<button type="button" className="action-main" onClick={()=>onSelectFolder(chosen.path)}>Open folder layer</button>}</div></div>
  <p className="folder-force3d__hint">Rendered by the selected 3d-force-graph / Three.js WebGL engine with real force physics, bloom and directional particles. Node size uses log file count. Particles indicate hierarchy direction, not measured traffic. Expanding adds actual child folders. Motion pauses offscreen and in hidden tabs; reduced-motion disables automatic movement and wakes rendering only for interaction.</p>
  <details><summary>Find folders · {model.total.toLocaleString()} available</summary><label className="folder-force3d__search">Folder path<input type="search" value={query} onChange={event=>setQuery(event.target.value)} placeholder="Filter folder paths"/></label><ul className="folder-force3d__list">{search.map(([id,node])=><li key={id}><button type="button" className="action-main" aria-pressed={selected===id} onClick={()=>{const next=new Set(expanded);let path=node.path.replaceAll('\\','/');while(pathKey(path)!==pathKey(folder.path)){const index=path.lastIndexOf('/');if(index<0)break;path=path.slice(0,index);next.add(pathKey(path));}setExpanded(next);setSelected(id);setHover(undefined);}}><span>{node.path}</span><small>{node.file_count.toLocaleString()} files</small></button></li>)}</ul>{model.total>100&&<p className="folder-force3d__hint">First 100 matching paths shown. Filter to reach deeper folders.</p>}</details>
 </section>;
};
