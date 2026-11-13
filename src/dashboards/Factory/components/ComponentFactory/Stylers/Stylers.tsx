import { useState } from "react";
import { Stylers as SharedStylers } from "../../../../../components/Stylers/Stylers";
import { ColorStyler } from "../../../../../components/Stylers/ColorStyler/ColorStyler";
import { SizeFields } from "../SizeFields";
import { radiusCorners } from "../js/sizeStyles";
import { FillIcon } from "../../../../../icons/FillIcon";
import { RadiusIcon } from "../../../../../icons/RadiusIcon";
import { StrokeIcon } from "../../../../../icons/StrokeIcon";
import type { ComponentFactoryProps, FactoryEditorProps, FactoryActionState, FactoryPaint, FactoryShadow } from "../ComponentFactory.types";

import { actionStates, strokeSides } from "../js/paintStyles";
const palette = ["--surface-main", "--surface-app", "--surface-inset", "--accent-default"];
const defaultShadow: FactoryShadow = { inset: false, x: 0, y: 4, blur: 8, spread: 0, color: "#000000" };

interface StylersProps extends FactoryEditorProps {
  theme_tokens?: ComponentFactoryProps["theme_tokens"];
  atoms: Record<"container" | "effect" | "action", string[]>;
}

export const Stylers = ({ editor, atoms, theme_tokens }: StylersProps) => {
  const [state, setState] = useState<FactoryActionState>("default");
  const [side, setSide] = useState<(typeof strokeSides)[number]>("all");
  const { selected, area, composition } = editor;
  const surface = area === undefined ? composition.gridStyle : composition.areaStyles?.[area];
  const button = selected?.type === "Button";
  const target = selected ?? surface;
  const paint = (button ? selected.states?.[state] : target?.paint) ?? {};
  const update = (patch: FactoryPaint) => {
    const next = { ...paint, ...patch };
    if (button) editor.updateElement({ states: { ...selected.states, [state]: next } });
    else if (selected) editor.updateElement({ paint: next });
    else editor.updateSurface({ paint: next });
  };
  const themeColors = theme_tokens === undefined ? palette : Object.keys(theme_tokens).filter((name) =>
    /^--[\w-]+$/.test(name) && typeof CSS !== "undefined" && CSS.supports("color", theme_tokens[name]),
  );
  const colorNames = [...new Set([...themeColors, ...Object.keys(composition.colors ?? {})])];
  const swatchColor = (name: string) =>
    composition.colors?.[name] ?? `var(${name}${theme_tokens?.[name] ? `, ${theme_tokens[name]}` : ""})`;
  const color = (label: string, value: string | undefined, change: (value: string) => void) => {
    return <fieldset><legend>{label}</legend>
      <ColorStyler color_property="color" values={{ color: value }} theme_tokens={Object.fromEntries(colorNames.map(name => [name, swatchColor(name)]))}
        handleChange={selection => { if (selection) change(String(selection.value ?? '')); }} />
      <label>Custom color<input aria-label={label + ' custom color'} type="color" value={value && /^#[\da-f]{6}$/i.test(value) ? value : '#000000'} onChange={event => change(event.target.value)} /></label>
      <button type="button" className="action-ghost" onClick={() => change('')}>Default</button>
    </fieldset>;
  };
  if (selected && selected.type !== "Div" && !button) {
    return <fieldset><legend>Text</legend>{color("Color", selected.color, (value) => editor.updateElement({ color: value || "#dfe4ee" }))}</fieldset>;
  }
  const fields = button ? ["action"] as const : ["container", "effect"] as const;
  const border = paint.borders?.[side] ?? {};
  const updateBorder = (patch: typeof border) => update({ borders: { ...paint.borders, [side]: { ...border, ...patch } } });
  const shadows = paint.shadows ?? [];
  const updateShadow = (index: number, patch: Partial<FactoryShadow>) => update({ shadows: shadows.map((layer, i) => i === index ? { ...layer, ...patch } : layer) });
  return (
    <>
      <SharedStylers types={[...fields]} atoms={atoms} values={{ container: target?.container, effect: target?.effect, action: selected?.action }}
        handleChange={change => {
          if (!change) return;
          const patch = { [change.name]: change.value };
          if (selected) editor.updateElement(patch);
          else editor.updateSurface(patch);
        }} />
      {button && <label><input type="checkbox" checked={selected.disabled ?? false} onChange={(event) => editor.updateElement({ disabled: event.target.checked })} />Disabled</label>}
      {button && <label>Action state<select value={state} onChange={(event) => setState(event.target.value as FactoryActionState)}>
        {actionStates.map((name) => <option key={name}>{name}</option>)}
      </select></label>}
      <fieldset>
        <legend>Appearance</legend>
        <SizeFields
          label="Radius"
          all={paint.radiusAll !== false}
          value={paint.radius}
          values={paint.radiusCorners}
          fields={radiusCorners}
          renderIcon={(corner) => <RadiusIcon corner={corner} />}
          handleChange={(change) => {
            if (!change) return;
            if ("all" in change) update({ radiusAll: change.all });
            else if ("field" in change) update({ radiusCorners: { ...paint.radiusCorners, [change.field]: change.value } });
            else update({ radius: change.value });
          }}
        />
      </fieldset>
      <fieldset>
        <legend><FillIcon /> Fill</legend>
        <label className="component-factory-dimension"><span>Fill type</span><select value={paint.gradient ? "gradient" : "solid"} onChange={(event) => update({ gradient: event.target.value === "gradient" })}>
          <option value="solid">Solid</option><option value="gradient">Gradient</option>
        </select></label>
        {color(paint.gradient ? "Start" : "BG", paint.background, (background) => update({ background }))}
        {paint.gradient && <>
          {color("End", paint.gradientEnd, (gradientEnd) => update({ gradientEnd }))}
          <label className="component-factory-dimension"><span>Angle</span><input type="number" value={paint.angle ?? 180} onChange={(event) => update({ angle: event.target.valueAsNumber || 0 })} /></label>
        </>}
      </fieldset>
      <fieldset>
        <legend><StrokeIcon /> Stroke</legend>
        {color("Color", border.color, (value) => updateBorder({ color: value }))}
        <div data-cols="2" data-gap="control">
        <label>Border side<select value={side} onChange={(event) => setSide(event.target.value as typeof side)}>
          {strokeSides.map((name) => <option key={name}>{name}</option>)}
        </select></label>
        <label>Border width<input type="number" min="0" value={border.width ?? ""} onChange={(event) => updateBorder({ width: event.target.value === "" ? undefined : Math.max(0, event.target.valueAsNumber) })} /></label>
        </div>
        <label>Border style<select value={border.style ?? ""} onChange={(event) => updateBorder({ style: event.target.value })}>
          {["", "none", "solid", "dashed", "dotted", "double", "groove", "ridge", "inset", "outset"].map((name) => <option key={name} value={name}>{name || "Default"}</option>)}
        </select></label>
      </fieldset>
      <fieldset>
        <legend>Effects</legend>
        {shadows.map((shadow, index) => (
          <fieldset key={index}>
            <legend>Layer {index + 1}</legend>
            <label className="component-factory-dimension"><span>Placement</span><select value={shadow.inset ? "inner" : "outer"} onChange={(event) => updateShadow(index, { inset: event.target.value === "inner" })}>
              <option value="outer">Outer</option><option value="inner">Inner</option>
            </select></label>
            <div data-cols="2" data-gap="control">
            {(["x", "y", "blur", "spread"] as const).map((key) => (
              <label key={key} className="component-factory-dimension"><span>{key}</span><input type="number" min={key === "blur" ? 0 : undefined} value={shadow[key]} onChange={(event) => {
                const value = event.target.valueAsNumber || 0;
                updateShadow(index, { [key]: key === "blur" ? Math.max(0, value) : value });
              }} /></label>
            ))}
            </div>
            {color("Shadow color", shadow.color, (value) => updateShadow(index, { color: value || "#000000" }))}
            <button type="button" className="action-main" onClick={() => update({ shadows: shadows.filter((_, i) => i !== index) })}>Remove layer</button>
          </fieldset>
        ))}
        <button type="button" className="action-main" onClick={() => update({ shadows: [...shadows, defaultShadow] })}>Add shadow layer</button>
      </fieldset>
    </>
  );
};
