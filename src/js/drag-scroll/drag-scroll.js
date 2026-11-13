export const defaultProps = Object.freeze({ flick: true, smooth: true, sensitivity: 3 });

/**
 * Attach pointer drag scrolling to an element or { current: element } ref.
 * Returns cleanup; call again after replacing the referenced element.
 * @param {HTMLElement | { current: HTMLElement | null } | null} ref
 * @param {{ flick?: boolean, smooth?: boolean, sensitivity?: number }} [props]
 */
export const dragScroll = (ref, props = {}) => {
  const element = ref && 'current' in ref ? ref.current : ref;
  if (!element) return () => {};
  const options = { ...defaultProps, ...Object.fromEntries(Object.entries(props).filter(([, value]) => value !== undefined)) };
  const sensitivity = Number.isFinite(options.sensitivity) ? Math.max(0, options.sensitivity) : defaultProps.sensitivity;
  const view = element.ownerDocument.defaultView;
  if (!view) return () => {};
  const originalBehavior = element.style.scrollBehavior;
  const originalSelect = element.style.userSelect;
  const idleBehavior = options.smooth ? 'smooth' : 'auto';
  element.style.scrollBehavior = idleBehavior;
  let frame = 0;
  let pointer = null;
  let dragged = false;
  let suppressClick = false;
  let x = 0, y = 0, startX = 0, startY = 0, time = 0, vx = 0, vy = 0;
  const stop = () => {
    view.cancelAnimationFrame(frame);
    frame = 0;
    element.style.scrollBehavior = idleBehavior;
  };
  const down = (event) => {
    // Touch retains native scrolling, momentum and pinch zoom.
    if (event.pointerType === 'touch' || !event.isPrimary || event.button !== 0 || pointer !== null) return;
    if (event.target.closest?.('input, textarea, select, [contenteditable], [draggable="true"]')) return;
    stop();
    suppressClick = false;
    pointer = event.pointerId;
    dragged = false;
    startX = x = event.clientX;
    startY = y = event.clientY;
    time = event.timeStamp;
    vx = vy = 0;
  };
  const move = (event) => {
    if (event.pointerId !== pointer) return;
    if (!dragged && Math.hypot(event.clientX - startX, event.clientY - startY) < 4) return;
    if (!dragged) {
      dragged = true;
      element.setPointerCapture(pointer);
      element.style.userSelect = 'none';
      element.style.scrollBehavior = 'auto';
    }
    event.preventDefault();
    const dt = Math.max(1, event.timeStamp - time);
    const dx = x - event.clientX, dy = y - event.clientY;
    element.scrollLeft += dx;
    element.scrollTop += dy;
    vx = dx / dt;
    vy = dy / dt;
    x = event.clientX;
    y = event.clientY;
    time = event.timeStamp;
  };
  const finish = (event) => {
    if (event.pointerId !== pointer) return;
    const released = pointer;
    pointer = null;
    if (element.hasPointerCapture(released)) element.releasePointerCapture(released);
    element.style.userSelect = originalSelect;
    suppressClick = dragged;
    const reduced = view.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!dragged || event.type !== 'pointerup' || !options.flick || reduced || event.timeStamp - time > 100) {
      stop();
      return;
    }
    vx = Math.max(-3, Math.min(3, vx)) * sensitivity;
    vy = Math.max(-3, Math.min(3, vy)) * sensitivity;
    let previous = view.performance.now();
    const tick = (now) => {
      const dt = Math.min(32, now - previous);
      previous = now;
      const left = element.scrollLeft, top = element.scrollTop;
      element.scrollLeft += vx * dt;
      element.scrollTop += vy * dt;
      if (element.scrollLeft === left) vx = 0;
      if (element.scrollTop === top) vy = 0;
      const decay = Math.exp(-dt / 180);
      vx *= decay;
      vy *= decay;
      if (Math.hypot(vx, vy) < 0.02) stop();
      else frame = view.requestAnimationFrame(tick);
    };
    frame = view.requestAnimationFrame(tick);
  };
  const click = (event) => {
    if (!suppressClick) return;
    suppressClick = false;
    event.preventDefault();
    event.stopPropagation();
  };
  // Links have native HTML dragging; keep this gesture with pointer scrolling.
  const dragStart = (event) => {
    if (pointer !== null) event.preventDefault();
  };
  element.addEventListener('pointerdown', down);
  element.addEventListener('dragstart', dragStart);
  view.addEventListener('pointermove', move, { passive: false });
  view.addEventListener('pointerup', finish);
  view.addEventListener('pointercancel', finish);
  element.addEventListener('lostpointercapture', finish);
  element.addEventListener('wheel', stop, { passive: true });
  element.addEventListener('keydown', stop);
  element.addEventListener('click', click, true);
  return () => {
    stop();
    if (pointer !== null && element.hasPointerCapture(pointer)) element.releasePointerCapture(pointer);
    pointer = null;
    element.removeEventListener('pointerdown', down);
    element.removeEventListener('dragstart', dragStart);
    view.removeEventListener('pointermove', move);
    view.removeEventListener('pointerup', finish);
    view.removeEventListener('pointercancel', finish);
    element.removeEventListener('lostpointercapture', finish);
    element.removeEventListener('wheel', stop);
    element.removeEventListener('keydown', stop);
    element.removeEventListener('click', click, true);
    element.style.scrollBehavior = originalBehavior;
    element.style.userSelect = originalSelect;
  };
};

export default dragScroll;
