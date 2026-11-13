import { GridLayoutDisplay } from "../../GridLayoutDisplay/GridLayoutDisplay";
import type { GridType } from "../../GridLayoutDisplay/GridLayoutDisplay.types";
import type { StylerPanelProps } from "../Stylers.types";
export const GridStyler = (props: StylerPanelProps) => <GridLayoutDisplay selected={props.values?.grid as GridType | undefined}
  handleClick={data => { if (!data) return; const change = { name: 'grid', value: data.grid }; props.handleClick?.(change, 'grid', props); props.handleChange?.(change, 'grid', props); }} />;
