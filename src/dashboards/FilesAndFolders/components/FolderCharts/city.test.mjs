import assert from 'node:assert/strict';
import {test} from 'node:test';
import {cityLayout,cityPick} from './city.ts';
import {buildFolderModel} from '../DiscoveryExplorer/js/discovery-model.ts';
const rows=[{id:1,path:'X:/repo',name:'repo',type:'folder'}];let id=2;
for(let i=0;i<40;i++)for(let j=0;j<3;j++)rows.push({id:id++,path:`X:/repo/district-${i}/block-${j}`,file:`View-${j}.tsx`,name:`View-${j}.tsx`,type:'tsx'});
const {tree}=buildFolderModel('X:/repo',rows);
test('nested city preserves actual file totals through depth changes and grouped districts',()=>{
 for(const depth of [1,2,3,4]){
  const blocks=cityLayout(tree,depth),leaves=blocks.filter(b=>!b.platform);
  assert.equal(leaves.reduce((sum,b)=>sum+b.count,0),120);
  assert.ok(blocks.every(b=>b.w>0&&b.h>0&&b.x>=0&&b.y>=0&&b.x+b.w<=1.00001&&b.y+b.h<=1.00001));
  assert.ok(blocks.filter(b=>b.platform).every(b=>{if(b.depth===0)return true;return blocks.some(parent=>parent.platform&&parent.depth===b.depth-1&&b.path.startsWith(parent.path+'/')&&b.x>=parent.x&&b.y>=parent.y&&b.x+b.w<=parent.x+parent.w+.00001&&b.y+b.h<=parent.y+parent.h+.00001);}));
 }
 assert.ok(cityLayout(tree,3).some(b=>b.name.includes('smaller groups')));
 assert.ok(cityLayout(tree,3).filter(b=>b.platform).length>cityLayout(tree,1).filter(b=>b.platform).length);
});
test('city picking selects the front-most roof and ignores streets outside geometry',()=>{
 const block=cityLayout(tree,1)[0],front={...block,name:'front'};
 const polygon=[[0,0],[10,0],[10,10],[0,10]];
 assert.equal(cityPick([{block,polygon},{block:front,polygon}],5,5)?.name,'front');
 assert.equal(cityPick([{block,polygon}],20,20),undefined);
});
