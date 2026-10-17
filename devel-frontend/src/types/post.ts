// LEARN: this mirrors the JSON the Go API sends for blog.Post
// (blog-engine/internal/domain/blog/post.go). Field names match the Go `json:"..."` tags,
// so switching from sample data to the real API doesn't need a mapping layer.
// If you change one side, change the other. See docs/LEARNING.md, "Data shape".
export interface Post {
  post_id: number;
  author_id: number;
  category_id?: number | null;
  title: string;
  slug: string;
  summary?: string | null;
  body_markdown: string;
  /** ISO 8601 timestamp, as Go's encoding/json writes time.Time. */
  date_published: string;
  date_updated: string;
  /** Frontend-only for now: the Go model has no tags yet (see issue #31). */
  tags?: string[];
}