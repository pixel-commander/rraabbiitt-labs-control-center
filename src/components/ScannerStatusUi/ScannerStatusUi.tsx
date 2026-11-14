import type { ScannerStatusUiProps } from './ScannerStatusUi.types';
import { useId, useRef } from 'react';
import { useScannerStatusUi } from './hooks/useScannerStatusUi/useScannerStatusUi';
import ignoredFolders from './ignored-folders.json';
import './css/scanner-status-ui.css';
import './css/scanner-status-content.css';

export const ScannerStatusUi = (props: ScannerStatusUiProps) => {
  const scan = useScannerStatusUi(props);
  const dialog = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const time = (date?:number) => date ? new Date(date).toLocaleTimeString() : '—';
  const heading = {idle:'Ready to scan',scanning:'Scanning…',complete:'Scan complete',error:'Scan needs attention'}[scan.status];
  const launch = () => {
    if (!dialog.current?.open) dialog.current?.showModal();
    if (scan.status === 'idle') void scan.start();
  };
  const progress = scan.progress;
  const stats = [
    ['Start',time(scan.started)],['End',time(scan.ended)],
    ['Duration',scan.started ? `${((Number(scan.ended??scan.now??scan.started)-scan.started)/1000).toFixed(1)}s` : '—'],
    ['Files',progress?.files??'—'],['Folders',progress?.folders??'—'],['Errors',Math.max(progress?.errors??0,scan.error?1:0)],
  ];
  return <>
    <button type="button" className="action-main pad" onClick={launch} disabled={!props.root.trim()}>{scan.status === 'scanning' ? 'View scan progress' : props.button_label??'Scan files and folders'}</button>
    <dialog ref={dialog} className={`scanner-status-popup container-main ${props.className??''}`} aria-labelledby={titleId}>
      <div className="scanner-status-popup__toolbar"><strong id={titleId}>Filesystem discovery</strong>
        <button type="button" className="action-outline" onClick={()=>dialog.current?.close()} title="Hide this window. A running scan continues.">Close</button>
      </div>
      <section className="scanner-status-ui" data-grid="shell" data-status={scan.status} aria-label="Scanner status">
        <header data-area="header" className="scanner-status-ui__header" role="status" aria-live="polite" aria-atomic="true"><strong>{heading}</strong><small>{progress?.root??props.root}</small></header>
        <div data-area="main" data-grid="side-left" className="scanner-status-ui__main">
          <aside data-area="side" className="container-main scanner-status-ui__sidebar scroll-y" tabIndex={0} aria-label="Folder timeline">
            <ol className="scanner-status-demo__timeline">
              <li data-state={progress?.root_read?'complete':scan.status}><strong>Folder discovery</strong><small>Collect all folders first</small><span className="scanner-status-demo__dot" /></li>
              {progress?.branches.map(branch=><li key={branch.path} title={branch.path} data-state={branch.state} aria-current={branch.state==='scanning'?'step':undefined}>
                <strong><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true"><path d="M3 7V5h6l2 2h10v12H3Z" /></svg>{branch.name}</strong>
                <small>{branch.state}{branch.started&&branch.ended ? ` · ${branch.ended-branch.started}ms` : ''}{branch.error && ` · ${branch.error}`}</small><span className="scanner-status-demo__dot" />
              </li>)}
            </ol>
          </aside>
          <div data-area="main" className="container-cell container-cell--inset scanner-status-ui__details-container">
            <div className="scroll-y scanner-status-ui__details" tabIndex={0} role="region" aria-label="Scan activity">
              <h3 className="scanner-status-demo__heading">Master activity</h3>
              <p className="scanner-status-ui__meta">Discover all folders, then three asynchronous workers read each folder’s files. Ignored folders are skipped.</p>
              {scan.status==='scanning' && <div className="scanner-status-ui__meta">{progress?.workers?.filter(worker=>worker.worker>0).map(worker=><p key={worker.worker}>Worker {worker.worker} · {worker.state} · {worker.name}</p>)}<p>{progress?.pending??0} folders queued</p></div>}
              {scan.error && <p role="alert" className="scanner-status-ui__error">{scan.error}</p>}
              {!scan.events.length && <p>Waiting for filesystem progress…</p>}
              <ol className="scanner-status-demo__events">{scan.events.map((event,index)=><li key={`${event.time}-${index}`} data-error={event.error||undefined} title={event.message}>
                <small>{time(event.time)} · {event.source}</small><p>{event.message}</p>
              </li>)}</ol>
              {scan.status==='complete' && <p>{props.save===false?'Inventory returned without saving.':'Discovery table updated.'}</p>}
              <details><summary>Ignored folders</summary><p className="scanner-status-ui__meta">{ignoredFolders.join(', ')}</p></details>
              {scan.result && <details><summary>Tool return summary</summary><pre>{JSON.stringify(scan.result,null,2)}</pre></details>}
              {props.children}
            </div>
          </div>
        </div>
        <footer data-area="footer" className="scanner-status-ui__footer">
          <dl className="scanner-status-ui__stats">{stats.map(([label,value])=><div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl>
          <button type="button" className="action-outline" disabled={scan.status==='scanning'} onClick={()=>void scan.start()}>Rescan</button>
        </footer>
      </section>
    </dialog>
  </>;
};
