import assert from "node:assert/strict";
import {DatabaseSync} from "node:sqlite";
import {mkdtemp,mkdir,writeFile,rm} from "node:fs/promises";
import {resolve,relative,isAbsolute} from "node:path";
import {favoriteOperation} from "../api/favorites/favorites.mjs";
import {run as newTable} from "../toolkit/tools/new-db-table/new-db-table.mjs";
import {generateWorldId} from "../toolkit/generators/generate-world-id/generate-world-id.ts";
import {projectRoot} from "../scripts/world.mjs";
const temp=resolve(projectRoot,".tmp/favorites-tests");await mkdir(temp,{recursive:true});
const folder=await mkdtemp(resolve(temp,"case-"));
try {
 const file=resolve(folder,"app.sqlite");new DatabaseSync(file).close();
 for(const name of ["records","favorites"])assert.equal((await newTable({path:folder,file:"app.sqlite",name})).status,"complete");
 await writeFile(resolve(folder,"rab.project.json"),JSON.stringify({paths:[{name:"database",path:".",file:"app.sqlite"}]}));
 const db=new DatabaseSync(file);const id=generateWorldId().id;
 db.prepare("INSERT INTO records(id,name,title,type) VALUES(?,?,?,?)").run(id,"fixture","Fixture","tool");
 const world={path:folder};
 const call=(action,settings)=>favoriteOperation(world,action,settings);
 assert.deepEqual((await call("get",{})).body.response.paths,[]);
 assert.equal((await call("set",{id})).body.response.favorite,true);
 assert.equal((await call("set",{id})).code,200);
 assert.equal(db.prepare("SELECT count(*) n FROM favorites").get().n,1);
 assert.equal((await call("get",{id})).body.response.paths[0].name,"fixture");
 assert.equal((await call("set",{id:generateWorldId().id})).code,404);
 assert.equal((await call("set",{id:"invalid"})).code,400);
 assert.equal((await call("set",{id,name:"untrusted replacement"})).code,400);
 assert.equal((await call("delete",{id})).body.response.favorite,false);
 assert.equal((await call("delete",{id})).code,200);
 assert.equal(db.prepare("SELECT count(*) n FROM favorites").get().n,0);
 assert.equal(db.prepare("SELECT count(*) n FROM records").get().n,1);
 db.close();
 console.log("PASS: favorite save, reopen/read, deduplication, validation and idempotent removal; source preserved.");
} finally {
 const child=relative(temp,folder);if(!child||child.startsWith("..")||isAbsolute(child))throw Error("Unsafe fixture cleanup");
 await rm(folder,{recursive:true,force:true});
}
