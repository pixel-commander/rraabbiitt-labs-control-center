import "./css/app-header.css";
import { Suspense, useState } from "react";
import { Shell } from "@shared/components/Shell/Shell";
import { TabNav } from "@shared/components/TabNav/TabNav";
import type { ComponentType } from "react";
import type { VIEWProps } from "./App.types";
import { HomePage } from "./pages/home/HomePage";
import { StyleGuidePage } from "./pages/StyleGuide/StyleGuidePage";
import { useURL } from "./hooks/useURL/useURL";

export const App = () => {
  const VIEWS: VIEWProps[] = [
    {
      id: __HOME_VIEW_ID__,
      name: "home-page",
      title: "Home Page",
      path: "home",
      View: HomePage,
    },
    {
      id: __STYLE_GUIDE_VIEW_ID__,
      name: "style-guide-page",
      title: "Style Guide",
      path: "style-guide",
      View: StyleGuidePage,
    },
  ];

  const [{ page }, handleURL] = useURL();
  const [mode, setMode] = useState(() =>
    document.documentElement.dataset.mode === "light" ? "light" : "dark",
  );
  const selected_view =
    VIEWS.find(({ path }) => path === String(page)) ||
    (page ? undefined : VIEWS[0]);
  let View: ComponentType = selected_view?.View || (() => <>404 not found</>);

  return (
    <Shell
      header={
        <>
          <div className="project-header__brand pad" data-area="side">
            <h1 className="project-header__name">{__PROJECT_TITLE_JSON__}</h1>
          </div>
          <div className="project-header__controls pad" data-area="main" data-grid="side-right" data-gap="control">
            <div data-area="main">
              <TabNav
                styler="main"
                items={VIEWS.map(({ id, title, path }) => ({
                  id: id!,
                  label: title ?? "",
                  path: `/${path ?? ""}`,
                }))}
                selected={`/${selected_view?.path ?? page ?? "home"}`}
                handleClick={(item) =>
                  item && handleURL({ page: item.path.slice(1) }, "set-path")
                }
              />
            </div>
            <button
              type="button"
              className="action-nav inner pad"
              data-area="side"
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
          </div>
        </>
      }
    >
      <div data-grid="main-footer">
        <div className="site-main" data-area="main" data-rows="1">
          <Suspense fallback={<p role="status">Loading view...</p>}>
            <View />
          </Suspense>
        </div>
        <footer className="site-footer" data-area="footer">
          <div className="pad">rab world v.0.0.11</div>
        </footer>
      </div>
    </Shell>
  );
};
