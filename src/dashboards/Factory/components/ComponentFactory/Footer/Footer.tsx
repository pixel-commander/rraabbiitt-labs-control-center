import { ToggleGroup } from "../../../../../components/ToggleGroup/ToggleGroup";
import "./css/footer.css";
import type { FooterProps } from "../ComponentFactory.types";

const backgrounds = [
  { id: 1, label: "Auto", path: "auto" },
  { id: 2, label: "Dark", path: "dark" },
  { id: 3, label: "Light", path: "light" },
];

export const Footer = (props: FooterProps) => {
  const { children, className, container_ref, background, handleChange } = props;
  const rootClassName = ["component-factory-footer", "pad-sm", className].filter(Boolean).join(" ");
  return (
    <footer className={rootClassName}>
      {children}
      {container_ref && (
        <label className="component-factory-footer__guides">
          <input
            type="checkbox"
            defaultChecked
            onChange={(event) => {
              container_ref.current?.classList.toggle("hide-grid-lines", !event.currentTarget.checked);
            }}
          />
          Grid lines and background
        </label>
      )}
      {handleChange && (
        <ToggleGroup
          title="Canvas background"
          items={backgrounds}
          selected={background ?? "auto"}
          handleClick={(item) => {
            if (!item) return;
            const { path } = item;
            handleChange(path === "dark" || path === "light" ? path : undefined, "canvas-background", props);
          }}
        />
      )}
    </footer>
  );
};
