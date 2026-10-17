import { formatDate } from '../lib/formatDate';
import { readingTime } from '../lib/readingTime';
import type { Post } from '../types/post';

/** "Oct 16, 2026 · 3 min read" */
export function PostMeta({ post }: { post: Post }) {
  return (
    <p className="text-sm text-muted">
      <time dateTime={post.date_published}>{formatDate(post.date_published)}</time>
      <span aria-hidden="true"> · </span>
      {readingTime(post.body_markdown)} min read
    </p>
  );
}