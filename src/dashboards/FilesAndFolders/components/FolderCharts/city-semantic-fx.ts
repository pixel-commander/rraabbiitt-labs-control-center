import * as THREE from 'three';
import type {CityVolume} from './folder-city-webgl-model';
export type CityEffectEncoding='type'|'count'|'bytes';
const hash=(text:string)=>[...text].reduce((h,c)=>(h*31+c.charCodeAt(0))>>>0,0)%7;
export const energyValue=(volume:CityVolume,encoding:CityEffectEncoding)=>encoding==='bytes'?volume.bytes:volume.block.count;
export function groupAnchors(volumes:CityVolume[]){const selected=new Map<string,CityVolume>();for(const volume of [...volumes].sort((a,b)=>b.block.count-a.block.count)){const key=volume.block.path+'\0'+volume.block.type;if(!selected.has(key))selected.set(key,volume);}return [...selected.values()].slice(0,8);}
export const cityEffectNames=['Rising streams','Scan bands','Perimeter packets','Roof beacons'] as const;
export const cityEffectFor=(volume:CityVolume)=>[...`${volume.block.path}/${volume.block.type}`].reduce((h,c)=>(h*31+c.charCodeAt(0))>>>0,0)%4;
export function perimeterPoint(progress:number,width:number,depth:number){
 const distance=((progress%1+1)%1)*2*(width+depth);
 if(distance<width)return {x:-width/2+distance,z:-depth/2};
 if(distance<width+depth)return {x:width/2,z:-depth/2+distance-width};
 if(distance<2*width+depth)return {x:width/2-(distance-width-depth),z:depth/2};
 return {x:-width/2,z:depth/2-(distance-2*width-depth)};
}
const vertex=`varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}`;
const fragment=`uniform vec3 uColor;uniform float uTime;uniform float uDensity;uniform float uSeed;uniform float uMode;varying vec2 vUv;
void main(){float strips=pow(max(0.0,sin(vUv.x*6.2831853*(24.0+uDensity*36.0)+uSeed)),20.0);float rise=fract(vUv.y*3.0-uTime*(0.18+uDensity*0.12)+uSeed);float sparks=pow(max(0.0,1.0-abs(rise-.5)*2.0),10.0);float ends=smoothstep(0.0,.09,vUv.y)*(1.0-smoothstep(.87,1.0,vUv.y));float band=pow(max(0.0,1.0-abs(fract(vUv.y-uTime*.14+uSeed)-.5)*2.0),24.0);
float scan=pow(max(0.0,sin(vUv.y*50.0-uTime*3.0)),16.0);
float pattern=uMode<.5?strips*sparks:uMode<1.5?band:uMode<2.5?strips*.12:scan*(.5+.5*sin(uTime*2.0+uSeed));
float alpha=(.006+pattern*.23)*ends;gl_FragColor=vec4(uColor,alpha);}`;
/** Eight bounded group anchors, with rectangular footprints and stable neighborhood effects. */
export function createCityEnergy(scene:THREE.Scene,volumes:CityVolume[],geometry:<T extends THREE.BufferGeometry>(value:T)=>T,material:<T extends THREE.Material>(value:T)=>T){
 const LIMIT=8,MAX_STREAMS=72,defaults=groupAnchors(volumes),root=new THREE.Group();root.name='Semantic file group energy';scene.add(root);
 const outline=new THREE.Shape();outline.moveTo(-.5,-.5);outline.lineTo(.5,-.5);outline.lineTo(.5,.5);outline.lineTo(-.5,.5);outline.closePath();
 const hole=new THREE.Path();hole.moveTo(-.49,-.49);hole.lineTo(-.49,.49);hole.lineTo(.49,.49);hole.lineTo(.49,-.49);hole.closePath();outline.holes.push(hole);
 const ringGeometry=geometry(new THREE.ShapeGeometry(outline)),cylinderGeometry=geometry(new THREE.BoxGeometry(1,1,1));
 const anchors=Array.from({length:LIMIT},(_,index)=>{
  const color=new THREE.Color();
  const ringMaterial=material(new THREE.MeshBasicMaterial({color,side:THREE.DoubleSide,transparent:true,opacity:.85,toneMapped:false,blending:THREE.AdditiveBlending,depthWrite:false}));
  const bottom=new THREE.Mesh(ringGeometry,ringMaterial),top=new THREE.Mesh(ringGeometry,ringMaterial);bottom.rotation.x=top.rotation.x=-Math.PI/2;
  const cylinderMaterial=material(new THREE.ShaderMaterial({vertexShader:vertex,fragmentShader:fragment,uniforms:{uColor:{value:new THREE.Color()},uTime:{value:0},uDensity:{value:0},uSeed:{value:index*.317},uMode:{value:0}},side:THREE.DoubleSide,transparent:true,blending:THREE.AdditiveBlending,depthWrite:false}));
  const cylinder=new THREE.Mesh(cylinderGeometry,cylinderMaterial),group=new THREE.Group();group.add(bottom,top,cylinder);root.add(group);
  return {group,bottom,top,cylinder,ringMaterial,cylinderMaterial};
 });
 const pointPositions=new Float32Array(LIMIT*MAX_STREAMS*3),pointColors=new Float32Array(pointPositions.length),streakPositions=new Float32Array(LIMIT*MAX_STREAMS*6),streakColors=new Float32Array(streakPositions.length);
 const pointGeometry=geometry(new THREE.BufferGeometry());pointGeometry.setAttribute('position',new THREE.BufferAttribute(pointPositions,3));pointGeometry.setAttribute('color',new THREE.BufferAttribute(pointColors,3));
 const streakGeometry=geometry(new THREE.BufferGeometry());streakGeometry.setAttribute('position',new THREE.BufferAttribute(streakPositions,3));streakGeometry.setAttribute('color',new THREE.BufferAttribute(streakColors,3));
 const pointMaterial=material(new THREE.PointsMaterial({vertexColors:true,size:.5,sizeAttenuation:true,transparent:true,opacity:.8,toneMapped:false,blending:THREE.AdditiveBlending,depthWrite:false})),streakMaterial=material(new THREE.LineBasicMaterial({vertexColors:true,transparent:true,opacity:.52,toneMapped:false,blending:THREE.AdditiveBlending,depthWrite:false}));
 root.add(new THREE.Points(pointGeometry,pointMaterial),new THREE.LineSegments(streakGeometry,streakMaterial));
 const maxCount=Math.max(1,...volumes.map(volume=>volume.block.count)),maxBytes=Math.max(1,...volumes.map(volume=>volume.bytes??0));
 const update=(time:number,palette:THREE.Color[],encoding:CityEffectEncoding,enabled:boolean,active?:CityVolume)=>{
  root.visible=enabled;if(!enabled||!palette.length)return;
  const selected=active?[active]:defaults;let streams=0;
  for(let index=0;index<LIMIT;index++){
   const anchor=anchors[index],volume=selected[index];anchor.group.visible=!!volume;if(!volume)continue;
   const value=energyValue(volume,encoding),maximum=encoding==='bytes'?maxBytes:maxCount,density=value===null?0:Math.max(0,Math.min(1,Math.log1p(value)/Math.log1p(maximum)));
   const color=encoding==='type'?palette[hash(volume.block.type)].clone():palette[1].clone().lerp(palette[3],density*.82);
   const mode=cityEffectFor(volume),width=Math.max(.4,volume.width*1.08),depth=Math.max(.4,volume.depth*1.08),height=Math.max(4.5,Math.min(34,volume.height+3.8)),base=volume.base+.08;
   anchor.group.position.set(volume.x,base,volume.z);anchor.bottom.position.set(0,0,0);anchor.top.position.set(0,mode===1?height*((time*.16+index*.13)%1):height,0);anchor.bottom.scale.set(width,depth,1);anchor.top.scale.set(width,depth,1);anchor.cylinder.position.set(0,height/2,0);anchor.cylinder.scale.set(width,height,depth);
   anchor.top.visible=mode!==2;anchor.ringMaterial.opacity=mode===3?.35+.5*(.5+.5*Math.sin(time*2.4+index)):.7;
   anchor.cylinderMaterial.uniforms.uMode.value=mode;
   anchor.ringMaterial.color.copy(color).multiplyScalar(1.7);anchor.cylinderMaterial.uniforms.uColor.value.copy(color).multiplyScalar(.9);anchor.cylinderMaterial.uniforms.uTime.value=time;anchor.cylinderMaterial.uniforms.uDensity.value=density;
   anchor.cylinder.visible=value!==null&&value>0;
   const count=value===null||value<=0?0:Math.min(MAX_STREAMS,Math.max(8,Math.round(8+density*64)));
   for(let j=0;j<count;j++){
    const phase=(j*.618033+index*.137+time*(.13+density*.08))%1;
    const perimeter=perimeterPoint(j/count+index*.137+(mode===2?time*.12:mode===3?time*.035:0),width,depth);
    const y=base+(mode===2?(.15+(j%4)*.23)*height:mode===3?height+Math.sin(phase*Math.PI)*2:phase*height);
    const x=volume.x+perimeter.x,z=volume.z+perimeter.z,tail=Math.max(base,y-(mode===1?.15:.35+density*.7));
    const p=streams*3,l=streams*6;pointPositions[p]=x;pointPositions[p+1]=y;pointPositions[p+2]=z;streakPositions[l]=x;streakPositions[l+1]=tail;streakPositions[l+2]=z;streakPositions[l+3]=x;streakPositions[l+4]=y;streakPositions[l+5]=z;
    for(let c=0;c<3;c++){const component=c===0?color.r:c===1?color.g:color.b;pointColors[p+c]=component;streakColors[l+c]=component;streakColors[l+3+c]=component;}streams++;
   }
  }
  pointGeometry.setDrawRange(0,streams);streakGeometry.setDrawRange(0,streams*2);for(const buffer of [pointGeometry,streakGeometry]){buffer.getAttribute('position').needsUpdate=true;buffer.getAttribute('color').needsUpdate=true;}
 };
 return {update,group:root};
}
