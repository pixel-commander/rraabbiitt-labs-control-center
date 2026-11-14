import { DatabaseSync } from 'node:sqlite';
import { readFile, lstat, realpath, writeFile } from 'node:fs/promises';
import { basename, dirname, extname, isAbsolute, join, relative, resolve } from 'node:path';
import ts from 'typescript';
import { createRequire, isBuiltin } from 'node:module';
import { scanFilesAndFolders } from '../tools/refresh-discovery-index/engine.ts';
import ignoredFolders from '../../../../components/ScannerStatusUi/ignored-folders.json' with {type:'json'};
import type { FinderSettings, FinderRow, FinderReport, ToolReturn } from '../FilesAndFolders.types.ts';
// @ts-expect-error Node runtime module.
import { databaseLocation } from './discovery-store.mjs';
const codeTypes=new Set(['ts','tsx','js','jsx','mjs','cjs','mts','cts']);
const key=(file:string)=>process.platform==='win32'?resolve(file).toLowerCase():resolve(file);
export const within=(root:string,file:string)=>{const r=relative(root,file);return r===''||r!=='..'&&!r.startsWith('..\\')&&!r.startsWith('../')&&!isAbsolute(r);};
const match=(value:string,query?:string)=>!query||value.toLowerCase().includes(query.toLowerCase());
export function scopeOf(s:FinderSettings){
 if(typeof s.root!=='string'||!isAbsolute(s.root))throw Error('root must be an absolute folder path.');
 if(s.db!==undefined&&typeof s.db!=='boolean')throw Error('db must be boolean.');
 for(const field of ['path','name','type','save_path','save_file'] as const)if(s[field]!==undefined&&typeof s[field]!=='string')throw Error(field+' must be a string.');
 if(s.limit!==undefined&&(!Number.isSafeInteger(s.limit)||s.limit<1||s.limit>10000))throw Error('limit must be an integer from 1 to 10000.');
 if(s.offset!==undefined&&(!Number.isSafeInteger(s.offset)||s.offset<0))throw Error('offset must be a nonnegative integer.');
 const root=resolve(s.root),scope=resolve(root,s.path||'.');if(!within(root,scope))throw Error('path must stay inside root.');return {root,scope};
}
const full=(row:FinderRow)=>row.file?join(row.path!,row.file):row.path!;
export const isType=(row:FinderRow,type?:string)=>!type||row.type?.toLowerCase()===type.replace(/^\./,'').toLowerCase();
export async function inventory(s:FinderSettings,databaseFile?:string){
 const {root,scope}=scopeOf(s);let rows:FinderRow[];
 if(s.db){
  const db=new DatabaseSync(databaseFile??await databaseLocation(),{readOnly:true});
  try{
   if(!db.prepare("SELECT 1 FROM sqlite_master WHERE name='discovery'").get())throw Error('Refresh discovery before searching the database.');
   const sizeColumn=db.prepare('PRAGMA table_info(discovery)').all().some(row=>row.name==='size')?'size':'NULL AS size';
   rows=db.prepare('SELECT id,path,file,name,type,'+sizeColumn+' FROM discovery WHERE root=?'+(process.platform==='win32'?' COLLATE NOCASE':'')+' ORDER BY path,name').all(root) as FinderRow[];
   if(!rows.length)throw Error('No saved discovery inventory for this root. Run refresh-discovery-index.');
  }finally{db.close();}
 }else{
  const scanned=await scanFilesAndFolders({root:scope,save:false});if(scanned.status==='error')throw Error(scanned.error);rows=scanned.response.paths;
 }
 const ignored=new Set(ignoredFolders.map(v=>v.toLowerCase()));
 rows=rows.filter(row=>row.error||within(scope,full(row))&&!relative(root,full(row)).split(/[\\/]/).some(part=>ignored.has(part.toLowerCase())));
 return {root,scope,rows,errors:rows.filter(row=>row.error),state:s.db?'saved discovery snapshot':'live filesystem'};
}
export async function fileFinder(s:FinderSettings):Promise<FinderReport>{
 const data=await inventory(s),valid=data.rows.filter(row=>!row.error);
 const paths=valid.filter(row=>match(row.name??basename(full(row)),s.name)&&isType(row,s.type));
 return {paths,count:paths.length,total:valid.length,errors:data.errors,detail:{state:data.state}};
}
export async function contentFinder(s:FinderSettings):Promise<FinderReport>{
 if(typeof s.name!=='string'||!s.name.trim())throw Error('name is the text to find.');
 if(s.mode!==undefined&&!['text','ast'].includes(s.mode))throw Error('mode must be ast or text.');
 if(s.kind!==undefined&&(typeof s.kind!=='string'||typeof (ts.SyntaxKind as unknown as Record<string,unknown>)[s.kind]!=='number'))throw Error('kind must be a TypeScript SyntaxKind name.');
 const data=await inventory(s),paths:FinderRow[]=[],errors=[...data.errors];let total=0,skipped=0;
 for(const row of data.rows){
  if(!row.file||row.error||!isType(row,s.type))continue;
  if(s.mode!=='text'&&!codeTypes.has(row.type??'')){skipped++;continue;}
  try{
   const file=full(row);if(!(await lstat(file)).isFile())throw Error('Not a regular file.');
   if(!within(await realpath(data.scope),await realpath(file)))throw Error('File resolves outside the scope.');
   const info=await lstat(file);if(info.size>5_000_000)throw Error('File exceeds the 5 MB search limit.');
   const text=await readFile(file,'utf8');total++;
   if(s.mode==='text'){
    text.split(/\r?\n/).forEach((line,index)=>{const column=line.toLowerCase().indexOf(s.name!.toLowerCase());if(column>=0)paths.push({...row,line:index+1,column:column+1,kind:'text',code:line.trim()});});
   }else{
    const source=ts.createSourceFile(file,text,ts.ScriptTarget.Latest,true);
    const diagnostics=(source as ts.SourceFile&{parseDiagnostics:readonly ts.Diagnostic[]}).parseDiagnostics;
    for(const diagnostic of diagnostics)errors.push({...row,error:ts.flattenDiagnosticMessageText(diagnostic.messageText,' ')});
    const visit=(node:ts.Node)=>{
     const chosen=s.kind?node.kind===(ts.SyntaxKind as unknown as Record<string,number>)[s.kind]:ts.isIdentifier(node)||ts.isStringLiteralLike(node)||ts.isJsxText(node)||ts.isTemplateHead(node)||ts.isTemplateMiddle(node)||ts.isTemplateTail(node);
     if(chosen&&match(node.getText(source),s.name)){const pos=source.getLineAndCharacterOfPosition(node.getStart(source));paths.push({...row,line:pos.line+1,column:pos.character+1,kind:ts.SyntaxKind[node.kind],code:node.getText(source).slice(0,500)});}
     ts.forEachChild(node,visit);
    };visit(source);
   }
  }catch(error){errors.push({...row,error:error instanceof Error?error.message:String(error)});}
 }
 return {paths,count:paths.length,total,errors,detail:{state:data.state,skipped,mode:s.mode??'ast'}};
}
interface Reference {source:string;path:string;file:string;name:string;type:string;line:number;target?:string}
export async function importGraph(s:FinderSettings){
 // Build the graph over the whole root before narrowing reported candidates.
 const data=await inventory({...s,path:undefined,type:undefined,name:undefined}),references:Reference[]=[],errors=[...data.errors],files=data.rows.filter(row=>row.file&&!row.error);
 const options=new Map<string,ts.CompilerOptions>();
 const compiler=(file:string)=>{const config=ts.findConfigFile(dirname(file),ts.sys.fileExists);if(!config)return {allowJs:true,moduleResolution:ts.ModuleResolutionKind.Bundler,module:ts.ModuleKind.ESNext};if(!options.has(config)){const read=ts.readConfigFile(config,ts.sys.readFile);if(read.error)throw Error(ts.flattenDiagnosticMessageText(read.error.messageText,' '));const parsed=ts.parseJsonConfigFileContent(read.config,ts.sys,dirname(config));if(parsed.errors.length)throw Error(ts.flattenDiagnosticMessageText(parsed.errors[0].messageText,' '));options.set(config,parsed.options);}return options.get(config)!;};
 for(const row of files){
  if(!codeTypes.has(row.type??''))continue;
  const file=full(row);
  try{
   const info=await lstat(file);if(!info.isFile()||info.isSymbolicLink()||info.size>5_000_000)throw Error('Source must be a regular file under 5 MB.');
   if(!within(await realpath(data.root),await realpath(file)))throw Error('Source resolves outside root.');
   const text=await readFile(file,'utf8'),source=ts.createSourceFile(file,text,ts.ScriptTarget.Latest,true);
   for(const diagnostic of (source as ts.SourceFile&{parseDiagnostics:readonly ts.Diagnostic[]}).parseDiagnostics)errors.push({...row,error:ts.flattenDiagnosticMessageText(diagnostic.messageText,' ')});
   const add=(node:ts.Node,spec:ts.Expression|undefined,type:string)=>{
    if(!spec||!ts.isStringLiteralLike(spec)){errors.push({...row,error:'Nonliteral dependency cannot be resolved statically.'});return;}
    const ref:Reference={source:spec.text,path:row.path!,file:row.file!,name:row.name!,type,line:source.getLineAndCharacterOfPosition(node.getStart(source)).line+1};
    const name=spec.text.replace(/\?(?:raw|url)(?:&.*)?$/,'');
    try{
     if(isBuiltin(name)){ref.target=name;}
     else{
      ref.target=ts.resolveModuleName(name,file,compiler(file),ts.sys).resolvedModule?.resolvedFileName;
      if(!ref.target&&name.startsWith('.')){const candidate=resolve(dirname(file),name);if(ts.sys.fileExists(candidate))ref.target=candidate;}
      if(!ref.target){try{ref.target=createRequire(file).resolve(name);}catch{}}
      if(!ref.target)errors.push({...row,error:`Unresolved import: ${spec.text}`});
     }
    }catch(error){errors.push({...row,error:error instanceof Error?error.message:String(error)});}
    if(ref.target&&!isBuiltin(ref.target))ref.target=resolve(ref.target);
    references.push(ref);
   };
   const visit=(node:ts.Node)=>{
    if(ts.isImportDeclaration(node))add(node,node.moduleSpecifier,'import');
    else if(ts.isExportDeclaration(node)&&node.moduleSpecifier)add(node,node.moduleSpecifier,'re-export');
    else if(ts.isImportEqualsDeclaration(node)&&ts.isExternalModuleReference(node.moduleReference))add(node,node.moduleReference.expression,'import-equals');
    else if(ts.isCallExpression(node)&&(node.expression.kind===ts.SyntaxKind.ImportKeyword||ts.isIdentifier(node.expression)&&node.expression.text==='require'))add(node,node.arguments[0],node.expression.kind===ts.SyntaxKind.ImportKeyword?'dynamic-import':'require');
    ts.forEachChild(node,visit);
   };visit(source);
  }catch(error){errors.push({...row,error:error instanceof Error?error.message:String(error)});}
 }
 return {...data,files,references,errors};
}
export async function importsFinder(s:FinderSettings):Promise<FinderReport>{
 const data=await importGraph(s),{scope}=scopeOf(s),refs=data.references.filter(r=>within(scope,join(r.path,r.file))&&isType({type:extname(r.file).slice(1)},s.type)&&match(r.source,s.name));
 const reverse:Record<string,Reference[]>={};for(const ref of refs){const k=ref.target??ref.source;if(!Object.hasOwn(reverse,k))Object.defineProperty(reverse,k,{value:[],enumerable:true});reverse[k].push(ref);}
 const external:Record<string,{count:number;files:string[];builtin:boolean}>={};
 for(const ref of refs){if(ref.source.startsWith('.')||isAbsolute(ref.source))continue;const dependency=ref.source.startsWith('@')?ref.source.split('/').slice(0,2).join('/'):ref.source.split('/')[0];if(!Object.hasOwn(external,dependency))Object.defineProperty(external,dependency,{value:{count:0,files:[],builtin:isBuiltin(ref.source)},enumerable:true});external[dependency].count++;const file=join(ref.path,ref.file);if(!external[dependency].files.includes(file))external[dependency].files.push(file);}
 const paths=[...new Map(refs.map(ref=>[join(ref.path,ref.file),{path:ref.path,file:ref.file,name:ref.name,type:extname(ref.file).slice(1)}])).values()];
 return {paths,count:refs.length,total:data.files.length,errors:data.errors,detail:{references:refs,by_source:reverse,external_dependencies:external,state:data.state}};
}
export async function orphansFinder(s:FinderSettings):Promise<FinderReport>{
 const data=await importGraph(s),{scope}=scopeOf(s),incoming=new Set(data.references.filter(r=>r.target&&key(r.target)!==key(join(r.path,r.file))).map(r=>key(r.target!)));
 const candidates=data.files.filter(row=>within(scope,full(row))&&!incoming.has(key(full(row)))&&match(row.name??'',s.name)&&isType(row,s.type));
 // Incomplete graphs cannot establish a useful orphan list.
 return {paths:data.errors.length?[]:candidates,count:data.errors.length?0:candidates.length,total:data.files.length,errors:data.errors,detail:{state:data.state,complete:data.errors.length===0,limitations:['Candidates only. Entry points, tests, dynamic loading, HTML and CSS references require review. No files are deleted.']}};
}
export async function typesFinder(s:FinderSettings):Promise<FinderReport>{
 const data=await inventory(s),all=data.rows.filter(row=>row.file&&!row.error),files=all.filter(row=>isType(row,s.type)&&match(row.name??'',s.name)),types:Record<string,{count:number;bytes:number}>={};const errors=[...data.errors];
 for(const row of files){const type=row.type||'(no extension)';if(!Object.hasOwn(types,type))Object.defineProperty(types,type,{value:{count:0,bytes:0},enumerable:true});types[type].count++;try{types[type].bytes+=(await lstat(full(row))).size;}catch(error){errors.push({...row,error:error instanceof Error?error.message:String(error)});}}
 return {paths:files,count:files.length,total:all.length,errors,detail:{state:data.state,types,bytes_source:'Current filesystem stat; db selects the saved file inventory.'}};
}
export async function responseFor(s:FinderSettings,report:FinderReport):Promise<ToolReturn>{
 const limit=s.limit??200,offset=s.offset??0;
 if(!Number.isSafeInteger(limit)||limit<1||limit>10000||!Number.isSafeInteger(offset)||offset<0)throw Error('Use limit 1–10000 and nonnegative offset.');
 const body={...report.detail,errors:report.errors,matched:report.paths.length,returned:Math.min(limit,Math.max(0,report.paths.length-offset)),offset,limit};
 const response={response_type:'list',summary:{count:report.count,total:report.total},paths:report.paths.slice(offset,offset+limit),body:JSON.stringify(body)};
 if(s.save_path){
  if(!(await lstat(s.save_path)).isDirectory())throw Error('save_path must be an existing folder.');
  const name=s.save_file??`finder-${Date.now()}`;if(!/^[a-zA-Z0-9_-]+$/.test(name))throw Error('save_file must be a plain filename stem.');
  await writeFile(join(s.save_path,name+'.json'),JSON.stringify({...response,paths:report.paths},null,2)+'\n',{flag:'wx'});
  await writeFile(join(s.save_path,name+'.txt'),`${report.count} matches / ${report.total} checked\n`+report.paths.map(row=>full(row)).join('\n')+'\n'+JSON.stringify(body,null,2)+'\n',{flag:'wx'});
 }
 return {return_type:'results',status:'complete',settings:s,response,...(report.errors.length?{error:`${report.errors.length} files or references need review.`}:{})};
}
