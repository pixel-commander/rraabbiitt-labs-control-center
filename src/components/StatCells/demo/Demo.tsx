import { StatCells } from "../StatCells";

const cells = [
  { title: "Spend", value: "$24.00" },
  { title: "Credit", value: "$5.00" },
  { title: "Net", value: "$19.00", label: "After credits" },
];

const sizes = ["sm", "md", "lg"] as const;

export const Demo = () => {
  return (
    <div style={{ display: "block" }}>
      <h3>Main</h3>
      {sizes.map((size) => (
        <section key={size}>
          <h4>{size}</h4>
          <StatCells pad="none" mode="main" size={size} cells={cells} />
        </section>
      ))}
      <h3>Alt</h3>
      <StatCells className="pad" mode="alt" cells={cells} />
    </div>
  );
};
