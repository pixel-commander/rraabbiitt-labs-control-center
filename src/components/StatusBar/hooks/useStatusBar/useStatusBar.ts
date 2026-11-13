import { useEffect, useRef } from "react";
import type { StatusBarProps } from "../../StatusBar.types";

export const useStatusBar = (props: StatusBarProps) => {
  const { status = "", delay = 0, duration = 3000, is_open = false } = props;
  const ref = useRef<HTMLDivElement>(null);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const clearTimers = () => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
  };
  useEffect(() => {
    clearTimers();
    ref.current?.classList.toggle("is-open", Boolean(status) && delay <= 0);
    if (!status) return;
    if (delay > 0)
      timers.current.push(
        setTimeout(() => ref.current?.classList.add("is-open"), delay),
      );
    if (!is_open && duration > 0)
      timers.current.push(
        setTimeout(
          () => ref.current?.classList.remove("is-open"),
          Math.max(0, delay) + duration,
        ),
      );
    return clearTimers;
  }, [status, delay, duration, is_open]);
  const close = () => {
    clearTimers();
    ref.current?.classList.remove("is-open");
    props.handleClick?.(status, "close", { ...props });
  };
  return { ref, close };
};
