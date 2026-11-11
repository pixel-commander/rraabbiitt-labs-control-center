import { useState } from "react";
import { CodeEditAndView } from "../CodeEditAndView";

const initialCode = `interface Person {
  name: string;
  active: boolean;
}

export const greet = (person: Person): string => {
  // Change this text, then check or save.
  return person.active ? \`Hello, \${person.name}\` : "Goodbye";
};
`;

export const Demo = () => {
  const [saved, setSaved] = useState<string | null>(null);
  const [failSave, setFailSave] = useState(false);
  return (
    <div>
      <h3>TypeScript</h3>
      <p>
        Edit the TypeScript, switch to View, or use the minimap. Saving in this
        demo updates memory only.
      </p>
      <label>
        <input
          type="checkbox"
          checked={failSave}
          onChange={(event) => setFailSave(event.currentTarget.checked)}
        />{" "}
        Simulate save failure
      </label>
      <div style={{ height: "24rem" }}>
        <CodeEditAndView
          file="greeting.ts"
          code={initialCode}
          showLineNumbers
          showMinimap
          handleSave={(data) => {
            if (failSave)
              throw new Error("Demo save failed. The draft has been kept.");
            if (data) setSaved(data.code);
          }}
        />
      </div>
      {saved !== null && (
        <p role="status">Demo save received: {saved.length} characters.</p>
      )}
      <h3>Plain text</h3>
      <p>
        Original spaces, tabs and blank lines. Long lines scroll horizontally.
      </p>
      <div style={{ height: "24rem" }}>
        <CodeEditAndView
          file="notes.txt"
          language="text"
          initialMode="view"
          showLineNumbers={false}
          code={
            "Project notes\n\n  This line starts with two spaces.\n\tThis line starts with a tab.\n\nCharacters stay literal: <div> & **asterisks**\n\nLast line has no trailing newline."
          }
        />
      </div>
      <h3>Markdown source</h3>
      <p>
        Markdown is shown as source, with no rendered headings, links or HTML.
      </p>
      <div style={{ height: "24rem" }}>
        <CodeEditAndView
          file="README.md"
          language="md"
          initialMode="view"
          code={
            "# Project notes\n\n## Tasks\n\n- [x] Preserve the original text\n- [ ] Add another example\n\n**Bold markup stays visible.**\n\n[Example link](https://example.com)\n\n```tsx\nexport const Demo = () => <div>Hello</div>;\n```\n\n<div>This is literal HTML, not rendered HTML.</div>\n"
          }
        />
      </div>
    </div>
  );
};
