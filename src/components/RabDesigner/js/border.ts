export function parseBorder(value: string) {
  const match = value.match(
    /^([\d.]+)(?:px)?\s+(none|solid|dashed|dotted|double)\s+(.+)$/,
  );
  return match
    ? { width: Number(match[1]), style: match[2], color: match[3] }
    : { width: 1, style: "solid", color: "var(--border-default)" };
}
