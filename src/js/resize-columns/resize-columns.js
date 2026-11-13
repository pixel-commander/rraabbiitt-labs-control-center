export const defaultProps = Object.freeze({
  grip_selector: "[data-resize]",
  min_rem: 6,
  max_rem: 34,
});

export const resizeColumns = (ref, props = {}) => {
  const root = ref && "current" in ref ? ref.current : ref;
  if (!root) return () => {};
  const settings = {
    ...defaultProps,
    ...Object.fromEntries(
      Object.entries(props).filter(([, value]) => value !== undefined),
    ),
  };
  if (
    !Number.isFinite(settings.min_rem) ||
    !Number.isFinite(settings.max_rem) ||
    settings.min_rem < 0 ||
    settings.max_rem < settings.min_rem
  )
    throw new RangeError("Supply valid min_rem and max_rem bounds.");
  const view = root.ownerDocument.defaultView;
  let active = null;
  const originalDragging = root.getAttribute("data-dragging");
  const stop = () => {
    if (!active) return;
    const { grip, pointer, userSelect, touchAction } = active;
    active = null;
    if (grip.hasPointerCapture(pointer)) grip.releasePointerCapture(pointer);
    root.style.userSelect = userSelect;
    grip.style.touchAction = touchAction;
    if (originalDragging === null) root.removeAttribute("data-dragging");
    else root.setAttribute("data-dragging", originalDragging);
    view.removeEventListener("pointermove", move);
    view.removeEventListener("pointerup", finish);
    view.removeEventListener("pointercancel", finish);
    view.removeEventListener("blur", stop);
    grip.removeEventListener("lostpointercapture", finish);
  };
  const move = (event) => {
    if (!active || event.pointerId !== active.pointer) return;
    event.preventDefault();
    const { side, startX, startWidth, rem } = active;
    const delta =
      ((event.clientX - startX) / rem) * (side === "right" ? -1 : 1);
    const width = Math.min(
      settings.max_rem,
      Math.max(settings.min_rem, startWidth + delta),
    );
    root.style.setProperty(
      side === "right" ? "--right-w" : "--left-w",
      `${width}rem`,
    );
    settings.handleChange?.({ side, width }, "resize-columns", settings);
  };
  const finish = (event) => {
    if (active && event.pointerId === active.pointer) stop();
  };
  const press = (event) => {
    if (active || event.button !== 0 || !event.isPrimary) return;
    const grip = event.target.closest?.(settings.grip_selector);
    if (!grip || !root.contains(grip)) return;
    const side = grip.getAttribute("data-resize") ?? "left";
    if (side !== "left" && side !== "right") return;
    const rem =
      parseFloat(
        view.getComputedStyle(root.ownerDocument.documentElement).fontSize,
      ) || 16;
    const tracks = view
      .getComputedStyle(root)
      .gridTemplateColumns.trim()
      .split(/\s+/);
    const width = parseFloat(side === "right" ? tracks.at(-1) : tracks[0]);
    if (!Number.isFinite(width)) return;
    event.preventDefault();
    active = {
      side,
      grip,
      pointer: event.pointerId,
      startX: event.clientX,
      startWidth: width / rem,
      rem,
      userSelect: root.style.userSelect,
      touchAction: grip.style.touchAction,
    };
    root.style.userSelect = "none";
    grip.style.touchAction = "none";
    root.setAttribute("data-dragging", side);
    grip.setPointerCapture(event.pointerId);
    view.addEventListener("pointermove", move, { passive: false });
    view.addEventListener("pointerup", finish);
    view.addEventListener("pointercancel", finish);
    view.addEventListener("blur", stop);
    grip.addEventListener("lostpointercapture", finish);
  };
  root.addEventListener("pointerdown", press);
  return () => {
    stop();
    root.removeEventListener("pointerdown", press);
  };
};
export default resizeColumns;
