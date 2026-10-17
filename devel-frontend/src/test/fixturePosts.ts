import type { Post } from '../types/post';

// Fake posts for tests, so tests don't depend on what's actually published.
// Tests swap them in with vi.mock('../data/samplePosts', ...).
const post = (id: number, slug: string, title: string, date: string, body: string): Post => ({
  post_id: id,
  author_id: 1,
  title,
  slug,
  summary: `Summary of ${title}.`,
  body_markdown: body,
  date_published: date,
  date_updated: date,
  tags: ['test'],
});

export const fixturePosts: Post[] = [
  post(1, 'first-post', 'First post', '2026-01-01T09:00:00Z', 'Just a paragraph.'),
  post(
    2,
    'routing-post',
    'A post with headings',
    '2026-02-01T09:00:00Z',
    ['Intro text.', '## Layers', 'Some text.', '```go', 'mux := http.NewServeMux()', '```', '## Wrapping up', 'Done.'].join('\n\n'),
  ),
  post(3, 'newest-post', 'Newest post', '2026-03-01T09:00:00Z', 'The latest one.'),
];