import { useState } from "react";
import { MessageBox } from "../MessageBox";
export const Demo = () => {
  const [submitted, setSubmitted] = useState("No message submitted");
  return (
    <div data-cols="1" data-gap="content">
      <MessageBox handleSubmit={(text) => setSubmitted(text ?? "")}>
        <span>Local message preview</span>
      </MessageBox>
      <output aria-live="polite">{submitted}</output>
    </div>
  );
};
export default Demo;
