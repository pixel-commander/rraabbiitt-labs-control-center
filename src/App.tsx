import "./css/layout.css";
import "./css/grid.css";
import "./css/style.css";
import "./themes/dark/colors.css";
import "./themes/light/colors.css";
import "./atoms/atoms.css";

import { SiteNav } from "./components/SiteNav/SiteNav";
import { WorldComponents } from "./components/WorldComponents/WorldComponents";
import { McpViewer } from "./components/McpViewer/McpViewer";
import { useEffect, useRef, useState } from "react";
import { WorldSearchPage } from "./pages/WorldSearch/WorldSearchPage";
import { DumBotPage } from "./pages/DumBot/DumBotPage";
import dumBotSettings from "./pages/DumBot/rab.settings.json";
import worldSearchSettings from "./pages/WorldSearch/rab.settings.json";
import type { ComponentType } from "react";
import type { VIEWProps } from "./App.types";
import { HomePage } from "./pages/home/HomePage";
import { StyleGuidePage } from "./pages/StyleGuide/StyleGuidePage";
import { useURL } from "./hooks/useURL/useURL";
import { WorldStates } from "./dashboards/WorldStates/WorldStates";
import worldStatesSettings from "./dashboards/WorldStates/rab.settings.json";
import { RabbitHead } from "./components/RabbitHead/RabbitHead";
import type { RabbitEffects } from "./components/RabbitHead/js/RabbitStage.jsx";
import type { HybridSearchProps } from "./components/HybridSearch/HybridSearch.types";

export const App = () => {
  const rabbitEffects = useRef<RabbitEffects | null>(null);
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);
  const VIEWS: VIEWProps[] = [
    { id: worldStatesSettings.id, name: "world-states", title: "World States", path: "world-states", View: WorldStates },
    { id: dumBotSettings.id, name: "dumbot", title: "DumBot", path: "dumbot", View: DumBotPage },
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
  let View: ComponentType<HybridSearchProps> = selected_view?.View || (() => <>404 not found</>);

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
          Right={<div className="site-header-controls"><McpViewer /><WorldComponents /></div>}
        />
      </header>
      <main className="site-main" data-area="main">
        <div className="page-rabbit-background" aria-hidden="true" hidden={page !== "dumbot" && page !== "world-search" && page !== "world-states"}>
          <RabbitHead transparentBg interactive={false} followMouse autoMotion={false} wheelZoom={false}
            handleReady={(effects) => { rabbitEffects.current = effects ?? null; }}
            zoom={1} faceOpacity={0.1} lineOpacity={0.15}
            showSparkles={false} dustAmount={0}
            strikeIntensity={0.3} strikeArms={1} strikeSpread={12} strikeLength={600}
            circuitGlow={0.08} circuitOpacity={0.08} pulseFreq={4} pulseSize={0.5}
            pointGlow={0} pointSize={0.3}
            panX={page === "dumbot" ? -0.72 : 0.65} panY={-0.03} />
        </div>
        <View rabbitEffects={rabbitEffects} />
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
