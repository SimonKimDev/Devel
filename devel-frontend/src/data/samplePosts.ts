import type { Post } from "../types/post";
import helloWorld from "./posts/hello-world.md?raw";

// LEARN: hardcoded posts, shaped exactly like the Go API's JSON. The Markdown bodies live
// in ./posts/*.md and are imported as plain strings with Vite's `?raw`. Once the frontend
// reads from the API (see services/posts.ts), this file goes away.
export const samplePosts: Post[] = [
  {
    post_id: 1,
    author_id: 1,
    title: "Hello World",
    slug: "hello-world",
    summary: "The first post on Studio Indigoblue's blog.",
    body_markdown: helloWorld,
    date_published: "2026-10-17T09:00:00Z",
    date_updated: "2026-10-17T09:00:00Z",
    tags: ["meta"],
  },
];
