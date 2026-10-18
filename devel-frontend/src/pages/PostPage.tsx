import { useMemo } from "react";
import { Link, useParams } from "react-router";
import { Markdown } from "../components/Markdown";
import { PostCard } from "../components/PostCard";
import { PostMeta } from "../components/PostMeta";
import { StatusMessage } from "../components/StatusMessage";
import { TableOfContents } from "../components/TableOfContents";
import { TagList } from "../components/TagList";
import { site } from "../config/site";
import { useAsync } from "../hooks/useAsync";
import { useDocumentTitle } from "../hooks/useDocumentTitle";
import { extractHeadings } from "../lib/extractHeadings";
import { getPostBySlug, getPosts } from "../services/posts";
import type { Post } from "../types/post";
import { NotFoundPage } from "./NotFoundPage";

const noKey = undefined;

export function PostPage() {
  // LEARN: `slug` comes from the URL (/posts/:slug in AppRoutes.tsx).
  const { slug = "" } = useParams();
  const post = useAsync(getPostBySlug, slug);
  const allPosts = useAsync(getPosts, noKey);

  useDocumentTitle(post.status === "success" ? post.data?.title : undefined);

  if (post.status === "loading") return <StatusMessage title="Loading post…" />;
  if (post.status === "error") {
    return <StatusMessage title="Couldn't load this post">Try refreshing the page.</StatusMessage>;
  }
  if (post.data === null) return <NotFoundPage message="There's no post at this address." />;

  const morePosts = allPosts.status === "success" ? allPosts.data.filter((p) => p.slug !== slug).slice(0, 2) : [];

  return <PostView post={post.data} morePosts={morePosts} />;
}

function PostView({ post, morePosts }: { post: Post; morePosts: Post[] }) {
  const headings = useMemo(() => extractHeadings(post.body_markdown), [post.body_markdown]);

  return (
    <>
      <div className="post-layout">
        <article className="reading-width min-w-0">
          <Link to="/" className="back-link mb-8">
            <span aria-hidden="true">←</span> All posts
          </Link>

          <header className="post-header mb-10">
            <TagList tags={post.tags} />
            <h1 className="page-title">{post.title}</h1>
            {post.summary && <p className="text-xl leading-relaxed text-soft">{post.summary}</p>}
            <div className="flex items-center gap-3">
              <span aria-hidden="true" className="avatar">
                {site.author
                  .split(" ")
                  .map((part) => part[0])
                  .join("")}
              </span>
              <div>
                <p className="font-medium text-ink">{site.author}</p>
                <PostMeta post={post} />
              </div>
            </div>
          </header>

          <Markdown>{post.body_markdown}</Markdown>
        </article>

        <aside className="hidden lg:block">
          <div className="sticky top-24">
            <TableOfContents headings={headings} />
          </div>
        </aside>
      </div>

      {morePosts.length > 0 && (
        <section aria-labelledby="more-posts" className="divider mt-20">
          <h2 id="more-posts" className="section-title mb-6">
            More posts
          </h2>
          <div className="grid gap-6 sm:grid-cols-2">
            {morePosts.map((p) => (
              <PostCard key={p.post_id} post={p} />
            ))}
          </div>
        </section>
      )}
    </>
  );
}
