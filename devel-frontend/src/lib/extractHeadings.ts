import GithubSlugger from "github-slugger";

export interface Heading {
  depth: 2 | 3;
  text: string;
  /** Matches the id rehype-slug gives the rendered heading, so TOC links land on it. */
  id: string;
}

/** Strips inline Markdown so the text matches what the reader sees. */
function plainText(markdown: string): string {
  return markdown
    .replace(/!?\[([^\]]*)\]\([^)]*\)/g, "$1") // [text](url) and ![alt](src)
    .replace(/[`*_~]/g, "")
    .trim();
}

/**
 * The ## and ### headings of a post, for the table of contents.
 *
 * Every heading is slugged in order, as rehype-slug does, so duplicate titles get the
 * same `-1`, `-2` suffixes, but only levels 2 and 3 are returned.
 */
export function extractHeadings(markdown: string): Heading[] {
  const slugger = new GithubSlugger();
  const headings: Heading[] = [];
  let inFence = false;

  for (const line of markdown.split("\n")) {
    if (/^\s*(```|~~~)/.test(line)) {
      inFence = !inFence;
      continue;
    }
    if (inFence) continue;

    const match = /^(#{1,6})\s+(.+?)\s*#*\s*$/.exec(line);
    if (!match) continue;

    const depth = match[1].length;
    const text = plainText(match[2]);
    const id = slugger.slug(text);
    if (depth === 2 || depth === 3) {
      headings.push({ depth, text, id });
    }
  }

  return headings;
}
