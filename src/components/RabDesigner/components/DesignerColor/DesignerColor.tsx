import type { DesignerColorProps } from "./DesignerColor.types";
import "./css/designer-color.css";
import type { CSSProperties } from "react";
import { useDesignerColor } from "../../hooks/useDesignerColor";

export const DesignerColor = (props: DesignerColorProps) => {
  const picker = useDesignerColor(props);
  const tokens = Object.keys(props.theme ?? {}).filter(
    (key) =>
      CSS.supports("color", props.theme![key]) &&
      !/shadow|font|motion/.test(key),
  );
  const palette = tokens.length
    ? tokens
    : [
        "--accent-default",
        "--accent-secondary",
        "--surface-main",
        "--surface-inset",
        "--content-default",
        "--success-default",
        "--danger-default",
      ];
  return (
    <div
      className={["designer-color", props.className].filter(Boolean).join(" ")}
      style={props.theme as CSSProperties}
      onChange={(e) => e.stopPropagation()}
    >
      {props.name && (
        <input type="hidden" name={props.name} value={props.value ?? ""} />
      )}
      <button
        type="button"
        className="designer-color-trigger container-cell action-main"
        aria-label={`Choose ${props.title}`}
        onClick={picker.handleOpen}
      >
        <span
          ref={picker.swatch}
          className="designer-color-swatch container-cell"
          style={
            {
              "--container-cell-background":
                props.value || "var(--surface-main)",
            } as CSSProperties
          }
        />
        <span>
          {props.value?.startsWith("var(")
            ? "Theme color"
            : props.value || "Default"}
        </span>
        <span>⌄</span>
      </button>
      <div
        ref={picker.panel}
        popover="auto"
        className="designer-color-popover container-cell container-cell--float"
        aria-label={`${props.title} picker`}
        onKeyDown={(e) => {
          if (e.key === "Escape") e.stopPropagation();
        }}
      >
        <header>
          <strong>{props.title}</strong>
          <button
            type="button"
            className="action-canvas-tool"
            aria-label="Close color picker"
            onClick={() => picker.panel.current?.hidePopover()}
          >
            ×
          </button>
        </header>
        <div
          ref={picker.square}
          className="designer-color-square container-canvas-color-square"
          aria-label="Saturation and brightness"
          onPointerDown={(e) => {
            e.currentTarget.setPointerCapture(e.pointerId);
            picker.handlePoint(e);
          }}
          onPointerMove={(e) => {
            if (e.currentTarget.hasPointerCapture(e.pointerId))
              picker.handlePoint(e);
          }}
          onPointerUp={(e) =>
            e.currentTarget.releasePointerCapture(e.pointerId)
          }
        >
          <span className="designer-color-cursor container-canvas-color-cursor" />
        </div>
        <label>
          Hue
          <input
            ref={picker.hue}
            type="range"
            min="0"
            max="360"
            aria-label={`${props.title} hue`}
            className="container-canvas-hue"
            onInput={(e) => picker.handleHue(Number(e.currentTarget.value))}
          />
        </label>
        <label>
          Opacity
          <input
            ref={picker.alpha}
            type="range"
            min="0"
            max="100"
            aria-label={`${props.title} opacity`}
            onInput={(e) => picker.handleAlpha(Number(e.currentTarget.value))}
          />
        </label>
        <label>
          Color value
          <input
            ref={picker.code}
            className="container-cell"
            aria-label={`${props.title} color value`}
            defaultValue={props.value ?? ""}
            onChange={(e) => {
              const value = e.currentTarget.value,
                valid = !value || CSS.supports("color", value);
              e.currentTarget.setCustomValidity(
                valid ? "" : "Choose a valid color.",
              );
              if (valid) props.handleChange(value, "change", { ...props });
            }}
          />
        </label>
        <div className="designer-color-palette">
          {palette
            .filter((token) => token !== props.title)
            .map((token) => (
              <button
                key={token}
                type="button"
                className="designer-color-swatch container-cell action-main"
                aria-label={`Use ${token}`}
                style={
                  {
                    "--container-cell-background": `var(${token})`,
                    "--action-main-background": `var(${token})`,
                  } as CSSProperties
                }
                onClick={() =>
                  props.handleChange(`var(${token})`, "change", { ...props })
                }
              />
            ))}
        </div>
        <button
          type="button"
          className="action-canvas-tool"
          onClick={() => props.handleChange("", "change", { ...props })}
        >
          Reset to default
        </button>
      </div>
    </div>
  );
};
