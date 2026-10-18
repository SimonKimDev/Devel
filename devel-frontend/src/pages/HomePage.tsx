import { PostCard } from "../components/PostCard";
import { StatusMessage } from "../components/StatusMessage";
import { useAsync } from "../hooks/useAsync";
import { useDocumentTitle } from "../hooks/useDocumentTitle";
import { getPosts } from "../services/posts";

const noKey = undefined;

export function HomePage() {
  useDocumentTitle();
  // LEARN: the page asks the service for data and renders one of three states.
  // It works the same whether getPosts reads sample data or calls the Go API.
  const posts = useAsync(getPosts, noKey);

  return (
    <>
      {/* A featured-projects showcase will go above the diary (issue #72). */}
      <h1 className="eyebrow mb-8">Development diary</h1>

      {posts.status === "loading" && <StatusMessage title="Loading posts…" />}
      {posts.status === "error" && <StatusMessage title="Couldn't load posts">Try refreshing the page.</StatusMessage>}
      {posts.status === "success" &&
        (posts.data.length === 0 ? (
          <StatusMessage title="No posts yet">Check back soon.</StatusMessage>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2">
            {posts.data.map((post) => (
              <PostCard key={post.post_id} post={post} />
            ))}
          </div>
        ))}
    </>
  );
}
