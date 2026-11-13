/** Extract words from the four supported top-level fields of parsed JSON. */
export const getWordsFromSettings = (settings: unknown): string[] => {
  if (settings === null || typeof settings !== "object" || Array.isArray(settings)) {
    return [];
  }

  const record = settings as Record<string, unknown>;
  const words: string[] = [];
  for (const key of ["name", "title", "description", "path"] as const) {
    if (!Object.hasOwn(record, key)) continue;
    const value = record[key];
    if (typeof value !== "string") continue;
    words.push(...generateWordArrayFromText(value));
  }
  return words;
};
import { generateWordArrayFromText } from "../generate-word-array-from-text/generate-word-array-from-text";

