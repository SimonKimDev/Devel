import { extractHeadings } from './extractHeadings';

test('returns level 2 and 3 headings with GitHub-style ids', () => {
  const markdown = ['# Title', '## Why it matters', 'text', '### The `net/http` router', '#### Too deep'].join('\n');

  expect(extractHeadings(markdown)).toEqual([
    { depth: 2, text: 'Why it matters', id: 'why-it-matters' },
    { depth: 3, text: 'The net/http router', id: 'the-nethttp-router' },
  ]);
});

test('ignores lines inside code fences', () => {
  const markdown = ['## Real', '```bash', '## not a heading', '```', '## Also real'].join('\n');

  expect(extractHeadings(markdown).map((h) => h.text)).toEqual(['Real', 'Also real']);
});

test('gives repeated headings unique ids, like rehype-slug', () => {
  const markdown = ['## Setup', '## Setup'].join('\n');

  expect(extractHeadings(markdown).map((h) => h.id)).toEqual(['setup', 'setup-1']);
});

test('strips links and emphasis from the text', () => {
  expect(extractHeadings('## Read **the** [docs](https://example.com)')[0].text).toBe('Read the docs');
});