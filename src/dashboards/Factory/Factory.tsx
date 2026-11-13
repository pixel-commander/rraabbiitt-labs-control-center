import { TabNav } from "../../components/TabNav/TabNav";
import { GridCell } from "../../components/GridCell/GridCell";
import { useEffect } from "react";
import { useURL } from "../../hooks/useURL/useURL";
import { ComponentFactory } from "./components/ComponentFactory/ComponentFactory";
import type { FactoryProps } from "./Factory.types";
import { SavePopup } from "./components/SavePopup/SavePopup";
import { useFactory } from "./hooks/useFactory/useFactory";
import { useDatabaseComposition } from "./hooks/useDatabaseComposition";
import "./css/factory.css";

const items = [
  { id: 1, path: "component-factory", label: "Component Factory" },
];

export const Factory = ({ className, ...props }: FactoryProps) => {
  const factory = useFactory(props);
  const database = useDatabaseComposition();
  const [url, handleURL] = useURL();
  const selected = typeof url.section === "string" && url.section ? url.section : "component-factory";
  useEffect(() => {
    if (!url.section && !/^#\d+$/.test(window.location.hash)) handleURL({ section: "component-factory" }, "set-path");
  }, [url.section, handleURL]);
  className = ["factory", className].filter(Boolean).join(" ");

  return (
    <div data-grid="header-main" data-gap="control" className={className}>
      <GridCell data_area="header" styler="main">
        <div className="pad-xs">
          <TabNav
            items={items}
            selected={selected}
            styler="main"
            handleClick={(item) => { if (item && item.path !== selected) handleURL({ section: item.path }, "set-path"); }}
          />
          {database.loading && <p role="status">Loading composition {database.id}…</p>}
          {database.error && <p role="alert">{database.error}</p>}
          {!factory.draft && factory.error && <p role="alert">{factory.error}</p>}
          {!factory.draft && factory.saved && <p role="status">Saved {factory.saved.file}</p>}
        </div>
      </GridCell>
      <div data-area="main" data-rows="1" data-cols="1">
        {selected === "component-factory" ? (
          <ComponentFactory {...props} json={database.json ?? props.json} handleSubmit={factory.openSave} />
        ) : <p>Factory view not found.</p>}
      </div>
      {factory.draft && (
        <SavePopup
          data={factory.draft}
          pending={factory.pending}
          result={factory.complete ? factory.saved : undefined}
          confirmation={factory.confirmation}
          error={factory.error}
          handleSave={(data, type) => factory.handleSave(data, type, props)}
          handleCancel={factory.closeSave}
        />
      )}
    </div>
  );
};
