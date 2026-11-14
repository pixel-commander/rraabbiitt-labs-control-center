import { useEffect, useRef, useState } from 'react';
import type { FinderConsoleProps } from './FinderConsole.types';
import type { RunResponse } from '../../../../../toolkit/Runner.types';
import type { PathsProps } from '../../../../HouseKeys.types';
import './css/finder-console.css';
const names=['find-files-and-folders','find-in-files','count-imports','count-file-types','list-orphaned-files'];
interface Preset extends PathsProps {id:number;name:string;tool:string;settings:Record<string,unknown>}
async function call(name:string,settings:Record<string,unknown>,signal?:AbortSignal):Promise<RunResponse[]>{
 const response=await fetch('/api/files-and-folders/tools',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({name,settings}),signal});
 const result=await response.json();if(!response.ok)throw Error(result.error??'Tool request failed.');return result;
}
export const FinderConsole=({root}:FinderConsoleProps)=>{
 const [tool,setTool]=useState(names[0]),[path,setPath]=useState(''),[name,setName]=useState(''),[type,setType]=useState(''),[db,setDb]=useState(true);
 const [mode,setMode]=useState('ast'),[presets,setPresets]=useState<Preset[]>([]),[presetName,setPresetName]=useState('');
 const [results,setResults]=useState<RunResponse[]>([]),[pending,setPending]=useState(false),[error,setError]=useState(''),[notice,setNotice]=useState('');
 const busy=useRef(false);
 const settings=()=>({root,...(path?{path}:{}),...(name?{name}:{}),...(type?{type}:{}),db,...(tool==='find-in-files'?{mode}:{})});
 useEffect(()=>{setPresets([]);if(!root)return;const controller=new AbortController();call('finder-presets',{action:'list',root,favorite:true},controller.signal).then(r=>setPresets((r.at(-1)?.response?.paths??[]) as Preset[])).catch(e=>{if(!controller.signal.aborted)setError(e.message);});return()=>controller.abort();},[root]);
 const execute=async(action:string,values:Record<string,unknown>)=>{
  if(busy.current)return;busy.current=true;setPending(true);setError('');setNotice('');
  try{const returned=await call(action,values);setResults(returned.filter(step=>step.name!=='tool-loader'));if(returned.some(step=>step.status==='error'||step.error))setError('Some steps need attention. See their returns below.');return returned;}
  catch(e){setError(e instanceof Error?e.message:String(e));}
  finally{busy.current=false;setPending(false);}
 };
 const save=async()=>{
  if(!presetName.trim())return setError('Enter a name for the favorite finder.');
  const result=await execute('finder-presets',{action:'save',name:presetName.trim(),tool,settings:settings(),favorite:true});
  if(result?.at(-1)?.status==='complete'&&!result.at(-1)?.error){try{const list=await call('finder-presets',{action:'list',root,favorite:true});setPresets((list.at(-1)?.response?.paths??[]) as Preset[]);setNotice('Favorite saved.');setPresetName('');}catch(error){setError(error instanceof Error?error.message:String(error));}}
 };
 return <section className="finder-console container-main pad">
  <header><h2>Finders and audits</h2><p>Search the discovery database or crawl files. Every execution uses the shared runner.</p></header>
  <div className="finder-console__favorites"><strong>Favorite finders</strong>{!presets.length&&<span>No favorites for this root yet.</span>}{presets.map(p=><button key={p.id} type="button" className="action-outline" disabled={pending} onClick={()=>{setTool(p.tool);setPath(String(p.settings.path??''));setName(String(p.settings.name??''));setType(String(p.settings.type??''));setDb(p.settings.db===true);setMode(String(p.settings.mode??'ast'));setNotice(`Loaded ${p.name}. Select Run finder to execute.`);}}>{p.name}</button>)}</div>
  <form onSubmit={event=>{event.preventDefault();void execute(tool,settings());}}>
   <label>Tool<select value={tool} onChange={e=>setTool(e.target.value)}>{names.map(n=><option key={n}>{n}</option>)}</select></label>
   <label>Folder within root<input value={path} onChange={e=>setPath(e.target.value)} placeholder="All folders" /></label>
   <label>{tool==='find-in-files'?'Text or identifier':'Name / import source'}<input value={name} onChange={e=>setName(e.target.value)} required={tool==='find-in-files'} placeholder={tool==='find-in-files'?'Chart':'Optional match'} /></label>
   <label>Extension<input value={type} onChange={e=>setType(e.target.value)} placeholder="tsx" /></label>
   {tool==='find-in-files'&&<label>Search mode<select value={mode} onChange={e=>setMode(e.target.value)}><option value="ast">AST nodes</option><option value="text">Literal text</option></select></label>}
   <label className="finder-console__checkbox"><input type="checkbox" checked={db} onChange={e=>setDb(e.target.checked)} /> Search database inventory</label>
   <button type="submit" className="action-main" disabled={pending||!root}>{pending?'Running…':'Run finder'}</button>
  </form>
  <div className="finder-console__actions"><label>Favorite name<input value={presetName} onChange={e=>setPresetName(e.target.value)} placeholder="My TSX finder" /></label><button type="button" className="action-outline" disabled={pending||!root} onClick={()=>void save()}>Save favorite</button><button type="button" className="action-outline" disabled={pending||!root} onClick={()=>void execute('runner-files-and-folders-audits',{root,db:true})}>Run indexed audits</button></div>
  {error&&<p role="alert">{error}</p>}{notice&&<p role="status">{notice}</p>}
  {results.map((step,index)=><details key={index} open={results.length===1}><summary>{step.name} · {step.status} · {step.response?.summary?.count??0} matches / {step.response?.summary?.total??'—'} checked</summary>{step.error&&<p role="alert">{step.error}</p>}<pre>{JSON.stringify(step.response,null,2)}</pre></details>)}
 </section>;
};
