import type {ReactNode,RefObject} from 'react';
import {SmartTooltip} from '../../../../components/SmartTooltip/SmartTooltip';
import type {SmartTooltipPosition} from '../../../../components/SmartTooltip/SmartTooltip.types';
import './css/chart-tooltip.css';

export const ChartTooltip=({targetRef,positionRef,title,rows,disabled}: {
 targetRef:RefObject<Element|null>;positionRef:RefObject<SmartTooltipPosition|null>;title:ReactNode;
 rows:{label:string;value:ReactNode}[];disabled:boolean;
})=><SmartTooltip targetRef={targetRef} positionRef={positionRef} title={title} disabled={disabled}
 container_class="container-main" className="folder-chart-tooltip" placement="above">
 <dl>{rows.map((row,index)=><div key={index}><dt>{row.label}</dt><dd>{row.value}</dd></div>)}</dl>
</SmartTooltip>;
