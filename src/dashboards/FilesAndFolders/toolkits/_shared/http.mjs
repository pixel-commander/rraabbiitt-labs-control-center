import { URL } from 'node:url';
import { inventory } from './finders.ts';
import { saveRun } from '../../../../../toolkit/runners/save-run/save-run.mjs';
export const toolkitIds={
 'refresh-discovery-index':1794630039559,'find-files-and-folders':1794629751709,'find-in-files':1794629753991,
 'finder-presets':1794629756361,'count-imports':1794630244310,'count-file-types':1794630246272,'list-orphaned-files':1794630248437,
 'runner-refresh-discovery':1794631061153,'runner-files-and-folders-audits':1794631064090,
};
const object=value=>value!==null&&typeof value==='object'&&!Array.isArray(value);
export async function handleToolkit(world,req,res,run){
 const send=(code,body)=>{res.writeHead(code,{'Content-Type':'application/json','Cache-Control':'no-store'});res.end(JSON.stringify(body));};
 const url=new URL(req.url,'http://localhost');
 try{
  if(url.pathname==='/api/files-and-folders/discovery'){
   if(req.method!=='GET')return send(405,{error:'Use GET.'});
   const allowed=new Set(['root','path','limit','offset']);
   if([...url.searchParams.keys()].some(key=>!allowed.has(key)||url.searchParams.getAll(key).length!==1))return send(400,{error:'Use one root, optional path, limit and offset.'});
   const root=url.searchParams.get('root'),path=url.searchParams.get('path')??undefined;
   if(!root)return send(400,{error:'root is required.'});
   const limit=Number(url.searchParams.get('limit')??100000),offset=Number(url.searchParams.get('offset')??0);
   if(!Number.isSafeInteger(limit)||limit<1||limit>100000||!Number.isSafeInteger(offset)||offset<0)return send(400,{error:'Use limit 1–100000 and a nonnegative offset.'});
   const settings={root,path,db:true};
   let data;
   try{data=await inventory(settings);}catch(error){
    if(/No saved discovery|Refresh discovery before/.test(error.message))return send(200,{return_type:'results',status:'complete',settings,response:{response_type:'list',paths:[],summary:{count:0,total:0},body:JSON.stringify({state:'not-indexed',complete:false,root,notice:error.message})}});
    throw error;
   }
   const rows=data.rows.filter(row=>!row.error),selected=rows.slice(offset,offset+limit);
   return send(200,{return_type:'results',status:'complete',settings,response:{response_type:'list',paths:selected,summary:{count:selected.length,total:rows.length},body:JSON.stringify({state:data.state,complete:offset===0&&selected.length===rows.length,root,path,offset,limit,truncated:offset+selected.length<rows.length,errors:data.errors})}});
  }
  if(url.pathname!=='/api/files-and-folders/tools')return send(404,{error:'Unknown Files and Folders route.'});
  if(req.method!=='POST')return send(405,{error:'Use POST.'});
  if(!(req.headers['content-type']??'').startsWith('application/json'))return send(415,{error:'Use application/json.'});
  let bytes=0;const chunks=[];
  for await(const chunk of req){bytes+=chunk.length;if(bytes>65536)return send(413,{error:'Tool request exceeds 64 KB.'});chunks.push(chunk);}
  let request;try{request=JSON.parse(Buffer.concat(chunks).toString());}catch{return send(400,{error:'Supply valid JSON.'});}
  if(!object(request)||Object.keys(request).some(key=>!['name','settings'].includes(key))||typeof request.name!=='string'||!Object.hasOwn(toolkitIds,request.name)||!object(request.settings))return send(400,{error:'Supply an allowed toolkit name and settings object.'});
  const results=await run({id:toolkitIds[request.name],content:JSON.stringify(request.settings),toolkits:world.toolkits},{complete:steps=>saveRun(world,steps)});
  return send(200,results);
 }catch(error){return send(400,{error:error instanceof Error?error.message:String(error)});}
}
