import type { FolderRowProps } from './FolderRow.types';
import { FolderDonut } from '../FolderCharts/FolderCharts';
import { pathKey } from '../DiscoveryExplorer/js/discovery-model';
import './css/folder-row.css';
export const FolderRow=(props:FolderRowProps)=>{
 const {folder,selected,expanded,visible,query_active,onToggle,onSelect}=props;
 const key=pathKey(folder.path),open=query_active||expanded.has(key),children=folder.children.filter(child=>!visible||visible.has(pathKey(child.path))),chosen=pathKey(selected)===key;
 return <li className="discovery-folder-row" data-selected={chosen||undefined}>
  <div className="discovery-folder-row__header">
   <button type="button" className="action-main discovery-folder-row__expand" disabled={!children.length} aria-label={`${open?'Collapse':'Expand'} ${folder.name}`} aria-expanded={children.length?open:undefined} onClick={()=>onToggle(folder.path)}>{children.length?(open?'−':'+'):'·'}</button>
   <button type="button" className="action-main discovery-folder-row__name" title={folder.path} aria-current={chosen?'location':undefined} onClick={()=>onSelect(folder.path)}>
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true"><path d="M3 7V5h6l2 2h10v12H3Z"/><path d="M3 10h18"/></svg>
    <span>{folder.name}<small>{folder.file_count.toLocaleString()} files · {folder.folder_count.toLocaleString()} folders</small></span>
   </button>
   <FolderDonut types={folder.types} compact label={`${folder.name} file types`} />
  </div>
  {open&&children.length>0&&<ul className="discovery-folder-row__children">{children.map(child=><FolderRow {...props} key={child.path} folder={child}/>)}</ul>}
 </li>;
};
