const rotations = { "top-left": 0, "top-right": 90, "bottom-right": 180, "bottom-left": 270 };

export const RadiusIcon = ({ corner = "top-left" }: { corner?: keyof typeof rotations }) => {
  return (
    <svg width="1em" height="1em" viewBox="0 0 16 16" aria-hidden="true" focusable="false">
      <path d="M4 13V8a4 4 0 0 1 4-4h5" transform={`rotate(${rotations[corner]} 8 8)`} fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
};
