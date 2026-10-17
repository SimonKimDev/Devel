import { samplePosts } from '../data/samplePosts';
import type { Post } from '../types/post';

// LEARN: this is the seam between the UI and the backend. Pages only call these two
// functions, so they don't know (or care) where posts come from.
// Today they read hardcoded sample data. The "Wire the frontend to the API" exercise
// replaces the bodies with fetch() calls to the Go API, for example:
//
//   const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/posts`);
//   if (!res.ok) throw new Error(`GET /posts failed: ${res.status}`);
//   return (await res.json()) as Post[];
//
// See docs/LEARNING.md, "Wiring to the Go API".

function newestFirst(a: Post, b: Post): number {
  return b.date_published.localeCompare(a.date_published);
}

/** All published posts, newest first. */
export async function getPosts(): Promise<Post[]> {
  return [...samplePosts].sort(newestFirst);
}

/** One post by its URL slug, or null if there isn't one. */
export async function getPostBySlug(slug: string): Promise<Post | null> {
  return samplePosts.find((post) => post.slug === slug) ?? null;
}