import "./css/layout.css";
import "./css/grid.css";
import "./css/style.css";
import "./themes/dark/colors.css";
import "./themes/light/colors.css";
import "./atoms/atoms.css";

import { SiteNav } from "./components/SiteNav/SiteNav";
import { McpViewer } from "./components/McpViewer/McpViewer";
import { useEffect, useState } from "react";
import { WorldSearchPage } from "./pages/WorldSearch/WorldSearchPage";
import worldSearchSettings from "./pages/WorldSearch/rab.settings.json";
import type { ComponentType } from "react";
import type { VIEWProps } from "./App.types";
import { HomePage } from "./pages/home/HomePage";
import { StyleGuidePage } from "./pages/StyleGuide/StyleGuidePage";
import { useURL } from "./hooks/useURL/useURL";

export const App = () => {
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);
  const VIEWS: VIEWProps[] = [
    {
      id: worldSearchSettings.id,
      name: "world-search",
      title: "World Search",
      path: "world-search",
      View: WorldSearchPage,
    },
    {
      id: 1794247089698,
      name: "home-page",
      title: "Home Page",
      path: "home",
      View: HomePage,
    },
    {
      id: 1794247089699,
      name: "style-guide-page",
      title: "Style Guide",
      path: "style-guide",
      View: StyleGuidePage,
    },
  ];

  const [{ page }, handleURL] = useURL();
  const selected_view =
    VIEWS.find(({ path }) => path === String(page)) ||
    (page ? undefined : VIEWS.find(({ path }) => path === "home"));
  let View: ComponentType = selected_view?.View || (() => <>404 not found</>);

  return (
    <div className="site-shell" data-theme={theme} data-grid="shell">
      <header data-area="header">
        <SiteNav
          Logo={
            <svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true">
              <rect
                x="2"
                y="2"
                width="12"
                height="12"
                fill="none"
                stroke="currentColor"
              />
              <path d="M2 2h6v12H2z" fill="currentColor" />
            </svg>
          }
          name={<strong>rraabbiitt labs</strong>}
          nav_items={VIEWS.map(({ id, title, path }) => ({
            id,
            label: title,
            title,
            path: "/" + path,
          }))}
          selected={selected_view ? "/" + selected_view.path : undefined}
          handleClick={(item) =>
            handleURL({ page: item?.path.slice(1) }, "update-path")
          }
          Right={<McpViewer />}
        />
      </header>
      <main className="site-main" data-area="main">
        <View />
      </main>
      <footer className="site-footer" data-area="footer" data-grid="side-right">
        <div className="pad" data-area="main">rab world v.0.0.11</div>
        <div className="pad" data-area="side">
          <button type="button" className="action-outline site-theme"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}>
            {theme === "dark" ? "Light theme" : "Dark theme"}
          </button>
        </div>
      </footer>
    </div>
  );
};
