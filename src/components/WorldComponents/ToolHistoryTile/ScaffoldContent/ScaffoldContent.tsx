import { FolderTree } from "../../../FolderTree/FolderTree";
import { settingsPathsToTree } from "../../../../js/settings-paths-to-tree/settings-paths-to-tree";
import type { PathsProps } from "../../../../HouseKeys.types";
import type { ScaffoldContentProps } from "./ScaffoldContent.types";
import { useState } from "react";
import type { FolderTreeNode } from "../../../FolderTree/FolderTree.types";
import { WorldCodeViewPopupLink } from "../../WorldCodeViewPopupLink/WorldCodeViewPopupLink";
import "./css/scaffold-content.css";

export const ScaffoldContent = ({ response, className = "" }: ScaffoldContentProps) => {
  const [selected, setSelected] = useState<FolderTreeNode>();
  const record = response && typeof response === "object" ? response as Record<string, unknown> : {};
  const paths = Array.isArray(record.paths) ? record.paths.filter((entry): entry is PathsProps =>
    entry != null && typeof entry === "object" &&
    (entry.path === undefined || typeof entry.path === "string") &&
    (entry.file === undefined || typeof entry.file === "string") &&
    (entry.name === undefined || typeof entry.name === "string")) : [];
  const sourcePath = (item: FolderTreeNode) =>
    typeof record.path === "string" &&
    paths.some(entry => (entry.file ?? entry.name) === item.path && (!entry.path || entry.path === "."))
      ? `${record.path.replace(/[\\/]$/, "")}/${item.path}`
      : item.path;
  const items = settingsPathsToTree(paths);
  return (
    <div data-grid="side-right" data-collapse="1" className={["scaffold-content", className].filter(Boolean).join(" ")}>
      <div data-area="main" className="scaffold-content__info">
        <span className="scaffold-content__type">{String(record.type ?? "Scaffold")}</span>
        <h3>{String(record.title ?? record.name ?? "Created item")}</h3>
        {typeof record.description === "string" && record.description && <p>{record.description}</p>}
        <dl>
          {["id", "name", "path", "file"].map(key => record[key] != null && <div key={key}><dt>{key}</dt><dd><code>{String(record[key])}</code></dd></div>)}
          <div><dt>Files</dt><dd>{paths.length}</dd></div>
        </dl>
        {Array.isArray(record.tags) && <div className="scaffold-content__tags">{record.tags.filter(tag => typeof tag === "string").map((tag, index) => <span key={index}>{tag}</span>)}</div>}
      </div>
      <div data-area="side" className="scaffold-content__paths scroll-both">
        <strong>Created files</strong>
        {items.length ? <FolderTree items={items} start_state="open" auto_size={false} selected={selected?.path}
          handleClick={(item, type) => { if (item && type === "file") setSelected(item); }} /> : <p>No paths returned.</p>}
      </div>
      {selected && <WorldCodeViewPopupLink key={selected.path} src_path={sourcePath(selected)}
        open showLink={false} handleCancel={() => setSelected(undefined)} />}
    </div>
  );
};

