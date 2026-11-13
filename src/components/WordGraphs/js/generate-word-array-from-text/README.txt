generateWordArrayFromText(text: string): string[]

Splits text on special characters, punctuation and whitespace. Retains Unicode
letters, numbers and combining marks. Preserves case, duplicates and word order.
Empty or punctuation-only input returns []. No file or network access occurs.

Example: "hello-world! hello" returns ["hello", "world", "hello"].
getWordsFromSettings uses this function for each supported top-level string field.
