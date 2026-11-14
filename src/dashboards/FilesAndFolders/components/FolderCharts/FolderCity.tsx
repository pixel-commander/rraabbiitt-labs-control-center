import {useEffect,useMemo,useRef,useState} from 'react';
import type {FolderNode} from '../DiscoveryExplorer/DiscoveryExplorer.types';
import {useThemedCanvas} from './hooks/useThemedCanvas';
import {cityLayout,drawLayeredCity,cityPick} from './city';
import type {CityHit,CityBlock} from './city';
import './css/folder-city.css';
import {ChartTooltip} from './ChartTooltip';
export const FolderCity=({folder,onSelect}:{folder:FolderNode;onSelect:(path:string)=>void})=>{
 const [depth,setDepth]=useState(3),[yaw,setYaw]=useState(45),[tilt,setTilt]=useState(28),[wire,setWire]=useState(false),[hover,setHover]=useState<CityBlock>();
 const blocks=useMemo(()=>cityLayout(folder,depth),[folder,depth]),hits=useRef<CityHit[]>([]),drag=useRef<{x:number;y:number;travel:number}|null>(null);
 const pointer=useRef<{x:number;y:number}|null>(null);
 useEffect(()=>{setHover(undefined);drag.current=null;},[folder.path]);
 const canvas=useThemedCanvas(state=>{hits.current=drawLayeredCity(state,blocks,{yaw,tilt,active:hover?.path,wire});});
 const hit=(event:React.PointerEvent<HTMLCanvasElement>)=>{const rect=event.currentTarget.getBoundingClientRect();return cityPick(hits.current,event.clientX-rect.left,event.clientY-rect.top);};
 return <div className="folder-city-view">
  <div className="folder-city-view__controls"><div><h3>Layered filesystem city</h3><p>Nested districts follow the folder hierarchy. Streets separate their children.</p></div>
   <label>Folder layers<select value={depth} onChange={event=>setDepth(Number(event.target.value))}>{[1,2,3,4].map(value=><option key={value} value={value}>{value} {value===1?'level':'levels'}</option>)}</select></label>
   <label>Elevation<input type="range" min="15" max="65" value={tilt} onChange={event=>setTilt(Number(event.target.value))}/></label>
   <label className="folder-city-view__check"><input type="checkbox" checked={wire} onChange={event=>setWire(event.target.checked)}/>Structure lines</label>
   <button type="button" className="action-outline" onClick={()=>{setYaw(45);setTilt(28);}}>Reset view</button>
  </div>
  <canvas ref={canvas} className="folder-city-layered" role="img" tabIndex={0} aria-label={`Layered folder city for ${folder.name}. ${blocks.filter(b=>b.platform).length} nested folder districts, ${blocks.filter(b=>!b.platform).length} file-count buildings. Drag or use arrow keys to orbit; select a district to drill in. The folder list below provides keyboard access.`}
   onPointerMoveCapture={event=>{pointer.current={x:event.clientX,y:event.clientY};}}
   onPointerDown={event=>{if(event.button!==0)return;setHover(undefined);drag.current={x:event.clientX,y:event.clientY,travel:0};event.currentTarget.setPointerCapture(event.pointerId);}}
   onPointerMove={event=>{if(drag.current){const dx=event.clientX-drag.current.x,dy=event.clientY-drag.current.y;drag.current.travel+=Math.abs(dx)+Math.abs(dy);drag.current.x=event.clientX;drag.current.y=event.clientY;setYaw(previous=>previous+dx*.4);setTilt(previous=>Math.max(15,Math.min(65,previous+dy*.2)));}else setHover(hit(event));}}
   onPointerUp={event=>{if(drag.current&&drag.current.travel<5){const block=hit(event);if(block)onSelect(block.path);}drag.current=null;}}
   onPointerCancel={()=>{drag.current=null;}} onLostPointerCapture={()=>{drag.current=null;}} onPointerLeave={()=>{if(!drag.current)setHover(undefined);}}
   onKeyDown={event=>{if(['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Home'].includes(event.key)){event.preventDefault();if(event.key==='Home'){setYaw(45);setTilt(28);}else if(event.key==='ArrowLeft'||event.key==='ArrowRight')setYaw(value=>value+(event.key==='ArrowRight'?5:-5));else setTilt(value=>Math.max(15,Math.min(65,value+(event.key==='ArrowDown'?3:-3))));}}}/>
  <ChartTooltip targetRef={canvas} positionRef={pointer} disabled={!hover} title={hover?.name} rows={hover?[{label:'Files',value:hover.count.toLocaleString()},{label:'Folder layer',value:hover.depth},{label:'Kind',value:hover.platform?'Folder district':hover.type},{label:'Path',value:hover.path}]:[]}/>
  <div className="folder-city-view__readout" aria-live="polite"><strong>{hover?.name??folder.name}</strong><span>{hover?`${hover.count.toLocaleString()} files · layer ${hover.depth} · ${hover.platform?'folder district':hover.type}`:`${blocks.filter(b=>b.platform).length} districts · ${blocks.filter(b=>!b.platform).length} buildings · ${folder.file_count.toLocaleString()} files`}</span><code>{hover?.path??folder.path}</code></div>
  <p className="folder-charts__hint">Drag to orbit · click a roof to drill into its folder · area and height use square-root file counts so smaller districts remain visible. Each terrace is one folder level. Up to 24 child groups per district; smaller groups are combined, and very large scenes collapse deeper branches.</p>
  <details><summary>District navigation and exact counts</summary><ol className="folder-city-view__districts">{blocks.filter(b=>b.platform&&b.depth>0).map(block=><li key={block.path}><button type="button" className="action-main" onClick={()=>onSelect(block.path)}><span>{'› '.repeat(block.depth)}{block.name}</span><strong>{block.count.toLocaleString()}</strong></button></li>)}</ol></details>
 </div>;
};
