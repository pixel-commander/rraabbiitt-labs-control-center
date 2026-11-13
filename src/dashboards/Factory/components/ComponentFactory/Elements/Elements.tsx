import type { FactoryHeadline, FactoryLayoutTag } from "../ComponentFactory.types";
import type { ElementsProps } from "./Elements.types";
import "./css/elements.css";

const layoutTags: FactoryLayoutTag[] = ["article", "aside", "footer", "header", "main", "nav", "section", "div", "span"];
const headings: FactoryHeadline[] = ["h1", "h2", "h3", "h4", "h5", "h6"];

export const Elements = ({ editor, className }: ElementsProps) => {
  const disabled = editor.area === undefined;

  return (
    <div data-grid="header-main" className={["component-factory-elements", className].filter(Boolean).join(" ")}>
      <header data-area="header" className="pad-md">Elements</header>
      <div data-area="main" data-rows="1" data-cols="1">
        <div className="inner scroll-y pad-md">
          <details open>
            <summary>Layout</summary>
            <div data-cols="2" data-gap="control">
              {layoutTags.map((layoutTag) => (
                <button key={layoutTag} type="button" className="action-main" disabled={disabled} onClick={() => editor.addElement("Div", { layoutTag })}>
                  {layoutTag}
                </button>
              ))}
            </div>
          </details>
          <details>
            <summary>Text</summary>
            <div data-cols="2" data-gap="control">
              <button type="button" className="action-main" disabled={disabled} onClick={() => editor.addElement("Text")}>Text</button>
              {headings.map((heading) => (
                <button key={heading} type="button" className="action-main" disabled={disabled} onClick={() => editor.addElement("Headline", { heading })}>
                  {heading}
                </button>
              ))}
            </div>
          </details>
          <details>
            <summary>Actions</summary>
            <div data-cols="2" data-gap="control">
              <button type="button" className="action-main" disabled={disabled} onClick={() => editor.addElement("Link")}>Link</button>
              <button type="button" className="action-main" disabled={disabled} onClick={() => editor.addElement("Button")}>Button</button>
            </div>
          </details>
          <details>
            <summary>Forms</summary>
            <p>Coming soon</p>
          </details>
        </div>
      </div>
    </div>
  );
};
