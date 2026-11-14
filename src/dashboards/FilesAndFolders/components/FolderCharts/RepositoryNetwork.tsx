import { useEffect, useMemo, useState } from 'react';
import type { CSSProperties } from 'react';
import { NetworkGraph } from '../../../../components/NetworkGraph/NetworkGraph';
import { GraphFootprint } from '../../../../components/NetworkGraph/GraphFootprint/GraphFootprint';
import { GraphSelection } from '../../../../components/NetworkGraph/GraphSelection/GraphSelection';
import { GraphSearch } from '../../../../components/NetworkGraph/GraphSearch/GraphSearch';
import { GraphLegend } from '../../../../components/NetworkGraph/GraphLegend/GraphLegend';
import type { GraphData } from '../../../../components/NetworkGraph/NetworkGraph.types';
import type { FolderNode, ImportReference } from '../DiscoveryExplorer/DiscoveryExplorer.types';
import { connectorModel } from './NeuralConnectors/js/connector-model';

export interface RepositoryNetworkProps {
  folder:FolderNode; references:ImportReference[];
  graph_status:'idle'|'loading'|'complete'|'error'; graph_error?:string; onLoadGraph:()=>void;
}
/** Dashboard adapter: real import evidence drives the existing global NetworkGraph. */
export const RepositoryNetwork = (props:RepositoryNetworkProps) => {
  const [selected,setSelected]=useState<string>(),[query,setQuery]=useState(''),[boundary,setBoundary]=useState(false),[elastic,setElastic]=useState(true),[effect,setEffect]=useState<'none'|'flow'|'pulse'|'crackle'>('crackle');
  useEffect(()=>{setSelected(undefined);setQuery('');},[props.folder.path]);
  const model=useMemo(()=>connectorModel(props.folder,props.references,boundary,60),[props.folder,props.references,boundary]);
  const data=useMemo<GraphData>(()=>{
    const sourceIds=new Set(model.edges.map(edge=>edge.from)),targetIds=new Set(model.edges.map(edge=>edge.to));
    const sources=model.nodes.filter(node=>sourceIds.has(node.id)).sort((a,b)=>a.path.localeCompare(b.path));
    const targets=model.nodes.filter(node=>targetIds.has(node.id)).sort((a,b)=>a.path.localeCompare(b.path));
    const matches=(path:string)=>!query||path.toLowerCase().includes(query.toLowerCase());
    const selectedIds=new Set(model.nodes.filter(node=>matches(node.path)).map(node=>node.id));
    const edges=model.edges.filter(edge=>!query||selectedIds.has(edge.from)||selectedIds.has(edge.to));
    const visibleSources=new Set(edges.map(edge=>edge.from)),visibleTargets=new Set(edges.map(edge=>edge.to));
    return {
      nodes:[
        ...sources.filter(node=>visibleSources.has(node.id)).map((node,index)=>({key:'source:'+node.id,name:node.name,title:node.name,path:node.path,description:`Importer · ${node.outgoing} outgoing module references`,type:'module',group:'components',x:205,y:70+index*26})),
        ...targets.filter(node=>visibleTargets.has(node.id)).map((node,index)=>({key:'target:'+node.id,name:node.name,title:node.name,path:node.path,description:`Dependency · ${node.incoming} incoming module references`,type:node.external?'boundary dependency':'module',group:'files',x:1100,y:70+index*26})),
      ],
      edges:edges.map(edge=>({id:edge.from+'→'+edge.to,source:'source:'+edge.from,target:'target:'+edge.to,route:elastic?'elastic':undefined,routeSettings:{slack:1.025,gravity:.06,damping:.88},effectSettings:{speed:1.1,width:1.3,dash:5,spacing:8,radius:2,glow:4}})),
    };
  },[model,query,elastic,effect]);
  const style={height:'min(650px,65vh)',minHeight:'360px','--network-node':'var(--color-primary)','--network-edge':'var(--color-primary-alt)','--network-text':'var(--color-main-alt-neg)','--network-line':'var(--border-default)'} as CSSProperties;
  return <section aria-label="Repository NetworkGraph">
    <header className="neural-connectors__toolbar"><div><h3>Repository network</h3><p>Global NetworkGraph · importer files → resolved dependencies</p></div><button type="button" className="action-outline" disabled={props.graph_status==='loading'} onClick={props.onLoadGraph}>{props.graph_status==='loading'?'Mapping…':props.references.length?'Refresh graph':'Map imports'}</button></header>
    {props.graph_error&&<p role="status">{props.graph_error}</p>}
    <GraphFootprint data={[{name:'modules',title:'Visible modules',value:model.nodes.length},{name:'links',title:'Visible links',value:data.edges.length},{name:'all-modules',title:'Modules in scope',value:model.allNodes.length}]} />
    <div className="neural-connectors__controls"><label><input type="checkbox" checked={boundary} onChange={event=>setBoundary(event.target.checked)}/> Include boundary dependencies</label><label><input type="checkbox" checked={elastic} onChange={event=>setElastic(event.target.checked)}/> Elastic wires</label><label>Selected wire effect<select value={effect} onChange={event=>setEffect(event.target.value as typeof effect)}><option value="none">None</option><option value="flow">Flow</option><option value="pulse">Pulse</option><option value="crackle">Traveling arc</option></select></label><button type="button" className="action-main" onClick={()=>setSelected(undefined)}>Clear selection</button></div>
    <GraphSearch handleChange={value=>setQuery(value?.search??'')} handleSubmit={value=>setQuery(value?.search??'')} />
    <GraphLegend data={[{name:'importers',title:'Left · importer files'},{name:'dependencies',title:'Right · resolved dependencies'}]} />
    <div className="container-main" style={style}><NetworkGraph key={props.folder.path+':'+(data.nodes.length?'indexed':'empty')} data={data} selected={selected} selectedEffect={effect} handleSelect={node=>setSelected(node?.key)} title={`${props.folder.name} repository import network`} lineStyle={{width:.7,opacity:.23,activeWidth:1.5,activeOpacity:.95,inactiveOpacity:.025}} /></div>
    <p className="scanner-status-ui__meta">Hover or select a module to trace its wires. Elastic geometry and effects use the shared Flow Maker connector engine. Drag to pan, scroll to zoom, double-click to fit. Up to 60 modules are shown; counts are explicit. A module may appear on both sides when it imports and is imported.</p>
    <GraphSelection data={data} selected={selected} handleSelect={node=>setSelected(node?.key)} title="Module connections" />
    <details><summary>Accessible module list · {data.nodes.length} graph nodes</summary><ul>{data.nodes.map(node=><li key={node.key}><button type="button" className="action-main" aria-pressed={selected===node.key} onClick={()=>setSelected(node.key)}>{node.path} · {node.group==='components'?'importer':'dependency'}</button></li>)}</ul></details>
  </section>;
};
