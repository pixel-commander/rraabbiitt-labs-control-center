import { useEffect, useRef } from 'react';
export interface CanvasPalette { background:string; foreground:string; muted:string; border:string; colors:string[] }
export interface CanvasDraw {context:CanvasRenderingContext2D;width:number;height:number;palette:CanvasPalette;time:number;reducedMotion:boolean}
export interface CanvasAnimation {animate?:boolean;settleFrames?:number}

/** Static by default. Optional active/settling animation pauses offscreen, hidden or reduced-motion. */
export function useThemedCanvas(draw:(state:CanvasDraw)=>void,animation:CanvasAnimation={}){
  const canvas=useRef<HTMLCanvasElement>(null),latest=useRef(draw),options=useRef(animation),redraw=useRef<()=>void>(()=>{});latest.current=draw;options.current=animation;
  useEffect(()=>{
    const element=canvas.current;if(!element)return;let frame=0,inView=true,settle=0;
    const motion=matchMedia('(prefers-reduced-motion: reduce)');
    const visible=()=>inView&&!document.hidden;
    const continuing=()=>visible()&&!motion.matches&&(options.current.animate||settle>0);
    const paint=(time:number)=>{
      frame=0;if(!visible())return;
      const context=element.getContext('2d');if(!context)return;
      const bounds=element.getBoundingClientRect(),width=bounds.width,height=bounds.height;if(!width||!height)return;
      const dpr=Math.min(window.devicePixelRatio||1,3),pixelWidth=Math.round(width*dpr),pixelHeight=Math.round(height*dpr);
      if(element.width!==pixelWidth)element.width=pixelWidth;if(element.height!==pixelHeight)element.height=pixelHeight;
      context.setTransform(dpr,0,0,dpr,0,0);context.clearRect(0,0,width,height);
      const style=getComputedStyle(element),token=(name:string)=>style.getPropertyValue(name).trim();
      const palette={background:token('--color-main'),foreground:token('--color-main-neg'),muted:token('--color-muted'),border:token('--border-default'),colors:['--color-primary','--color-primary-alt','--status-success','--status-warning','--status-error','--color-muted','--color-tertiary-neg'].map(token)};
      latest.current({context,width,height,palette,time,reducedMotion:motion.matches});
      if(settle>0)settle--;
      if(continuing())frame=requestAnimationFrame(paint);
    };
    const schedule=()=>{if(!frame&&visible())frame=requestAnimationFrame(paint);};
    const request=()=>{settle=Math.max(settle,Math.min(180,options.current.settleFrames??0));schedule();};
    const visibility=()=>{if(!visible()){cancelAnimationFrame(frame);frame=0;}else schedule();};
    const motionChange=()=>{cancelAnimationFrame(frame);frame=0;if(motion.matches)settle=0;schedule();};
    redraw.current=request;
    const resize=new ResizeObserver(request);resize.observe(element);
    const theme=new MutationObserver(request);for(let parent:Element|null=element;parent;parent=parent.parentElement)theme.observe(parent,{attributes:true,attributeFilter:['data-theme','class','style']});
    const intersection=new IntersectionObserver(entries=>{inView=entries[0]?.isIntersecting??true;visibility();});intersection.observe(element);
    window.addEventListener('resize',request);document.addEventListener('visibilitychange',visibility);motion.addEventListener('change',motionChange);request();
    return()=>{redraw.current=()=>{};resize.disconnect();theme.disconnect();intersection.disconnect();window.removeEventListener('resize',request);document.removeEventListener('visibilitychange',visibility);motion.removeEventListener('change',motionChange);cancelAnimationFrame(frame);};
  },[]);
  useEffect(()=>{redraw.current();},[draw,animation.animate,animation.settleFrames]);
  return canvas;
}
