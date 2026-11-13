import { useRef } from "react";
import { useKeypress } from "../../../../hooks/useKeypress/useKeypress";
import { Canvas } from "./Canvas";
import type { ComponentFactoryProps } from "./ComponentFactory.types";
import { Footer } from "./Footer/Footer";
import { GridCol } from "./GridCol";
import { Header } from "./Header/Header";
import { JsonPreview } from "./JsonPreview/JsonPreview";
import { Layers } from "./Layers/Layers";
import { StyleCol } from "./StyleCol";
import { useComponentFactory } from "./hooks/useComponentFactory/useComponentFactory";
import "./css/component-factory.css";

export const ComponentFactory = (props: ComponentFactoryProps) => {
  const { className, theme_tokens, layout_tokens } = props;
  const rootClassName = ["component-factory", className].filter(Boolean).join(" ");
  const editor = useComponentFactory(props);
  const container_ref = useRef<HTMLDivElement>(null);
  const file_ref = useRef<HTMLInputElement>(null);
  useKeypress({
    key: "Escape",
    callback: () => {
      if (!editor.gridDraft && !editor.jsonOpen) editor.clearSelection();
    },
  });

  return (
    <div data-grid="holy-grail" className={rootClassName}>
      <div data-area="header">
        <Header
          {...props}
          component_name={editor.composition.name}
          handleViewJson={() => editor.setJsonOpen(true)}
          handleChange={(name) => { if (name !== undefined) editor.setName(name); }}
          handleClick={(_, action) => action === "open" ? file_ref.current?.click() : action && editor.handleAction(action)}
        />
        <input ref={file_ref} type="file" accept=".json,application/json" hidden aria-label="Open composition JSON"
          onChange={async event => {
            const file = event.currentTarget.files?.[0];
            event.currentTarget.value = "";
            if (file) editor.loadJson(await file.text());
          }} />
        {editor.jsonError && <p role="alert">Could not load composition: {editor.jsonError}</p>}
      </div>
      <div data-area="left" data-rows="2" data-cols="1">
        <GridCol editor={editor} />
        <Layers editor={editor} />
      </div>
      <Canvas editor={editor} container_ref={container_ref} />
      <StyleCol editor={editor} theme_tokens={theme_tokens} layout_tokens={layout_tokens} />
      <div data-area="footer">
        <Footer container_ref={container_ref} background={editor.theme} handleChange={editor.setTheme} />
      </div>
      {editor.jsonOpen && <JsonPreview composition={editor.document} handleClose={() => editor.setJsonOpen(false)} />}
    </div>
  );
};
