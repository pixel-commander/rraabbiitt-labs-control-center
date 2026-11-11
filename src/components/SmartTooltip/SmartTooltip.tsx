import { useEffect, useLayoutEffect, useRef, useState } from "react";
import type { ReactPortal } from "react";
import { createPortal } from "react-dom";
import "./css/smart-tooltip.css";
import type {
  SmartTooltipProps,
  SmartTooltipPlacement,
} from "./SmartTooltip.types";

type PointerPosition = { x: number; y: number };
type PhysicalPlacement = "above" | "below" | "left" | "right";
type TooltipPosition = PointerPosition & {
  placement: PhysicalPlacement;
  arrow: number;
};

const opposites: Record<PhysicalPlacement, PhysicalPlacement> = {
  above: "below",
  below: "above",
  left: "right",
  right: "left",
};

const opposite = (placement: PhysicalPlacement): PhysicalPlacement =>
  opposites[placement];

const clamp = (value: number, minimum: number, maximum: number): number =>
  Math.max(minimum, Math.min(value, Math.max(minimum, maximum)));

const MountedSmartTooltip = ({
  targetRef,
  content,
  title,
  children = null,
  placement = "above",
  className,
  container_class = "",
  positionRef,
}: SmartTooltipProps): ReactPortal | null => {
  const tooltipRef = useRef<HTMLDivElement>(null);
  const [portalHost, setPortalHost] = useState<Element | null>(null);
  useEffect(() => {
    setPortalHost(
      targetRef.current?.closest("dialog[open], dialog") ?? document.body,
    );
  }, [targetRef]);
  const pointerRef = useRef<PointerPosition | null>(null);
  const horizontalDirectionRef = useRef<"left" | "right">("right");
  const tooltipContent = content !== undefined ? content : children;
  const hasContent =
    (tooltipContent !== null &&
      tooltipContent !== undefined &&
      tooltipContent !== false) ||
    (title !== null && title !== undefined && title !== false);

  useLayoutEffect(() => {
    const target = targetRef.current;
    const tooltip = tooltipRef.current;
    if (!target || !tooltip) return;

    const hide = () => {
      tooltip.style.visibility = "hidden";
    };
    const position = (): void => {
      const pointer = pointerRef.current;
      if (!pointer) return;
      const rect = tooltip.getBoundingClientRect();
      const width = rect.width;
      const height = rect.height;
      const viewportWidth = document.documentElement.clientWidth;
      const viewportHeight = document.documentElement.clientHeight;
      const margin = 8;
      const gap = 10;
      const arrowSize = 8;
      const requestedPlacement: PhysicalPlacement =
        placement === "before"
          ? horizontalDirectionRef.current
          : placement === "after"
            ? opposite(horizontalDirectionRef.current)
            : placement;
      const available = (side: PhysicalPlacement): boolean => {
        switch (side) {
          case "above":
            return pointer.y - height - gap - arrowSize >= margin;
          case "below":
            return (
              pointer.y + height + gap + arrowSize <= viewportHeight - margin
            );
          case "left":
            return pointer.x - width - gap - arrowSize >= margin;
          case "right":
            return (
              pointer.x + width + gap + arrowSize <= viewportWidth - margin
            );
        }
      };
      const actualPlacement = available(requestedPlacement)
        ? requestedPlacement
        : available(opposite(requestedPlacement))
          ? opposite(requestedPlacement)
          : requestedPlacement;
      let left = pointer.x - width / 2;
      let top = pointer.y - height / 2;
      if (actualPlacement === "above")
        top = pointer.y - height - gap - arrowSize;
      if (actualPlacement === "below") top = pointer.y + gap + arrowSize;
      if (actualPlacement === "left")
        left = pointer.x - width - gap - arrowSize;
      if (actualPlacement === "right") left = pointer.x + gap + arrowSize;
      left = clamp(left, margin, viewportWidth - width - margin);
      top = clamp(top, margin, viewportHeight - height - margin);

      const verticalPlacement =
        actualPlacement === "above" || actualPlacement === "below";
      const cursorAlongEdge = verticalPlacement
        ? pointer.x - left
        : pointer.y - top;
      const edgeLength = verticalPlacement ? width : height;
      const arrow = clamp(
        cursorAlongEdge,
        arrowSize + 2,
        edgeLength - arrowSize - 2,
      );
      const next: TooltipPosition = {
        x: left,
        y: top,
        placement: actualPlacement,
        arrow,
      };
      tooltip.dataset.placement = next.placement;
      tooltip.style.left = `${next.x}px`;
      tooltip.style.top = `${next.y}px`;
      tooltip.style.setProperty(
        "--smart-tooltip-arrow-offset",
        `${next.arrow}px`,
      );
      tooltip.style.visibility = "visible";
    };
    const onPointerMove = (event: Event): void => {
      const pointerEvent = event as PointerEvent;
      const next = positionRef?.current ?? {
        x: pointerEvent.clientX,
        y: pointerEvent.clientY,
      };
      const previous = pointerRef.current;
      if (previous && Math.abs(next.x - previous.x) >= 1) {
        horizontalDirectionRef.current = next.x > previous.x ? "right" : "left";
      }
      pointerRef.current = next;
      position();
    };
    const onPointerEnter = (event: Event): void => {
      horizontalDirectionRef.current = "right";
      pointerRef.current = null;
      onPointerMove(event);
    };
    const onPointerLeave = (): void => {
      pointerRef.current = null;
      hide();
    };

    target.addEventListener("pointerenter", onPointerEnter);
    target.addEventListener("pointermove", onPointerMove);
    target.addEventListener("pointerleave", onPointerLeave);
    window.addEventListener("resize", position);
    window.addEventListener("scroll", position, true);
    const observer =
      typeof ResizeObserver === "undefined"
        ? undefined
        : new ResizeObserver(position);
    observer?.observe(tooltip);
    position();

    return () => {
      target.removeEventListener("pointerenter", onPointerEnter);
      target.removeEventListener("pointermove", onPointerMove);
      target.removeEventListener("pointerleave", onPointerLeave);
      window.removeEventListener("resize", position);
      window.removeEventListener("scroll", position, true);
      observer?.disconnect();
    };
  }, [targetRef, placement, hasContent, positionRef, portalHost]);

  if (!hasContent || typeof document === "undefined") return null;

  return createPortal(
    <div
      ref={tooltipRef}
      className={["smart-tooltip", container_class, className]
        .filter(Boolean)
        .join(" ")}
      role="tooltip"
    >
      <span className="smart-tooltip-arrow" aria-hidden="true" />
      {title !== null && title !== undefined && title !== false && (
        <div className="smart-tooltip-title">{title}</div>
      )}
      {tooltipContent !== null &&
        tooltipContent !== undefined &&
        tooltipContent !== false && (
          <div className="smart-tooltip-content">{tooltipContent}</div>
        )}
    </div>,
    portalHost ?? document.body,
  );
};

export const SmartTooltip = ({
  disabled = false,
  ...props
}: SmartTooltipProps): React.ReactNode => {
  if (disabled) return null;
  return <MountedSmartTooltip {...props} />;
};
