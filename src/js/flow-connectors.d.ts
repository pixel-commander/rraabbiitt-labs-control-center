export type FlowConnectorPoint = { x:number; y:number };
export interface FlowConnectorEdge {
  id?:string|number;
  routeSettings?:Record<string,number|undefined>;
  effectSettings?:Record<string,number|undefined>;
}
export interface FlowBolt { pts:FlowConnectorPoint[]; branches:{pts:FlowConnectorPoint[];arc?:boolean}[] }
export interface FlowConnectors {
  step():void;
  elasticPath(edge:FlowConnectorEdge,x1:number,y1:number,x2:number,y2:number,peek?:boolean):FlowConnectorPoint[];
  drawCable(points:readonly FlowConnectorPoint[],color:string,weight:number):void;
  makeBolt(x1:number,y1:number,x2:number,y2:number,chaos:number,depth:number):FlowBolt;
  drawBolt(edge:FlowConnectorEdge,x1:number,y1:number,x2:number,y2:number,color:string):void;
  drawFx(edge:FlowConnectorEdge & {fx:'pulse'|'flow'|'crackle'},points:readonly FlowConnectorPoint[],color:string,time?:number):void;
}
export function straightPath(from:FlowConnectorPoint,to:FlowConnectorPoint):FlowConnectorPoint[];
export function orthoPath(from:FlowConnectorPoint,to:FlowConnectorPoint):FlowConnectorPoint[];
export function curvePath(from:FlowConnectorPoint,to:FlowConnectorPoint):FlowConnectorPoint[];
export function createFlowConnectors(context:CanvasRenderingContext2D,resolveToken:(token:string)=>string):FlowConnectors;
