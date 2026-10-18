const WORDS_PER_MINUTE = 200;

/** Estimated minutes to read some Markdown, rounded up, at least 1. */
export function readingTime(markdown: string): number {
  const words = markdown
    .replace(/```[\s\S]*?```/g, " ") // code blocks are skimmed, not read word by word
    .split(/\s+/)
    .filter(Boolean).length;

  return Math.max(1, Math.ceil(words / WORDS_PER_MINUTE));
}
