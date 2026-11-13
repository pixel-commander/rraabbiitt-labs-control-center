import noiseWords from "./lexicon/noise_words.json" with { type: "json" };
import lemmas from "./lexicon/lemmas.json" with { type: "json" };
import normalizedWords from "./lexicon/normalized_words.json" with { type: "json" };

export type SlotChoices = Record<string, readonly (string | number)[]>;

export interface SlotFillerProps {
  project_slots: SlotChoices;
  target_slots?: SlotChoices;
  chaining_slots?: SlotChoices;
  props?: unknown;
}

export interface SlotFillerResult {
  message: { word: string; slot: string }[];
  classifier: Record<string, unknown>;
  slots: { slot: string; word: string; stem: string; normalized: string | number }[];
  stats: { start: number; end: number; dur: number };
  response: Record<string, never>;
  status: Record<string, never>;
}

const tokens = (text: string): string[] =>
  text.normalize("NFKC").replace(/([a-z0-9])([A-Z])/g, "$1 $2").toLowerCase().match(/[\p{L}\p{N}]+/gu) ?? [];

// Longest phrase first; each pass runs once, with no recursive replacements.
const replacements = (lexicon: Record<string, string[]>) =>
  Object.entries(lexicon).flatMap(([word, forms]) =>
    forms.map((form) => ({ from: tokens(form), to: tokens(word) })))
    .filter(({ from }) => from.length > 0)
    .sort((a, b) => b.from.length - a.from.length);

const lemmaRules = replacements(lemmas);
const normalizationRules = replacements(normalizedWords);

const replace = (words: string[], rules: ReturnType<typeof replacements>): string[] => {
  const output: string[] = [];
  for (let index = 0; index < words.length;) {
    const rule = rules.find(({ from }) => from.every((word, offset) => words[index + offset] === word));
    if (rule) {
      output.push(...rule.to);
      index += rule.from.length;
    } else {
      output.push(words[index++]);
    }
  }
  return output;
};

export const normalizeWords = (text: string) => replace(replace(tokens(text), lemmaRules), normalizationRules);
const normalize = normalizeWords;

interface SourceWord { text: string; stem: string; start: number; end: number }

const messageWords = (message: string, stems: Record<string, string>): SourceWord[] => {
  let words: SourceWord[] = [];
  for (const match of message.matchAll(/[\p{L}\p{N}]+/gu)) {
    let start = match.index;
    for (const part of match[0].split(/(?<=[a-z0-9])(?=[A-Z])/g)) {
      const original = part.normalize("NFKC").toLowerCase();
      const stem = stems[original] ?? original;
      words.push({ text: stem, stem, start, end: start + part.length });
      start += part.length;
    }
  }
  for (const rules of [lemmaRules, normalizationRules]) {
    const output: SourceWord[] = [];
    for (let index = 0; index < words.length;) {
      const rule = rules.find(({ from }) => from.every((word, offset) => words[index + offset]?.text === word));
      if (rule) {
        const start = words[index].start;
        const end = words[index + rule.from.length - 1].end;
        const stem = words.slice(index, index + rule.from.length).map((word) => word.stem).join(" ");
        output.push(...rule.to.map((text) => ({ text, stem, start, end })));
        index += rule.from.length;
      } else output.push(words[index++]);
    }
    words = output;
  }
  return words;
};


/** Known filler words only. Quoted values, labelled values and paths are literal. */
const noiseRanges = (message: string) => {
  const literals = [...message.matchAll(/"[^"\n]*"|'[^'\n]*'|\b(?:named|called|name it)\s+(?:"[^"\n]*"|'[^'\n]*'|\S+)|\b[\w]+\s*[:=]\s*(?:"[^"\n]*"|'[^'\n]*'|\S+)|\S*[\\/]\S*/gi)]
    .map(match => ({ start: match.index, end: match.index + match[0].length }));
  return [...message.matchAll(/[\p{L}\p{N}]+/gu)]
    .filter(match => noiseWords.includes(match[0].toLowerCase()) &&
      !literals.some(span => span.start <= match.index && span.end >= match.index + match[0].length))
    .map(match => ({ start: match.index, end: match.index + match[0].length }));
};

export const stripNoise = (message: string): string => {
  let text = message;
  for (const span of noiseRanges(message).reverse()) text = text.slice(0, span.start) + text.slice(span.end);
  return text.replace(/\s+/g, " ").trim();
};

/** Match supplied choices and their slot names. No training, saving or execution. */
export const slotFiller = (message: string, bag: SlotFillerProps, stems: Record<string, string> = {}): SlotFillerResult => {
  const start = Date.now();
  if (typeof message !== "string") throw new TypeError("message must be text.");
  const sourceWords = messageWords(message, stems);
  const words = sourceWords.map(({ text }) => text);
  const matches: { slot: string; word: string | number; index: number; length: number }[] = [];
  const groups = [bag.project_slots, bag.target_slots ?? {}, bag.chaining_slots ?? {}];
  for (const group of groups) {
    if (!group || typeof group !== "object" || Array.isArray(group)) throw new TypeError("Slot groups must be objects of arrays.");
  }
  // Build locally from incoming keys; do not add anything to the caller's lexicon.
  const type = [...new Set(groups.flatMap((group) => Object.keys(group)))];
  for (const group of [...groups, { type }]) {
    for (const [slot, choices] of Object.entries(group)) {
      if (!Array.isArray(choices)) throw new TypeError(`${slot} must be an array.`);
      for (const word of choices) {
        if (typeof word !== "string" && (typeof word !== "number" || !Number.isSafeInteger(word)))
          throw new TypeError(`${slot} choices must be text or safe integer IDs.`);
        const phrase = normalize(String(word));
        if (!phrase.length) continue;
        for (let index = 0; index <= words.length - phrase.length; index++) {
          if (phrase.every((part, offset) => words[index + offset] === part))
            matches.push({ slot, word, index, length: phrase.length });
        }
      }
    }
  }
  // Prefer a full name over its shorter contained name within the same slot.
  const slots: SlotFillerResult["slots"] = [];
  for (const match of matches.sort((a, b) => a.index - b.index || b.length - a.length)) {
    const contained = matches.some((other) => other.slot === match.slot && other.length > match.length &&
      other.index <= match.index && other.index + other.length >= match.index + match.length);
    const word = message.slice(sourceWords[match.index].start, sourceWords[match.index + match.length - 1].end);
    if (!contained && !slots.some((entry) => entry.slot === match.slot && entry.word === word && entry.normalized === match.word))
      slots.push({ slot: match.slot, word, stem: sourceWords.slice(match.index, match.index + match.length).map((part) => part.stem).join(" "), normalized: match.word });
  }
  const end = Date.now();
  // Keep every original word in order, including repetitions. Longest matching
  // phrase wins; each word in that phrase carries the same slot.
  const orderedMatches = [...matches].sort((a, b) => b.length - a.length);
  const noise = noiseRanges(message);
  const annotatedMessage = [...message.matchAll(/[\p{L}\p{N}]+/gu)].map(token => {
    const match = orderedMatches.find(candidate =>
      sourceWords[candidate.index].start < token.index + token[0].length &&
      sourceWords[candidate.index + candidate.length - 1].end > token.index);
    return { word: token[0], slot: match?.slot ?? (noise.some(span => span.start === token.index) ? "noise" : "unknown") };
  });
  return { message: annotatedMessage, classifier: {}, slots, stats: { start, end, dur: end - start }, response: {}, status: {} };
};
