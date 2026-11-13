import { PositionIcon } from "../../../../icons/PositionIcon";
import { CodePreview } from "./CodePreview";
import type { ComponentFactoryProps, FactoryDisplay, FactoryEditorProps, FactoryElement } from "./ComponentFactory.types";
import { SettingsCol } from "./SettingsCol/SettingsCol";
import { PaddingFields, SizeSelect } from "./SizeFields";
import { Stylers } from "./Stylers/Stylers";

const styleTabs = ["Style", "Theme", "Code"];
const displays: FactoryDisplay[] = ["block", "grid", "flex", "inline", "inline-block", "inline-grid", "inline-flex"];

const atomStyles = import.meta.glob("../../../../atoms/{containers,effects,actions}/*/*.css", { eager: true });

const atomNames = (group: string) =>
  Object.keys(atomStyles)
    .filter((path) => path.includes(`/${group}/`))
    .map((path) => path.split("/").at(-2)!)
    .sort();

const containers = atomNames("containers");
const effects = atomNames("effects");
const actions = atomNames("actions");

export const StyleCol = ({ editor, theme_tokens, layout_tokens }: FactoryEditorProps & Pick<ComponentFactoryProps, "theme_tokens" | "layout_tokens">) => {
  const { selected, composition } = editor;
  const layoutTokens = Object.entries(layout_tokens ?? {});
  const textElement = selected && (selected.type === "Text" || selected.type === "Headline");
  const surface = editor.area === undefined
    ? composition.gridStyle
    : composition.areaStyles?.[editor.area];
  const previewFile = editor.compositionTab === "CSS" ? "composition.css" : "composition.html";

  return (
    <div data-area="right" data-rows="2" data-cols="1">
      <SettingsCol
        tabs={styleTabs}
        selected={editor.styleTab}
        handleClick={(item) => { if (item) editor.setStyleTab(item.path); }}
      >
        <div className="pad-md" data-cols="1" data-gap="control">
          {editor.styleTab === "Code" ? (
            <small>{previewFile}</small>
          ) : editor.styleTab === "Theme" ? (
            <>
              {layoutTokens.length > 0 && (
                <fieldset>
                  <legend>Layout</legend>
                  <dl>
                    {layoutTokens.map(([name, value]) => (
                      <div key={name}>
                        <dt>{name}</dt>
                        <dd>{value}</dd>
                      </div>
                    ))}
                  </dl>
                </fieldset>
              )}
              <form onSubmit={(event) => {
                event.preventDefault();
                const values = new FormData(event.currentTarget);
                const name = String(values.get("name")).trim();
                const color = String(values.get("color"));
                if (/^[a-z][a-z0-9-]*$/i.test(name)) editor.setColor(`--factory-${name.toLowerCase()}`, color);
                event.currentTarget.reset();
              }}>
                <label>Color name<input name="name" required pattern="[A-Za-z][A-Za-z0-9\-]*" /></label>
                <label>Color<input name="color" type="color" /></label>
                <button type="submit" className="action-main">Add theme color</button>
              </form>
              {Object.entries(composition.colors ?? {}).map(([name, value]) => (
                <label key={name}>{name}<input type="color" value={value} onChange={(event) => editor.setColor(name, event.target.value)} /></label>
              ))}
            </>
          ) : !editor.frameSelected && editor.area === undefined ? (
            <p>Select a layer to edit its style.</p>
          ) : (
            <>
              <strong>{selected?.type ?? (editor.area ? `Area: ${editor.area}` : "Grid shell")}</strong>
              {!selected && editor.area !== undefined && (
                <fieldset>
                  <legend><PositionIcon /> Position</legend>
                  <div data-cols="2" data-gap="control">
                    {(["horizontalAlign", "verticalAlign"] as const).map((axis) => {
                      const vertical = axis === "verticalAlign";
                      return (
                        <div key={axis} className="component-factory-alignment" role="group" aria-label={vertical ? "Vertical alignment" : "Horizontal alignment"}>
                          <div data-cols="3">
                            {(["start", "center", "end"] as const).map((value) => {
                              const active = surface?.[axis] === value;
                              return (
                                <button
                                  key={value}
                                  type="button"
                                  aria-label={`${vertical ? "Vertical" : "Horizontal"} ${value}`}
                                  aria-pressed={active}
                                  onClick={() => editor.updateSurface({ [axis]: active ? undefined : value })}
                                >
                                  <PositionIcon align={value} vertical={vertical} />
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </fieldset>
              )}
              {!selected && editor.area !== undefined && (
                <>
                <fieldset>
                  <legend>Layout</legend>
                  <div data-cols="2" data-gap="control">
                    {(["width", "height"] as const).map((dimension) => (
                      <label key={dimension} className="component-factory-dimension" data-cols="1">
                        <span>{dimension === "width" ? "W" : "H"}</span>
                        <input
                          aria-label={dimension === "width" ? "Width in pixels" : "Height in pixels"}
                          type="number"
                          min="0"
                          placeholder="Auto"
                          value={surface?.[dimension] ?? ""}
                          onChange={(event) => editor.updateSurface({
                            [dimension]: event.target.value === "" ? undefined : Math.max(0, event.target.valueAsNumber || 0),
                          })}
                        />
                      </label>
                    ))}
                  </div>
                </fieldset>
                <fieldset>
                  <legend>Spacing</legend>
                  <PaddingFields style={surface ?? {}} handleChange={(patch) => { if (patch) editor.updateSurface(patch); }} />
                  <label className="component-factory-dimension">
                    <span>Gap</span>
                    <SizeSelect label="Gap" value={surface?.gap} handleChange={(gap) => editor.updateSurface({ gap })} />
                  </label>
                  <label>
                    <input type="checkbox" checked={surface?.scrollY ?? false} onChange={(event) => editor.updateSurface({ scrollY: event.target.checked })} />
                    Scroll Y
                  </label>
                </fieldset>
                </>
              )}
              {selected && selected.type !== "Div" && (
                <label>
                  Text
                  <input value={selected.text} onChange={(event) => editor.updateElement({ text: event.target.value })} />
                </label>
              )}
              {selected?.type === "Link" && (
                <label>
                  Link URL
                  <input value={selected.href ?? ""} onChange={(event) => editor.updateElement({ href: event.target.value })} />
                </label>
              )}
              {textElement && (
                <>
                  <label>
                    Size
                    <input type="number" min="1" value={selected.size} onChange={(event) => editor.updateElement({ size: Math.max(1, event.target.valueAsNumber || 1) })} />
                  </label>
                </>
              )}
              {selected?.type === "Headline" && (
                <label>
                  Heading
                  <select value={selected.heading} onChange={(event) => editor.updateElement({ heading: event.target.value as FactoryElement["heading"] })}>
                    {["h1", "h2", "h3", "h4", "h5", "h6"].map((tag) => <option key={tag}>{tag}</option>)}
                  </select>
                </label>
              )}
              {selected?.type === "Div" && (
                <>
                  <PaddingFields style={selected} handleChange={(patch) => { if (patch) editor.updateElement(patch); }} />
                  <label className="component-factory-dimension">
                    <span>Gap</span>
                    <SizeSelect label="Gap" value={selected.gap} handleChange={(gap) => editor.updateElement({ gap })} />
                  </label>
                  <label>
                    Display
                    <select
                      value={selected.display ?? ""}
                      disabled={Boolean(selected.gridLayout)}
                      onChange={(event) => editor.updateElement({ display: (event.target.value || undefined) as FactoryDisplay | undefined })}
                    >
                      <option value="">Default</option>
                      {displays.map((display) => <option key={display}>{display}</option>)}
                    </select>
                  </label>
                  <label>
                    <input type="checkbox" checked={selected.scrollX ?? false} onChange={(event) => editor.updateElement({ scrollX: event.target.checked })} />
                    Scroll X
                  </label>
                  <label>
                    <input type="checkbox" checked={selected.scrollY ?? false} onChange={(event) => editor.updateElement({ scrollY: event.target.checked })} />
                    Scroll Y
                  </label>
                </>
              )}
              <Stylers editor={editor} theme_tokens={theme_tokens} atoms={{ container: containers, effect: effects, action: actions }} />
            </>
          )}
        </div>
      </SettingsCol>
      <CodePreview editor={editor} />
    </div>
  );
};

