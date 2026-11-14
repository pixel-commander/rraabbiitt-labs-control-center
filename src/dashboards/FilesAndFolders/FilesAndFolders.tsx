import type { ReactNode } from "react";
import { PageHeader } from "../../components/UiElements/PageHeader/PageHeader";
import { SearchBar } from "../../components/SearchBar/SearchBar";
import { useFilesAndFolders } from "./hooks/useFilesAndFolders";
import { ScannerStatusUi } from "../../components/ScannerStatusUi/ScannerStatusUi";
import { DiscoveryExplorer } from "./components/DiscoveryExplorer/DiscoveryExplorer";
import { FinderConsole } from "./components/FinderConsole/FinderConsole";
import "./css/files-and-folders.css";
export interface FilesAndFoldersProps {
  children?: ReactNode;
  className?: string;
}
export const FilesAndFolders = ({
  children,
  className = "",
}: FilesAndFoldersProps) => {
  const { inventory, entries, source, setSource, setQuery, root,setRoot,rootError,refreshKey,refresh } = useFilesAndFolders();
  return (
    <div data-grid="header-main" className={`${className} files-and-folders`}>
      <header data-area="header">
        <PageHeader label="FILES / FOLDERS / AUDITING" Headline={<h1>Files and Folders</h1>} />
        <p>Filesystem discovery, source relationships, and project audits.</p>
      </header>
      <div data-area="main" className="files-and-folders__main">
        <section className="container-main pad files-and-folders__scan"><div><h2>Filesystem discovery</h2><p>Discover folders, scan their files with three workers, then publish the index.</p></div><label>Root folder<input value={root} onChange={event=>setRoot(event.target.value)} placeholder="Absolute folder path" /></label><ScannerStatusUi root={root} handleComplete={result=>{if(result.status==='complete'&&!result.error)refresh();}} />{rootError&&<p role="alert">{rootError}</p>}</section>
        {root && <DiscoveryExplorer root={root} refresh_key={refreshKey} />}
        {root && <FinderConsole root={root} />}
        <details className="files-and-folders__reference"><summary>Legacy tool inventory · {inventory.summary.count} source entries</summary>
        <div className="files-and-folders__sources">
          {inventory.sources.map(item => <section key={item.path} className="container-main pad">
            <h2>{item.name}</h2>
            <p>{inventory.entries.filter(entry => entry.source === item.name).length} capabilities · {item.file_count.toLocaleString()} files</p>
            <code>{item.path}</code>
          </section>)}
        </div>
        <p className="container-outline pad">Reference snapshot from {inventory.date}. These assessments describe the old tools; the current filesystem toolkit lives with this dashboard.</p>
        <div className="files-and-folders__filters">
          <SearchBar handleChange={data => setQuery(data?.search ?? "")} handleSubmit={data => setQuery(data?.search ?? "")} />
          <label>Source <select value={source} onChange={event => setSource(event.target.value)}>
            <option value="">All sources</option>
            {inventory.sources.map(item => <option key={item.name} value={item.name}>{item.name}</option>)}
          </select></label>
        </div>
        <p role="status">{entries.length} of {inventory.summary.count} capabilities</p>
        <div className="files-and-folders__table-wrap container-main">
          <table>
            <caption>Auditing tools and reuse assessments</caption>
            <thead><tr><th scope="col">Capability</th><th scope="col">Assessment</th><th scope="col">Work needed</th></tr></thead>
            <tbody>{entries.map(entry => <tr key={entry.path}>
              <td><strong>{entry.name}</strong><p>{entry.description}</p><small>{entry.source} · {entry.type}</small><code>{entry.path}</code></td>
              <td>{entry.decision}</td><td>{entry.note}</td>
            </tr>)}</tbody>
          </table>
          {entries.length === 0 && <p className="pad">No matching capabilities.</p>}
        </div>
        </details>
        {children}
      </div>
    </div>
  );
};
