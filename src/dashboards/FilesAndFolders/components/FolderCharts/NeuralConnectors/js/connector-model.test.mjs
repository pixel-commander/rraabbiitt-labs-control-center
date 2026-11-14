import assert from 'node:assert/strict';
import { test } from 'node:test';
import { connectorModel } from './connector-model.ts';
const folder={path:'X:/repo',name:'repo'},ref=(from,to)=>({path:from.startsWith('outside')?'X:/other':'X:/repo',file:from+'.ts',source:to,target:to.startsWith('node:')?to:'X:/repo/'+to+'.ts'});
const refs=[ref('A','B'),ref('A','B'),ref('B','C'),ref('C','B'),ref('outside','A'),ref('A','node:fs'),{path:'X:/repo',file:'A.ts',source:'unresolved'}];
test('connector layers follow directed references, collapse cycles and aggregate actual repeated edges',()=>{
 const model=connectorModel(folder,refs);assert.equal(model.nodes.length,3);assert.equal(model.edges.length,3);assert.equal(model.cycle_groups,1);
 const a=model.nodes.find(node=>node.name==='A.ts'),b=model.nodes.find(node=>node.name==='B.ts'),c=model.nodes.find(node=>node.name==='C.ts');
 assert.ok(a.layer<b.layer);assert.equal(b.layer,c.layer);assert.equal(model.edges.find(edge=>edge.from===a.id&&edge.to===b.id).count,2);
 assert.equal(b.incoming,3);assert.equal(b.outgoing,1);
 for(const edge of model.edges)assert.ok(refs.some(ref=>ref.target&&ref.target.toLowerCase()===edge.to&&(ref.path+'/'+ref.file).toLowerCase()===edge.from));
});
test('boundary scope includes actual external dependencies and focused caps keep selected modules',()=>{
 const boundary=connectorModel(folder,refs,true);assert.ok(boundary.nodes.some(node=>node.path==='node:fs'&&node.external));assert.ok(boundary.nodes.some(node=>node.path.includes('outside.ts')&&node.external));
 const capped=connectorModel(folder,refs,false,2,'x:/repo/a.ts');assert.equal(capped.nodes.length,2);assert.ok(capped.nodes.some(node=>node.name==='A.ts'));assert.ok(capped.edges.every(edge=>capped.nodes.some(node=>node.id===edge.from)&&capped.nodes.some(node=>node.id===edge.to)));
 const self=connectorModel(folder,[ref('A','A')]);assert.equal(self.cycle_groups,1);
});
test('large fan-in wraps within its semantic layer and keeps layer bands ordered',()=>{
 const fan=Array.from({length:97},(_,index)=>ref('Consumer'+index,'Shared'));
 const model=connectorModel(folder,fan,false,100,'x:/repo/shared.ts');
 assert.equal(model.nodes.length,98);assert.ok(model.height<=1100);
 const bands=[...model.bands].sort(([a],[b])=>a-b);
 assert.equal(bands[0][1].lanes,9);assert.ok(bands[0][1].rows<=12);
 for(let i=1;i<bands.length;i++)assert.ok(bands[i][1].x>bands[i-1][1].x+bands[i-1][1].width);
 const rects=[...model.positions.values()];for(let a=0;a<rects.length;a++)for(let b=a+1;b<rects.length;b++){
  const x=rects[a],y=rects[b];assert.ok(x.x+x.w<=y.x||y.x+y.w<=x.x||x.y+x.h<=y.y||y.y+y.h<=x.y,'node rectangles must not overlap');
 }
 for(const node of model.nodes){const rect=model.positions.get(node.id),band=model.bands.get(node.layer);assert.ok(rect.x>=band.x&&rect.x+rect.w<=band.x+band.width);}
 const single=connectorModel(folder,refs,false,1,'x:/repo/a.ts');assert.equal(single.nodes[0].name,'A.ts');
});
