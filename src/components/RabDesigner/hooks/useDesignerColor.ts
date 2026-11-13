import { useRef, useLayoutEffect } from "react";
import type { DesignerColorProps } from "../components/DesignerColor/DesignerColor.types";
import { hsvToHex, rgbToHsv } from "../js/color";
export function useDesignerColor(props: DesignerColorProps) {
  const swatch = useRef<HTMLSpanElement>(null),
    panel = useRef<HTMLDivElement>(null),
    square = useRef<HTMLDivElement>(null),
    hue = useRef<HTMLInputElement>(null),
    alpha = useRef<HTMLInputElement>(null),
    code = useRef<HTMLInputElement>(null);
  const hsv = useRef({ h: 0, s: 1, v: 1, a: 1 });
  const draw = () => {
    const c = hsv.current;
    if (square.current) {
      square.current.style.setProperty("--picker-hue", String(c.h));
      square.current.style.setProperty("--picker-x", `${c.s * 100}%`);
      square.current.style.setProperty("--picker-y", `${(1 - c.v) * 100}%`);
    }
    if (hue.current) hue.current.value = String(c.h);
    if (alpha.current) alpha.current.value = String(Math.round(c.a * 100));
  };
  useLayoutEffect(() => {
    if (!swatch.current) return;
    const parts = getComputedStyle(swatch.current)
      .backgroundColor.match(/[\d.]+/g)
      ?.map(Number);
    if (parts && parts.length >= 3) {
      const c = rgbToHsv(parts[0], parts[1], parts[2]);
      hsv.current = { ...c, h: c.s ? c.h : hsv.current.h, a: parts[3] ?? 1 };
      draw();
    }
    if (code.current && document.activeElement !== code.current)
      code.current.value = props.value ?? "";
  }, [props.value, props.theme]);
  const emit = () => {
    draw();
    const c = hsv.current;
    props.handleChange(hsvToHex(c.h, c.s, c.v, c.a), "change", { ...props });
  };
  const handleOpen = () => {
    if (!panel.current || !swatch.current) return;
    const r = swatch.current.getBoundingClientRect();
    panel.current.style.left = `${Math.max(8, Math.min(window.innerWidth - 280, r.left - 180))}px`;
    panel.current.style.top = `${Math.max(8, Math.min(window.innerHeight - 410, r.bottom + 8))}px`;
    panel.current.showPopover();
  };
  const handlePoint = (e: React.PointerEvent<HTMLDivElement>) => {
    e.preventDefault();
    const r = e.currentTarget.getBoundingClientRect();
    hsv.current.s = Math.max(0, Math.min(1, (e.clientX - r.left) / r.width));
    hsv.current.v =
      1 - Math.max(0, Math.min(1, (e.clientY - r.top) / r.height));
    emit();
  };
  return {
    swatch,
    panel,
    square,
    hue,
    alpha,
    code,
    handleOpen,
    handlePoint,
    handleHue: (value: number) => {
      hsv.current.h = value;
      emit();
    },
    handleAlpha: (value: number) => {
      hsv.current.a = value / 100;
      emit();
    },
  };
}
