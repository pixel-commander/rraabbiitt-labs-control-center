import { useEffect, useMemo, useState } from 'react';
import type { DiscoveryExplorerProps, FolderNode } from './DiscoveryExplorer.types';
import { useDiscovery, useImportGraph } from './hooks/useDiscovery';
import { buildFolderModel, isWithin, parentPath, pathKey } from './js/discovery-model';
import { FolderRow } from '../FolderRow/FolderRow';
import { FolderCharts } from '../FolderCharts/FolderCharts';
import './css/discovery-explorer.css';

export const DiscoveryExplorer=({root,refresh_key=0,className=''}:DiscoveryExplorerProps)=>{
 const discovery=useDiscovery(root,refresh_key),graph=useImportGraph(root),model=useMemo(()=>buildFolderModel(root,discovery.rows),[root,discovery.rows]);
 const [selected,setSelected]=useState(root),[expanded,setExpanded]=useState<Set<string>>(()=>new Set([pathKey(root)])),[query,setQuery]=useState(''),[fileLimit,setFileLimit]=useState(100);
 useEffect(()=>{setSelected(root);setExpanded(new Set([pathKey(root)]));setQuery('');},[root]);
 const folder=model.nodes.get(pathKey(selected))??model.tree;
 const select=(path:string)=>{setSelected(path);setFileLimit(100);};
 const toggle=(path:string)=>setExpanded(previous=>{const next=new Set(previous),key=pathKey(path);if(next.has(key))next.delete(key);else next.add(key);return next;});
 const visible=useMemo(()=>{if(!query.trim())return null;const values=new Set<string>(),term=query.trim().toLowerCase();for(const node of model.nodes.values()){
  if(!node.path.toLowerCase().includes(term)&&!node.files.some(file=>file.name.toLowerCase().includes(term)))continue;
  let current=node.path;while(isWithin(root,current)){values.add(pathKey(current));const parent=parentPath(current);if(parent===current||pathKey(current)===pathKey(root))break;current=parent;}
 }return values;},[model,root,query]);
 const breadcrumbs:FolderNode[]=[];let current:FolderNode|undefined=folder;while(current){breadcrumbs.unshift(current);if(pathKey(current.path)===pathKey(root))break;current=model.nodes.get(pathKey(parentPath(current.path)));}
 const files=folder.files.filter(file=>!query.trim()||file.name.toLowerCase().includes(query.toLowerCase()));
 return <section className={`discovery-explorer ${className}`} aria-label="Filesystem discovery explorer">
  <header className="discovery-explorer__header"><div><p className="discovery-explorer__kicker">DISCOVERY / INDEXED FILESYSTEM</p><h2>Folder layers</h2><p>{model.tree.file_count.toLocaleString()} files · {model.tree.folder_count.toLocaleString()} subfolders · charts derived from saved rows</p></div><label>Find a folder or file<input type="search" value={query} onChange={event=>setQuery(event.target.value)} placeholder="Filter the indexed tree" /></label></header>
  {discovery.loading&&<p role="status">Reading discovery index…</p>}{discovery.error&&<p role="alert" className="container-outline pad">{discovery.error}</p>}{discovery.notice&&<p role="status">{discovery.notice}</p>}
  {!discovery.loading&&!discovery.rows.length&&<div className="container-main pad"><h3>No discovery inventory yet</h3><p>Run the filesystem scan for this root. The explorer reads saved discovery rows; expanding folders does not rescan them.</p></div>}
  {discovery.rows.length>0&&<div className="discovery-explorer__layout">
   <aside className="container-main discovery-explorer__tree"><div className="discovery-explorer__tree-title"><strong>FILESYSTEM</strong><button type="button" className="action-main" onClick={()=>setExpanded(new Set([pathKey(root)]))}>Collapse</button></div><div className="scroll-y discovery-explorer__tree-scroll" tabIndex={0} aria-label="Folder hierarchy"><ul><FolderRow folder={model.tree} selected={folder.path} expanded={expanded} visible={visible} query_active={!!query.trim()} onToggle={toggle} onSelect={select}/></ul>{visible&&visible.size===0&&<p>No indexed folders or files match.</p>}</div></aside>
   <div className="discovery-explorer__inspector">
    <header className="discovery-explorer__folder-head container-main pad"><nav aria-label="Folder breadcrumbs">{breadcrumbs.map(node=><button type="button" className="action-main" key={node.path} onClick={()=>select(node.path)} aria-current={node.path===folder.path?'location':undefined}>{node.name}</button>)}</nav><h3>{folder.name}</h3><code>{folder.path}</code><dl><div><dt>Descendant files</dt><dd>{folder.file_count.toLocaleString()}</dd></div><div><dt>Descendant folders</dt><dd>{folder.folder_count.toLocaleString()}</dd></div><div><dt>Direct files</dt><dd>{folder.files.length.toLocaleString()}</dd></div><div><dt>File types</dt><dd>{folder.types.length}</dd></div></dl></header>
    <FolderCharts folder={folder} root={model.tree} references={graph.references} graph_status={graph.status} graph_error={graph.error} graph_issues={graph.issues} onLoadGraph={graph.load} onSelectFolder={select}/>
    <section className="container-main pad discovery-explorer__files"><h3>Direct files · {files.length.toLocaleString()}</h3><p className="discovery-explorer__muted">Only this folder. Charts above include descendants.</p><div className="discovery-explorer__file-table"><table><thead><tr><th scope="col">Name</th><th scope="col">Type</th><th scope="col">ID</th></tr></thead><tbody>{files.slice(0,fileLimit).map(file=><tr key={file.id??file.name}><td title={file.path}>{file.name}</td><td><code>{file.type||'(none)'}</code></td><td>{file.id}</td></tr>)}</tbody></table></div>{files.length===0&&<p>No matching direct files.</p>}{files.length>fileLimit&&<button type="button" className="action-outline pad" onClick={()=>setFileLimit(previous=>previous+100)}>Show next 100 files</button>}</section>
   </div>
  </div>}
 </section>;
};
