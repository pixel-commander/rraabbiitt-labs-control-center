import { useId, useRef } from "react";
import type { ToggleSectionProps } from "./ToggleSection.types";
import "./css/toggle-section.css";
import "../../atoms/containers/container-dropdown/container-dropdown.css";

export const ToggleSection = ({
  title, title_class = "", container_class = "container-dropdown", children, className = "",
}: ToggleSectionProps) => {
  const main = useRef<HTMLDivElement>(null);
  const section = useRef<HTMLElement>(null);
  const mainId = useId();
  return (
    <section ref={section} className={["toggle-section", container_class, className].filter(Boolean).join(" ")}>
      <div className={["toggle-section-title", title_class].filter(Boolean).join(" ")}>{title}</div>
      <button type="button" className="toggle-section-toggle" aria-label="Toggle section"
        aria-expanded="false" aria-controls={mainId}
        onClick={event => {
          if (!main.current) return;
          const open = main.current.classList.toggle("is-open");
          section.current?.classList.toggle("is-open", open);
          main.current.classList.toggle("is-closed", !open);
          main.current.inert = !open;
          main.current.setAttribute("aria-hidden", String(!open));
          event.currentTarget.setAttribute("aria-expanded", String(open));
        }}>
        <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
          <path d="m4 6 4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      <div ref={main} id={mainId} className="toggle-section-main is-closed" inert aria-hidden="true">
        <div className="toggle-section-inner">
          <div className="toggle-section-content pad scroll-y">{children}</div>
        </div>
      </div>
    </section>
  );
};
