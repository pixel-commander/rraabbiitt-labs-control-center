import { DatabaseSync } from 'node:sqlite';
import { dirname, basename } from 'node:path';
import type { ToolsProps, ToolReturn } from '../../../../../toolkit/Tooling.types';
import { scopeOf } from './finders.ts';
import type { FinderSettings } from '../FilesAndFolders.types';
// @ts-expect-error Node runtime module.
import { databaseLocation } from './discovery-store.mjs';
// @ts-expect-error Node runtime module.
import { executeTool as newTable } from '../../../../../toolkit/tools/new-db-table/new-db-table.mjs';
const toolIds:Record<string,number>={'find-files-and-folders':1794629751709,'find-in-files':1794629753991,'count-imports':1794630244310,'count-file-types':1794630246272,'list-orphaned-files':1794630248437};
const object=(value:unknown):value is Record<string,unknown>=>!!value&&typeof value==='object'&&!Array.isArray(value);
export async function presetOperation(input:ToolsProps,databaseFile?:string):Promise<ToolReturn>{
 const action=input.action??'list';
 if(!['list','save'].includes(String(action)))throw Error('action must be list or save.');
 for(const field of ['name','title','description','root'] as const)if(input[field]!==undefined&&typeof input[field]!=='string')throw Error(field+' must be a string.');
 if(input.id!==undefined&&(!Number.isSafeInteger(input.id)||input.id<1))throw Error('id must be a positive House ID.');
 if(input.favorite!==undefined&&typeof input.favorite!=='boolean')throw Error('favorite must be boolean.');
 const file=databaseFile??await databaseLocation();
 let db=new DatabaseSync(file);
 const present=!!db.prepare("SELECT 1 FROM sqlite_master WHERE name='finder_presets'").get();db.close();
 if(!present){const created=await newTable({path:dirname(file),file:basename(file),name:'finder_presets'});if(created.status!=='complete'&&!created.error?.includes('already exists'))throw Error(created.error);}
 db=new DatabaseSync(file);
 try{
  db.exec('PRAGMA busy_timeout=5000; BEGIN IMMEDIATE');
  const columns=new Set(db.prepare('PRAGMA table_info(finder_presets)').all().map(row=>row.name));
  for(const [name,type]of [['tool_id','INTEGER'],['tool','TEXT'],['settings',"TEXT NOT NULL DEFAULT '{}' CHECK(json_valid(settings) AND json_type(settings)='object')"],['favorite','INTEGER NOT NULL DEFAULT 1 CHECK(favorite IN (0,1))'],['date_added','INTEGER'],['date_updated','INTEGER']])if(!columns.has(name))db.exec(`ALTER TABLE finder_presets ADD COLUMN ${name} ${type}`);
  const decode=(row:Record<string,unknown>)=>({...row,id:Number(row.id),name:String(row.name),path:String(row.path),tags:JSON.parse(String(row.tags??'[]')),paths:JSON.parse(String(row.paths??'[]')),settings:JSON.parse(String(row.settings)),favorite:row.favorite===1});
  let rows:Record<string,unknown>[];
  if(action==='list'){
   const clauses:string[]=[],params:(string|number)[]=[];
   if(input.id!==undefined){clauses.push('id=?');params.push(input.id);}
   if(input.root!==undefined){clauses.push('path=?');params.push(String(input.root));}
   if(input.favorite!==undefined){clauses.push('favorite=?');params.push(input.favorite?1:0);}
   rows=db.prepare('SELECT * FROM finder_presets'+(clauses.length?' WHERE '+clauses.join(' AND '):'')+' ORDER BY name,id').all(...params);
  }else{
   if(typeof input.name!=='string'||!input.name.trim())throw Error('name is required when saving a preset.');
   if(typeof input.tool!=='string'||!Object.hasOwn(toolIds,input.tool))throw Error('tool must name a Files and Folders finder or counter.');
   if(!object(input.settings))throw Error('settings must be a finder settings object.');
   const settings=input.settings as FinderSettings;scopeOf(settings);
   if(input.tool==='find-in-files'&&(typeof settings.name!=='string'||!settings.name.trim()))throw Error('Content finder presets need settings.name.');
   const saved=JSON.stringify(settings);if(Buffer.byteLength(saved)>16384)throw Error('Preset settings exceed 16 KB.');
   const old=input.id===undefined?undefined:db.prepare('SELECT * FROM finder_presets WHERE id=?').get(input.id);
   if(input.id!==undefined&&!old)throw Error('Preset ID does not exist.');
   if(input.id===undefined&&db.prepare('SELECT id FROM finder_presets WHERE name=? AND path=?').get(input.name.trim(),settings.root))throw Error('A preset with this name and root already exists; supply its id to update.');
   const id=input.id??Math.max(Date.now(),Number(db.prepare('SELECT max(id) AS id FROM finder_presets').get()?.id??0)+1),date=Date.now();
   db.prepare(`INSERT INTO finder_presets(id,name,title,type,description,path,tool_id,tool,settings,favorite,date_added,date_updated)
     VALUES(?,?,?,?,?,?,?,?,?,?,?,?) ON CONFLICT(id) DO UPDATE SET name=excluded.name,title=excluded.title,description=excluded.description,path=excluded.path,tool_id=excluded.tool_id,tool=excluded.tool,settings=excluded.settings,favorite=excluded.favorite,date_updated=excluded.date_updated`).run(
     id,input.name.trim(),input.title??input.name.trim(),'finder-preset',input.description??'',settings.root,toolIds[input.tool],input.tool,saved,input.favorite===false?0:1,Number(old?.date_added??date),date);
   rows=[db.prepare('SELECT * FROM finder_presets WHERE id=?').get(id)!];
  }
  db.exec('COMMIT');
  return {return_type:'results',status:'complete',settings:input,response:{response_type:'list',paths:rows.map(decode),summary:{count:rows.length,total:rows.length}}};
 }catch(error){db.exec('ROLLBACK');throw error;}finally{db.close();}
}
