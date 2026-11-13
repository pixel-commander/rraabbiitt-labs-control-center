import { useLayoutEffect, useState } from "react";
import type { DesignerProps } from "../RABDesigner.types";
import { isHtml } from "../js/htmlModel";
import { captureLayout } from "../js/layoutSnapshot";
import { locate } from "../js/document";
import { compositionCode } from "../js/composition";
import gridCSS from "../../../css/grid.css?raw";
import { siteCode } from "../js/site";
export function useDesignerComposition(props: DesignerProps) {
  const [layout, setLayout] = useState(props.data);
  useLayoutEffect(() => {
    if (!isHtml(props.data))
      setLayout(captureLayout(props.data, props.view.scale));
  }, [props.data, props.view.scale]);
  const selected = locate(props.data.children, props.selected)?.node;
  const site = isHtml(props.data)
    ? siteCode(props.data, selected, props.data.mode === "view" ? gridCSS : "")
    : undefined;
  const layoutSelected = locate(layout.children, props.selected)?.node;
  return {
    site,
    code: site
      ? { jsx: props.data.mode === "dev" ? site.jsx : site.html, css: site.css }
      : compositionCode(
          layoutSelected ? [layoutSelected] : layout.children,
          layout.theme,
        ),
  };
}
