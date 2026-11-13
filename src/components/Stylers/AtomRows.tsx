import type { StylerPanelProps } from "./Stylers.types";
import { atomNames } from "./catalog";
import "./css/stylers.css";
export const AtomRows = ({ type, ...props }: StylerPanelProps & { type: "container" | "action" | "effect" }) => <div className="stylers-rows">
  {["", ...(props.atoms?.[type] ?? atomNames(type))].map(name => <button key={name} type="button" aria-pressed={(props.values?.[type] ?? "") === name}
    className={['stylers-atom', type === 'action' ? name || 'action-outline' : 'action-ghost'].join(' ')}
    onClick={() => { const change = { name: type, value: name }; props.handleClick?.(change, type, props); props.handleChange?.(change, type, props); }}>
    <span className={type === 'action' ? 'stylers-atom-label' : 'stylers-atom-sample ' + name}>{name || 'None'}</span>
  </button>)}
</div>;
