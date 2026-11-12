import assert from "node:assert/strict";
import {createServer} from "node:http";
import {createRequestHandler} from "../../api/mcp/server.mjs";
import {loadWorld} from "../../scripts/world.mjs";
const world=await loadWorld();
const handler=await createRequestHandler();
const server=createServer(handler);
await new Promise((done,fail)=>{server.once("error",fail);server.listen(0,"127.0.0.1",done);});
const origin=`http://127.0.0.1:${server.address().port}`;
const auth=process.env.MCP_TOKEN?{Authorization:`Bearer ${process.env.MCP_TOKEN}`} : {};
try {
 const health=await fetch(origin+"/health",{headers:auth});
 assert.equal(health.status,200);assert.equal((await health.json()).name,world.name);
 const returned=await fetch(origin+"/mcp",{method:"POST",headers:{...auth,"Content-Type":"application/json",Accept:"application/json, text/event-stream"},body:JSON.stringify({jsonrpc:"2.0",id:1,method:"tools/call",params:{name:"use_tool",arguments:{id:1793210509222}}})});
 assert.equal(returned.status,200);
 const rpc=await returned.json();
 assert.ok(!rpc.error,JSON.stringify(rpc.error));
 const rows=JSON.parse(rpc.result.content[0].text);
 assert.equal(rows[0].status,"complete");
 assert.equal(rows[0].response.paths[0].id,1793210509222);
 console.log("PASS: MCP loads this world's settings and resolves a tool by ID over HTTP.");
} finally {handler.close();server.closeAllConnections();await new Promise(done=>server.close(done));}
