import { PostCard } from '../components/PostCard';
import { StatusMessage } from '../components/StatusMessage';
import { site } from '../config/site';
import { useAsync } from '../hooks/useAsync';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { getPosts } from '../services/posts';

const noKey = undefined;

export function HomePage() {
  useDocumentTitle();
  // LEARN: the page asks the service for data and renders one of three states.
  // It works the same whether getPosts reads sample data or calls the Go API.
  const posts = useAsync(getPosts, noKey);

  return (
    <>
      <section className="mb-12 max-w-2xl sm:mb-16">
        <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-accent-600 dark:text-accent-400">
          Development diary
        </p>
        <h1 className="font-serif text-4xl font-semibold leading-tight tracking-tight text-zinc-900 sm:text-5xl dark:text-zinc-50">
          {site.tagline}
        </h1>
        <p className="mt-4 text-lg text-zinc-600 dark:text-zinc-400">{site.description}</p>
      </section>

      {posts.status === 'loading' && <StatusMessage title="Loading posts…" />}
      {posts.status === 'error' && (
        <StatusMessage title="Couldn't load posts">Try refreshing the page.</StatusMessage>
      )}
      {posts.status === 'success' &&
        (posts.data.length === 0 ? (
          <StatusMessage title="No posts yet">Check back soon.</StatusMessage>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2">
            {posts.data.map((post, index) => (
              <PostCard key={post.post_id} post={post} featured={index === 0} />
            ))}
          </div>
        ))}
    </>
  );
}