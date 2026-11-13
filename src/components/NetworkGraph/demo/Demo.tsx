import "./demo.css";
import snapshot from "./import-map.json";
import "./demo.css";
import { GraphLegend } from "../GraphLegend/GraphLegend";
import { GraphSearch } from "../GraphSearch/GraphSearch";
import type { GraphSearchProps } from "../GraphSearch/GraphSearch.types";
import { useState } from "react";
import { NetworkGraph } from "../NetworkGraph";
import { GraphFootprint } from "../GraphFootprint/GraphFootprint";
import { GraphSelection } from "../GraphSelection/GraphSelection";
import type { GraphData, NetworkGraphProps } from "../NetworkGraph.types";
import type { GraphMetric } from "../GraphFootprint/GraphFootprint.types";

const palette: Record<string, string> = {
  ".tsx": "#5b9eff",
  ".ts": "#52c6f2",
  ".js": "#ffb86b",
  ".mjs": "#ffb86b",
  ".css": "#ec83ed",
  ".html": "#8ddd8d",
};
const components = [...snapshot.components].sort(
  (a, b) => a.source.localeCompare(b.source) || a.name.localeCompare(b.name),
);
const files = [...snapshot.files].sort(
  (a, b) => a.ext.localeCompare(b.ext) || a.file.localeCompare(b.file),
);
const fileKeys = new Set(files.map((file) => file.id));
const data: GraphData = {
  nodes: [
    ...components.map((item, i) => ({
      key: `c${item.id}`,
      id: item.id,
      name: item.name,
      path: item.path,
      description: item.description,
      type: item.type,
      group: "components",
      color: "#53e0dc",
      x: 205,
      y: 95 + i * 40,
    })),
    ...files.map((item, i) => ({
      key: `f${item.id}`,
      id: item.id,
      name: item.file,
      path: item.path,
      type: item.ext,
      group: "files",
      color: palette[item.ext] ?? "#b0bec5",
      x: 1100,
      y: 70 + i * 18,
    })),
  ],
  edges: components.flatMap((item) =>
    item.imports
      .filter((id) => fileKeys.has(id))
      .map((id) => ({ source: `c${item.id}`, target: `f${id}` })),
  ),
};
const metrics: GraphMetric[] = [
  { name: "components", title: "Components", value: components.length },
  { name: "files", title: "Unique files", value: files.length },
  { name: "links", title: "Import links", value: data.edges.length },
  {
    name: "roots",
    title: "Source roots",
    value: new Set(components.map((item) => item.source)).size,
  },
];

export const Demo = () => {
  const [selected, setSelected] = useState<string>();
  const [query, setQuery] = useState("");
  const handleSearch: GraphSearchProps["handleChange"] = (value) => {
    setQuery(value?.search ?? "");
  };
  const matching = new Set(
    data.nodes
      .filter((node) =>
        `${node.name ?? ""} ${node.path ?? ""}`
          .toLowerCase()
          .includes(query.toLowerCase()),
      )
      .map((node) => node.key),
  );
  const edges = data.edges.filter(
    (edge) => matching.has(edge.source) || matching.has(edge.target),
  );
  const visible = new Set([
    ...matching,
    ...edges.flatMap((edge) => [edge.source, edge.target]),
  ]);
  const filtered: GraphData = {
    nodes: data.nodes.filter((node) => visible.has(node.key)),
    edges,
  };

  const handleSelect: NetworkGraphProps["handleSelect"] = (node) => {
    setSelected(node?.key);
  };
  return (
    <div
      className="network-graph-demo"
      data-grid="side-right"
      data-gap="control"
    >
      <div data-area="main">
        <GraphSearch handleChange={handleSearch} handleSubmit={handleSearch} />
        <p>Drag to pan · Scroll to zoom · Double-click to reset</p>
        <NetworkGraph
          data={filtered}
          initialZoom={1}
          colors={{ node: "#53e0dc", edge: "#338295", label: "#cae4e9" }}
          lineStyle={{
            width: 1,
            opacity: 0.9,
            activeWidth: 1.25,
            activeOpacity: 1,
            inactiveOpacity: 0.025,
          }}
          selected={selected}
          handleSelect={handleSelect}
        />
        <GraphLegend
          data={[
            { name: "components", title: "Components", shape: "circle" },
            { name: "files", title: "Files", shape: "square" },
          ]}
        />
      </div>
      <aside data-area="side">
        <GraphFootprint data={metrics} />
        <GraphSelection
          data={data}
          selected={selected}
          handleSelect={handleSelect}
        />
      </aside>
    </div>
  );
};
