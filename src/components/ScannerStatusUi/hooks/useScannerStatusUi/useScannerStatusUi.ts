import { useEffect, useRef, useState } from 'react';
import type { ScannerStatus, ScannerStatusUiProps, ScanProgress, ScannerEvent } from '../../ScannerStatusUi.types';
import type { ToolReturn } from '../../../../../toolkit/Tooling.types';

interface ScanState {
  status: ScannerStatus; started?:number; ended?:number; now?:number;
  progress?:ScanProgress; events:ScannerEvent[]; result?:ToolReturn; error?:string;
}
export const useScannerStatusUi = (props:ScannerStatusUiProps) => {
  const [state,setState]=useState<ScanState>({status:'idle',events:[]});
  const busy=useRef(false), mounted=useRef(true), controller=useRef<AbortController|null>(null);
  useEffect(()=>{mounted.current=true;return()=>{mounted.current=false;controller.current?.abort();};},[]);
  useEffect(()=>{
    if(state.status!=='scanning')return;
    const timer=setInterval(()=>setState(previous=>({...previous,now:Date.now()})),250);
    return()=>clearInterval(timer);
  },[state.status]);
  const start=async()=>{
    if(busy.current)return;
    busy.current=true;
    const started=Date.now();
    setState({status:'scanning',started,now:started,events:[]});
    controller.current=new AbortController();
    let complete=false;
    try {
      const response=await fetch('/api/files-and-folders/scan',{
        method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({root:props.root,save:props.save??true}),signal:controller.current.signal,
      });
      if(!response.ok)throw Error((await response.json()).error??`Scan returned ${response.status}.`);
      if(!response.body)throw Error('The scan returned no progress stream.');
      const reader=response.body.getReader(),decoder=new TextDecoder();let buffer='';
      const receive=(line:string)=>{
        if(!line.trim()||!mounted.current)return;
        const event=JSON.parse(line);
        if(event.type==='progress')setState(previous=>({...previous,progress:event.scan,events:event.scan.activity,now:Date.now()}));
        if(event.type==='error')throw Error(event.error);
        if(event.type==='complete'){
          complete=true;
          const result=event.result as ToolReturn;
          setState(previous=>({...previous,status:result.status==='error'||result.error?'error':'complete',ended:event.time,result,error:result.error}));
          props.handleComplete?.(result);
        }
      };
      try {for(;;){const {done,value}=await reader.read();if(done)break;buffer+=decoder.decode(value,{stream:true});let index;
        while((index=buffer.indexOf('\n'))>=0){const line=buffer.slice(0,index);buffer=buffer.slice(index+1);receive(line);}
      } buffer+=decoder.decode();if(buffer.trim())receive(buffer);
      } finally {reader.releaseLock();}
      if(!complete)throw Error('The connection ended before scan completion.');
    } catch(error) {
      if(mounted.current)setState(previous=>({...previous,status:'error',ended:Date.now(),error:error instanceof Error?error.message:String(error)}));
    } finally {busy.current=false;}
  };
  return {...state,start};
};
