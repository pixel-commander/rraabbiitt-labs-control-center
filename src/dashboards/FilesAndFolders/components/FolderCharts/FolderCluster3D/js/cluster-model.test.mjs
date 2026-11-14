import assert from 'node:assert/strict';
import { test } from 'node:test';
import { clusterModel, expandedToDepth } from './cluster-model.ts';
const node=(path,children=[])=>({path,name:path.split('/').at(-1),children,files:[],file_count:children.reduce((sum,child)=>sum+child.file_count,1),folder_count:children.reduce((sum,child)=>sum+child.folder_count+1,0),types:[],bytes:null});
const leaf=node('X:/repo/A/nested'),a=node('X:/repo/A',[leaf]),b=node('X:/repo/B'),root=node('X:/repo',[a,b]);
test('expansion and collapse expose only actual folder nodes and actual parent-child edges',()=>{
 const collapsed=clusterModel(root,new Set(['x:/repo']));assert.deepEqual(collapsed.nodes.map(row=>row.id),['x:/repo','x:/repo/a','x:/repo/b']);assert.equal(collapsed.edges.length,2);
 const open=clusterModel(root,new Set(['x:/repo','x:/repo/a']));assert.equal(open.nodes.length,4);assert.equal(open.total,4);assert.equal(open.edges.length,3);
 for(const edge of open.edges){const parent=open.all.get(edge.from);assert.ok(parent.children.some(child=>child.path.toLowerCase()===edge.to));}
 const again=clusterModel(root,new Set(['x:/repo']));assert.equal(again.nodes.length,3);assert.ok(!again.nodes.some(row=>row.id==='x:/repo/a/nested'));
});
test('visible budgets are explicit and full expansion preserves true volumetric seeds',()=>{
 const expanded=expandedToDepth(root,Infinity),all=clusterModel(root,expanded),limited=clusterModel(root,expanded,2);
 assert.equal(all.nodes.length,4);assert.equal(all.truncated,false);assert.equal(limited.nodes.length,2);assert.equal(limited.truncated,true);assert.equal(limited.total,4);
 assert.ok(all.nodes.some(row=>Math.abs(row.position.z)>.001));
 for(const row of all.nodes)assert.ok(Object.values(row.position).every(Number.isFinite));
 assert.equal(expandedToDepth(root,1).size,1);assert.ok(all.nodes.find(row=>row.id==='x:/repo/a').radius<all.nodes[0].radius);
});
