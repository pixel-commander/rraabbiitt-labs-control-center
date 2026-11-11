import { Demo as TooltipDemo } from "../../components/Tooltip/demo/Demo";
import { Demo as MessageBoxDemo } from "../../components/MessageBox/demo/Demo";
import { Demo as SiteNavDemo } from "../../components/SiteNav/demo/Demo";
import { useState } from "react";
import { Demo as CodeEditAndViewDemo } from "../../components/CodeEditAndView/demo/Demo";
import { Demo as UiElementsDemo } from "../../components/UiElements/demo/Demo";
import { Demo as SearchResponsesDemo } from "../../components/SearchResponses/demo/Demo";
import { Slider } from "../../components/Slider/Slider";
import { McpViewer } from "../../components/McpViewer/McpViewer";
import { Demo as FloatWindowDemo } from "../../components/FloatWindow/demo/Demo";
import "./css/style-guide.css";
const containers = [
  "container-main",
  "container-outline",
  "container-alt",
  "container-neg",
  "container-fill",
  "container-side-rail",
];
const actions = [
  "action-outline",
  "action-filled",
  "action-ghost",
  "action-light",
];
export const StyleGuidePage = () => {
  const [value, setValue] = useState(0.7);
  return (
    <div className="style-guide" data-cols="1" data-gap="section">
      <header>
        <p className="style-guide-kicker">RRAABBIITT / DESIGN SYSTEM</p>
        <h1>Style guide</h1>
        <p>Charcoal surfaces. Cyan signals. One set of theme tokens.</p>
        <a className="action-text-link" href="/world-search">
          Open World Search ↗
        </a>
      </header>
      <section id="mcp-viewer" data-cols="1" data-gap="content">
        <h2>McpViewer</h2>
        <McpViewer />
      </section>
      <section id="float-window" data-cols="1" data-gap="content">
        <h2>FloatWindow</h2>
        <FloatWindowDemo />
      </section>
      <section data-cols="1" data-gap="content">
        <h2>Color slots</h2>
        <div data-cols="1" data-gap="content">
          {[
            "main",
            "main-alt",
            "primary",
            "primary-alt",
            "secondary",
            "secondary-alt",
            "tertiary",
            "tertiary-alt",
            "muted",
            "inverse",
          ].map((slot) => (
            <div key={slot} data-cols="2" data-gap="content">
              {["color-" + slot, "color-" + slot + "-neg"].map((token) => (
                <div key={token}>
                  <div
                    className="style-guide-swatch"
                    style={{ background: "var(--" + token + ")" }}
                  />
                  <code>--{token}</code>
                </div>
              ))}
            </div>
          ))}
        </div>
        <h2>Status colors</h2>
        <div data-cols="4" data-collapse="2" data-gap="content">
          {[
            "status-success",
            "status-warning",
            "status-error",
            "status-muted",
          ].map((token) => (
            <div key={token}>
              <div
                className="style-guide-swatch"
                style={{ background: "var(--" + token + ")" }}
              />
              <code>--{token}</code>
            </div>
          ))}
        </div>
      </section>
      <section data-cols="1" data-gap="content">
        <h2>Containers</h2>
        <div data-cols="2" data-collapse="2" data-gap="content">
          {containers.map((name) => (
            <div key={name} className={name + " style-guide-sample"}>
              <h3>{name}</h3>
              <p>Reusable surface skin, composed in markup.</p>
              {name === "container-side-rail" && (
                <p>(modifiers: right, top, bottom)</p>
              )}
            </div>
          ))}
        </div>
      </section>
      <section data-cols="1" data-gap="content">
        <h2>Actions</h2>
        <div
          className="style-guide-action-list"
          data-cols="1"
          data-gap="content"
        >
          {actions.map((name) => (
            <div data-cols="4" data-collapse="2" data-gap="control" key={name}>
              <code>{name}</code>
              <button className={name} type="button">
                Default
              </button>
              <button
                className={name + " is-selected"}
                type="button"
                aria-pressed="true"
              >
                Selected
              </button>
              <button className={name} type="button" disabled>
                Disabled
              </button>
            </div>
          ))}
        </div>
      </section>
      <section id="site-nav" data-cols="1" data-gap="content">
        <h2>SiteNav</h2>
        <SiteNavDemo />
      </section>
      <section data-cols="1" data-gap="content">
        <h2>Inline text color</h2>
        <p>
          Use an{" "}
          <a href="#ui-elements" className="action-text-link">
            inline link
          </a>{" "}
          or a <span className="action-text-link">colored span</span> in a
          sentence, with no underline.
        </p>
      </section>
      <section id="tooltip" data-cols="1" data-gap="content">
        <h2>Tooltip</h2>
        <TooltipDemo />
      </section>
      <section id="message-box" data-cols="1" data-gap="content">
        <h2>MessageBox</h2>
        <MessageBoxDemo />
      </section>
      <section id="ui-elements" data-cols="1" data-gap="content">
        <h2>UiElements</h2>
        <UiElementsDemo />
      </section>
      <section id="search-responses" data-cols="1" data-gap="content">
        <h2>SearchResponses</h2>
        <SearchResponsesDemo />
      </section>
      <section data-cols="1" data-gap="content">
        <h2>Shared Slider</h2>
        <div className="container-main style-guide-sample">
          <Slider
            label="Temperature"
            min={0}
            max={2}
            step={0.1}
            value={value}
            handleChange={(next) => setValue(next ?? 0)}
          />
          <Slider label="Disabled" min={0} max={2} value={1} is_disabled />
        </div>
      </section>
      <section id="code-edit-and-view" data-cols="1" data-gap="content">
        <h2>CodeEditAndView</h2>
        <CodeEditAndViewDemo />
      </section>
    </div>
  );
};
