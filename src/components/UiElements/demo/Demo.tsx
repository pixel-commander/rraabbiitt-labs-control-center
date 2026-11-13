import { useState } from "react";
import {
  UiElements,
  StatusLabel,
  ModelTile,
  PageHeader,
  IconButton,
} from "../UiElements";
export const Demo = () => {
  const [clicks, setClicks] = useState(0);
  return (
    <UiElements>
      <section data-cols="1" data-gap="control">
        <h3>IconButton</h3>
        <div data-cols="3" data-collapse="2" data-gap="control">
          <IconButton
            Icon="↑"
            handleClick={() => setClicks((value) => value + 1)}
          >
            Run
          </IconButton>
          <IconButton type="add" action_atom="action-light">
            Add
          </IconButton>
          <IconButton
            Icon="↑"
            disabled
            handleClick={() => setClicks((value) => value + 1)}
          >
            Disabled
          </IconButton>
        </div>
        <div data-cols="3" data-collapse="2" data-gap="control">
          {(["skill", "tool", "runner", "doc", "find", "settings", "beacon"] as const).map(type => (
            <IconButton key={type} type={type} action_atom="action-light">{type}</IconButton>
          ))}
        </div>
        <output aria-live="polite">IconButton clicks: {clicks}</output>
      </section>
      <section data-cols="1" data-gap="control">
        <h3>PageHeader</h3>
        <PageHeader
          label="SEARCH PROTOCOL / SESSION"
          Headline={<strong>Qwen3-Coder 30B</strong>}
          Right={<StatusLabel label="READY" />}
        />
      </section>
      <section data-cols="1" data-gap="control">
        <h3>StatusLabel</h3>
        <StatusLabel label="READY" />
        <StatusLabel
          label="UNAVAILABLE"
          status_color="var(--color-muted)"
          label_color="var(--color-muted)"
        />
      </section>
      <section data-cols="1" data-gap="control">
        <h3>ModelTile</h3>
        <ModelTile title="Qwen3-Coder 30B" label="OLLAMA / AVAILABLE" />
      </section>
    </UiElements>
  );
};
export default Demo;
