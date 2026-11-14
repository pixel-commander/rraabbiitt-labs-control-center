import assert from "node:assert/strict";
import { mkdtemp, mkdir, readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { evaluate, assess } from "./run-react-tests.ts";

const folder = await mkdtemp(join(tmpdir(), "react-runner-check-"));
await mkdir(join(folder,"runs"));
const test = {id:1,name:"atom-trial",type:"evaluation-test",schema_version:1,version:1,
  prompt:"Find action atoms.",setup:{fresh_chat:true,tool_ids:[1794610890789]},
  limits:{seconds:10,tool_calls:2,human_interventions:0},
  checks:[{name:"correct-atoms",validator:"atom-list",settings:{type:"action"}}]};
const originalFetch=globalThis.fetch;
let calls=0;
globalThis.fetch=async(url,options)=>{
  const body=JSON.parse(options.body);
  if(String(url).endsWith("/mcp")) return new Response(JSON.stringify({result:{}}));
  calls++;
  return new Response(JSON.stringify({prompt_eval_count:4,eval_count:2,message:calls===1
    ?{role:"assistant",content:"",tool_calls:[{function:{name:"use_tool",arguments:{id:123,content:"{}"}}}]}
    :{role:"assistant",content:"I found everything successfully."}}));
};
try{
  const searchTest={...test,checks:[{name:"target",validator:"search-target",settings:{ids:[99],top_k:2}},{name:"style",validator:"search-query-style",settings:{style:"prose"}}]};
  const searchReceipt=[{steps:[{name:"search-hybrid-seat-ranking",status:"complete",settings:{query:"Find the component that shows a tooltip"},response:{paths:[{id:1},{id:99}]}}]}];
  assert.ok(assess(searchTest,searchReceipt,"",[],null).every(c=>c.outcome==="passed"));
  assert.ok(assess(searchTest,[],"I found 99",[],null).every(c=>c.outcome==="failed"));
  searchReceipt[0].steps[0].response.paths=[{id:1},{id:2},{id:99}];
  assert.equal(assess(searchTest,searchReceipt,"",[],null)[0].outcome,"failed");
  const result=await evaluate(folder,test,Buffer.from(JSON.stringify(test)),{name:"mock",digest:"digest"},
    {path:folder,models:["mock"]},{toolkit_revision:"a".repeat(64),catalog_sha256:"b".repeat(64)},"unused.sqlite","http://127.0.0.1:5183");
  assert.equal(result.response.result.outcome,"failed","A model claim cannot substitute for tool evidence.");
  assert.equal(result.response.result.metrics.tool_errors,1,"An unapproved execution must be denied.");
  assert.equal(result.response.result.metrics.tool_calls,1);
  assert.deepEqual(result.response.result.run_ids,[]);
  const saved=JSON.parse(await readFile(join(result.response.path,result.response.file),"utf8"));
  assert.equal(saved.test_id,test.id);
  assert.equal(saved.model.harness,"ollama-mcp-v1");
  globalThis.fetch=async(url)=>new Response(JSON.stringify(String(url).endsWith("/mcp")?{result:{}}:
    {message:{role:"assistant",content:"",tool_calls:[{function:{name:"use_tool",arguments:{id:123,content:"{}"}}}]}}));
  const limited=await evaluate(folder,test,Buffer.from(JSON.stringify(test)),{name:"mock",digest:"digest"},
    {path:folder,models:["mock"]},{toolkit_revision:"a".repeat(64),catalog_sha256:"b".repeat(64)},"unused.sqlite","http://127.0.0.1:5183");
  assert.equal(limited.response.result.outcome,"failed","Exhausting the call budget is a test failure, not an infrastructure block.");
  assert.equal(limited.response.result.metrics.tool_calls,2);
  console.log("Passed: denied execution, evidence-based grading, and external result persistence.");
}finally{globalThis.fetch=originalFetch;}
