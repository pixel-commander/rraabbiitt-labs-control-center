import type { GraphSelectionProps } from "./GraphSelection.types";
import "./css/graph-selection.css";
import "../../../atoms/actions/action-row/action-row.css";

export const GraphSelection = ({
  className = "",
  data,
  selected,
  handleSelect,
  title = "Selection",
}: GraphSelectionProps) => {
  const node = data.nodes.find((item) => item.key === selected);
  const connectedKeys = new Set(
    data.edges.flatMap((edge) =>
      edge.source === selected
        ? [edge.target]
        : edge.target === selected
          ? [edge.source]
          : [],
    ),
  );
  const connected = data.nodes.filter((item) => connectedKeys.has(item.key));
  return (
    <section
      className={["graph-selection", className].filter(Boolean).join(" ")}
      aria-label={title}
    >
      <h3>{title}</h3>
      {node ? (
        <>
          <h4>{node.title ?? node.name ?? node.key}</h4>
          {node.description && <p>{node.description}</p>}
          {node.type && <p>{node.type}</p>}
          {node.path && <p className="graph-selection__path">{node.path}</p>}
          <h4>Connected nodes - {connected.length}</h4>
          <div data-cols="1" data-gap="control">
            {connected.map((item) => (
              <button
                key={item.key}
                type="button"
                className="action-row pad"
                onClick={() => handleSelect?.(item, "network-graph")}
              >
                {item.name ?? item.key}
              </button>
            ))}
          </div>
        </>
      ) : (
        <p>Select a node to view its connections.</p>
      )}
    </section>
  );
};
