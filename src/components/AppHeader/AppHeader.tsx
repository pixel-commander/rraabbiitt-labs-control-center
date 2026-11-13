import "./css/app-header.css";
import { useState } from "react";
import type { ReactNode } from "react";
import type { TabNavItem } from "../TabNav/TabNav.types";
import { useURL } from "../../hooks/useURL/useURL.ts";
import { TabNav } from "../TabNav/TabNav";
import { useProjectRefresh } from "./hooks/useProjectRefresh/useProjectRefresh";

const wordmark = "rraabbiitt";

export const AppHeader = ({ brand, nav_items = [] }: {
  brand?: { mark?: ReactNode; title?: string };
  nav_items?: TabNavItem[];
} = {}) => {
  const [mode, setMode] = useState(() =>
    document.documentElement.dataset.mode === "light" ? "light" : "dark",
  );
  const [url, handleURL] = useURL();
  const { pending, error, handleRefresh } = useProjectRefresh();
  const current = (url.page as string) || "home";
  return (
    <>
      <div data-area="side">
        <div className="app-header__brand inner pad">
          <span className="app-header__mark">{brand?.mark}</span>
          <span className="app-header__wordmark" aria-label={brand?.title ?? "rraabbiitt labs"}>
            {Array.from(wordmark).map((letter, index) => (
              <span
                key={`${letter}-${index}`}
                className={
                  index % 2 === 1
                    ? "app-header__brand-letter--muted"
                    : undefined
                }
                aria-hidden="true"
              >
                {letter}
              </span>
            ))}
            <span aria-hidden="true">.labs</span>
          </span>
        </div>
      </div>
      <div data-area="main">
        <div className="app-header__right inner pad">
          <TabNav
            styler="main"
            items={nav_items}
            selected={`/${current}`}
            handleClick={(item) =>
              item && handleURL({
                page: item.path.slice(1),
                ...(item.path === "/factory" ? { section: "component-factory" } : {}),
              }, "set-path")
            }
          />
          <button
            type="button"
            className="action-nav inner pad"
            aria-label="Light mode"
            aria-pressed={mode === "light"}
            title={`Switch to ${mode === "dark" ? "light" : "dark"} mode`}
            onClick={() => {
              const next = mode === "dark" ? "light" : "dark";
              document.documentElement.dataset.theme = "main";
              document.documentElement.dataset.mode = next;
              setMode(next);
            }}
          >
            {mode === "dark" ? "Light mode" : "Dark mode"}
          </button>
          <div>
            <button
              type="button"
              className="action-nav"
              disabled={pending}
              onClick={handleRefresh}
            >
              {pending ? "Refreshing…" : "Refresh Project"}
            </button>
            {error && <p role="alert">{error}</p>}
          </div>
        </div>
      </div>
    </>
  );
};
