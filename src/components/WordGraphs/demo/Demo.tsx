import { WordGraphs } from "../WordGraphs";
import { generateWordArrayFromText } from "../js/generate-word-array-from-text/generate-word-array-from-text";
const text = "Components compose structure. Atoms compose skin. Shared tokens connect components and atoms. Components preserve supplied values. Shared tokens keep the design consistent.";

export const Demo = () => {
  return (
    <div className="demo container-demos scroll-y">
      <WordGraphs words={generateWordArrayFromText(text)} />
    </div>
  );
};
