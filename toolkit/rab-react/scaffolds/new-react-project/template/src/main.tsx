import "@shared/css/global.css";
import "@shared/themes/main/layout/layout.css";
import "@shared/themes/main/dark/colors.css";
import "@shared/themes/main/light/colors.css";
import "@shared/themes/main/layout/grid.css";
import "@shared/css/containers.css";
import "@shared/css/actions.css";
import "@shared/atoms/containers/container-cell/container-cell.css";
import "@shared/atoms/containers/container-machine/container-machine.css";
import "@shared/atoms/containers/container-metal/container-metal.css";
import "@shared/atoms/containers/container-neon-corner/container-neon-corner.css";
import "@shared/atoms/effects/effect-inset/effect-inset.css";
import "@shared/atoms/effects/effect-float/effect-float.css";
import "./atoms/atoms.css";

import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./App";
const root = document.getElementById("root");
if (!root) throw new Error("Application root is missing.");
createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
