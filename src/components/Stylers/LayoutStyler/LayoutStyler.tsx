import type { StylerPanelProps } from "../Stylers.types";
import { useRef } from "react";
import type { ComponentProps } from "react";
import { SmartTooltip } from "../../SmartTooltip/SmartTooltip";
import { ToggleGroup } from "../../ToggleGroup/ToggleGroup";
import { PositionIcon } from "../../../icons/PositionIcon";
import { PaddingSideIcon } from "../../../icons/PaddingSideIcon";
import { RadiusIcon } from "../../../icons/RadiusIcon";
import "./css/layout-styler.css";
const fields: Record<string, string[]> = {
  display: ['block', 'grid', 'flex', 'inline', 'inline-block', 'inline-grid', 'inline-flex'],
  horizontalAlign: ['start', 'center', 'end', 'stretch'], verticalAlign: ['start', 'center', 'end', 'stretch'],
  padding: ['xs', 'sm', 'md', 'base', 'lg', 'xl'], radius: ['xs', 'sm', 'md', 'base', 'lg', 'xl'],
};
const labels: Record<string, string> = { display: 'Display', horizontalAlign: 'Horizontal align', verticalAlign: 'Vertical align', padding: 'Padding', radius: 'Radius' };
const LayoutOption = ({ title, ...props }: ComponentProps<'button'> & { title: string }) => {
  const ref = useRef<HTMLButtonElement>(null);
  return <><button {...props} ref={ref} /><SmartTooltip targetRef={ref} content={title} /></>;
};
const LayoutSelect = ({ title, ...props }: ComponentProps<'select'> & { title: string }) => {
  const ref = useRef<HTMLSelectElement>(null);
  return <><select {...props} ref={ref} /><SmartTooltip targetRef={ref} content={title} /></>;
};
const TokenLabel = ({ name, value }: { name: string; value: string }) => {
  const ref = useRef<HTMLSpanElement>(null);
  return <><span ref={ref}>{value}</span><SmartTooltip targetRef={ref} content={`${labels[name]}: ${value}`} /></>;
};
export const LayoutStyler = (props: StylerPanelProps) => {
  const change = (name: string, value: string) => {
    props.handleChange?.({ name, value: value || undefined }, 'layout', props);
  };
  return <div className="stylers-layout">{Object.entries(fields).map(([name, options]) => {
    if (name === 'padding' || name === 'radius') {
      return <fieldset className="layout-styler-tokens" key={name}>
        <legend><span className="layout-styler-label">{name === 'padding' ? <PaddingSideIcon side="top" /> : <RadiusIcon />}{labels[name]}</span></legend>
        <ToggleGroup className="layout-styler-pills" title={labels[name]} selected={String(props.values?.[name] ?? '')}
          items={options.map((value, id) => ({ id, path: value, label: <TokenLabel name={name} value={value} /> }))}
          handleClick={item => { if (item) change(name, props.values?.[name] === item.path ? '' : item.path); }} />
      </fieldset>;
    }
    if (name === 'horizontalAlign' || name === 'verticalAlign') {
      return <fieldset className="layout-styler-alignment" key={name}>
        <legend>{labels[name]}</legend>
        <div className="layout-styler-options">{options.map(value =>
          <LayoutOption type="button" key={value} className="action-light" title={`${labels[name]}: ${value}`}
            aria-label={`${labels[name]}: ${value}`} aria-pressed={props.values?.[name] === value}
            onClick={() => change(name, props.values?.[name] === value ? '' : value)}>
            {value === 'stretch' ? <span aria-hidden="true">↔</span> :
              <PositionIcon align={value as 'start' | 'center' | 'end'} vertical={name === 'verticalAlign'} />}
          </LayoutOption>)}</div>
      </fieldset>;
    }
    return <label key={name}><span className="layout-styler-label">
      {labels[name]}</span>
      <LayoutSelect title={props.values?.[name] ? `${labels[name]}: ${props.values[name]}` : labels[name]} value={props.values?.[name] ?? ''} onChange={event => change(name, event.target.value)}>
        <option value="" hidden></option>{options.map(value => <option key={value}>{value}</option>)}
      </LayoutSelect></label>;
  })}</div>;
};
