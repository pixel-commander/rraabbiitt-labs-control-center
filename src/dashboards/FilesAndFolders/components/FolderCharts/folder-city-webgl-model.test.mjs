import assert from 'node:assert/strict';
import {test} from 'node:test';
import {buildFolderModel,pathKey} from '../DiscoveryExplorer/js/discovery-model.ts';
import {citySceneModel,volumeFor} from './folder-city-webgl-model.ts';
const rows=[{id:1,path:'X:/repo',name:'repo',type:'folder'},{id:2,path:'X:/repo/empty',name:'empty',type:'folder'}];let id=3;
for(const [folder,type,count]of [['X:/repo','ts',3],['X:/repo/features/a','tsx',7],['X:/repo/features/b','css',2],['X:/repo/shared','mjs',5]])for(let i=0;i<count;i++)rows.push({id:id++,path:folder,name:`File${i}.${type}`,file:`File${i}.${type}`,type});
const {tree,nodes}=buildFolderModel('X:/repo',rows);
test('digital city towers retain actual indexed file totals across layers',()=>{
 for(const depth of [1,2,3,4]){const scene=citySceneModel(tree,depth);assert.equal(scene.buildings.reduce((sum,volume)=>sum+volume.block.count,0),17);assert.ok(scene.buildings.every(volume=>volume.block.count>0));assert.ok(scene.platforms.every(volume=>nodes.has(pathKey(volume.block.path))));assert.equal(scene.omitted,0);for(const volume of [...scene.platforms,...scene.buildings])assert.ok([volume.x,volume.z,volume.width,volume.depth,volume.base,volume.height].every(Number.isFinite)&&volume.width>0&&volume.depth>0&&volume.height>0);}
});
test('hierarchy lightways join actual parent/child districts only',()=>{
 const scene=citySceneModel(tree,4),parentOf=new Map();const visit=node=>{for(const child of node.children){parentOf.set(pathKey(child.path),pathKey(node.path));visit(child);}};visit(tree);
 for(const road of scene.roads){assert.equal(parentOf.get(pathKey(road.path)),pathKey(road.parent));assert.equal(road.count,nodes.get(pathKey(road.path)).file_count);assert.equal(road.points.length,3);assert.ok(road.points.flat().every(Number.isFinite));assert.ok(road.points.every(point=>point[1]===.42));}
 assert.ok(scene.roads.length>=4);
});
test('empty folders have terraces without invented file towers',()=>{
 const empty=nodes.get(pathKey('X:/repo/empty')),scene=citySceneModel(empty,4);assert.equal(scene.platforms.length,1);assert.equal(scene.buildings.length,0);assert.equal(scene.roads.length,0);
 const small=volumeFor({path:'x',name:'a',type:'ts',count:1,x:0,y:0,w:.1,h:.1,depth:1,platform:false}),large=volumeFor({...small.block,count:100});assert.ok(large.height>small.height);
});

test('type districts aggregate actual rows and never expose virtual group paths',()=>{
 const scene=citySceneModel(tree,3,'type');assert.equal(scene.grouping,'type');assert.equal(scene.buildings.reduce((sum,volume)=>sum+volume.block.count,0),17);assert.equal(new Set(scene.buildings.map(volume=>volume.block.type)).size,4);
 assert.ok([...scene.platforms,...scene.buildings].every(volume=>volume.block.path===tree.path));assert.ok(scene.roads.every(road=>road.kind==='type-membership'&&road.path===tree.path&&road.parent===tree.path));assert.equal(scene.bytesAvailable,false);
});
test('byte encoding uses complete real file sizes and keeps missing sizes unknown',()=>{
 const rows=[{id:1,path:'X:/known',name:'known',type:'folder'},{id:2,path:'X:/known/a',name:'A.ts',file:'A.ts',type:'ts',size:100},{id:3,path:'X:/known/b',name:'B.ts',file:'B.ts',type:'ts',size:250},{id:4,path:'X:/known',name:'C.css',file:'C.css',type:'css',size:50}];
 const {tree}=buildFolderModel('X:/known',rows),scene=citySceneModel(tree,3,'type');assert.equal(scene.bytesAvailable,true);assert.equal(scene.buildings.reduce((sum,volume)=>sum+volume.bytes,0),400);assert.equal(scene.buildings.find(volume=>volume.block.type==='ts').bytes,350);
 delete rows[2].size;const unknown=citySceneModel(buildFolderModel('X:/known',rows).tree,3,'type');assert.equal(unknown.bytesAvailable,false);assert.equal(unknown.buildings.find(volume=>volume.block.type==='ts').bytes,null);
});

test('collapsed smaller-group bytes sum the exact verified groups and preserve unknown evidence',()=>{
 const rows=[{id:1,path:'X:/many',name:'many',type:'folder'}];let id=2;for(let group=0;group<40;group++)for(let file=0;file<3;file++)rows.push({id:id++,path:`X:/many/group-${String(group).padStart(2,'0')}`,name:`F${file}.ts`,file:`F${file}.ts`,type:'ts',size:10+group});
 const {tree}=buildFolderModel('X:/many',rows),scene=citySceneModel(tree,3),small=scene.buildings.find(volume=>volume.block.name==='17 smaller groups');assert.ok(small);assert.equal(small.bytes,tree.children.slice(23).reduce((sum,child)=>sum+child.bytes,0));assert.equal(scene.bytesAvailable,true);assert.equal(scene.buildings.reduce((sum,volume)=>sum+volume.bytes,0),tree.bytes);
 delete rows.at(-1).size;const incomplete=citySceneModel(buildFolderModel('X:/many',rows).tree,3);assert.equal(incomplete.bytesAvailable,false);assert.equal(incomplete.buildings.find(volume=>volume.block.name==='17 smaller groups').bytes,null);
});
