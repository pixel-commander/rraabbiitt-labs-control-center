import assert from 'node:assert/strict';
import { test } from 'node:test';
import { barRows, niceCeiling } from './bar-model.ts';
const folder={path:'X:/repo',name:'repo',children:[{path:'X:/repo/src',name:'src',file_count:8,types:[{type:'tsx',count:8}]}],files:[{name:'root.ts',type:'ts'},{name:'README.md',type:'md'}],file_count:10,types:[{type:'tsx',count:8},{type:'ts',count:1},{type:'md',count:1}]};
test('folder bar groups partition actual descendants and direct files without counting twice',()=>{
 const rows=barRows(folder,'folders');assert.equal(rows.reduce((sum,row)=>sum+row.count,0),10);
 const direct=rows.find(row=>row.label==='Direct files');assert.equal(direct.count,2);assert.deepEqual(direct.types,[{type:'ts',count:1},{type:'md',count:1}]);
 assert.equal(barRows(folder,'types').reduce((sum,row)=>sum+row.count,0),10);
});
test('count scales contain values and use whole-number major ticks',()=>{
 for(const value of [0,1,2,7,18,73,934,12001]){const max=niceCeiling(value);assert.ok(max>=value);assert.equal(max%5,0);}
});
