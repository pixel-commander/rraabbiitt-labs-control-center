import assert from 'node:assert/strict';
import { test } from 'node:test';
import { mkdtemp, mkdir, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { scanFilesAndFolders } from './engine.ts';
import { saveDiscovery } from '../../_shared/discovery-store.mjs';

test('folder pass finishes before three workers read files; shared ignores stay excluded',async()=>{
 const root=await mkdtemp(join(tmpdir(),'discovery-scan-'));
 try{
  await writeFile(join(root,'Root.tsx'),'export const Root=1');
  for(const name of ['a','b','c','d']){await mkdir(join(root,name,'nested'),{recursive:true});await writeFile(join(root,name,'nested','File.tsx'),'export const File=1');}
  await mkdir(join(root,'node_modules','hidden'),{recursive:true});await writeFile(join(root,'node_modules','bad.ts'),'no');
  const events=[],active=new Set();let peak=0;
  const result=await scanFilesAndFolders({root,save:false},{progress:async event=>{
   events.push(event);
   if(event.phase==='files' && event.state==='scanning'){assert.ok(!active.has(event.worker));active.add(event.worker);peak=Math.max(peak,active.size);await new Promise(resolve=>setTimeout(resolve,5));}
   if(event.phase==='files' && event.state!=='scanning')active.delete(event.worker);
  }});
  assert.equal(result.status,'complete');assert.equal(result.error,undefined);
  assert.equal(result.response.paths.filter(p=>p.file).length,5);
  assert.equal(result.response.paths.find(p=>p.file==='Root.tsx').size,Buffer.byteLength('export const Root=1'));
  assert.ok(result.response.paths.filter(p=>p.file).every(p=>Number.isSafeInteger(p.size)&&p.size>=0));
  assert.ok(result.response.paths.some(p=>p.name==='File.tsx'&&p.type==='tsx'));
  assert.ok(!result.response.paths.some(p=>p.path.includes('node_modules')));
  const first=events.findIndex(e=>e.phase==='files');assert.ok(first>0);
  assert.ok(events.slice(first).every(e=>e.phase!=='discovery'));
  const folderRows=result.response.paths.filter(p=>p.type==='folder');
  assert.equal(events.filter(e=>e.phase==='files'&&e.state==='read').length,folderRows.length);
  assert.equal(peak,3);assert.ok(events.at(-1).branches.every(b=>b.state==='complete'&&b.pending===0));
 }finally{await rm(root,{recursive:true,force:true});}
});

test('discovery preserves IDs, replaces one root only and rolls back failed updates',async()=>{
 const root=await mkdtemp(join(tmpdir(),'discovery-store-')),file=join(root,'test.sqlite');
 const db=new DatabaseSync(file);db.exec('PRAGMA user_version=1');db.close();
 try{
  const rows=[{path:root,name:'Folder',type:'folder'},{path:root,name:'File.tsx',file:'File.tsx',type:'tsx',size:123}];
  const first=await saveDiscovery(file,root,rows),second=await saveDiscovery(file,root,rows);
  assert.deepEqual(first.map(r=>r.id),second.map(r=>r.id));assert.ok(first.every(r=>Number.isSafeInteger(r.id)));
  await saveDiscovery(file,'another-root',[{path:'another-root',name:'other.ts',file:'other.ts',type:'ts'}]);
  await assert.rejects(saveDiscovery(file,root,[rows[0],rows[0]]));
  const check=new DatabaseSync(file,{readOnly:true});
  try{assert.equal(check.prepare('SELECT COUNT(*) AS n FROM discovery').get().n,3);assert.equal(check.prepare("SELECT size FROM discovery WHERE file='File.tsx'").get().size,123);assert.equal(check.prepare("SELECT size FROM discovery WHERE type='folder'").get().size,null);}finally{check.close();}
 }finally{await rm(root,{recursive:true,force:true});}
});
