import {test} from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {createCityEnergy,energyValue,groupAnchors} from './city-semantic-fx.ts';
const volume=(index,count=10)=>({block:{path:`X:/repo/${index}`,name:String(index),type:`type-${index}`,count,x:0,y:0,w:.1,h:.1,depth:1,platform:false},x:index*2,z:0,width:2,depth:2,base:0,height:5,bytes:index%2?null:count*100});
test('energy groups cap eight real anchors and preserve metric meaning',()=>{
 const volumes=Array.from({length:15},(_,index)=>volume(index,index+1)),anchors=groupAnchors(volumes);assert.equal(anchors.length,8);assert.ok(anchors.every(anchor=>volumes.includes(anchor)));assert.equal(energyValue(volumes[0],'count'),1);assert.equal(energyValue(volumes[0],'bytes'),100);assert.equal(energyValue(volumes[1],'bytes'),null);
});
test('energy geometry stays bounded, changes encoding and stops for empty or disabled groups',()=>{
 const scene=new THREE.Scene(),geometries=[],materials=[],volumes=Array.from({length:12},(_,index)=>volume(index,index+1));
 const energy=createCityEnergy(scene,volumes,value=>(geometries.push(value),value),value=>(materials.push(value),value));const palette=Array.from({length:7},(_,index)=>new THREE.Color(.2+index*.05,.5,.7));
 energy.update(1,palette,'type',true);assert.equal(energy.group.visible,true);assert.equal(energy.group.children.filter(child=>child.type==='Group'&&child.visible).length,8);
 const points=energy.group.children.find(child=>child.isPoints);assert.ok(points.geometry.drawRange.count<=8*72);assert.ok(points.geometry.drawRange.count>0);const before=Array.from(points.geometry.attributes.position.array.slice(0,12));energy.update(2,palette,'count',true);assert.notDeepEqual(Array.from(points.geometry.attributes.position.array.slice(0,12)),before);
 energy.update(2,palette,'count',true,volume(0,0));assert.equal(points.geometry.drawRange.count,0);energy.update(2,palette,'type',false);assert.equal(energy.group.visible,false);
 geometries.forEach(value=>value.dispose());materials.forEach(value=>value.dispose());
});
