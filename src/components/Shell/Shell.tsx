import { useEffect, useRef } from "react";
import { createFlowConnectors } from "../../js/flow-connectors.js";
import type { ShellProps } from "./Shell.types";
import { RailCanvas } from "./RailCanvas/RailCanvas";
import "./css/shell.css";

// Site Chrome â€” structure only. Skin rides the atoms stacked in the markup
// (container-* to hold, row-*/button-* to respond); this file never paints.

const leftRail = {
  corner: {
    at: "start" as const,
    color: "var(--color-primary-rgb)",
    length: 0.15,
  },
  tubes: [
    { color: "var(--color-primary-rgb)", top: 0.19, height: 0.22 },
    { color: "var(--color-secondary-rgb)", top: 0.48, height: 0.34 },
  ],
  leds: [
    { color: "var(--color-tertiary-rgb)", top: 0.44, can_blink: true },
    { color: "var(--color-quaternary-rgb)", top: 0.87 },
  ],
  joints: [0.17, 0.43, 0.84],
};

const rightRail = {
  corner: {
    at: "end" as const,
    color: "var(--color-secondary-rgb)",
    length: 0.15,
  },
  tubes: [
    { color: "var(--color-secondary-rgb)", top: 0.14, height: 0.3 },
    { color: "var(--color-primary-rgb)", top: 0.53, height: 0.24 },
  ],
  leds: [
    { color: "var(--color-quaternary-rgb)", top: 0.48, can_blink: true },
    { color: "var(--color-tertiary-rgb)", top: 0.81 },
  ],
  joints: [0.12, 0.47, 0.79],
};

const topRail = {
  corner: {
    at: "start" as const,
    color: "var(--color-primary-rgb)",
    length: 0.12,
  },
  tubes: [
    { color: "var(--color-primary-rgb)", top: 0.08, height: 0.16 },
    { color: "var(--color-secondary-rgb)", top: 0.69, height: 0.2 },
  ],
  leds: [
    { color: "var(--color-tertiary-rgb)", top: 0.31, can_blink: true },
    { color: "var(--color-quaternary-rgb)", top: 0.61 },
  ],
  joints: [0.27, 0.64, 0.92],
};

const bottomRail = {
  corner: {
    at: "end" as const,
    color: "var(--color-secondary-rgb)",
    length: 0.12,
  },
  tubes: [
    { color: "var(--color-primary-rgb)", top: 0.13, height: 0.25 },
    { color: "var(--color-secondary-rgb)", top: 0.56, height: 0.28 },
  ],
  leds: [
    { color: "var(--color-quaternary-rgb)", top: 0.45, can_blink: true },
    { color: "var(--color-tertiary-rgb)", top: 0.89 },
  ],
  joints: [0.1, 0.42, 0.87],
};

export const Shell = ({ header, children, className = "" }: ShellProps) => {
  const shell = useRef<HTMLElement>(null);

  useEffect(() => {
    const motion = matchMedia("(prefers-reduced-motion: reduce)");
    const corners = Array.from(shell.current?.querySelectorAll<HTMLCanvasElement>(".site-chrome__arc canvas") ?? []).flatMap((canvas) => {
      const ctx = canvas.getContext("2d");
      const corner = canvas.parentElement;
      if (!ctx || !corner) return [];
      const connector = createFlowConnectors(ctx, () => getComputedStyle(corner).color);
      return [{ canvas, ctx, corner, connector }];
    });
    let frame = 0;
    const paint = (now: number) => {
      corners.forEach(({ canvas, ctx, corner, connector }, index) => {
        const { width, height } = canvas.getBoundingClientRect();
        const dpr = devicePixelRatio || 1;
        const w = Math.round(width * dpr);
        const h = Math.round(height * dpr);
        if (canvas.width !== w) canvas.width = w;
        if (canvas.height !== h) canvas.height = h;
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        ctx.clearRect(0, 0, width, height);
        if (motion.matches || width < 4 || height < 4) return;
        const style = getComputedStyle(corner);
        const right = index % 2 === 1;
        const bottom = index > 1;
        const inset = parseFloat(style.borderTopWidth) / 2;
        const radius = Math.max(0, Math.min(width, height, parseFloat([
          style.borderTopLeftRadius, style.borderTopRightRadius,
          style.borderBottomLeftRadius, style.borderBottomRightRadius,
        ][index])) - inset);
        const orient = (x: number, y: number) => ({ x: right ? width - x : x, y: bottom ? height - y : y });
        const center = radius + inset;
        const path = [
          orient(inset, height - inset),
          ...Array.from({ length: 13 }, (_, i) => {
            const angle = Math.PI + i * Math.PI / 24;
            return orient(center + Math.cos(angle) * radius, center + Math.sin(angle) * radius);
          }),
          orient(width - inset, inset),
        ];
        connector.drawFx(
          { id: index, fx: "crackle", effectSettings: { arcs: 1, cycle: 130, sparks: 0.35 } },
          path,
          bottom ? style.borderBottomColor : style.borderTopColor,
          now * 0.06 + index * 30,
        );
      });
      frame = requestAnimationFrame(paint);
    };
    frame = requestAnimationFrame(paint);
    return () => cancelAnimationFrame(frame);
  }, []);

  return (
  <section
    ref={shell}
    className={["site-chrome", "container-machine", className]
      .filter(Boolean)
      .join(" ")}
    data-cols="1"
  >
    <div
      className="site-chrome__rail site-chrome__rail--left container-cell container-cell--inset"
      aria-hidden="true"
    >
      <RailCanvas side="left" {...leftRail} />
    </div>
    <div
      className="site-chrome__rail site-chrome__rail--right container-cell container-cell--inset"
      aria-hidden="true"
    >
      <RailCanvas side="right" {...rightRail} />
    </div>
    <div
      className="site-chrome__rail site-chrome__rail--top container-cell container-cell--inset"
      aria-hidden="true"
    >
      <RailCanvas side="top" {...topRail} />
    </div>
    <div
      className="site-chrome__rail site-chrome__rail--bottom container-cell container-cell--inset"
      aria-hidden="true"
    >
      <RailCanvas side="bottom" {...bottomRail} />
    </div>
    <span
      className="site-chrome__arc site-chrome__arc--top-left container-neon-corner container-neon-corner--top-left"
      aria-hidden="true"
    ><canvas /></span>
    <span
      className="site-chrome__arc site-chrome__arc--top-right container-neon-corner container-neon-corner--secondary container-neon-corner--top-right"
      aria-hidden="true"
    ><canvas /></span>
    <span
      className="site-chrome__arc site-chrome__arc--bottom-left container-neon-corner container-neon-corner--bottom-left"
      aria-hidden="true"
    ><canvas /></span>
    <span
      className="site-chrome__arc site-chrome__arc--bottom-right container-neon-corner container-neon-corner--secondary container-neon-corner--bottom-right"
      aria-hidden="true"
    ><canvas /></span>
    <div
      className="site-chrome__inner container-cell container-cell--inset"
      data-grid="header-main"
      data-gap={header ? "control" : undefined}
    >
      <header
        className="site-chrome__header container-metal"
        hidden={!header}
        data-area="header"
        data-grid="side-left"
      >
        {header}
      </header>
      <main className="site-chrome__main scroll" data-area="main" data-rows="1">
        {children}
      </main>
    </div>
  </section>
);
};
