import { newDocument, newElement } from "../js/document.ts";
import { writeFile } from "node:fs/promises";
const text = (title, x, y, width, height, size = 16, color = "default") => ({
  ...newElement("text", x, y, width, height),
  title,
  content: title,
  fontSize: size,
  color,
  fontWeight: size >= 19 ? 600 : 400,
});
const box = (title, x, y, width, height, children = [], surface = "main") => ({
  ...newElement("box", x, y, width, height),
  title,
  surface,
  children,
});
const nav = [
  "◇  Workspace",
  "▦  Overview",
  "▱  Projects",
  "◷  Activity",
  "⚙  Settings",
].map((t, i) =>
  text(
    t,
    24,
    30 + i * 62,
    146,
    28,
    i === 0 ? 17 : 14,
    i === 1 ? "accent" : "default",
  ),
);
const cards = [
  ["Active projects", "12", "↗ +2 from last week"],
  ["Tasks complete", "84", "↗ +12 from last week"],
  ["Team members", "6", "— No change"],
].map((v, i) =>
  box(v[0], 228 + i * 282, 168, 260, 150, [
    text(v[0], 20, 18, 220, 24, 14),
    text(v[1], 20, 55, 200, 50, 36),
    text(v[2], 20, 114, 230, 20, 12, i < 2 ? "success" : "muted"),
  ]),
);
const rows = [
  ["Website redesign", "● In progress", "Today"],
  ["Component library", "● Review", "Yesterday"],
  ["Dashboard", "● Draft", "Oct 27"],
].map((v, i) =>
  box(
    v[0] + " row",
    0,
    48 + i * 66,
    824,
    66,
    [
      text("▤  " + v[0], 20, 22, 340, 24, 14),
      text(
        v[1],
        394,
        22,
        180,
        24,
        13,
        i === 0 ? "secondary" : i === 1 ? "accent" : "muted",
      ),
      text(v[2], 670, 22, 134, 24, 13, "muted"),
    ],
    "transparent",
  ),
);
const table = box("Recent activity table", 228, 414, 824, 246, [
  text("Project", 20, 16, 200, 24, 12, "muted"),
  text("Status", 394, 16, 160, 24, 12, "muted"),
  text("Updated", 670, 16, 130, 24, 12, "muted"),
  ...rows,
]);
const frame = box("Dashboard · 1120 × 720", 0, 0, 1120, 720, [
  box("Sidebar", 0, 0, 188, 720, nav, "inset"),
  text("Overview", 228, 32, 500, 42, 30),
  text("Your workspace at a glance", 228, 80, 500, 26, 16, "muted"),
  box("Date range", 794, 42, 258, 38, [
    text("▦  Oct 20 — Oct 27, 2026", 16, 9, 230, 20, 13),
  ]),
  ...cards,
  text("Recent activity", 228, 366, 400, 28, 19),
  text("View all  ›", 966, 370, 100, 24, 13, "accent"),
  table,
]);
cards[0].appearance = {
  normal: {
    "box-shadow":
      "0px 4px 18px 0px rgb(0 0 0 / 30%), inset 0px 4px 12px 0px rgb(0 0 0 / 30%)",
  },
};
const document = {
  ...newDocument(),
  id: 1793329853409,
  title: "Dashboard / Overview",
  children: [frame],
};
const r = await fetch("http://127.0.0.1:5173/api/designer", {
  method: "PUT",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(document),
});
const result = await r.json();
if (!r.ok) throw Error(JSON.stringify(result));
const reopened = await (
  await fetch(`http://127.0.0.1:5173/api/designer?id=${document.id}`)
).json();
if (JSON.stringify(reopened) !== JSON.stringify(document))
  throw Error("Saved demo did not round-trip.");
await writeFile(
  new URL("./dashboard-overview.json", import.meta.url),
  JSON.stringify(document, null, 2) + "\n",
);
console.log(
  JSON.stringify({
    id: document.id,
    selected: cards[0].id,
    file: result.file,
    roundTrip: true,
  }),
);
