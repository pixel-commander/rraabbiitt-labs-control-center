import { useEffect, useRef } from "react";
import { useClickOutside } from "../../../../hooks/useClickOutside/useClickOutside";
import { useKeypress } from "../../../../hooks/useKeypress/useKeypress";
import type { ModalProps } from "../../Modal.types";

export const useModal = (props: ModalProps) => {
  const { open = false, closeOnBackdrop = true, handleClick } = props;
  const dialogRef = useRef<HTMLDialogElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const close = () => handleClick?.({}, "close-modal");
  useClickOutside(contentRef, () => { if (open && closeOnBackdrop) close(); });
  useKeypress({ key: "Escape", callback: event => {
    if (!open || event.defaultPrevented) return;
    event.preventDefault();
    close();
  } });
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
    return () => { if (dialog.open) dialog.close(); };
  }, [open]);
  return { dialogRef, contentRef, close };
};
