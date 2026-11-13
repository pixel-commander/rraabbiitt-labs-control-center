getWordsFromSettings(settings: unknown): string[]

Pass parsed JSON, such as an imported house JSON file or JSON.parse(fileText).
Reads only own top-level name, title, description and path fields, in that order.
Missing, empty and non-string fields contribute no words. Arrays, null and other
non-object roots return []. Nested records are not traversed.

Special characters, punctuation, whitespace and path separators split words.
Unicode letters, numbers and combining marks are retained. Case, duplicates and
word order are preserved. The input is not mutated; no file or network access occurs.

Example: {name: "word-graphs", path: "src/components/WordGraphs"}
returns ["word", "graphs", "src", "components", "WordGraphs"].
Pass the result to WordGraphs via its words prop.
