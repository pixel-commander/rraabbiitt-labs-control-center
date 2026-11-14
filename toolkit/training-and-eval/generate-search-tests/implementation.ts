import {readFile,writeFile,realpath} from 'node:fs/promises';
import {resolve,relative,isAbsolute} from 'node:path';
import {DatabaseSync} from 'node:sqlite';
import {createHash} from 'node:crypto';
import {parse as parseYaml} from 'yaml';
import {executeTool as generateTest} from '../generate-react-tests/generate-react-tests.ts';
import type {ToolsProps,ToolReturn} from '../../HouseKeys.types.ts';
// @ts-ignore Existing JavaScript runtime.
import {loadWorld,projectRoot} from '../../../scripts/world.mjs';

const scenarios=[
 ['does-this','Find the component that does this: {q}.','free'],
 ['do-we-have','Do we have something that could {q}?','free'],
 ['how-do-i','How do I {q}? Find the existing implementation or usage instructions.','free'],
 ['prose-request','I need a way to {q}. Find what we already have.','prose'],
 ['short-keywords','Find something for this job: {q}.','keywords'],
 ['vague-memory','I vaguely remember something for {q}. Can you find it?','free'],
 ['teammate-question','A teammate asked for help with {q}. What should I point them to?','prose'],
 ['existing-not-new','Before building anything new, find an existing way to {q}.','free'],
 ['casual','hey, got anything for {q}?','free'],
 ['full-sentence','Please locate an existing capability that can {q}.','prose'],
 ['minimal-query','Find the right thing for {q}.','keywords'],
 ['user-outcome','I want users to be able to {q}. What do we already have?','free'],
 ['maintenance','Where should I look if I need to change how we {q}?','prose'],
 ['usage-guide','Find instructions for using our existing way to {q}.','free'],
 ['not-sure-name','I do not know its name, but I need to {q}. Find it.','free'],
 ['search-prose-only','Find the existing implementation for {q}.','prose'],
 ['search-nouns','Locate something that supports {q}.','keywords'],
 ['brief-context','I am working on a page and need to {q}. What should I use?','free'],
 ['explain-after-finding','Find what handles {q}, then explain how to use it briefly.','prose'],
 ['evidence-first','Locate what lets us {q}. Give a real record or path, not a guess.','free'],
 ['lookup-only','Look up the existing way to {q}; do not run it.','keywords'],
 ['indirect','Which part of our project would help someone {q}?','free'],
 ['workflow','Find the tool or instructions needed to {q}.','prose'],
 ['incomplete-memory','There was a thing for {q}, I think. Can you track it down?','free'],
 ['capability-question','Can our project already {q}? Find the relevant record.','prose'],
 ['compact-query','Search for the existing capability related to {q}.','keywords'],
 ['safety-check','Find a documented way to {q}. If nothing fits, say that rather than inventing it.','free'],
 ['long-context','I am cleaning up an old screen. One small part needs to {q}. Find the existing thing I should reuse.','prose'],
 ['plain-language','In plain language, I need to {q}. Find the matching component, tool, or guide.','free'],
 ['startup-help','How do I create a React app and get it running locally? Find the startup tool or its usage instructions.','prose'],
 ['tabs-maintenance','How do I update the tabs nav, like adding another tab and changing which one is selected? Find its usage instructions.','free']
] as const;
const words=(s:string)=>s.trim().split(/\s+/).filter(Boolean);
const sha=(s:string)=>createHash('sha256').update(s).digest('hex');
export function seededRandom(seed:number){let state=seed>>>0;return()=>{state=(Math.imul(state,1664525)+1013904223)>>>0;return state/4294967296;};}
export async function executeTool(settings:ToolsProps):Promise<ToolReturn>{
 try{
  if(typeof settings.save_path!=='string'||!settings.save_path.trim())throw Error('save_path is required.');
  const parent=await realpath(settings.save_path),rel=relative(projectRoot,parent);
  if(rel!== '..'&&!rel.startsWith('..\\')&&!rel.startsWith('../')&&!isAbsolute(rel))throw Error('Save generated tests outside the code repository.');
  const count=Number(settings.count??31),seed=Number(settings.seed??Date.now());
  if(!Number.isInteger(count)||count<1||count>31||!Number.isSafeInteger(seed))throw Error('Use count 1–31 and an integer seed.');
  const random=seededRandom(seed),world=await loadWorld(),entry=world.paths.find((x:any)=>x.name==='database');
  const db=new DatabaseSync(resolve(world.path,entry.path,entry.file),{readOnly:true});let records:any[];
  try{records=(db.prepare('SELECT data FROM records ORDER BY id').all() as any[]).map(r=>JSON.parse(r.data));}finally{db.close();}
  const candidates=records.filter(r=>['component','tool','runner','skill'].includes(r.type)&&typeof r.description==='string'&&words(r.description).length>=8&&!r.path?.includes('training-and-eval'));
  const used=new Set<number>(),paths:any[]=[],manifest:any[]=[];
  const url=String(settings.url??'http://127.0.0.1:11434'),model=String(settings.model??'qwen2.5-14b:latest');
  const server=new URL(url);if(!['localhost','127.0.0.1','[::1]'].includes(server.hostname))throw Error('Use a local model server.');
  const tags=await (await fetch(`${server.origin}/api/tags`)).json();const installed=tags.models?.find((m:any)=>m.name===model);if(!installed?.digest)throw Error('Rewording model is not installed.');
  for(let i=0;i<count;i++){
   const [variant,frame,style]=scenarios[i];
   const kind=['component','tool','skill'][i%3];
   let pool=candidates.filter(r=>!used.has(r.id)&&(kind==='tool'?['tool','runner'].includes(r.type):r.type===kind));
   if(i===29)pool=records.filter(r=>['tool','runner','skill'].includes(r.type)&&/starts? (?:the |a |local-)?(?:app|server)|npm run dev|startup|install.*start/i.test([r.description,r.instructions].join(' ')));
   if(i===30)pool=records.filter(r=>r.type==='component'&&/^TabNav$/i.test(r.name));
   if(!pool.length)throw Error(`No catalog target for ${variant}.`);
   const record=pool[Math.floor(random()*pool.length)];used.add(record.id);
   const name=`search-${seed}-${String(i+1).padStart(2,'0')}-${variant}`;
   const destination=resolve(parent,name);
   try {
    const prior=JSON.parse(await readFile(resolve(destination,'source.json'),'utf8'));
    const priorTest=JSON.parse(await readFile(resolve(destination,'test.json'),'utf8'));
    if(prior.seed!==seed||prior.variant!==variant||prior.record?.id!==record.id||prior.source_sha256!==sha(JSON.stringify(record)))throw Error(`Existing output does not match this catalog: ${name}`);
    paths.push({id:priorTest.id,name,path:destination,file:'test.json',type:'evaluation-test'});
    manifest.push({name,target_id:record.id,type:record.type,variant,query_style:style});
    continue;
   } catch(error) { if((error as any).code!=='ENOENT')throw error; }
   // Only attached skills and explicit owner/implementation relations count as nearby.
   let near=record.skills?.find((s:any)=>s.instructions)||records.find(r=>r.type==='skill'&&r.owner?.id===record.id)|| (record.type==='skill'?record:undefined);
   if(record.type!=='skill') {
    const adjacent=resolve(projectRoot,record.path,'use.skill.yaml');
    const child=relative(projectRoot,adjacent);
    if(child==='..'||child.startsWith('..\\')||child.startsWith('../')||isAbsolute(child))throw Error('Adjacent skill escapes the project.');
    try {
     const actual=await realpath(adjacent),within=relative(projectRoot,actual);
     if(within==='..'||within.startsWith('..\\')||within.startsWith('../')||isAbsolute(within))throw Error('Adjacent skill resolves outside the project.');
     const raw=await readFile(actual,'utf8');const skill=parseYaml(raw);
     if(typeof skill?.instructions==='string')near={...skill,path:relative(projectRoot,actual).replaceAll('\\','/'),source_sha256:sha(raw)};
    }catch(error){if((error as any).code!=='ENOENT')throw error;}
   }
   const description=record.description;
   const forbidden=[record.name,record.title].filter((s:any)=>typeof s==='string'&&s.length>=3&&(/\B[A-Z]|[-_]/.test(s)||words(s).length>=2));
   let paraphrase='',rejected='';
   for(let attempt=0;attempt<3;attempt++){
    const response=await fetch(`${server.origin}/api/chat`,{method:'POST',headers:{'Content-Type':'application/json'},signal:AbortSignal.timeout(60000),body:JSON.stringify({model,stream:false,format:'json',options:{temperature:0,seed:seed+i+attempt,num_predict:240},messages:[{role:'system',content:'Rewrite the task as a short, vague capability phrase that can follow "I need to". Return JSON {"phrase":"..."}. Use 3 to 8 words, fewer words than the source description. Remove implementation details, names, IDs and paths. Preserve the core purpose. Do not invent a new feature.'},{role:'user',content:JSON.stringify({description,nearby_usage:near?.instructions?.slice(0,900)??'',avoid:forbidden,feedback:attempt?`Rejected output: ${rejected}. Use 3 to ${Math.min(8,words(description).length-1)} words. Do not include the listed names, long IDs, or slashes.`:''})}]})});
    if(!response.ok)throw Error(`Rewording model HTTP ${response.status}.`);
    const answer=await response.json();try{paraphrase=JSON.parse(answer.message.content).phrase;}catch{continue;}
    rejected=String(paraphrase);
    if(typeof paraphrase==='string'&&words(paraphrase).length>=3&&words(paraphrase).length<=8&&words(paraphrase).length<words(description).length&&!forbidden.some((s:string)=>paraphrase.toLowerCase().includes(s.toLowerCase()))&&!/\d{8,}|[\\/]/.test(paraphrase))break;
    paraphrase='';
   }
   if(!paraphrase)throw Error(`Could not produce a valid shorter paraphrase for ${record.id}: ${rejected}. Earlier generated tests are retained.`);
   const instruction=style==='prose'?'Use a complete natural-language sentence of at least six words for each actual content-search query. Do not reduce the query to keywords.':style==='keywords'?'Use keyword queries of no more than five words for actual content searches.':'Choose your own search wording.';
   const prompt=`${frame.replace('{q}',paraphrase)}\n\n${instruction} Search the project records, not just the executable-tool catalog. Find evidence before answering. Do not execute the capability you find or change files.`;
   const ids=[...new Set([record.id,near?.id,record.type==='skill'?record.owner?.id:undefined].filter(Number.isSafeInteger))];
   const checks:any[]=[{name:'find-expected-record',validator:'search-target',settings:{ids,top_k:10}}];
   if(style!=='free')checks.push({name:'query-style',validator:'search-query-style',settings:{style}});
   const result=await generateTest({name,title:`Search ${i+1}: ${variant}`,description:'Generated search benchmark. Expected targets and source evidence are withheld from the model prompt.',save_path:parent,prompt,tags:['search',record.type,style,'generated'],setup:{fresh_chat:true,tool_ids:[1793154927345]},limits:{seconds:120,tool_calls:16,human_interventions:0},checks});
   if(result.status!=='complete')throw Error(result.error);
   const folder=result.response!.path!;
   const provenance={seed,variant,query_style:style,record:{id:record.id,name:record.name,type:record.type,path:record.path,description},nearby_skill:near??null,source_sha256:sha(JSON.stringify(record)),paraphrase,rewording_model:{name:model,digest:installed.digest},review_required:true};
   await writeFile(resolve(folder,'source.json'),JSON.stringify(provenance,null,2)+'\n',{flag:'wx'});
   await writeFile(resolve(folder,'README.md'),`# Search test: ${variant}\n\n## Model request\n\n${prompt}\n\n## Human review\n\nThe source record and linked usage skill are in source.json.\nReview the shorter phrase for semantic drift before treating this test as a benchmark.\nThe target check measures retrieval in the first ten results. It does not grade the final explanation.\nThe query-style check measures word count, not grammar.\nExpected IDs are not included in the model prompt.\n`,{flag:'w'});
   paths.push({id:result.response!.id,name,path:folder,file:'test.json',type:'evaluation-test'});
   manifest.push({name,target_id:record.id,type:record.type,variant,query_style:style});
  }
  const manifestFile=`search-${seed}-manifest.json`;
  const manifestText=JSON.stringify({seed,count,tests:manifest},null,2)+'\n';
  try {await writeFile(resolve(parent,manifestFile),manifestText,{flag:'wx'});}
  catch(error){if((error as any).code!=='EEXIST'||await readFile(resolve(parent,manifestFile),'utf8')!==manifestText)throw error;}
  const index=`# Search tests: ${seed}\n\nGenerated from real component, tool, runner, and skill records.\nReview source.json before accepting each shortened request as a fair benchmark.\n\n| Test | Target type | Query instructions |\n| --- | --- | --- |\n${manifest.map(t=>`| [${t.name}](${t.name}/README.md) | ${t.type} | ${t.query_style} |`).join('\n')}\n\nThe checks measure target retrieval and query word count. They do not grade the final explanation.\n`;
  const indexPath=resolve(parent,`search-${seed}-index.md`);
  try{await writeFile(indexPath,index,{flag:'wx'});}catch(error){if((error as any).code!=='EEXIST')throw error;}
  return {return_type:'results',status:'complete',settings,response:{name:'search-tests',path:parent,file:manifestFile,paths,summary:{count:paths.length}}};
 }catch(error){return {return_type:'results',status:'error',settings,error:error instanceof Error?error.message:String(error)};}
}
