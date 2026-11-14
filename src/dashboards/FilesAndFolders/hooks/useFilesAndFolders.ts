import { useEffect, useState } from "react";
import inventory from "../audit-inventory.json";

export const useFilesAndFolders = () => {
  const [query, setQuery] = useState("");
  const [source, setSource] = useState("");
  const [root,setRoot]=useState('');
  const [rootError,setRootError]=useState('');
  const [refreshKey,setRefreshKey]=useState(0);
  useEffect(()=>{const controller=new AbortController();fetch('/api/files-and-folders/scan',{signal:controller.signal}).then(async response=>{if(!response.ok)throw Error('Could not load the registered project root.');return response.json();}).then(data=>setRoot(data.root)).catch(error=>{if(!controller.signal.aborted)setRootError(error.message);});return()=>controller.abort();},[]);
  const terms = query.toLocaleLowerCase().trim().split(/\s+/).filter(Boolean);
  const entries = inventory.entries.filter(entry =>
    (!source || entry.source === source) && terms.every(term =>
      [entry.name, entry.description, entry.path, entry.decision, entry.note]
        .join(" ").toLocaleLowerCase().includes(term),
    ),
  );
  return { inventory, entries, source, setSource, setQuery,root,setRoot,rootError,refreshKey,refresh:()=>setRefreshKey(value=>value+1) };
};
