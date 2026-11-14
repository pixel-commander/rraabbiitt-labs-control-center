import type { Runner, RunProps } from '../../../../../../toolkit/Runner.types.ts';
import type { Tool } from '../../../../../../toolkit/Tooling.types.ts';
import { runTools } from '../../_shared/execution.mjs';
import { run as refresh } from '../../tools/refresh-discovery-index/refresh-discovery-index.ts';
import { run as imports } from '../../tools/count-imports/count-imports.ts';
import { run as types } from '../../tools/count-file-types/count-file-types.ts';
import { run as orphans } from '../../tools/list-orphaned-files/list-orphaned-files.ts';
import { scopeOf } from '../../_shared/finders.ts';
import type { FinderSettings } from '../../FilesAndFolders.types.ts';
export const id=1794631064090;
const tools:Record<string,{id:number;run:Tool}>={
 'count-imports':{id:1794630244310,run:imports},'count-file-types':{id:1794630246272,run:types},'list-orphaned-files':{id:1794630248437,run:orphans},
};
export function createWorkflow(settings:Record<string,unknown>):RunProps[]{
 scopeOf(settings as FinderSettings);
 if(settings.refresh!==undefined&&typeof settings.refresh!=='boolean')throw Error('refresh must be boolean.');
 const selected=settings.checks??Object.keys(tools);
 if(!Array.isArray(selected)||!selected.length||selected.some(name=>typeof name!=='string'||!Object.hasOwn(tools,name))||new Set(selected).size!==selected.length)throw Error('checks must contain unique available audit names.');
 const runs:RunProps[]=[];
 if(settings.refresh===true)runs.push({type:'tool',id:1794630039559,name:'refresh-discovery-index',settings:{root:settings.root,save:true,...(settings.message?{message:settings.message}:{})}});
 for(const name of selected){
  const {refresh:_refresh,checks:_checks,...input}=settings;
  runs.push({type:'tool',id:tools[name].id,name,settings:{...input,db:settings.db??true,...(settings.save_file?{save_file:`${settings.save_file}-${name}`}:{})}});
 }
 return [{type:'runner',id,name:'runner-files-and-folders-audits',settings:{...settings,runs}}];
}
export const run:Runner=async(settings,options={})=>{
 let refreshFailed=false;
 return runTools(createWorkflow(settings),async step=>{
  if(step.name==='refresh-discovery-index'){
   const result=await refresh(step.settings);refreshFailed=result.status!=='complete'||!!result.error;return result;
  }
  if(refreshFailed)return {return_type:'results',status:'error',settings:step.settings,error:'Audit skipped: discovery refresh did not complete cleanly. Existing inventory was not used.'};
  if(!step.name||!Object.hasOwn(tools,step.name))throw Error('Unknown audit step.');
  return tools[step.name].run(step.settings);
 },options);
};
