import { useState } from "react";
import { ConnectorSettings } from "../components/ConnectorSettings/ConnectorSettings";
import { CanvasFlow } from "../CanvasFlow";
import type { FlowData, FlowSelection } from "../CanvasFlow.types";

const initial: FlowData = {
  title: "Flow canvas demo",
  types: { safe: { color: "--safe" }, danger: { color: "--danger" } },
  nodes: [
    { id: "n1", x: 80, y: 90, type: "safe", title: "you run", sub: "a command" },
    { id: "n2", x: 380, y: 190, type: "danger", title: "it writes", sub: "a file" },
  ],
  edges: [
    { id: "e1", from: "n1", to: "n2", type: "safe", route: "ortho", fx: "pulse", label: "what travels" },
  ],
};

export const Demo = () => {
  const [data, setData] = useState(initial);
  const [selected, setSelected] = useState<FlowSelection | null>({ type: "edge", id: "e1" });
  const [saved, setSaved] = useState(false);
  const edge = selected?.type === "edge" ? data.edges.find((item, index) => (item.id ?? index) === selected.id) : undefined;
  return (
    <>
      <div style={{ blockSize: "26rem" }}>
        <CanvasFlow
          data={data}
          selected={selected}
          handleSelect={(next) => setSelected(next ?? null)}
          handleChange={(next) => { if (next) { setData(next); setSaved(false); } }}
          handleSave={() => setSaved(true)}
        />
      </div>
      <p role="status">{saved ? "Save requested" : selected ? `Selected ${selected.type} ${selected.id}` : "Select a node or wire"}</p>
      {edge && (
        <div style={{ inlineSize: "16rem" }}>
          <ConnectorSettings
            edge={edge}
            handleChange={(next) => {
              if (!next) return;
              setData((current) => ({ ...current, edges: current.edges.map((item) => item.id === edge.id ? next : item) }));
              setSaved(false);
            }}
            handleClick={() => {
              setData((current) => ({ ...current, edges: current.edges.filter((item) => item.id !== edge.id) }));
              setSelected(null);
              setSaved(false);
            }}
          />
        </div>
      )}
    </>
  );
};
