import React from "react";
import type { StyleGuidePageProps } from "./StyleGuidePage.types";

export const StyleGuidePage: React.FC<StyleGuidePageProps> = () => {
  return (
    <div data-grid="side-left">
      <aside data-area="side">
        <div className="scroll-y">Left side placeholder text.</div>
      </aside>
      <div data-area="main">
        <div className="scroll-y">Main area placeholder text.</div>
      </div>
    </div>
  );
};
