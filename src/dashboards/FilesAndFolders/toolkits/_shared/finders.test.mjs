import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,mkdir,writeFile,readFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {DatabaseSync} from 'node:sqlite';
import {fileFinder,contentFinder,importsFinder,orphansFinder,typesFinder,inventory,responseFor} from './finders.ts';
import {presetOperation} from './presets.ts';
import {saveDiscovery} from './discovery-store.mjs';
import {createWorkflow as refreshPlan} from '../runners/runner-refresh-discovery/runner-refresh-discovery.ts';
import {createWorkflow as auditPlan,run as auditRun} from '../runners/runner-files-and-folders-audits/runner-files-and-folders-audits.ts';
const fixture=async t=>{const root=await mkdtemp(join(tmpdir(),'finder-kit-'));t.after(()=>rm(root,{recursive:true,force:true}));return root;};
const database=file=>{const db=new DatabaseSync(file);db.exec('PRAGMA user_version=1');db.close();};

test('finder scopes name/extension and rejects a path outside the root',async t=>{
 const root=await fixture(t);await mkdir(join(root,'src'));await writeFile(join(root,'src','Chart.tsx'),'export const Chart=1');await writeFile(join(root,'Chart.ts'),'export {}');
 const result=await fileFinder({root,path:'src',name:'chart',type:'.tsx'});assert.equal(result.count,1);assert.equal(result.paths[0].name,'Chart.tsx');assert.equal(result.paths[0].path,join(root,'src'));
 await assert.rejects(fileFinder({root,path:'..'}),/inside root/);await assert.rejects(fileFinder({root,db:'true'}),/boolean/);
});
test('AST finds actual identifiers while text mode also sees comments; pagination keeps full summary',async t=>{
 const root=await fixture(t);await writeFile(join(root,'Chart.tsx'),'// Chart comment\nexport const Chart=()=> <div/>;\n');
 const ast=await contentFinder({root,name:'Chart',type:'tsx'}),text=await contentFinder({root,name:'Chart',type:'tsx',mode:'text'});
 assert.equal(ast.count,1);assert.equal(ast.paths[0].kind,'Identifier');assert.equal(ast.paths[0].line,2);assert.equal(text.count,2);
 const paged=await responseFor({root,limit:1},text);assert.equal(paged.response.summary.count,2);assert.equal(paged.response.paths.length,1);assert.equal(JSON.parse(paged.response.body).returned,1);
});
test('AST import graph counts imports, re-exports, dynamic imports and reverse references',async t=>{
 const root=await fixture(t);await writeFile(join(root,'Main.ts'),"import {Chart} from './Chart'; export {Chart as Other} from './Chart'; void import('./Lazy'); export const main=Chart;\n");await writeFile(join(root,'Chart.ts'),'export const Chart=1;');await writeFile(join(root,'Lazy.ts'),'export const Lazy=1;');await writeFile(join(root,'Unused.ts'),'export const Unused=1;');
 const report=await importsFinder({root});assert.equal(report.errors.length,0);assert.equal(report.count,3);assert.equal(Object.values(report.detail.by_source).flat().length,3);assert.equal(report.detail.by_source[join(root,'Chart.ts')].length,2);
 const orphan=await orphansFinder({root,type:'ts'});assert.equal(orphan.count,2);assert.deepEqual(orphan.paths.map(p=>p.name).sort(),['Main.ts','Unused.ts']);assert.equal(orphan.total,4);
});
test('nonliteral and unresolved dependencies suppress orphan candidates',async t=>{
 const root=await fixture(t);await writeFile(join(root,'Main.ts'),"export const load=(name:string)=>import(name); import './Missing';\n");await writeFile(join(root,'Unused.ts'),'export const Unused=1;');
 const report=await orphansFinder({root});assert.equal(report.count,0);assert.equal(report.paths.length,0);assert.ok(report.errors.length>=2);assert.equal(report.detail.complete,false);
});
test('DB inventory is a saved snapshot and does not silently crawl new files',async t=>{
 const root=await fixture(t),file=join(root,'snapshot.sqlite');database(file);
 await writeFile(join(root,'Old.ts'),'old');await saveDiscovery(file,root,[{path:root,name:'Old.ts',file:'Old.ts',type:'ts'}]);await writeFile(join(root,'New.ts'),'new');
 const stored=await inventory({root,db:true},file),live=await inventory({root,db:false});assert.ok(stored.rows.some(p=>p.name==='Old.ts'));assert.ok(!stored.rows.some(p=>p.name==='New.ts'));assert.ok(live.rows.some(p=>p.name==='New.ts'));
});
test('file type counts and explicit reports use House summaries without changing source',async t=>{
 const root=await fixture(t);await writeFile(join(root,'A.ts'),'abc');await writeFile(join(root,'B.ts'),'abcd');await writeFile(join(root,'C.css'),'12345');const out=join(root,'reports');await mkdir(out);
 const report=await typesFinder({root});assert.equal(report.count,3);assert.equal(report.detail.types.ts.count,2);assert.equal(report.detail.types.ts.bytes,7);
 const response=await responseFor({root,save_path:out,save_file:'types'},report);assert.equal(response.response.summary.count,3);assert.ok((await readFile(join(out,'types.txt'),'utf8')).includes('3 matches'));assert.equal(await readFile(join(root,'A.ts'),'utf8'),'abc');
 await assert.rejects(responseFor({root,save_path:out,save_file:'types'},report),/EEXIST/);
});
test('favorite presets save settings without running them and preserve identity on updates',async t=>{
 const root=await fixture(t),file=join(root,'presets.sqlite');database(file);
 const result=await presetOperation({action:'save',name:'tsx',tool:'find-files-and-folders',settings:{root,type:'tsx',db:true}},file),saved=result.response.paths[0];assert.ok(Number.isSafeInteger(saved.id));assert.equal(saved.favorite,true);assert.equal(saved.settings.type,'tsx');
 await presetOperation({action:'save',id:saved.id,name:'tsx',tool:'find-files-and-folders',favorite:false,settings:{root,type:'ts',db:true}},file);
 const all=await presetOperation({action:'list',root},file);assert.equal(all.response.summary.count,1);assert.equal(all.response.paths[0].id,saved.id);assert.equal(all.response.paths[0].settings.type,'ts');assert.equal(all.response.paths[0].favorite,false);
 assert.equal((await presetOperation({action:'list',favorite:true},file)).response.summary.count,0);
});
test('runners create separate refresh and audit steps and never run stale audits after a failed refresh',async t=>{
 const root=await fixture(t);assert.equal(refreshPlan({paths:[{path:root},{path:join(root,'other')} ]})[0].settings.runs.length,2);assert.throws(()=>refreshPlan({root,paths:[{path:root}]}),/not both/);
 const plan=auditPlan({root,refresh:true});assert.equal(plan[0].settings.runs[0].name,'refresh-discovery-index');assert.equal(plan[0].settings.runs[1].settings.db,true);
 const returned=await auditRun({root:join(root,'missing'),refresh:true,checks:['count-file-types']});assert.equal(returned.length,3);assert.equal(returned[1].status,'error');assert.match(returned[2].error,/skipped/);assert.ok(returned.every(row=>Number.isFinite(row.date_start)&&Number.isFinite(row.date_end)));
});
