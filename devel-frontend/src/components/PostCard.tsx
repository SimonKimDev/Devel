import { Link } from 'react-router';
import type { Post } from '../types/post';
import { PostMeta } from './PostMeta';
import { TagList } from './TagList';

// LEARN: a component is a function from props to markup. PostCard doesn't fetch anything;
// it renders whatever post it's given, which makes it easy to reuse and to test.
export function PostCard({ post, featured = false }: { post: Post; featured?: boolean }) {
  return (
    <article className={featured ? 'card sm:col-span-2 sm:p-8' : 'card'}>
      <TagList tags={post.tags} />
      <h2 className={featured ? 'card-title text-3xl sm:text-4xl' : 'card-title text-2xl'}>
        {/* The stretched link makes the whole card clickable while keeping one real link. */}
        <Link to={`/posts/${post.slug}`} className="stretched-link">
          {post.title}
        </Link>
      </h2>
      {post.summary && <p className={featured ? 'text-lg text-soft' : 'line-clamp-3 text-soft'}>{post.summary}</p>}
      <div className="mt-auto pt-2">
        <PostMeta post={post} />
      </div>
    </article>
  );
}
