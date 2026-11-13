import { Slider } from "../../../Slider/Slider";
import { SearchableSelect } from "../../../SearchableSelect/SearchableSelect";
import type { ConnectorSettingsProps } from "./ConnectorSettings.types";
import "../../../../atoms/actions/action-main/action-main.css";
import "../../../../atoms/containers/container-cell/container-cell.css";
import "./css/connector-settings.css";

const routes = (["ortho", "curve", "straight", "elastic", "bolt"] as const).map((name, index) => ({ id: index + 1, name }));
const effects = (["none", "pulse", "flow", "crackle"] as const).map((name, index) => ({ id: index + 1, name }));
const routeKnobs = {
  ortho: [],
  curve: [],
  straight: [],
  elastic: [
    ["slack", "Slack", 1, 1.5, 0.01, 1.06],
    ["gravity", "Gravity", 0, 1, 0.01, 0.30],
    ["damping", "Damping", 0, 0.99, 0.01, 0.90],
  ],
  bolt: [
    ["chaos", "Jaggedness", 0, 0.5, 0.01, 0.16],
    ["branches", "Branch depth", 0, 3, 1, 2],
    ["flicker", "Frames per strike", 1, 30, 1, 6],
    ["glow", "Glow", 0, 2, 0.1, 1],
  ],
} as const;

const knobs = {
  none: [],
  pulse: [
    ["speed", "Speed", 0, 6, 0.1, 1.6],
    ["radius", "Dot size", 0, 12, 0.1, 3.2],
    ["glow", "Glow", 0, 24, 1, 8],
  ],
  flow: [
    ["speed", "Speed", 0, 8, 0.1, 1.4],
    ["width", "Stroke width", 0.5, 8, 0.5, 2],
    ["dash", "Dash length", 1, 24, 1, 7],
    ["spacing", "Dash spacing", 1, 24, 1, 9],
  ],
  crackle: [
    ["arcs", "Arc count", 1, 8, 1, 3],
    ["cycle", "Cycle length", 20, 180, 1, 78],
    ["sparks", "Spark intensity", 0, 2, 0.1, 1],
  ],
} as const;

const colors = [
  ["--safe", "Blue", "#4a9eff"],
  ["--danger", "Red", "#d4635a"],
  ["--ok", "Green", "#17c98a"],
  ["--warn", "Amber", "#d8a24a"],
  ["--dim", "Gray", "#8792a6"],
  ["--ink", "White", "#e8eaf0"],
] as const;

export const ConnectorSettings = (props: ConnectorSettingsProps) => {
  const { edge, className, handleChange, handleClick } = props;
  const route = edge.route ?? "ortho";
  const effect = edge.fx ?? "none";
  const change = (patch: Partial<typeof edge>) => {
    handleChange?.({ ...edge, ...patch }, "connector-settings", props);
  };

  return (
    <section className={["connector-settings", "container-cell", className].filter(Boolean).join(" ")} data-grid="header-main" aria-label="Connector settings">
      <header data-area="header" data-grid="side-right">
        <strong data-area="main">wire</strong>
        <button data-area="side" type="button" className="action-main" disabled={!handleClick}
          onClick={() => handleClick?.(edge, "connector-delete", props)}>delete</button>
      </header>
      <div data-area="main" className="connector-settings-body" data-cols="1">
        <label data-cols="2">label<input value={edge.label ?? ""} onChange={(event) => change({ label: event.currentTarget.value })} /></label>
        <label data-cols="2">note<input value={edge.note ?? ""} onChange={(event) => change({ note: event.currentTarget.value })} /></label>
        <div role="group" aria-label="Route" className="connector-settings-controls" data-cols="1">
          <span>ROUTE</span>
          <SearchableSelect
            label="Route"
            data={routes}
            selected={routes.find(({ name }) => name === route)}
            searchable={false}
            handleClick={(option) => {
              const picked = routes.find(({ id }) => id === option?.id);
              if (picked && picked.name !== route) change({ route: picked.name, routeSettings: undefined });
            }}
          />
          {routeKnobs[route].map(([key, label, min, max, step, initial]) => (
            <Slider key={key} label={label} min={min} max={max} step={step}
              value={edge.routeSettings?.[key] ?? initial}
              handleChange={(value) => {
                if (value !== undefined) change({ routeSettings: { ...edge.routeSettings, [key]: value } });
              }}
            />
          ))}
        </div>
        <div role="group" aria-label="Effect" className="connector-settings-controls" data-cols="1">
          <span>EFFECT</span>
          <SearchableSelect
            label="Effect"
            data={effects}
            selected={effects.find(({ name }) => name === effect)}
            searchable={false}
            handleClick={(option) => {
              const picked = effects.find(({ id }) => id === option?.id);
              if (picked && picked.name !== effect) change({ fx: picked.name, effectSettings: undefined });
            }}
          />
          {knobs[effect].map(([key, label, min, max, step, initial]) => (
            <Slider key={key} label={label} min={min} max={max} step={step}
              value={edge.effectSettings?.[key] ?? initial}
              handleChange={(value) => {
                if (value !== undefined) change({ effectSettings: { ...edge.effectSettings, [key]: value } });
              }}
            />
          ))}
        </div>
        <div role="group" aria-label="Colour" className="connector-settings-options">
          <span>COLOUR</span>
          {colors.map(([color, label, fallback]) => {
            const active = color === edge.color;
            return <button key={color} type="button" className={active ? "action-main is-active" : "action-main"}
              aria-label={label} aria-pressed={active} style={{ color: `var(${color}, ${fallback})` }}
              onClick={() => change({ color })}>■</button>;
          })}
          <button type="button" className={edge.color ? "action-main" : "action-main is-active"} aria-label="Use type colour" aria-pressed={!edge.color}
            onClick={() => change({ color: undefined })}>×</button>
        </div>
      </div>
    </section>
  );
};
