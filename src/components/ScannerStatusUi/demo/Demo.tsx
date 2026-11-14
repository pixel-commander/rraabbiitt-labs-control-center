import { ScannerStatusUi } from "../ScannerStatusUi";
import { useEffect, useState } from "react";

export const Demo = () => {
  const [root,setRoot]=useState('');
  const [error,setError]=useState('');
  useEffect(()=>{const controller=new AbortController();fetch('/api/files-and-folders/scan',{signal:controller.signal}).then(async response=>{if(!response.ok)throw Error('Could not load the project root.');return response.json();}).then(data=>setRoot(data.root)).catch(error=>{if(!controller.signal.aborted)setError(error.message);});return()=>controller.abort();},[]);
  return (
    <div className='demo container-demos'>
      <label>Root folder<input value={root} onChange={event=>setRoot(event.target.value)} placeholder="Absolute folder path" /></label>
      {error && <p role="alert">{error}</p>}
      <ScannerStatusUi root={root} />
    </div>
  )
};
