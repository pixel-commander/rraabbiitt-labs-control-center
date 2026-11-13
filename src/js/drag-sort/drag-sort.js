export const defaultProps = Object.freeze({ item_selector: "[data-sort-id]" });
/** Native sorting: call dragSort(ref, {handleSort(data, type, props)}).
 * data is {ids, from, to}; type is "drag-sort". Caller owns row order.
 * Style drag-source and drop-slot externally. Return cleanup from the owning effect.
 */
const KEEP =
  "input,textarea,select,button,a,[contenteditable=true],[data-no-drag]";
export const dragSort = (ref, options) => {
  const settings = {
    ...defaultProps,
    ...Object.fromEntries(
      Object.entries(options ?? {}).filter(([, value]) => value !== undefined),
    ),
  };
  const root = ref && "current" in ref ? ref.current : ref;
  if (!root) return () => {};

  const view = root.ownerDocument.defaultView;
  let held = null;
  let pending = 0;
  const originals = new Map();
  const itemsOf = () => {
    const found = Array.prototype.slice.call(
      root.querySelectorAll(settings.item_selector),
    );
    return (
      found.length ? found : Array.prototype.slice.call(root.children)
    ).filter((one) => one !== held?.slot);
  };
  const idOf = (el, at) => el.getAttribute("data-sort-id") || String(at);
  const lineOf = (target) =>
    itemsOf().filter((one) => one === target || one.contains(target))[0];

  /* every line is draggable, and stays draggable as React replaces them â€” one observer rather than
     an attribute the six row components would each have to remember */
  const mark = () =>
    itemsOf().forEach((one) => {
      if (!originals.has(one))
        originals.set(one, one.getAttribute("draggable"));
      one.draggable = true;
    });
  mark();
  const watch = new view.MutationObserver(mark);
  watch.observe(root, { childList: true, subtree: true });

  /* a press inside a field or a button is not a drag â€” turn the line's drag off for that press */
  const down = (event) => {
    const line = lineOf(event.target);
    if (!line) return;
    line.draggable = !(event.target.closest && event.target.closest(KEEP));
  };

  const start = (event) => {
    const line = lineOf(event.target);
    if (!line) return;
    if (held || !line.draggable || event.target.closest?.(KEEP)) {
      event.preventDefault();
      return;
    }
    const rows = itemsOf().filter(
      (one) => one.parentElement === line.parentElement,
    );

    const box = line.getBoundingClientRect();
    const slot = root.ownerDocument.createElement("div");
    slot.className = "drop-slot";
    slot.style.height = box.height + "px";

    held = {
      item: line,
      area: line.parentElement,
      from: rows.indexOf(line),
      slot,
      rows,
      ids: rows.map(idOf),
    };
    event.dataTransfer.effectAllowed = "move";
    /* firefox needs the payload set before a drag will start */
    try {
      event.dataTransfer.setData("text/plain", idOf(line, held.from));
    } catch (nope) {
      void nope;
    }

    /* the dim + slot land after the browser has taken its snapshot, so the carried line looks whole */
    pending = view.setTimeout(() => {
      if (!held) return;
      held.item.classList.add("drag-source");
      held.area.insertBefore(held.slot, held.item.nextSibling);
    }, 0);
  };

  const over = (event) => {
    if (!held) return;
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";

    /* where would it land? the first line whose middle is below the pointer */
    const others = held.rows.filter((one) => one !== held.item);
    let before = null;
    for (const one of others) {
      const box = one.getBoundingClientRect();
      if (event.clientY < box.top + box.height / 2) {
        before = one;
        break;
      }
    }
    held.area.insertBefore(held.slot, before);
  };

  const drop = (event) => {
    if (!held) return;
    event.preventDefault();
    const done = held;
    held = null;

    /* the order is read from the slot's position, then the dom is put back as it was */
    view.clearTimeout(pending);
    const line = Array.from(done.area.children).filter(
      (one) =>
        one === done.slot || (one !== done.item && done.rows.includes(one)),
    );
    const to = line.indexOf(done.slot);
    const ids = done.ids.filter((_, index) => index !== done.from);
    ids.splice(to < 0 ? done.from : to, 0, done.ids[done.from]);

    done.slot.remove();
    done.item.classList.remove("drag-source");

    if (to !== done.from && to > -1)
      settings.handleSort?.(
        { ids, from: done.from, to },
        "drag-sort",
        settings,
      );
  };

  const end = () => {
    view.clearTimeout(pending);
    if (!held) return;
    held.slot.remove();
    held.item.classList.remove("drag-source");
    held = null;
  };

  root.addEventListener("pointerdown", down);
  root.addEventListener("dragstart", start);
  root.addEventListener("dragover", over);
  root.addEventListener("drop", drop);
  root.addEventListener("dragend", end);
  return () => {
    watch.disconnect();
    end();
    for (const [item, value] of originals) {
      if (value === null) item.removeAttribute("draggable");
      else item.setAttribute("draggable", value);
    }
    originals.clear();
    root.removeEventListener("pointerdown", down);
    root.removeEventListener("dragstart", start);
    root.removeEventListener("dragover", over);
    root.removeEventListener("drop", drop);
    root.removeEventListener("dragend", end);
  };
};

export default dragSort;
