import { useEffect, useRef } from "react";
import { dragScroll } from "../../../ui/js/drag-scroll/drag-scroll.js";
import type { SiteNavProps } from "./SiteNav.types";
import "./css/site-nav.css";
export const SiteNav = (props: SiteNavProps) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  useEffect(() => dragScroll(scrollRef), []);
  const {
    Left,
    Logo,
    name,
    Right,
    nav_items = [],
    selected,
    render,
    className = "",
  } = props;
  return (
    <nav
      aria-label={props.title ?? "Site navigation"}
      data-grid="sides"
      data-collapse="1"
      className={["site-nav", "container-main", className]
        .filter(Boolean)
        .join(" ")}
    >
      <div data-area="left" className="site-nav-left">
        <div className="site-nav-brand gap-base">
          {Logo !== undefined && Logo !== null && Logo !== false && (
            <span className="site-nav-logo">{Logo}</span>
          )}
          <span className="site-nav-name">{name}</span>
          {Left}
        </div>
      </div>
      <div data-area="main" className="scroll-x" ref={scrollRef}>
        <div className="site-nav-items">
          {nav_items.map((item) => (
            <a
              key={item.id}
              href={item.path}
              title={item.title}
              className={[
                "site-nav-item",
                "action-light",
                selected !== undefined && selected === item.path
                  ? "is-selected"
                  : "",
              ]
                .filter(Boolean)
                .join(" ")}
              aria-current={
                selected !== undefined && selected === item.path
                  ? "page"
                  : undefined
              }
              onClick={(event) => {
                if (
                  event.button !== 0 ||
                  event.metaKey ||
                  event.ctrlKey ||
                  event.shiftKey ||
                  event.altKey
                )
                  return;
                event.preventDefault();
                item.handleClick?.(item, "site-nav", props);
                props.handleClick(item, "site-nav", props);
              }}
            >
              {render ? render(item, "nav-item") : item.label}
            </a>
          ))}
        </div>
      </div>
      <div data-area="right" className="site-nav-right">
        <div className="site-nav-right-content gap-base">{Right}</div>
      </div>
    </nav>
  );
};
