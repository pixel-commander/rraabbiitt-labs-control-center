import type { WordGraphsProps } from "./WordGraphs.types";
import "./css/word-graphs.css";

export const WordGraphs = ({ words = [], className = "" }: WordGraphsProps) => {
  const counts = new Map<string, number>();
  for (const word of words) counts.set(word, (counts.get(word) ?? 0) + 1);
  const entries = [...counts.entries()].sort((a, b) => b[1] - a[1]);
  const maximum = entries[0]?.[1] ?? 1;
  const rootClass = `word-graphs ${className}`;
  return (
    <div className={rootClass}>
      {entries.length === 0 ? (
        <p>No words to count.</p>
      ) : (
        <ul className="word-graphs__list" aria-label="Word counts">
          {entries.map(([word, count]) => (
            <li key={word} data-cols="3" className="word-graphs__row">
              <span className="word-graphs__word">{word === "" ? "(empty word)" : word}</span>
              <span className="word-graphs__track" aria-hidden="true">
                <span className="word-graphs__bar" style={{ width: `${(count / maximum) * 100}%` }} />
              </span>
              <span>{count}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};
