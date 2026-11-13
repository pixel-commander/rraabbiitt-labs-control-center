import type { ModalProps } from './Modal.types';
import './css/modal.css';
import { useId } from "react";
import { useModal } from "./hooks/useModal/useModal";

export const Modal = (props: ModalProps) => {
  const {
  children,
  className = "",
  title = "Dialog",
  footer,
  } = props;
  const { dialogRef, contentRef, close } = useModal(props);
  const titleId = useId();
  return (
    <dialog ref={dialogRef} className={["modal", className].filter(Boolean).join(" ")}
      aria-labelledby={titleId}
      onCancel={event => { event.preventDefault(); }}>
      <div ref={contentRef} className="modal__panel container-float">
      <header className="modal__header">
        <div id={titleId}>{title}</div>
        <button type="button" className="action-main" aria-label="Close dialog" onClick={close}>Close</button>
      </header>
      <div className="modal__content scroll-both">{children}</div>
      {footer != null && <footer className="modal__footer">{footer}</footer>}
      </div>
    </dialog>
  );
};
