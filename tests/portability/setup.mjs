import assert from "node:assert/strict";
import {cp,mkdir,mkdtemp,readFile,writeFile,rm} from "node:fs/promises";
import {resolve,relative,isAbsolute} from "node:path";
import {pathToFileURL} from "node:url";
import {DatabaseSync} from "node:sqlite";
import {spawnSync} from "node:child_process";
import {projectRoot} from "../../scripts/world.mjs";
const temporaryRoot=resolve(projectRoot,".tmp/portability-tests");
await mkdir(temporaryRoot,{recursive:true});
const root=await mkdtemp(resolve(temporaryRoot,"relocated-"));
const python=resolve(projectRoot,".venv/Scripts/python.exe");
const env={...process.env,TOOL_LEARNER_PYTHON:python};
const command=(file,args=[],input)=>spawnSync(process.execPath,[resolve(root,file),...args],{cwd:root,env,encoding:"utf8",input,windowsHide:true});
const good=result=>assert.equal(result.status,0,result.stderr || result.stdout);
const moduleAt=file=>import(pathToFileURL(resolve(root,file)).href);
try {
 for(const name of ["toolkit","api","scripts"]) await cp(resolve(projectRoot,name),resolve(root,name),{recursive:true});
 await mkdir(resolve(root,"db"));
 await cp(resolve(projectRoot,"db/base"),resolve(root,"db/base"),{recursive:true});
 await cp(resolve(projectRoot,"db/setup.mjs"),resolve(root,"db/setup.mjs"));
 await writeFile(resolve(root,"package.json"),'{"type":"module"}');
 const project={type:"project",paths:[{name:"database",path:"db/main",file:"app.sqlite"},{name:"toolkit",path:"toolkit",type:"path"}]};
 await writeFile(resolve(root,"rab.project.json"),JSON.stringify(project));
 await writeFile(resolve(root,"rab.world.json"),JSON.stringify({path:".",toolkits:[{path:"toolkit"}],paths:[],mcp:{host:"127.0.0.1",port:1,path:"api/mcp"}}));
 good(command("db/setup.mjs"));
 const db=new DatabaseSync(resolve(root,"db/main/app.sqlite"));
 assert.equal(db.prepare("PRAGMA integrity_check").get().integrity_check,"ok");
 assert.ok(db.prepare("SELECT count(*) n FROM records").get().n>0);
 for(const table of ["messages","docs","runs","tool_calls","tool_usage"])
  assert.equal(db.prepare(`SELECT count(*) n FROM ${table}`).get().n,0);
 const {generateWorldId}=await moduleAt("toolkit/generators/generate-world-id/generate-world-id.ts");
 const message=generateWorldId().id;
 db.prepare("INSERT INTO messages(id,description) VALUES(?,?)").run(message,"Preserve me across setup and refresh");
 good(command("db/setup.mjs"));
 good(command("scripts/refresh-catalog.mjs"));
 assert.equal(db.prepare("SELECT description FROM messages WHERE id=?").get(message).description,"Preserve me across setup and refresh");
 const bom=spawnSync(python,["-B",resolve(root,"toolkit/tools/refresh-world-database/refresh_world_database.py")],{cwd:root,input:"\uFEFF"+JSON.stringify({path:root}),encoding:"utf8",windowsHide:true});
 good(bom);assert.equal(JSON.parse(bom.stdout).status,"complete");
 const load=command("scripts/tool.mjs",["1793210509222"]);good(load);assert.equal(JSON.parse(load.stdout)[0].status,"complete");
 assert.notEqual(command("scripts/tool.mjs",["not-an-id"]).status,0);
 assert.notEqual(command("toolkit/tools/refresh-world-database/refresh-world-database.ts",["--json","broken"]).status,0);
 const sample=resolve(root,"toolkit/tools/fixture");await mkdir(sample);
 const id=generateWorldId().id;
 const registration={id,type:"tool",name:"fixture",file:"fixture.mjs",description:"Fixture tool"};
 await writeFile(resolve(sample,"rab.settings.json"),JSON.stringify(registration));
 await writeFile(resolve(sample,"fixture.mjs"),'export const run=async settings=>({status:"complete",return_type:"results",settings});');
 const found=command("scripts/tool.mjs",[String(id)]);good(found);
 assert.equal(JSON.parse(found.stdout)[0].response.paths[0].id,id);
 assert.equal(db.prepare("SELECT id FROM records WHERE id=?").get(id).id,id);
 // Existing ID lookup must not read unrelated broken metadata or walk the tree.
 const broken=resolve(root,"toolkit/tools/broken");await mkdir(broken);await writeFile(resolve(broken,"rab.settings.json"),"broken JSON");
 good(command("scripts/tool.mjs",[String(id)]));
 await writeFile(resolve(sample,"rab.settings.json"),JSON.stringify({...registration,title:"Fresh metadata"}));
 assert.equal(JSON.parse(command("scripts/tool.mjs",[String(id)]).stdout)[0].response.paths[0].title,"Fresh metadata");
 await rm(resolve(broken,"rab.settings.json"));
 const {executeTool:refreshSettings}=await moduleAt("toolkit/tools/refresh-settings-json/refresh-settings-json.ts");
 const updated=await refreshSettings({path:sample});assert.equal(updated.status,"complete",updated.error);assert.equal(updated.response.path,"toolkit/tools/fixture");
 const {newSkillFlow}=await moduleAt("toolkit/scaffolds/new-skill-flow/new-skill-flow.ts");
 const skill=await newSkillFlow({path:sample,name:"fixture",title:"Fixture",description:"Test",instructions:"Use this test fixture",owner:{id}});
 assert.equal(skill.path,"toolkit/tools/fixture");
 const {newSettingsJson}=await moduleAt("toolkit/scaffolds/new-settings-json/new-settings-json.mjs");
 const created=await newSettingsJson({path:"toolkit/tools/new-fixture",name:"new-fixture",title:"New fixture",description:"Test",type:"tool"});
 assert.equal(created.path,"toolkit/tools/new-fixture");
 const prior=process.env.TOOL_LEARNER_PYTHON;process.env.TOOL_LEARNER_PYTHON=python;
 try {
  const {finishToolUsage}=await moduleAt("api/tool-usage/finish-tool-usage.ts");
  const saved=await finishToolUsage(id,{}, {status:"complete",return_type:"scaffold",response:skill});
  assert.equal(saved.status,"complete",saved.error);
  assert.equal(db.prepare("SELECT id FROM records WHERE id=?").get(skill.id).id,skill.id);
 } finally {if(prior===undefined)delete process.env.TOOL_LEARNER_PYTHON;else process.env.TOOL_LEARNER_PYTHON=prior;}
 db.close();
 await writeFile(resolve(temporaryRoot,"setup-report.json"),JSON.stringify({status:"PASS",checks:["relocated base seed","integrity","empty application tables","repeat setup preserves messages","refresh preserves messages","UTF-8 BOM","numeric ID CLI","invalid CLI errors","missing ID refresh and persist","no tree scan on ID hit","current metadata read","relative settings and skill writers","scaffold indexes new skill"]},null,2));
 console.log("PASS: relocated setup, preservation, BOM, tool lookup, relative paths, scaffold registration.");
} finally {
 const child=relative(temporaryRoot,root);
 if(!child || child.startsWith("..") || isAbsolute(child))throw Error("Unsafe fixture cleanup");
 await rm(root,{recursive:true,force:true});
}
