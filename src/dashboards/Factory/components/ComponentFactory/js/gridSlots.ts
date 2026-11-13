import { gridTypes } from "../../../../../components/GridLayoutDisplay/GridLayoutDisplay.types";
import type { FactoryGridLayout } from "../ComponentFactory.types";

export const gridSlots = (layout: FactoryGridLayout) =>
  layout.grid
    ? gridTypes[layout.grid]
    : Array.from({ length: layout.custom?.areas.length ?? (layout.rows ?? 1) * (layout.cols ?? 1) }, () => undefined);

export const slotKey = (owner: string, layout: FactoryGridLayout, index: number) =>
  `${owner}/${layout.custom?.areas[index]?.id ?? gridSlots(layout)[index] ?? index}`;

export const layoutCells = (layout: FactoryGridLayout, owner: string) =>
  gridSlots(layout).map((name, index) => ({
    key: slotKey(owner, layout, index),
    name: layout.grid === "single-cell" ? undefined : name,
    label: layout.grid === "single-cell" ? "cell" : name ?? layout.custom?.areas[index]?.name ?? `Cell ${index + 1}`,
    receivesContent: name === "main" || (name === undefined && index === 0),
  }));

export const rootCells = (layout: FactoryGridLayout, areas: string[]) => {
  if (layout.grid) {
    return areas.map((area) => ({
      key: area,
      name: layout.grid === "single-cell" ? undefined : area,
      label: layout.grid === "single-cell" ? "cell" : area,
      inheritedAreas: undefined,
    }));
  }

  return layoutCells(layout, "shell").map((cell, index, cells) => ({
    ...cell,
    inheritedAreas: index === cells.length - 1 ? areas.slice(index) : areas.slice(index, index + 1),
  }));
};
