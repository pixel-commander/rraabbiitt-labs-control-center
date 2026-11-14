import type { Runner, RunProps } from '../../../../../../toolkit/Runner.types.ts';
import { runTools } from '../../_shared/execution.mjs';
import { run as refresh } from '../../tools/refresh-discovery-index/refresh-discovery-index.ts';
import { scopeOf } from '../../_shared/finders.ts';
import type { FinderSettings } from '../../FilesAndFolders.types.ts';
export const id=1794631061153;
export function createWorkflow(settings:Record<string,unknown>):RunProps[]{
 if(settings.root!==undefined&&settings.paths!==undefined)throw Error('Supply root or paths, not both.');
 const roots=settings.paths===undefined?[settings.root]:Array.isArray(settings.paths)?settings.paths.map(row=>row&&typeof row==='object'?(row as {path?:unknown}).path:undefined):[];
 if(!roots.length||roots.some(root=>typeof root!=='string'))throw Error('Supply root, or a nonempty paths array with absolute path values.');
 if(new Set(roots).size!==roots.length)throw Error('Root paths must be unique.');
 for(const root of roots)scopeOf({root} as FinderSettings);
 return [{type:'runner',id,name:'runner-refresh-discovery',settings:{...settings,runs:roots.map(root=>({type:'tool',id:1794630039559,name:'refresh-discovery-index',settings:{root,save:settings.save??true,...(settings.scan_id?{scan_id:settings.scan_id}:{}),...(settings.message?{message:settings.message}:{})}}))}}];
}
export const run:Runner=async(settings,options={})=>runTools(createWorkflow(settings),step=>refresh(step.settings),options);
