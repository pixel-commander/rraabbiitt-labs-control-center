import { useRef, useState } from "react";
import type { PointerEvent } from "react";
import type {
  DatePickerProps,
  DatePickerSelection,
} from "../../DatePicker.types";
export const useDatePicker = (props: DatePickerProps) => {
  const [state, setState] = useState<{ open: boolean; month?: number }>({
    open: false,
  });
  const drag = useRef<{ id: number; start: number; end: number } | null>(null);
  const [preview, setPreview] = useState<[number, number] | undefined>();
  const chosen = props.selected;
  const first = chosen?.[0];
  const selected =
    first !== undefined && Number.isFinite(first) ? new Date(first) : undefined;
  const range =
    preview ??
    (chosen !== undefined
      ? [Math.min(...chosen), Math.max(...chosen)]
      : undefined);
  const anchor =
    selected && !Number.isNaN(selected.getTime()) ? selected : new Date();
  const view =
    state.month === undefined
      ? new Date(anchor.getFullYear(), anchor.getMonth(), 1)
      : new Date(state.month);
  const open = props.is_open ?? state.open;
  const toggle = (next: boolean) => {
    if (props.is_disabled) return;
    if (!next) {
      drag.current = null;
      setPreview(undefined);
    }
    setState((current) => ({
      ...current,
      open: next,
      ...(next
        ? {
            month: new Date(
              anchor.getFullYear(),
              anchor.getMonth(),
              1,
            ).getTime(),
          }
        : {}),
    }));
  };
  const step = (delta: number) => {
    if (!props.is_disabled)
      setState((current) => ({
        ...current,
        month: new Date(
          view.getFullYear(),
          view.getMonth() + delta,
          1,
        ).getTime(),
      }));
  };
  const pick = (value: DatePickerSelection) => {
    if (props.is_disabled) return;
    props.handleSelect?.(value, "date-picker", props);
    toggle(false);
  };
  const cancel = () => {
    drag.current = null;
    setPreview(undefined);
  };
  const point = (event: PointerEvent<HTMLDivElement>) => {
    const cell = event.currentTarget.ownerDocument
      .elementFromPoint(event.clientX, event.clientY)
      ?.closest<HTMLButtonElement>("[data-date]");
    return cell && event.currentTarget.contains(cell)
      ? Number(cell.dataset.date)
      : undefined;
  };
  const begin = (event: PointerEvent<HTMLDivElement>) => {
    if (props.is_disabled || event.button !== 0 || !event.isPrimary) return;
    const date = point(event);
    if (date === undefined) return;
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    drag.current = { id: event.pointerId, start: date, end: date };
    setPreview([date, date]);
  };
  const move = (event: PointerEvent<HTMLDivElement>) => {
    const current = drag.current;
    if (!current || current.id !== event.pointerId) return;
    if (props.is_disabled) {
      cancel();
      return;
    }
    const date = point(event);
    if (date === undefined) return;
    current.end = date;
    setPreview([Math.min(current.start, date), Math.max(current.start, date)]);
  };
  const finish = (event: PointerEvent<HTMLDivElement>) => {
    const current = drag.current;
    if (!current || current.id !== event.pointerId) return false;
    const end = point(event) ?? current.end;
    cancel();
    event.currentTarget.releasePointerCapture(event.pointerId);
    pick([Math.min(current.start, end), Math.max(current.start, end)]);
    return true;
  };
  return {
    open,
    view,
    selected,
    range,
    toggle,
    step,
    pick,
    begin,
    move,
    finish,
    cancel,
  };
};
