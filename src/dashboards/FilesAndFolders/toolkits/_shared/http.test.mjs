import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Readable } from 'node:stream';
import { handleToolkit } from './http.mjs';
const call=async(url,method='GET',body,headers={})=>{
 const req=Readable.from(body===undefined?[]:[Buffer.from(typeof body==='string'?body:JSON.stringify(body))]);Object.assign(req,{url,method,headers});
 let status,result,dispatch;
 const res={writeHead(code){status=code;},end(value){result=JSON.parse(value);}};
 await handleToolkit({toolkits:[{path:'toolkit'}]},req,res,async settings=>{dispatch=settings;return [{name:'stub',status:'complete',settings:{},return_type:'results'}];});
 return {status,result,dispatch};
};
test('HTTP tool transport only dispatches allowlisted names through the master runner',async()=>{
 const good=await call('/api/files-and-folders/tools','POST',{name:'count-imports',settings:{root:'X:\\repo',db:true}},{'content-type':'application/json'});
 assert.equal(good.status,200);assert.equal(good.dispatch.id,1794630244310);assert.deepEqual(JSON.parse(good.dispatch.content),{root:'X:\\repo',db:true});assert.equal(good.result[0].name,'stub');
 const bad=await call('/api/files-and-folders/tools','POST',{name:'run-shell',settings:{}},{'content-type':'application/json'});assert.equal(bad.status,400);assert.equal(bad.dispatch,undefined);
});
test('HTTP transport rejects missing root, duplicate fields, wrong method and malformed/large requests',async()=>{
 assert.equal((await call('/api/files-and-folders/discovery')).status,400);
 assert.equal((await call('/api/files-and-folders/discovery?root=x&root=y')).status,400);
 assert.equal((await call('/api/files-and-folders/discovery','POST')).status,405);
 assert.equal((await call('/api/files-and-folders/tools','POST','{','content-type')).status,415);
 assert.equal((await call('/api/files-and-folders/tools','POST','{',{'content-type':'application/json'})).status,400);
 assert.equal((await call('/api/files-and-folders/tools','POST','x'.repeat(65537),{'content-type':'application/json'})).status,413);
});
