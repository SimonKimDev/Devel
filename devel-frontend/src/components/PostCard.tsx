import { Link } from 'react-router';
import type { Post } from '../types/post';
import { PostMeta } from './PostMeta';
import { TagList } from './TagList';

// LEARN: a component is a function from props to markup. PostCard doesn't fetch anything;
// it renders whatever post it's given, which makes it easy to reuse and to test.
export function PostCard({ post, featured = false }: { post: Post; featured?: boolean }) {
  return (
    <article
      className={`group relative flex flex-col gap-3 rounded-2xl border border-zinc-200 p-6 transition hover:-translate-y-0.5 hover:border-zinc-300 hover:shadow-lg hover:shadow-zinc-900/5 dark:border-zinc-800 dark:hover:border-zinc-700 dark:hover:shadow-black/30 ${
        featured ? 'sm:col-span-2 sm:p-8' : ''
      }`}
    >
      <TagList tags={post.tags} />
      <h2
        className={`font-serif font-semibold tracking-tight text-zinc-900 group-hover:text-accent-700 dark:text-zinc-50 dark:group-hover:text-accent-300 ${
          featured ? 'text-3xl sm:text-4xl' : 'text-2xl'
        }`}
      >
        {/* The ::after overlay makes the whole card clickable while keeping one real link. */}
        <Link to={`/posts/${post.slug}`} className="after:absolute after:inset-0">
          {post.title}
        </Link>
      </h2>
      {post.summary && (
        <p className={`text-zinc-600 dark:text-zinc-400 ${featured ? 'text-lg' : 'line-clamp-3'}`}>{post.summary}</p>
      )}
      <div className="mt-auto pt-2">
        <PostMeta post={post} />
      </div>
    </article>
  );
}