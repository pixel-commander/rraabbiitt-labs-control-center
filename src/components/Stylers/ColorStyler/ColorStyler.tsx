import { useRef } from "react";
import { SmartTooltip } from "../../SmartTooltip/SmartTooltip";
import type { StylerPanelProps } from "../Stylers.types";
import { themeColors } from "../catalog";
import "../css/stylers.css";
const Swatch = ({ token, ...props }: StylerPanelProps & { token: string }) => {
  const ref = useRef<HTMLButtonElement>(null);
  const name = props.color_property ?? 'color';
  const value = 'var(' + token + ')';
  return <><button ref={ref} type="button" className="stylers-swatch" style={{ background: props.theme_tokens?.[token] ?? value }}
    aria-label={token} aria-pressed={props.values?.[name] === value}
    onClick={() => { const change = { name, value }; props.handleClick?.(change, 'color', props); props.handleChange?.(change, 'color', props); }} />
    <SmartTooltip targetRef={ref} content={token} /></>;
};
export const ColorStyler = (props: StylerPanelProps) => {
  const tokens = props.theme_tokens ? Object.keys(props.theme_tokens).filter(name => /^--[\w-]+$/.test(name) && CSS.supports('color', props.theme_tokens![name])) : themeColors;
  return <div className="stylers-colors" data-cols="2" data-gap="control">{tokens.map(token => <Swatch key={token} {...props} token={token} />)}</div>;
};
