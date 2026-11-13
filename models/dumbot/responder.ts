import { stripNoise } from "./nlp/slot-machine/slotFiller.ts";
import normalizedWords from "./nlp/slot-machine/lexicon/normalized_words.json" with { type: "json" };

export type ResponseValues = Record<string, string | number | boolean | null | undefined>;

/** Fill named blanks once. Missing values keep their placeholder; false, zero
 * and empty strings are supplied values. Inserted text is never reinterpreted. */
export const fillResponse = (template: string, values: ResponseValues): string =>
  template.replace(/\{([a-zA-Z_][a-zA-Z0-9_]*)\}/g, (placeholder, key: string) =>
    Object.hasOwn(values, key) && values[key] !== null && values[key] !== undefined
      ? String(values[key])
      : placeholder);

export const responseTemplates = {
  rephrase: "You want to {message}",
  completed: "I've {action} the {type} named: {name} in the {path} folder.",
};

/** Rephrase the action using a random entry in its normalized-word array.
 * Preserve the original target, literal names, paths and qualifiers.
 * Unrecognized phrasing is returned unchanged rather than inventing an intent. */
export const rephraseMessage = (message: string, slots: readonly { slot: string; word: string; normalized: string | number }[]): string => {
  const action = slots.find(slot => slot.slot === "action");
  const text = message.trim();
  if (!action) return stripNoise(text);
  const escaped = action.word.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = new RegExp("\\b" + escaped + "\\b", "i").exec(text);
  if (!match) return stripNoise(text);
  const prefix = text.slice(0, match.index).trim();
  if (prefix && !/^(?:(?:i want to|i would like to|i'd like to|please|can you|could you|you want to)\s*)+$/i.test(prefix)) return stripNoise(text);
  const lexicon: Record<string, readonly string[]> = normalizedWords;
  const choices = lexicon[String(action.normalized)];
  const replacement = choices?.length ? choices[Math.floor(Math.random() * choices.length)] : match[0];
  const command = replacement + text.slice(match.index + match[0].length);
  return fillResponse(responseTemplates.rephrase, { message: stripNoise(command) });
};
