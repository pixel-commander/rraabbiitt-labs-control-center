import { randomUUID } from 'node:crypto';
import { resolve } from 'node:path';
import { subscribeProgress } from './progress.mjs';
import { saveRun } from '../../../../toolkit/runners/save-run/save-run.mjs';

const active = new Set();
export async function handleScan(world, req, res, run) {
  const reject = (status, error) => {res.writeHead(status, {'Content-Type':'application/json'});res.end(JSON.stringify({error}));};
  if (req.method === 'GET') {res.writeHead(200,{'Content-Type':'application/json'});res.end(JSON.stringify({root:world.path,tool_id:1794630039559}));return;}
  if (req.method !== 'POST') return reject(405, 'Use POST.');
  if (!(req.headers['content-type']??'').startsWith('application/json')) return reject(415, 'Use application/json.');
  let settings;
  try {
    const chunks=[];let bytes=0;
    for await(const chunk of req) {bytes+=chunk.length;if(bytes>8192)return reject(413,'Scan settings exceed 8 KB.');chunks.push(chunk);}
    settings=JSON.parse(Buffer.concat(chunks).toString());
    if (!settings || typeof settings.root !== 'string' || !settings.root.trim() ||
      Object.keys(settings).some(key=>!['root','save'].includes(key)) ||
      (settings.save!==undefined && typeof settings.save!=='boolean')) throw Error('Supply root and optional save.');
  } catch(error) {return reject(400,error.message);}
  const rootKey=resolve(settings.root).toLowerCase();
  if(active.has(rootKey))return reject(409,'A scan of this root is already running.');
  active.add(rootKey);
  const scan_id=randomUUID();
  res.writeHead(200,{'Content-Type':'application/x-ndjson','Cache-Control':'no-store','X-Accel-Buffering':'no'});
  let closed=false,last=0,pending,timer;
  const send=event=>{if(!closed && !res.destroyed)res.write(JSON.stringify(event)+'\n');};
  const flush=()=>{clearTimeout(timer);timer=undefined;if(pending){send({type:'progress',scan:pending});pending=undefined;last=Date.now();}};
  const events=[],workers=new Map();let root_read=false;
  const unsubscribe=subscribeProgress(scan_id,event=>{
    workers.set(event.worker,{worker:event.worker,name:event.name,directory:event.directory,state:event.state});
    if(event.phase==='files'||event.phase==='indexing')root_read=true;
    if(event.state!=='scanning')events.push({time:event.timestamp,source:`${event.phase} · Worker ${event.worker} · ${event.name}`,message:event.error??(event.phase==='discovery'?`Folder discovered · ${event.directory}`:event.phase==='indexing'?'Discovery table updated':`${event.directFiles} direct files · ${event.directory}`),error:!!event.error});
    if(events.length>50)events.shift();
    pending={...event,root_read,workers:[...workers.values()],activity:[...events]};
    if(event.worker===0||Date.now()-last>=50)flush();
    else timer??=setTimeout(flush,50);
  });
  res.once('close',()=>{closed=true;});
  send({type:'started',time:Date.now(),root:settings.root});
  try {
    const results=await run({id:1794631061153,content:JSON.stringify({...settings,save:settings.save??true,scan_id}),toolkits:world.toolkits},
      {complete:steps=>saveRun(world,steps)});
    flush();
    const result=results.findLast(step=>step.id===1794630039559 && step.name==='refresh-discovery-index') ?? results.at(-1);
    if(!result)throw Error('The scan returned no result.');
    send({type:'complete',time:Date.now(),result:{...result,response:{...result.response,paths:undefined}}});
  } catch(error) {flush();send({type:'error',time:Date.now(),error:error.message});}
  finally {clearTimeout(timer);unsubscribe();active.delete(rootKey);if(!closed)res.end();}
}
