interface PositionIconProps {
  align?: "start" | "center" | "end";
  vertical?: boolean;
}

export const PositionIcon = ({ align, vertical }: PositionIconProps) => {
  const alignmentPaths = {
    start: "M3 2v12m3-8h7m-7 4h4",
    center: "M8 2v12M3 6h10m-8 4h6",
    end: "M13 2v12M3 6h7m-4 4h4",
  };

  return (
    <svg width="1em" height="1em" viewBox="0 0 16 16" aria-hidden="true" focusable="false">
      <path
        d={align ? alignmentPaths[align] : "M8 2v12M2 8h12M4 4h8v8H4z"}
        transform={vertical ? "rotate(90 8 8)" : undefined}
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
};
