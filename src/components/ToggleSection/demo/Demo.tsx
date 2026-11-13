import { ToggleSection } from "../ToggleSection";

export const Demo = () => {
  return (
    <div className="demo container-demos">
      <ToggleSection
        title="Section title"
      >
        <p>Content is shown when the section is open.</p>
      </ToggleSection>
    </div>
  );
};
