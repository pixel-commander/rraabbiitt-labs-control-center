import { TabNav } from "../../../../components/TabNav/TabNav";
import { compositionCode } from "./js/compositionCode";
import type { FactoryEditorProps } from "./ComponentFactory.types";

const compositionTabs = [
  { id: 1, path: "HTML", label: "HTML" },
  { id: 2, path: "CSS", label: "CSS" },
];

export const CodePreview = ({ editor }: FactoryEditorProps) => {
  const { css, html } = compositionCode(editor.composition);
  const cssSelected = editor.compositionTab === "CSS";

  return (
    <div data-grid="header-main" className="component-factory-code-preview">
      <header data-area="header" className="pad-md">
        <TabNav
          items={compositionTabs}
          selected={editor.compositionTab}
          styler="tabs"
          full
          handleClick={(item) => item && editor.setCompositionTab(item.path)}
        />
      </header>
      <div data-area="main" data-rows="1" data-cols="1">
        <div className="inner scroll-both pad-md">
          <pre><code>{cssSelected ? css : html}</code></pre>
        </div>
      </div>
    </div>

  );
};
