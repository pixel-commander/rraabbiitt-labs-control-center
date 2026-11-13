import { normalizeWords } from "../nlp/slot-machine/slotFiller.ts";

export interface SearchRecord {
  id: number;
  name?: string;
  title?: string;
  type?: string;
  description?: string;
  [key: string]: unknown;
}
export interface DbPairsProps {
  query: string;
  data: readonly SearchRecord[];
  fields?: readonly string[];
}
const defaultFields = ["name", "title", "description", "type", "tags", "action_type", "instructions"];
const pairs = (words: string[]) => words.slice(1).map((word, index) => `${words[index]}\0${word}`);

/** Score supplied records. Pairs never cross fields or separate array entries. */
export const dbPairs = ({ query, data, fields = defaultFields }: DbPairsProps) => {
  if (typeof query !== "string" || !Array.isArray(data)) throw Error("Supply query and data.");
  const words = new Set(normalizeWords(query));
  const expectedPairs = new Set(pairs(normalizeWords(query)));
  return data.map(record => {
    const counts = new Map<string, number>();
    const pairCounts = new Map<string, number>();
    for (const field of fields) {
      const value = record[field];
      const values = Array.isArray(value) ? value : [value];
      for (const item of values) {
        if (typeof item !== "string") continue;
        const tokens = normalizeWords(item);
        for (const word of tokens) counts.set(word, (counts.get(word) ?? 0) + 1);
        for (const pair of pairs(tokens)) pairCounts.set(pair, (pairCounts.get(pair) ?? 0) + 1);
      }
    }
    const matched_words = [...words].filter(word => counts.has(word)).map(word => ({ word, count: counts.get(word)! }));
    const matched_pairs = [...expectedPairs].filter(pair => pairCounts.has(pair)).map(pair => ({ words: pair.split("\0"), count: pairCounts.get(pair)! }));
    const frequency_score = matched_words.reduce((sum, item) => sum + item.count, 0);
    const pair_score = matched_pairs.reduce((sum, item) => sum + item.count, 0);
    return { ...record, score: frequency_score + 2 * pair_score,
      evidence: { frequency_score, pair_score, matched_words, matched_pairs } };
  }).filter(record => record.score > 0).sort((a, b) => b.score - a.score || a.id - b.id);
};
