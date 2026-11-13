import React, { useEffect } from "react";
import { RabbitControls } from "../../components/RabbitHead/RabbitControls/RabbitControls";
import { useRabbitContext } from "../../components/RabbitHead/hooks/useRabbit/RabbitProvider";
import type { HomePageProps } from "./HomePage.types";

export const HomePage: React.FC<HomePageProps> = () => {
  const rabbit = useRabbitContext();
  const { setOpen } = rabbit;
  useEffect(() => {
    setOpen(true);
    return () => setOpen(false);
  }, [setOpen]);
  return (
    <>
      {!rabbit.open && (
        <button type="button" className="action-outline" onClick={() => setOpen(true)}>Rabbit controls</button>
      )}
      <RabbitControls />
    </>
  );
};

/* Preserved World Search right-column JSX. Requires the original World Search state, handleChange, StatusLabel and Slider imports if restored.
        <aside
          data-area="right"
          className="container-main world-search-panel world-search-inspector pad-xs"
          data-cols="1"
        >
          <div className="pad-xs scroll-y" data-cols="1" data-gap="section">
            <section>
              <h2>RUN INSPECTOR / TOOLS</h2>
              <div className="container-alt world-search-trace">
                <StatusLabel label="PREVIEW DATA" />
                <code>check_world_settings</code>
                <p className="world-search-muted">
                  World: rraabbiitt-hq
                  <br />
                  No tool executed
                </p>
              </div>
            </section>
            <section>
              <h2>MODEL PARAMETERS</h2>
              <div className="world-search-sliders" data-cols="1">
                <Slider
                  label="Temperature"
                  min={0}
                  max={2}
                  step={0.1}
                  value={state.temperature}
                  handleChange={(value) =>
                    handleChange("temperature", value ?? 0)
                  }
                />
                <Slider
                  label="Top P"
                  min={0}
                  max={1}
                  step={0.1}
                  value={state.topP}
                  handleChange={(value) => handleChange("topP", value ?? 0)}
                />
                <Slider
                  label="Top K"
                  min={1}
                  max={100}
                  value={state.topK}
                  handleChange={(value) => handleChange("topK", value ?? 1)}
                />
              </div>
            </section>
            <section>
              <h2>PERSONA / SYSTEM</h2>
              <label className="world-search-sr" htmlFor="world-persona">
                Persona instructions
              </label>
              <textarea
                className="container-alt world-search-persona"
                id="world-persona"
                value={state.persona}
                onChange={(event) =>
                  handleChange("persona", event.target.value)
                }
              />
              <button
                type="button"
                className="action-light world-search-save"
                onClick={() => handleChange("saved", true)}
                disabled={state.saved}
              >
                {state.saved ? "✓ Saved in preview" : "Save in preview"}
              </button>
            </section>
          </div>
        </aside>
*/
