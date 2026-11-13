import "./css/world-code-view-popup-link.css";
import type { WorldCodeViewPopupLinkProps } from "./WorldCodeViewPopupLink.types";
import { CodeViewPopupLink } from "../../CodeViewPopupLink/CodeViewPopupLink";

export const WorldCodeViewPopupLink = ({ src_path, className = "", ...props }: WorldCodeViewPopupLinkProps) => {
  const source = src_path?.replaceAll("\\", "/");
  const slash = source?.lastIndexOf("/") ?? -1;
  const path = source !== undefined ? slash >= 0 ? source.slice(0, slash + 1) : "" : props.path;
  const file = source !== undefined ? source.slice(slash + 1) : props.file;
  return (
    <CodeViewPopupLink {...props} path={path} file={file} className={["world-code-view-popup-link", className].filter(Boolean).join(" ")}
      handleLoad={async location => {
        const query = new URLSearchParams({ path: location?.path ?? "", file: location?.file ?? "" });
        const response = await fetch(`/api/file-system/read-file?${query}`);
        const result = await response.json();
        if (!response.ok || typeof result.code !== "string") throw new Error(result.error ?? "Could not read file.");
        return result.code;
      }} />
  );
};
