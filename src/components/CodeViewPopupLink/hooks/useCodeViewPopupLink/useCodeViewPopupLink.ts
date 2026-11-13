import { useEffect, useRef, useState } from "react";
import type { CodeViewPopupLinkProps } from "../../CodeViewPopupLink.types";
import type { FloatWindowProps } from "../../../FloatWindow/FloatWindow.types";
export const useCodeViewPopupLink = (props: CodeViewPopupLinkProps) => {
  const [state, setState] = useState(() => ({
    open: false,
    code: props.code ?? "",
    error: "",
    loaded: "",
    rect: props.rect ?? {
      x: 24,
      y: 24,
      width: Math.min(860, window.innerWidth - 48),
      height: Math.min(560, window.innerHeight - 48),
    },
  }));
  const trigger = useRef<HTMLButtonElement>(null);
  const currentProps = useRef(props);
  currentProps.current = props;
  const open = props.open ?? state.open;
  const source = JSON.stringify([props.path, props.file]);
  useEffect(() => {
    if (!open) return;
    let current = true;
    const bag = currentProps.current;
    setState((value) => ({ ...value, loaded: "", error: "" }));
    Promise.resolve()
      .then(() =>
        bag.handleLoad
          ? bag.handleLoad({ path: bag.path, file: bag.file }, "load-code", bag)
          : (bag.code ?? ""),
      )
      .then((code) => {
        if (current) setState((value) => ({ ...value, code, loaded: source }));
      })
      .catch((error) => {
        if (current)
          setState((value) => ({
            ...value,
            error: String(error),
            loaded: source,
          }));
      });
    return () => {
      current = false;
    };
  }, [open, source, props.code]);
  const show = () => {
    if (props.disabled) return;
    setState((value) => ({ ...value, open: true }));
    props.handleClick?.({ path: props.path, file: props.file }, "open", props);
  };
  const close = () => {
    setState((value) => ({ ...value, open: false }));
    props.handleCancel?.(undefined, "close", props);
    trigger.current?.focus();
  };
  const move = (rect?: FloatWindowProps["rect"]) => {
    if (rect) setState((value) => ({ ...value, rect }));
  };
  return {
    ...state,
    open,
    pending: state.loaded !== source,
    trigger,
    show,
    close,
    move,
  };
};
