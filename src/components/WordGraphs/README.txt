WordGraphs

Props extend HouseKeys: words?: string[] and className?: string.
Counts exact strings, preserving case, whitespace and empty words.
Displays highest counts first; ties retain first-seen order.
Each distinct word has a horizontal bar and visible count. Bars scale to the largest
count. Missing or empty words displays No words to count. Parent owns the input;
there are no callbacks or internal state. House metadata is not spread onto the DOM.

Styling: className composes with word-graphs. Parent/external CSS may override
.word-graphs and its __list, __row, __word, __track and __bar parts.
Theme tokens: --word-graphs-color defaults to --accent-secondary;
--word-graphs-track defaults to --surface-inset; --word-graphs-bar-height defaults
to --space-sm. Rows use the registered data-cols=3 grid. No fixed component size.

Demo uses generateWordArrayFromText on rab-hybrid-seat-ranking/README.txt.
The helper splits special characters and preserves case and duplicates.
WordGraphs itself performs no tokenization or case folding.
