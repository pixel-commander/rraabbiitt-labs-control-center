import { useEffect, useState } from 'react';
import type { DiscoveryRow, ImportReference, ImportGraphIssue } from '../DiscoveryExplorer.types';
export const useDiscovery=(root:string,refresh_key=0)=>{
 const [state,setState]=useState<{root:string;rows:DiscoveryRow[];loading:boolean;error?:string;notice?:string}>({root,rows:[],loading:false});
 useEffect(()=>{
  if(!root.trim()){setState({root,rows:[],loading:false});return;}
  const controller=new AbortController();setState(previous=>({...previous,root,rows:previous.root===root?previous.rows:[],loading:true,error:undefined}));
  const load=async()=>{
   const rows:DiscoveryRow[]=[],notices=new Set<string>();let offset=0,more=true;
   while(more){
    const response=await fetch('/api/files-and-folders/discovery?'+new URLSearchParams({root,limit:'100000',offset:String(offset)}),{signal:controller.signal});
    const value=await response.json();if(!response.ok||value.status==='error')throw Error(value.error??'Could not read discovery.');
    if(!Array.isArray(value.response?.paths))throw Error('Discovery did not return file and folder rows.');
    const body=typeof value.response.body==='string'?JSON.parse(value.response.body):value.response.body;
    if(value.error)notices.add(value.error);if(body?.notice)notices.add(body.notice);
    if(body?.errors?.length)notices.add(`${body.errors.length} inventory errors were reported.`);
    rows.push(...value.response.paths);more=body?.truncated===true;
    if(more&&!value.response.paths.length)throw Error('Discovery pagination did not advance.');
    offset=rows.length;
    if(more&&offset>=500000){notices.add(`Partial visualization: showing ${offset.toLocaleString()} of ${Number(value.response.summary?.total??offset).toLocaleString()} indexed rows. Narrow the scan root for complete charts.`);break;}
   }
   if(!controller.signal.aborted)setState({root,rows,loading:false,notice:[...notices].join(' ')||undefined});
  };
  void load().catch(error=>{if(!controller.signal.aborted)setState(previous=>({...previous,loading:false,error:error.message}));});
  return()=>controller.abort();
 },[root,refresh_key]);
 return state;
};
export const useImportGraph=(root:string)=>{
 const [state,setState]=useState<{status:'idle'|'loading'|'complete'|'error';references:ImportReference[];issues:ImportGraphIssue[];error?:string}>({status:'idle',references:[],issues:[]});
 const [request,setRequest]=useState({root,id:0});
 useEffect(()=>{setState({status:'idle',references:[],issues:[]});},[root]);
 useEffect(()=>{
  if(!request.id||request.root!==root||!root)return;
  const controller=new AbortController();setState(previous=>({...previous,status:'loading',error:undefined}));
  fetch('/api/files-and-folders/tools',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({name:'count-imports',settings:{root,db:true,limit:10000}}),signal:controller.signal}).then(async response=>{
   const value=await response.json();if(!response.ok)throw Error(value.error??'Import mapping failed.');
   const steps=Array.isArray(value)?value:Array.isArray(value.response?.body)?value.response.body:Array.isArray(value.runs)?value.runs:[];
   const result=steps.findLast((step:{name?:string})=>step.name==='count-imports')??(value.response?value:undefined);
   if(!result||result.status==='error')throw Error(result?.error??'No count-imports result was returned.');
   const body=typeof result.response?.body==='string'?JSON.parse(result.response.body):result.response?.body;
   const references=Array.isArray(body?.references)?body.references:[];
   const issues:ImportGraphIssue[]=Array.isArray(body?.errors)?body.errors.filter((item:unknown):item is ImportGraphIssue=>!!item&&typeof item==='object'&&typeof (item as ImportGraphIssue).error==='string'):[];
   const error=issues.length?`${issues.length} source files or references need review; resolved connections are still shown.`:result.error?'The import map completed with a reporting warning. Resolved connections are still shown.':undefined;
   if(result.error&&!issues.length)issues.push({error:/response\.body|orphan/i.test(result.error)?'The tool reported a warning without file-level details. Resolved connections remain available.':result.error});
   if(!controller.signal.aborted)setState({status:error?'error':'complete',references,issues,error});
  }).catch(error=>{if(!controller.signal.aborted)setState(previous=>({...previous,status:'error',error:error.message}));});
  return()=>controller.abort();
 },[root,request]);
 return {...state,load:()=>setRequest(previous=>({root,id:previous.id+1}))};
};
