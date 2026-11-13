type Point = { x: number; y: number };

export function createFlowConnectors(
  context: CanvasRenderingContext2D,
  resolveToken: (token: string) => string,
): {
  drawFx(
    edge: { id?: string | number; fx: "pulse" | "flow" | "crackle"; effectSettings?: Record<string, number> },
    points: readonly Point[],
    color: string,
    time?: number,
  ): void;
};
