export function splitShadows(value: string) {
  if (!value.trim() || value.trim() === "none") return [];
  const result: string[] = [];
  let depth = 0,
    start = 0;
  for (let i = 0; i < value.length; i++) {
    if (value[i] === "(") depth++;
    if (value[i] === ")") depth--;
    if (value[i] === "," && depth === 0) {
      result.push(value.slice(start, i).trim());
      start = i + 1;
    }
  }
  result.push(value.slice(start).trim());
  return result;
}
export function parseShadow(value: string) {
  const inset = /\binset\b/.test(value);
  const color =
    value.match(
      /(#[\da-f]{3,8}|(?:rgba?|hsla?|var|color|oklch)\([^)]*\)|[a-z]+)\s*$/i,
    )?.[1] ?? "#0000004d";
  const lengths = value
    .replace(/\binset\b/, "")
    .replace(color, "")
    .trim()
    .split(/\s+/)
    .map(Number.parseFloat);
  return {
    inset,
    x: lengths[0] || 0,
    y: lengths[1] || 0,
    blur: lengths[2] || 0,
    spread: lengths[3] || 0,
    color,
  };
}
export function shadowValue(value: ReturnType<typeof parseShadow>) {
  return `${value.inset ? "inset " : ""}${value.x}px ${value.y}px ${value.blur}px ${value.spread}px ${value.color}`;
}
