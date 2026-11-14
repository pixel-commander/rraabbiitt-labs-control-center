import { readdir, lstat } from 'node:fs/promises';
import { basename, extname, isAbsolute, join, resolve } from 'node:path';
import ignoredFolders from '../../../../../components/ScannerStatusUi/ignored-folders.json' with { type:'json' };
import type { ScanBranch, ScanProgress, ScanFilesAndFoldersProps, ScanFilesAndFoldersReturn, ScanFilesAndFoldersPath } from '../../../../../components/ScannerStatusUi/ScannerStatusUi.types.ts';
// @ts-expect-error Node runtime module.
import { databaseLocation, saveDiscovery } from '../../_shared/discovery-store.mjs';
const ignored = new Set(ignoredFolders.map(name=>name.toLowerCase()));
export interface ScanOptions { progress?:(event:ScanProgress)=>void|Promise<void> }

/** Adapted from rab-worlds' three-worker scanner. Discovery now seals the full folder array first. */
export async function scanFilesAndFolders(settings:ScanFilesAndFoldersProps, options:ScanOptions={}):Promise<ScanFilesAndFoldersReturn> {
  const paths:ScanFilesAndFoldersPath[]=[];
  const result=(status:'complete'|'error',error?:string):ScanFilesAndFoldersReturn=>({return_type:'results',status,settings:{...settings},...(error?{error}:{}),response:{paths,summary:{count:paths.filter(row=>!row.error).length,total:paths.length}}});
  try {
    if(typeof settings.root!=='string'||!isAbsolute(settings.root))throw Error('root must be an absolute directory.');
    if(settings.save!==undefined&&typeof settings.save!=='boolean')throw Error('save must be boolean.');
    const root=resolve(settings.root),info=await lstat(root);
    if(!info.isDirectory()||info.isSymbolicLink())throw Error('root must be a directory, not a symbolic link.');
    const folders=[root],owners=new Map<string,string>(),branches=new Map<string,ScanBranch>();
    let files=0,errors=0,cursor=0;
    const emit=async(directory:string,worker:number,state:ScanProgress['state'],phase:ScanProgress['phase'],directFiles=0,error?:string)=>{
      await options.progress?.({root,directory,name:basename(directory)||directory,worker,state,phase,
        files,folders:folders.length,errors,directFiles,pending:phase==='files'?folders.length-cursor:folders.length,
        queued:folders.slice(cursor,cursor+30),timestamp:Date.now(),branches:[...branches.values()].map(row=>({...row})),...(error?{error}:{}),
      });
    };
    const failed=(directory:string,error:unknown)=>{
      const message=error instanceof Error?error.message:String(error);errors++;paths.push({path:directory,type:'error',error:message});return message;
    };
    // Pass 1: discover directories only. File workers cannot begin until this pass ends.
    for(let index=0;index<folders.length;index++){
      const directory=folders[index];
      paths.push({path:directory,name:basename(directory)||directory,type:'folder'});
      await emit(directory,0,'scanning','discovery');
      try {
        for(const entry of await readdir(directory,{withFileTypes:true})){
          if(entry.isSymbolicLink()||!entry.isDirectory()||ignored.has(entry.name.toLowerCase()))continue;
          const child=join(directory,entry.name);folders.push(child);
          if(directory===root){owners.set(child,child);branches.set(child,{path:child,name:entry.name,state:'waiting',pending:1});}
          else {const owner=owners.get(directory);if(owner){owners.set(child,owner);branches.get(owner)!.pending++;}}
        }
        await emit(directory,0,'read','discovery');
      } catch(error) {const message=failed(directory,error);const owner=owners.get(directory);if(owner)branches.get(owner)!.error=message;await emit(directory,0,'error','discovery',0,message);}
    }
    const worker=async(id:number)=>{
      while(cursor<folders.length){
        const directory=folders[cursor++],owner=owners.get(directory),branch=owner?branches.get(owner):undefined;
        if(branch){branch.started??=Date.now();branch.state='scanning';}
        await emit(directory,id,'scanning','files');let directFiles=0,failure:string|undefined;
        try {
          for(const entry of await readdir(directory,{withFileTypes:true})){
            if(!entry.isFile()||entry.isSymbolicLink())continue;
            const info=await lstat(join(directory,entry.name));
            if(!info.isFile()||info.isSymbolicLink())continue;
            paths.push({path:directory,file:entry.name,name:entry.name,type:extname(entry.name).slice(1).toLowerCase(),size:info.size});files++;directFiles++;
          }
        } catch(error) {failure=failed(directory,error);if(branch)branch.error??=failure;}
        if(branch){branch.pending--;if(branch.pending===0){branch.ended=Date.now();branch.state=branch.error?'error':'complete';}}
        await emit(directory,id,failure?'error':'read','files',directFiles,failure);
      }
    };
    await Promise.all([worker(1),worker(2),worker(3)]);
    if(errors)return result('complete',`${errors} folder reads failed. Previous discovery rows were kept.`);
    if(settings.save!==false){
      await emit(root,0,'scanning','indexing');
      const saved=await saveDiscovery(await databaseLocation(),root,paths);
      paths.splice(0,paths.length,...saved);
      await emit(root,0,'read','indexing');
    }
    return result('complete');
  } catch(error) {return result('error',error instanceof Error?error.message:String(error));}
}
