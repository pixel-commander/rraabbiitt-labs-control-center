/** Split text into words, removing punctuation and other special characters. */
export const generateWordArrayFromText = (text: string): string[] => {
  return text.match(/[\p{L}\p{N}\p{M}]+/gu) ?? [];
};
