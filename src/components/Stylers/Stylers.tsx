import { useId, useState } from 'react';
import type { ComponentType } from 'react';
import type { StylersProps, StylerPanelProps, StylerType } from './Stylers.types';
import { ColorStyler } from './ColorStyler/ColorStyler';
import { ContainerStyler } from './ContainerStyler/ContainerStyler';
import { ActionStyler } from './ActionStyler/ActionStyler';
import { EffectStyler } from './EffectStyler/EffectStyler';
import { GridStyler } from './GridStyler/GridStyler';
import { LayoutStyler } from './LayoutStyler/LayoutStyler';
import './css/stylers.css';
const panels: Record<StylerType, ComponentType<StylerPanelProps>> = { color: ColorStyler, container: ContainerStyler, action: ActionStyler, effect: EffectStyler, grid: GridStyler, layout: LayoutStyler };
const defaults: StylerType[] = ['color', 'container', 'action', 'effect', 'grid', 'layout'];
export const Stylers = ({ types = defaults, className = '', ...props }: StylersProps) => {
  const id = useId();
  const available = [...new Set(types)].filter(type => Object.hasOwn(panels, type));
  const [tab, setTab] = useState<StylerType | undefined>(available[0]);
  const selected = tab && available.includes(tab) ? tab : available[0];
  const Panel = selected ? panels[selected] : undefined;
  return <div className={'stylers ' + className}>
    <div className="scroll-x stylers-header">
    <div className="stylers-tabs" role="tablist" aria-label="Stylers">{available.map(type => <button key={type} type="button" role="tab" id={id + '-' + type} aria-controls={id + '-panel'} aria-selected={selected === type}
      tabIndex={selected === type ? 0 : -1} className="action-light" onClick={() => setTab(type)} onKeyDown={event => {
        const index = available.indexOf(type);
        const next = event.key === 'ArrowRight' ? (index + 1) % available.length : event.key === 'ArrowLeft' ? (index - 1 + available.length) % available.length : event.key === 'Home' ? 0 : event.key === 'End' ? available.length - 1 : undefined;
        if (next === undefined) return;
        event.preventDefault(); setTab(available[next]); document.getElementById(id + '-' + available[next])?.focus();
      }}>{type}</button>)}</div>
    </div>
    {Panel && <div id={id + '-panel'} role="tabpanel" aria-labelledby={id + '-' + selected} tabIndex={0} className="stylers-panel"><Panel {...props} /></div>}
  </div>;
};
