import {useEffect,useMemo,useRef,useState} from 'react';
import * as THREE from 'three';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import {EffectComposer} from 'three/addons/postprocessing/EffectComposer.js';
import {RenderPass} from 'three/addons/postprocessing/RenderPass.js';
import {UnrealBloomPass} from 'three/addons/postprocessing/UnrealBloomPass.js';
import {OutputPass} from 'three/addons/postprocessing/OutputPass.js';
import type {FolderNode} from '../DiscoveryExplorer/DiscoveryExplorer.types';
import type {CityBlock} from './city';
import {citySceneModel} from './folder-city-webgl-model';
import type {CityVolume,CityGrouping} from './folder-city-webgl-model';
import {createCityEnergy,cityEffectFor,cityEffectNames} from './city-semantic-fx';
import type {CityEffectEncoding} from './city-semantic-fx';
import {FolderCity} from './FolderCity';
import {ChartTooltip} from './ChartTooltip';
import './css/folder-city-webgl.css';

const hash=(text:string)=>[...text].reduce((h,c)=>(h*31+c.charCodeAt(0))>>>0,0)%7;
const formatBytes=(value:number|null)=>{if(value===null)return 'Unknown';const units=['B','KiB','MiB','GiB','TiB'];const level=Math.min(units.length-1,Math.floor(Math.log(Math.max(1,value))/Math.log(1024)));return `${(value/1024**level).toLocaleString(undefined,{maximumFractionDigits:1})} ${units[level]}`;};
const identity=(block:CityBlock)=>`${block.path}\0${block.name}\0${block.platform}`;
export const FolderCityWebGL=({folder,onSelect}:{folder:FolderNode;onSelect:(path:string)=>void})=>{
 const [depth,setDepth]=useState(3),[flow,setFlow]=useState(true),[energy,setEnergy]=useState(true),[grouping,setGrouping]=useState<CityGrouping>('folder'),[encoding,setEncoding]=useState<CityEffectEncoding>('type'),[hover,setHover]=useState<CityBlock>(),[error,setError]=useState('');
 const model=useMemo(()=>citySceneModel(folder,depth,grouping),[folder,depth,grouping]),canvas=useRef<HTMLCanvasElement>(null),pointer=useRef<{x:number;y:number}|null>(null),activeHover=useRef<string|undefined>(undefined),latest=useRef({onSelect,flow,energy,encoding});latest.current={onSelect,flow,energy,encoding};
 const hoveredVolume=hover?[...model.buildings,...model.platforms].find(volume=>identity(volume.block)===identity(hover)):undefined;
 const sceneControls=useRef<{fit:()=>void;draw:()=>void}|null>(null);
 useEffect(()=>{sceneControls.current?.draw();},[flow,energy,encoding]);
 useEffect(()=>{if(encoding==='bytes'&&!model.bytesAvailable)setEncoding('count');},[model.bytesAvailable,encoding]);
 useEffect(()=>{
  const element=canvas.current;if(!element)return;setError('');setHover(undefined);activeHover.current=undefined;
  let renderer:THREE.WebGLRenderer;
  try{
   const context=element.getContext('webgl2',{antialias:true,alpha:false,powerPreference:'high-performance'});
   if(!context||context.isContextLost())throw Error('No active WebGL2 context.');
   renderer=new THREE.WebGLRenderer({canvas:element,context,antialias:true,alpha:false,powerPreference:'high-performance'});
  }catch{setError('WebGL2 could not start in this browser. The existing canvas city below preserves the same folder data and controls.');return;}
  renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,2));renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=.76;
  const scene=new THREE.Scene(),camera=new THREE.PerspectiveCamera(43,1,.1,800),controls=new OrbitControls(camera,element);
  controls.enableDamping=true;controls.dampingFactor=.065;controls.minDistance=12;controls.maxDistance=330;controls.minPolarAngle=.18;controls.maxPolarAngle=Math.PI*.47;controls.enablePan=true;
  const geometries=new Set<THREE.BufferGeometry>(),materials=new Set<THREE.Material>();
  const geometry=<T extends THREE.BufferGeometry>(value:T):T=>(geometries.add(value),value),material=<T extends THREE.Material>(value:T):T=>(materials.add(value),value);
  const baseBox=geometry(new THREE.BoxGeometry(1,1,1)),unitEdges=geometry(new THREE.EdgesGeometry(baseBox)),dummy=new THREE.Object3D(),white=new THREE.Color(1,1,1);
  const glass=material(new THREE.MeshPhysicalMaterial({color:white,vertexColors:true,transparent:true,opacity:.14,roughness:.28,metalness:.12,clearcoat:.3,clearcoatRoughness:.4,depthWrite:false,side:THREE.DoubleSide}));
  const floorMaterial=material(new THREE.MeshStandardMaterial({color:white,vertexColors:true,transparent:true,opacity:.09,roughness:.82,metalness:.12,depthWrite:false}));
  const tintMaterial=material(new THREE.MeshBasicMaterial({color:white,vertexColors:true,transparent:true,opacity:.13,depthWrite:false,side:THREE.FrontSide}));
  const tintVolumes=new THREE.InstancedMesh(baseBox,tintMaterial,model.buildings.length);tintVolumes.name='Unlit file group tint';tintVolumes.renderOrder=1;
  const buildings=new THREE.InstancedMesh(baseBox,glass,model.buildings.length),platforms=new THREE.InstancedMesh(baseBox,floorMaterial,model.platforms.length);buildings.name='Indexed file groups';buildings.renderOrder=2;platforms.name='Folder districts';scene.add(platforms,tintVolumes,buildings);
  const matrixFor=(volume:CityVolume)=>{dummy.position.set(volume.x,volume.base+volume.height/2,volume.z);dummy.scale.set(volume.width,volume.height,volume.depth);dummy.updateMatrix();return dummy.matrix;};
  model.buildings.forEach((volume,index)=>{const matrix=matrixFor(volume);buildings.setMatrixAt(index,matrix);tintVolumes.setMatrixAt(index,matrix);});model.platforms.forEach((volume,index)=>platforms.setMatrixAt(index,matrixFor(volume)));
  const edgePositions:number[]=[],edgeGroups:number[]=[],windowPositions:number[]=[],windowGroups:number[]=[];
  const rawEdges=unitEdges.getAttribute('position');
  for(const [index,volume]of model.buildings.entries()){
   const transform=matrixFor(volume).clone(),group=hash(volume.block.type),point=new THREE.Vector3();
   for(let i=0;i<rawEdges.count;i++){point.fromBufferAttribute(rawEdges,i).applyMatrix4(transform);edgePositions.push(point.x,point.y,point.z);edgeGroups.push(group);}
   // Window density is capped, but every light is supported by the group's actual file count.
   const count=Math.min(volume.block.count,75,Math.max(0,12000-windowGroups.length)),levels=Math.max(1,Math.floor(volume.height/1.4));
   for(let i=0;i<count;i++){
    const side=i%4,slot=Math.floor(i/4),level=slot%levels,t=((Math.floor(slot/levels)%9)+1)/10;
    let x=volume.x-volume.width/2+t*volume.width,z=volume.z-volume.depth/2;
    if(side===1){x=volume.x+volume.width/2;z=volume.z-volume.depth/2+t*volume.depth;}else if(side===2)z=volume.z+volume.depth/2;else if(side===3){x=volume.x-volume.width/2;z=volume.z-volume.depth/2+t*volume.depth;}
    windowPositions.push(x,volume.base+.5+(level+.2)/levels*(volume.height-.7),z);windowGroups.push(group);
   }
  }
  const edgeGeometry=geometry(new THREE.BufferGeometry());edgeGeometry.setAttribute('position',new THREE.Float32BufferAttribute(edgePositions,3));edgeGeometry.setAttribute('color',new THREE.Float32BufferAttribute(new Float32Array(edgePositions.length),3));
  const edgeMaterial=material(new THREE.LineBasicMaterial({vertexColors:true,transparent:true,opacity:.32,blending:THREE.NormalBlending,depthWrite:false}));scene.add(new THREE.LineSegments(edgeGeometry,edgeMaterial));
  const windowGeometry=geometry(new THREE.BufferGeometry());windowGeometry.setAttribute('position',new THREE.Float32BufferAttribute(windowPositions,3));windowGeometry.setAttribute('color',new THREE.Float32BufferAttribute(new Float32Array(windowPositions.length),3));
  const windowMaterial=material(new THREE.PointsMaterial({vertexColors:true,size:.11,sizeAttenuation:true,transparent:true,opacity:.42,blending:THREE.NormalBlending,depthWrite:false}));scene.add(new THREE.Points(windowGeometry,windowMaterial));
  const platformEdges:number[]=[];
  for(const volume of model.platforms){const y=volume.base+volume.height+.015,x1=volume.x-volume.width/2,x2=volume.x+volume.width/2,z1=volume.z-volume.depth/2,z2=volume.z+volume.depth/2;platformEdges.push(x1,y,z1,x2,y,z1,x2,y,z1,x2,y,z2,x2,y,z2,x1,y,z2,x1,y,z2,x1,y,z1);}
  const platformGeometry=geometry(new THREE.BufferGeometry());platformGeometry.setAttribute('position',new THREE.Float32BufferAttribute(platformEdges,3));
  const platformLine=material(new THREE.LineBasicMaterial({transparent:true,opacity:.12,blending:THREE.NormalBlending,depthWrite:false}));scene.add(new THREE.LineSegments(platformGeometry,platformLine));
  const roadPoints:number[]=[],routes=model.roads.map(road=>({road,curve:new THREE.CurvePath<THREE.Vector3>()}));
  for(const route of routes){for(let i=0;i<route.road.points.length-1;i++){const a=new THREE.Vector3(...route.road.points[i]),b=new THREE.Vector3(...route.road.points[i+1]);if(a.distanceToSquared(b)<.0001)continue;route.curve.add(new THREE.LineCurve3(a,b));roadPoints.push(a.x,a.y,a.z,b.x,b.y,b.z);}}
  const roadGeometry=geometry(new THREE.BufferGeometry());roadGeometry.setAttribute('position',new THREE.Float32BufferAttribute(roadPoints,3));
  const roadMaterial=material(new THREE.LineBasicMaterial({transparent:true,opacity:.28,blending:THREE.NormalBlending,depthWrite:false}));scene.add(new THREE.LineSegments(roadGeometry,roadMaterial));
  const moving=routes.filter(route=>route.curve.curves.length),particleArray=new Float32Array(moving.length*3),particleGeometry=geometry(new THREE.BufferGeometry());particleGeometry.setAttribute('position',new THREE.BufferAttribute(particleArray,3));
  const particleMaterial=material(new THREE.PointsMaterial({size:.26,sizeAttenuation:true,transparent:true,opacity:.72,blending:THREE.AdditiveBlending,depthWrite:false}));const particles=new THREE.Points(particleGeometry,particleMaterial);scene.add(particles);
  const semanticEnergy=createCityEnergy(scene,model.buildings,geometry,material);
  const floor= new THREE.Mesh(geometry(new THREE.PlaneGeometry(145,145)),material(new THREE.MeshStandardMaterial({roughness:.88,metalness:.1,transparent:true,opacity:.15})));floor.rotation.x=-Math.PI/2;floor.position.y=-.35;scene.add(floor);
  const hoverMaterial=material(new THREE.LineBasicMaterial({transparent:true,opacity:.95,blending:THREE.AdditiveBlending,depthWrite:false})),highlight=new THREE.LineSegments(unitEdges,hoverMaterial);highlight.visible=false;highlight.matrixAutoUpdate=false;highlight.renderOrder=20;scene.add(highlight);
  scene.add(new THREE.AmbientLight(white,.5));const key=new THREE.DirectionalLight(white,.9);key.position.set(40,100,35);scene.add(key);const rim=new THREE.PointLight(white,24,240,1.5);rim.position.set(-45,35,-40);scene.add(rim);
  const composer=new EffectComposer(renderer),renderPass=new RenderPass(scene,camera),bloom=new UnrealBloomPass(new THREE.Vector2(1,1),.18,.22,.94),output=new OutputPass();composer.addPass(renderPass);composer.addPass(bloom);composer.addPass(output);
  let activeVolume:CityVolume|undefined;
  let palette:THREE.Color[]=[],frame=0,visible=true,disposed=false,last=0,elapsed=0,dragStart:{x:number;y:number;travel:number}|undefined;
  const motion=matchMedia('(prefers-reduced-motion: reduce)'),raycaster=new THREE.Raycaster(),screen=new THREE.Vector2();
  const theme=()=>{
   const style=getComputedStyle(element),token=(name:string)=>new THREE.Color(style.getPropertyValue(name).trim()||style.color);
   const background=token('--color-main'),foreground=token('--color-main-neg'),primary=token('--color-primary');
   palette=['--color-primary-alt','--color-primary','--status-error','--status-warning','--status-success','--color-muted','--color-tertiary-neg'].map(token);
   renderer.setClearColor(background,1);scene.background=background;scene.fog=new THREE.FogExp2(background,.0025);(floor.material as THREE.MeshStandardMaterial).color.copy(background).lerp(primary,.08);roadMaterial.color.copy(primary).multiplyScalar(1.05);particleMaterial.color.copy(primary).lerp(foreground,.06).multiplyScalar(1.22);platformLine.color.copy(primary);hoverMaterial.color.copy(foreground);rim.color.copy(primary);
   model.buildings.forEach((volume,index)=>{const color=palette[hash(volume.block.type)];buildings.setColorAt(index,color);tintVolumes.setColorAt(index,color);});model.platforms.forEach((volume,index)=>platforms.setColorAt(index,primary.clone().lerp(palette[hash(volume.block.type)],.3)));
   if(buildings.instanceColor)buildings.instanceColor.needsUpdate=true;if(tintVolumes.instanceColor)tintVolumes.instanceColor.needsUpdate=true;if(platforms.instanceColor)platforms.instanceColor.needsUpdate=true;
   const colors=edgeGeometry.getAttribute('color') as THREE.BufferAttribute;edgeGroups.forEach((group,index)=>{const c=palette[group].clone().lerp(foreground,.04).multiplyScalar(.82);colors.setXYZ(index,c.r,c.g,c.b);});colors.needsUpdate=true;
   const windows=windowGeometry.getAttribute('color') as THREE.BufferAttribute;windowGroups.forEach((group,index)=>{const c=palette[group].clone().lerp(foreground,.06).multiplyScalar(.92);windows.setXYZ(index,c.r,c.g,c.b);});windows.needsUpdate=true;
   request();
  };
  const fit=()=>{controls.target.set(0,5,0);camera.position.set(105,89,105);camera.lookAt(controls.target);controls.update();request();};
  const render=()=>{if(disposed||!visible||document.hidden)return;const now=performance.now(),dt=Math.min(.05,(now-(last||now))/1000);last=now;if(!motion.matches&&(latest.current.flow||latest.current.energy))elapsed+=dt;
   particles.visible=latest.current.flow;
   for(let i=0;i<moving.length;i++){const point=moving[i].curve.getPointAt((elapsed*.065+(i*.137)%1)%1),index=i*3;particleArray[index]=point.x;particleArray[index+1]=point.y+.07;particleArray[index+2]=point.z;}
   (particleGeometry.getAttribute('position') as THREE.BufferAttribute).needsUpdate=true;semanticEnergy.update(elapsed,palette,latest.current.encoding,latest.current.energy,activeVolume);controls.update();composer.render();
  };
  const animate=()=>{frame=0;render();if(!disposed&&!frame&&visible&&!document.hidden&&!motion.matches&&(latest.current.flow||latest.current.energy))frame=requestAnimationFrame(animate);};
  function request(){if(!disposed&&!frame&&visible&&!document.hidden)frame=requestAnimationFrame(animate);}
  const resize=()=>{const bounds=element.getBoundingClientRect();if(!bounds.width||!bounds.height)return;renderer.setSize(bounds.width,bounds.height,false);composer.setSize(bounds.width,bounds.height);camera.aspect=bounds.width/bounds.height;camera.updateProjectionMatrix();request();};
  const pick=(event:PointerEvent)=>{const rect=element.getBoundingClientRect();screen.set((event.clientX-rect.left)/rect.width*2-1,-(event.clientY-rect.top)/rect.height*2+1);raycaster.setFromCamera(screen,camera);const hit=raycaster.intersectObjects([buildings,platforms],false)[0];if(!hit||hit.instanceId===undefined)return;const volume=(hit.object===buildings?model.buildings:model.platforms)[hit.instanceId];return volume;};
  const setPicked=(volume?:CityVolume)=>{activeVolume=volume;const id=volume?identity(volume.block):undefined;if(activeHover.current!==id){activeHover.current=id;setHover(volume?.block);}highlight.visible=!!volume;if(volume){highlight.matrix.copy(matrixFor(volume));}request();};
  const down=(event:PointerEvent)=>{pointer.current=null;setPicked();dragStart={x:event.clientX,y:event.clientY,travel:0};};
  const move=(event:PointerEvent)=>{if(dragStart){dragStart.travel+=Math.abs(event.clientX-dragStart.x)+Math.abs(event.clientY-dragStart.y);dragStart.x=event.clientX;dragStart.y=event.clientY;pointer.current=null;return;}pointer.current={x:event.clientX,y:event.clientY};setPicked(pick(event));};
  const up=(event:PointerEvent)=>{if(dragStart&&dragStart.travel<5){const volume=pick(event);if(volume)latest.current.onSelect(volume.block.path);}dragStart=undefined;};
  const leave=()=>{pointer.current=null;setPicked();};
  const cancel=()=>{dragStart=undefined;leave();};
  const keyboard=(event:KeyboardEvent)=>{if(event.key==='Home'){event.preventDefault();fit();}else if(event.key==='Escape'){leave();}else if(['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','+','-','='].includes(event.key)){event.preventDefault();const offset=camera.position.clone().sub(controls.target),spherical=new THREE.Spherical().setFromVector3(offset);if(event.key==='ArrowLeft')spherical.theta-=.12;if(event.key==='ArrowRight')spherical.theta+=.12;if(event.key==='ArrowUp')spherical.phi=Math.max(.18,spherical.phi-.08);if(event.key==='ArrowDown')spherical.phi=Math.min(Math.PI*.47,spherical.phi+.08);if(event.key==='+'||event.key==='=')spherical.radius=Math.max(12,spherical.radius*.9);if(event.key==='-')spherical.radius=Math.min(330,spherical.radius*1.1);camera.position.copy(controls.target).add(new THREE.Vector3().setFromSpherical(spherical));controls.update();request();}};
  const visibility=()=>{last=0;if(document.hidden){cancelAnimationFrame(frame);frame=0;}else request();};
  const observer=new ResizeObserver(resize);observer.observe(element);const intersection=new IntersectionObserver(entries=>{visible=entries.some(entry=>entry.isIntersecting);last=0;if(visible)request();else{cancelAnimationFrame(frame);frame=0;}});intersection.observe(element);
  const themeObserver=new MutationObserver(theme);for(let parent:Element|null=element.parentElement;parent;parent=parent.parentElement)themeObserver.observe(parent,{attributes:true,attributeFilter:['data-theme','class','style']});
  controls.addEventListener('change',request);document.addEventListener('visibilitychange',visibility);motion.addEventListener('change',request);
  element.addEventListener('pointerdown',down);element.addEventListener('pointermove',move);element.addEventListener('pointerup',up);element.addEventListener('pointerleave',leave);element.addEventListener('pointercancel',cancel);element.addEventListener('keydown',keyboard);
  const lost=(event:Event)=>{event.preventDefault();visible=false;cancelAnimationFrame(frame);frame=0;setError('WebGL context was lost. The canvas fallback below uses the same folder data.');};element.addEventListener('webglcontextlost',lost);
  sceneControls.current={fit,draw:request};fit();theme();resize();
  return()=>{disposed=true;sceneControls.current=null;cancelAnimationFrame(frame);observer.disconnect();intersection.disconnect();themeObserver.disconnect();controls.removeEventListener('change',request);controls.dispose();document.removeEventListener('visibilitychange',visibility);motion.removeEventListener('change',request);element.removeEventListener('pointerdown',down);element.removeEventListener('pointermove',move);element.removeEventListener('pointerup',up);element.removeEventListener('pointerleave',leave);element.removeEventListener('pointercancel',cancel);element.removeEventListener('keydown',keyboard);element.removeEventListener('webglcontextlost',lost);composer.dispose();bloom.dispose();output.dispose();buildings.dispose();tintVolumes.dispose();platforms.dispose();for(const value of geometries)value.dispose();for(const value of materials)value.dispose();renderer.dispose();};
 },[model]);
 return <section className="folder-city-webgl">
  <header className="folder-city-webgl__toolbar"><div><span>FILESYSTEM / DIGITAL CITY</span><h3>{folder.name} district</h3><p>Folder partitions and real file-type groups — not a street map.</p></div><label>Group by<select value={grouping} onChange={event=>setGrouping(event.target.value as CityGrouping)}><option value="folder">Folder hierarchy</option><option value="type">File-type districts</option></select></label><label>Folder layers<select disabled={grouping==='type'} value={depth} onChange={event=>setDepth(Number(event.target.value))}>{[1,2,3,4].map(value=><option key={value} value={value}>{value} levels</option>)}</select></label><label><input type="checkbox" checked={flow} onChange={event=>setFlow(event.target.checked)}/> Connection pulses</label><label><input type="checkbox" checked={energy} onChange={event=>setEnergy(event.target.checked)}/> Group energy</label><label>Effect encoding<select value={encoding} onChange={event=>setEncoding(event.target.value as CityEffectEncoding)}><option value="type">File type</option><option value="count">File count</option><option value="bytes" disabled={!model.bytesAvailable}>Verified bytes{model.bytesAvailable?'':' — unknown'}</option></select></label><button type="button" className="action-outline" onClick={()=>sceneControls.current?.fit()}>Fit city</button></header>
  <div className="folder-city-webgl__stage" hidden={!!error}><canvas ref={canvas} tabIndex={0} role="img" aria-label={`${folder.name} WebGL filesystem city. ${model.platforms.length} folder platforms, ${model.buildings.length} actual file group towers, ${model.roads.length} hierarchy connections. Drag to orbit, right drag to pan, scroll to zoom. Arrow keys orbit, plus and minus zoom, Home fits. Click a district or building to open its folder. Exact counts and navigation follow below.`}/><div className="folder-city-webgl__hud" aria-hidden="true"><span>DISCOVERY GEOMETRY</span><strong>{folder.file_count.toLocaleString()}</strong><span>INDEXED FILES</span></div><div className="folder-city-webgl__corner">WEBGL · SEMANTIC GROUP ENERGY</div></div>
  <ChartTooltip targetRef={canvas} positionRef={pointer} disabled={!hover||!pointer.current} title={hover?.name} rows={hover?[{label:'Path',value:hover.path},{label:'Files',value:hover.count.toLocaleString()},{label:'Verified bytes',value:formatBytes(hoveredVolume?.bytes??null)},...(hoveredVolume?[{label:'Neighborhood effect',value:cityEffectNames[cityEffectFor(hoveredVolume)]}]:[]),{label:'Folder layer',value:hover.depth},{label:'Kind',value:hover.platform?(grouping==='type'?'File-type district':'Folder district'):hover.type}]:[]}/>
  {error&&<><p role="status">{error}</p><FolderCity folder={folder} onSelect={onSelect}/></>}
  <div className="folder-city-webgl__metrics"><span><strong>{model.platforms.length}</strong> {grouping==='type'?'type districts':'folder terraces'}</span><span><strong>{model.buildings.length}</strong> file group towers</span><span><strong>{model.roads.length}</strong> {grouping==='type'?'type membership links':'hierarchy connections'}</span><span><strong>{grouping==='type'?1:depth}</strong> {grouping==='type'?'type layer':'folder layers'}</span></div>
  <div className="folder-city-webgl__encoding" aria-label="Effect encoding legend"><strong>{encoding==='type'?'Type color · file-count stream density':encoding==='count'?'File count → energy density':'Verified bytes → energy density'}</strong>{encoding==='type'?<ul>{folder.types.slice(0,12).map(row=><li key={row.type}><i style={{backgroundColor:`var(${['--color-primary-alt','--color-primary','--status-error','--status-warning','--status-success','--color-muted','--color-tertiary-neg'][hash(row.type)]})`}}/><code>{row.type}</code><span>{row.count.toLocaleString()}</span></li>)}</ul>:<p><i className="folder-city-webgl__gradient"/>Lower → higher values use denser rising streams and stronger halos.</p>}<small>{model.bytesAvailable?'Byte encoding uses complete recorded file sizes.':'Byte sizes are incomplete in this snapshot; byte encoding is disabled.'} Geometry is a hierarchy partition, not geographic streets.</small><p>Neighborhood styles: rising streams � scan bands � perimeter packets � roof beacons. Style is assigned by folder/type; density follows the selected metric.</p></div>
  <p className="folder-charts__hint">Each tower represents an actual folder or file-type group; height follows logarithmic file count. Folder mode links actual parent/child districts; type mode links this scope to its real type aggregates. Rectangular footprints follow the buildings. Neighborhoods use rising streams, scan bands, perimeter packets, or roof beacons; hover to isolate one. Up to eight anchors animate at once. Effects are a visual guide, not live scan activity. Windows sample file density. Drag to orbit · scroll to zoom · click to drill into a folder. {model.omitted?`${model.omitted.toLocaleString()} small groups are omitted from this scene; the indexed folder counts remain complete.`:''}</p>
  <div className="folder-city-webgl__selection" aria-live="polite"><strong>{hover?.name??folder.name}</strong><span>{hover?`${hover.count.toLocaleString()} files · layer ${hover.depth}`:`${folder.file_count.toLocaleString()} files in this scope`}</span><code>{hover?.path??folder.path}</code></div>
  <details><summary>District navigation and exact counts</summary><ol className="folder-city-webgl__districts">{model.platforms.filter(volume=>volume.block.depth>0).map(volume=><li key={volume.block.sourceKey??volume.block.path}><button type="button" className="action-main" onClick={()=>onSelect(volume.block.path)}><span>{'› '.repeat(volume.block.depth)}{volume.block.name}</span><strong>{volume.block.count.toLocaleString()}</strong></button></li>)}</ol></details>
 </section>;
};
