import { viewGrids, setViewGrid, addViewElement } from "../../js/viewGrid";
import { isHtml, instantiateClass } from "../../js/htmlModel";
import { useRef } from "react";
import type { DesignerProps, DesignerElement } from "../../RABDesigner.types";
import { newElement } from "../../js/document";
import "./css/designer-library.css";
import { useDesignerTabs } from "../../hooks/useDesignerTabs";
export const DesignerLibrary = (props: DesignerProps) => {
  const tiles = useRef<HTMLDivElement>(null);
  const status = useRef<HTMLOutputElement>(null);
  const { root, handleTab } = useDesignerTabs("components", props.data);
  const add = (name: string) => {
    if (isHtml(props.data) && name === "Text") {
      props.handleAction({ value: "text" }, "tool", { ...props });
      return;
    }
    const node = newElement(
      name === "Text" ? "text" : "box",
      40,
      40,
      name === "Frame" ? 1120 : name === "Button" ? 140 : 240,
      name === "Frame" ? 720 : name === "Button" ? 44 : 160,
    );
    node.title = name;
    if (name === "Text") node.content = "Text";
    if (name === "Card")
      node.children = [
        {
          ...newElement("text", 20, 20, 180, 40),
          content: "Card title",
          title: "Card title",
          fontSize: 20,
          fontWeight: 600,
        },
      ];
    if (name === "Button") {
      node.content = "Button";
      node.color = "accent";
    }
    if (name === "3 columns" || name === "3 rows") {
      node.grid = name === "3 columns" ? "columns" : "rows";
      node.cols = 3;
      node.rows = 3;
      node.width = 640;
      node.height = 300;
      node.children = Array.from({ length: 3 }, (_, i) => ({
        ...newElement("box", i * 180, 0, 160, 100),
        title: `Cell ${i + 1}`,
      }));
    }
    let data = { ...props.data, children: [...props.data.children, node] };
    if (props.data.mode === "view") {
      try {
        data = addViewElement(props.data, props.selected, node);
      } catch (error) {
        if (status.current) status.current.value = (error as Error).message;
        return;
      }
    }
    if (status.current) status.current.value = "";
    props.handleChange(data, "change", { ...props });
    props.handleClick({ id: node.id }, "select", { ...props });
  };
  const tree = (nodes: DesignerElement[], depth = 0): React.ReactNode =>
    nodes.map((node) => (
      <div key={node.id}>
        <button
          className={[
            "designer-layer",
            "action-canvas-tool",
            props.selected === node.id ? "is-selected" : "",
          ].join(" ")}
          aria-pressed={props.selected === node.id}
          style={{ paddingLeft: 16 + depth * 16 }}
          onClick={() =>
            props.handleClick({ id: node.id }, "select", { ...props })
          }
        >
          <span>{node.children.length ? "⌄" : " "}</span>
          <span>{node.type === "text" ? "T" : "▣"}</span>
          {node.title}
        </button>
        {tree(node.children, depth + 1)}
      </div>
    ));
  return (
    <aside
      ref={root}
      data-grid="header-main"
      className="designer-library container-canvas-panel"
      aria-label="Components and layers"
    >
      <div
        data-area="header"
        role="tablist"
        aria-label="Library sections"
        className="designer-panel-tabs"
      >
        {["components", "layers", "icons"].map((tab, index) => (
          <button
            key={tab}
            id={`designer-library-tab-${tab}`}
            role="tab"
            data-tab={tab}
            aria-controls={`designer-library-${tab}`}
            aria-selected={index === 0}
            tabIndex={index === 0 ? 0 : -1}
            className={`action-nav-alt ${index === 0 ? "is-selected" : ""}`}
            onClick={() => handleTab({ value: tab }, "tab", { ...props })}
            onKeyDown={(e) => {
              if (["ArrowLeft", "ArrowRight", "Home", "End"].includes(e.key)) {
                e.preventDefault();
                const buttons = Array.from(
                  e.currentTarget.parentElement!.querySelectorAll<HTMLButtonElement>(
                    '[role="tab"]',
                  ),
                );
                const next =
                  e.key === "Home"
                    ? 0
                    : e.key === "End"
                      ? buttons.length - 1
                      : (index +
                          (e.key === "ArrowRight" ? 1 : buttons.length - 1)) %
                        buttons.length;
                buttons[next].click();
                buttons[next].focus();
              }
            }}
          >
            {tab[0].toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>
      <div data-area="main" className="scroll-y">
        <section
          id="designer-library-components"
          role="tabpanel"
          aria-labelledby="designer-library-tab-components"
          data-panel="components"
          className="designer-library-content"
        >
          {props.data.mode === "view" && (
            <>
              <h3>House grid</h3>
              <div data-cols="2" data-gap="control">
                {Object.entries(viewGrids).map(([grid, areas]) => (
                  <button
                    key={grid}
                    className={`designer-tile container-cell action-main ${props.data.children[0]?.["data-grid"] === grid ? "is-selected" : ""}`}
                    aria-pressed={
                      props.data.children[0]?.["data-grid"] === grid
                    }
                    onClick={() =>
                      props.handleChange(
                        setViewGrid(props.data, grid),
                        "change",
                        { ...props },
                      )
                    }
                  >
                    <strong>{grid}</strong>
                    <span>{areas.join(" / ")}</span>
                  </button>
                ))}
              </div>
              <p>Select an area or a div, then add to it.</p>
            </>
          )}
          <output ref={status} aria-live="polite" />
          <input
            className="container-cell"
            aria-label="Find a component"
            placeholder="⌕  Find a component"
            onInput={(e) => {
              const query = e.currentTarget.value.toLowerCase();
              tiles.current
                ?.querySelectorAll<HTMLElement>("[data-title]")
                .forEach((tile) => {
                  tile.hidden = !tile.dataset.title
                    ?.toLowerCase()
                    .includes(query);
                });
            }}
          />
          <div ref={tiles}>
            <h3>Layout</h3>
            <div data-cols="3" data-gap="control">
              {(isHtml(props.data)
                ? ["Div"]
                : ["Frame", "3 columns", "3 rows"]
              ).map((name) => (
                <button
                  key={name}
                  data-title={name}
                  className="designer-tile container-cell action-main"
                  onClick={() => add(name)}
                >
                  <svg
                    width="54"
                    height="38"
                    viewBox="0 0 54 38"
                    fill="none"
                    stroke="currentColor"
                    aria-hidden="true"
                  >
                    <rect x="2" y="2" width="50" height="34" />
                    {name === "3 columns" ? (
                      <path d="M18 2V36 M36 2V36" />
                    ) : name === "3 rows" ? (
                      <path d="M2 13H52 M2 25H52" />
                    ) : null}
                  </svg>
                  <span>{name}</span>
                </button>
              ))}
            </div>
            <h3>Components</h3>
            <div data-cols="3" data-gap="control">
              {(isHtml(props.data)
                ? ["Text"]
                : ["Box", "Card", "Button", "Text"]
              ).map((name) => (
                <button
                  key={name}
                  data-title={name}
                  className="designer-tile container-cell action-main"
                  onClick={() => add(name)}
                >
                  <span className="designer-tile-icon">
                    {name === "Text" ? "T" : name === "Button" ? "▭" : "□"}
                  </span>
                  <span>{name}</span>
                </button>
              ))}
            </div>
          </div>
          {props.data.mode === "dev" && (
            <>
              <h3>Saved classes</h3>
              {Object.keys(props.data.classes ?? {}).map((name) => (
                <button
                  key={name}
                  className="action-main designer-file-row"
                  onClick={() => {
                    const node = instantiateClass(props.data, name);
                    props.handleChange(
                      {
                        ...props.data,
                        children: [...props.data.children, node],
                      },
                      "change",
                      { ...props },
                    );
                    props.handleClick({ id: node.id }, "select", { ...props });
                  }}
                >
                  + {name}
                </button>
              ))}
            </>
          )}
        </section>
        <section
          id="designer-library-layers"
          role="tabpanel"
          aria-labelledby="designer-library-tab-layers"
          data-panel="layers"
          hidden
        >
          <h3 className="designer-tree-heading">Composition</h3>
          {props.data.children.length ? (
            tree(props.data.children)
          ) : (
            <p className="designer-tree-heading container-cell-content-muted">
              No layers yet. Add a component or draw on the canvas.
            </p>
          )}
        </section>
        <section
          id="designer-library-icons"
          role="tabpanel"
          aria-labelledby="designer-library-tab-icons"
          data-panel="icons"
          hidden
          className="designer-library-content"
        >
          <h3>Icons</h3>
          <p className="container-cell-content-muted">
            Icon library coming later.
          </p>
        </section>
      </div>
    </aside>
  );
};
