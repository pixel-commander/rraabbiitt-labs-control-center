import { lazy, Suspense, useId, useRef, useState } from 'react';
import type { FolderChartsProps, FolderDonutProps } from './FolderCharts.types';
import { useThemedCanvas } from './hooks/useThemedCanvas';
import { drawDonut, drawGauge, paletteIndex } from './draw';
import { FolderCity } from './FolderCity';
import { ImportWebGL } from './ImportWebGL';
import { FolderBars } from './FolderBars/FolderBars';
import { NeuralConnectors } from './NeuralConnectors/NeuralConnectors';
import { ChartTooltip } from './ChartTooltip';
import { RepositoryNetwork } from './RepositoryNetwork';
import './css/folder-charts.css';

const FolderCluster3D=lazy(()=>import('./FolderCluster3D/FolderCluster3D').then(module=>({default:module.FolderCluster3D})));
const FolderClusterCanvas=lazy(()=>import('./FolderCluster3D/FolderClusterCanvas').then(module=>({default:module.FolderClusterCanvas})));
const FolderCityWebGL=lazy(()=>import('./FolderCityWebGL').then(module=>({default:module.FolderCityWebGL})));

export const FolderDonut=({types,compact=false,label}:FolderDonutProps)=>{
 const [hover,setHover]=useState<string|null>(null),pointer=useRef<{x:number;y:number}|null>(null);
 const canvas=useThemedCanvas(state=>drawDonut(state,types,compact,hover??undefined));
 const row=types.find(item=>item.type===hover),total=types.reduce((sum,item)=>sum+item.count,0);
 return <><canvas ref={canvas} className={`folder-donut${compact?' folder-donut--compact':''}`} aria-hidden={compact||undefined} role={compact?undefined:'img'} aria-label={compact?undefined:`${label}: ${types.map(row=>`${row.type} ${row.count}`).join(', ')||'no indexed files'}`}
 onPointerMove={event=>{if(compact)return;pointer.current={x:event.clientX,y:event.clientY};const b=event.currentTarget.getBoundingClientRect(),x=event.clientX-b.left-b.width/2,y=(event.clientY-b.top-b.height*.40)/.62,r=Math.min(b.width*.41,b.height*.43),distance=Math.hypot(x,y);if(distance<r*.57||distance>r){setHover(null);return;}const angle=(Math.atan2(y,x)+Math.PI/2+Math.PI*2)%(Math.PI*2);let cumulative=0;setHover(types.find(item=>{cumulative+=item.count/total*Math.PI*2;return angle<=cumulative;})?.type??null);}}
 onPointerLeave={()=>setHover(null)}/>{!compact&&<ChartTooltip targetRef={canvas} positionRef={pointer} title={row?.type||'(no extension)'} disabled={!row} rows={[{label:'Files',value:row?.count.toLocaleString()},{label:'Share',value:total&&row?`${(row.count/total*100).toFixed(1)}%`:'0%'}]}/>}</>;

};
const FolderGauge=({folder,root}:Pick<FolderChartsProps,'folder'|'root'>)=>{
 const pointer=useRef<{x:number;y:number}|null>(null),[hover,setHover]=useState(false);
 const canvas=useThemedCanvas(state=>drawGauge(state,folder.file_count,root.file_count));
 const share=root.file_count?(folder.file_count/root.file_count*100).toFixed(1):'0';
 return <><canvas ref={canvas} className="folder-gauge" role="img" aria-label={`${folder.name} contains ${folder.file_count} of ${root.file_count} indexed root files; ${share} percent.`} onPointerMove={event=>{pointer.current={x:event.clientX,y:event.clientY};setHover(true);}} onPointerLeave={()=>setHover(false)}/><ChartTooltip targetRef={canvas} positionRef={pointer} title={folder.name} disabled={!hover} rows={[{label:'Folder files',value:folder.file_count.toLocaleString()},{label:'Root files',value:root.file_count.toLocaleString()},{label:'Share of root',value:share+'%'}]}/></>;
};
const modes=[{key:'clusters',label:'3D force graph'},{key:'canvas-clusters',label:'Canvas clusters'},{key:'types',label:'3D file types'},{key:'bars',label:'Bar charts'},{key:'digital-city',label:'Digital city'},{key:'city',label:'Layered city'},{key:'connectors',label:'Neural connectors'},{key:'repository',label:'Network graph'},{key:'network',label:'WebGL imports'}] as const;
export const FolderCharts=(props:FolderChartsProps)=>{
 const {folder,root}=props,id=useId(),[mode,setMode]=useState<'clusters'|'canvas-clusters'|'types'|'bars'|'digital-city'|'city'|'connectors'|'repository'|'network'>('types');
 const select=(key:typeof mode)=>{setMode(key);};
 return <section className="folder-charts" aria-label="Folder visualizations">
  <button type="button" className="action-outline folder-charts__fullscreen" onClick={event=>{const section=event.currentTarget.closest('section');if(document.fullscreenElement)void document.exitFullscreen();else if(section?.requestFullscreen)void section.requestFullscreen().catch(()=>{});}}>Full screen</button>
  <div role="tablist" aria-label="Chart view" className="folder-charts__tabs">{modes.map((item,index)=><button type="button" role="tab" key={item.key} id={`${id}-${item.key}`} aria-controls={`${id}-panel`} aria-selected={mode===item.key} tabIndex={mode===item.key?0:-1} className={`action-outline${mode===item.key?' is-active':''}`} onClick={()=>select(item.key)} onKeyDown={event=>{let next=index;if(event.key==='ArrowRight')next=(index+1)%modes.length;else if(event.key==='ArrowLeft')next=(index+modes.length-1)%modes.length;else if(event.key==='Home')next=0;else if(event.key==='End')next=modes.length-1;else return;event.preventDefault();select(modes[next].key);document.getElementById(`${id}-${modes[next].key}`)?.focus();}}>{item.label}</button>)}</div>
  <div role="tabpanel" id={`${id}-panel`} aria-labelledby={`${id}-${mode}`} className="folder-charts__panel container-cell container-cell--inset">
   {mode==='clusters'&&<Suspense fallback={<p role="status">Loading 3D force graph…</p>}><FolderCluster3D folder={folder} onSelectFolder={props.onSelectFolder}/></Suspense>}
   {mode==='canvas-clusters'&&<Suspense fallback={<p role="status">Loading canvas clusters…</p>}><FolderClusterCanvas folder={folder} onSelectFolder={props.onSelectFolder}/></Suspense>}
   {mode==='types'&&<div className="folder-charts__types"><div><FolderDonut types={folder.types} label={`${folder.name} file types`} /><FolderGauge folder={folder} root={root}/></div><div><h3>File composition</h3><p className="folder-charts__hint">All descendants of this folder. The same chart grammar repeats at every folder layer.</p><ul className="folder-charts__legend">{folder.types.map(row=><li key={row.type}><code>{row.type||'(no extension)'}</code><strong>{row.count.toLocaleString()}</strong><span>{folder.file_count?(row.count/folder.file_count*100).toFixed(1):0}%</span><div className="folder-charts__type-track" aria-hidden="true"><i data-color={paletteIndex(row.type)} style={{width:`${folder.file_count?row.count/folder.file_count*100:0}%`}}/></div></li>)}</ul>{!folder.types.length&&<p>No indexed files in this folder.</p>}</div></div>}
   {mode==='repository'&&<RepositoryNetwork {...props}/>}
   {mode==='digital-city'&&<Suspense fallback={<p role="status">Loading WebGL city…</p>}><FolderCityWebGL folder={folder} onSelect={props.onSelectFolder}/></Suspense>}
   {mode==='city'&&<FolderCity folder={folder} onSelect={props.onSelectFolder}/>}
   {mode==='bars'&&<FolderBars folder={folder} root={root} onSelectFolder={props.onSelectFolder}/>}
   {mode==='connectors'&&<NeuralConnectors {...props}/>}
   {mode==='network'&&<>{props.graph_status==='idle'&&<div className="folder-charts__empty"><h3>Module connections</h3><p>Build the import graph through the tracked count-imports tool. Node = source file; edge = resolved module reference. No made-up links.</p><button type="button" className="action-outline pad" onClick={props.onLoadGraph}>Map imports</button></div>}{props.graph_status==='loading'&&<p role="status">Mapping source references…</p>}{props.graph_error&&<p role="alert">{props.graph_error}</p>}{!!props.graph_issues?.length&&<details className="folder-charts__issues"><summary>Review {props.graph_issues.length} source issues</summary><ol>{props.graph_issues.map((issue,index)=><li key={index}>{issue.path&&<code>{issue.path}{issue.file ? '/'+issue.file : ''}</code>}<p>{issue.error}</p></li>)}</ol></details>}{(props.graph_status==='complete'||props.graph_status==='error'&&props.references.length>0)&&<ImportWebGL folder={folder} references={props.references}/>}<p className="folder-charts__hint">Folder clusters repeat in 3D. Geometry shows a module graph, not a trained neural network. Up to 120 connected files are shown, ranked by degree.</p>{(props.graph_status==='complete'||props.graph_status==='error')&&<button type="button" className="action-outline pad" onClick={props.onLoadGraph}>Refresh import graph</button>}</>}
  </div>
 </section>;
};
