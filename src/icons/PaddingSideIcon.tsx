const rotations = { top: 0, right: 90, bottom: 180, left: 270 };

export const PaddingSideIcon = ({ side }: { side: keyof typeof rotations }) => {
  return (
    <svg width="1em" height="1em" viewBox="0 0 16 16" aria-hidden="true" focusable="false">
      <path d="M8 13V3M4 7l4-4 4 4" transform={`rotate(${rotations[side]} 8 8)`} fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
};
