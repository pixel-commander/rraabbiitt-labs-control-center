import "./css/settings-col.css";
import type { SettingsColProps } from "../ComponentFactory.types";
import { TabNav } from "../../../../../components/TabNav/TabNav";

export const SettingsCol = (props: SettingsColProps) => {
  const { className, data_area, tabs, selected, children, footer, handleClick } = props;
  const rootClassName = ["settings-col", className].filter(Boolean).join(" ");
  return (
    <div data-grid={footer != null ? "shell" : "header-main"} data-area={data_area} className={rootClassName}>
      <div data-area="header">
        <TabNav
          gap={0}
          items={tabs.map((tab, index) => ({ id: index + 1, path: tab, label: tab }))}
          selected={selected}
          styler="tabs"
          full
          handleClick={(item) => {
            if (item) handleClick?.(item, "tab-nav", props);
          }}
        />
      </div>
      <div data-area="main" className="scroll-y">{children}</div>
      {footer != null && <div data-area="footer" className="pad-md">{footer}</div>}
    </div>
  );
};
