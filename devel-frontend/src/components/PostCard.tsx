import { Link } from 'react-router';
import type { Post } from '../types/post';
import { PostMeta } from './PostMeta';
import { TagList } from './TagList';

// LEARN: a component is a function from props to markup. PostCard doesn't fetch anything;
// it renders whatever post it's given, which makes it easy to reuse and to test.
export function PostCard({ post, featured = false }: { post: Post; featured?: boolean }) {
  return (
    <article
      className={`group relative flex flex-col gap-3 rounded-2xl border border-line p-6 transition hover:-translate-y-0.5 hover:border-line-strong hover:shadow-lg hover:shadow-lift ${
        featured ? 'sm:col-span-2 sm:p-8' : ''
      }`}
    >
      <TagList tags={post.tags} />
      <h2
        className={`font-serif font-semibold tracking-tight text-ink group-hover:text-accent-strong ${
          featured ? 'text-3xl sm:text-4xl' : 'text-2xl'
        }`}
      >
        {/* The ::after overlay makes the whole card clickable while keeping one real link. */}
        <Link to={`/posts/${post.slug}`} className="after:absolute after:inset-0">
          {post.title}
        </Link>
      </h2>
      {post.summary && (
        <p className={`text-soft ${featured ? 'text-lg' : 'line-clamp-3'}`}>{post.summary}</p>
      )}
      <div className="mt-auto pt-2">
        <PostMeta post={post} />
      </div>
    </article>
  );
}