import { useState } from "react";
import { Chat } from "../Chat";
import type { ChatMessage } from "../Chat.types";

const messages: ChatMessage[] = [
  {
    id: 1,
    user: "assistant",
    name: "Rraabbiitt",
    message: "A short response with the lighter response skin.",
    status: "read",
    date: new Date("2026-11-06T10:30:00").getTime(),
  },
  {
    id: 2,
    user: "user",
    name: "You",
    message: "A plain user message on the right.",
    status: "read",
    date: new Date("2026-11-06T10:31:00").getTime(),
  },
  {
    id: 3,
    user: "assistant",
    name: "Rraabbiitt",
    message: (
      <p>
        Formatted text with <strong>bold emphasis</strong>, <em>italic text</em>
        , <s>removed text</s>, and <code>inlineCode()</code>.
      </p>
    ),
    status: "read",
    date: new Date("2026-11-06T10:32:00").getTime(),
  },
  {
    id: 4,
    user: "user",
    name: "You",
    message:
      "Multiple lines stay intact.\n\nThis follows a blank line.\n  This line is indented.",
    status: "read",
    date: new Date("2026-11-06T10:33:00").getTime(),
  },
  {
    id: 5,
    user: "assistant",
    name: "Rraabbiitt",
    message: (
      <>
        <h3>A response with structure</h3>
        <p>Block content is rendered directly.</p>
        <ul>
          <li>A reusable bubble</li>
          <li>React content supplied by the parent</li>
          <li>No text conversion in Chat</li>
        </ul>
      </>
    ),
    status: "read",
    date: new Date("2026-11-06T10:34:00").getTime(),
  },
  {
    id: 6,
    user: "user",
    name: "You",
    message: (
      <p>
        Here is a{" "}
        <a href="https://example.com" target="_blank" rel="noreferrer">
          working example link
        </a>{" "}
        inside a user message.
      </p>
    ),
    status: "read",
    date: new Date("2026-11-06T10:35:00").getTime(),
  },
  {
    id: 7,
    user: "assistant",
    name: "Rraabbiitt",
    message: (
      <>
        <p>A code example:</p>
        <pre>
          <code>
            {
              "export const hello = (name: string) => {\n  return `Hello, ${name}`;\n};"
            }
          </code>
        </pre>
      </>
    ),
    status: "read",
    date: new Date("2026-11-06T10:36:00").getTime(),
  },
  {
    id: 8,
    user: "user",
    name: "You",
    message: (
      <blockquote>
        A quoted message can be supplied as React content.
      </blockquote>
    ),
    status: "read",
    date: new Date("2026-11-06T10:37:00").getTime(),
  },
  {
    id: 9,
    user: "assistant",
    name: "Rraabbiitt",
    message: (
      <>
        <p>Ordered steps:</p>
        <ol>
          <li>Supply the messages array.</li>
          <li>Render each bubble.</li>
          <li>Handle input in the parent.</li>
        </ol>
      </>
    ),
    status: "read",
    date: new Date("2026-11-06T10:38:00").getTime(),
  },
  {
    id: 10,
    user: "user",
    name: "You",
    message:
      "A deliberately long message: " +
      "This content follows the available space without a fixed or maximum bubble width. ".repeat(
        5,
      ),
    status: "read",
    date: new Date("2026-11-06T10:39:00").getTime(),
  },
  {
    id: 11,
    user: "assistant",
    name: "Rraabbiitt",
    message: (
      <>
        <p>
          Mixed content: <strong>ready</strong>
        </p>
        <p>
          A second paragraph and a literal string:{" "}
          {"<div>not interpreted as HTML</div>"}
        </p>
      </>
    ),
    status: "read",
    date: new Date("2026-11-06T10:40:00").getTime(),
  },
  {
    id: 12,
    user: "user",
    name: "You",
    message: "Sent, awaiting a read status.",
    status: "sent",
    date: new Date("2026-11-06T10:41:00").getTime(),
  },
];

export const Demo = () => {
  const [received, setReceived] = useState<string | null>(null);
  return (
    <div className="chat-demo" data-grid="main-footer">
      <div data-area="main" data-rows="1">
        <Chat
          messages={messages}
          handleSubmit={(data) => {
            if (data) setReceived(data.message);
          }}
        />
      </div>
      <p data-area="footer" role="status">
        {received === null
          ? "Input is passed to the parent; this demo does not send messages."
          : `Parent received: ${received}`}
      </p>
    </div>
  );
};
