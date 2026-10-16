package blog

import (
	"time"
)

type Post struct {
	PostID        int64     `json:"post_id"`
	AuthorID      int64     `json:"author_id"`
	CategoryID    *int64    `json:"category_id,omitempty"`
	Title         string    `json:"title"`
	Slug          string    `json:"slug"`
	Summary       *string   `json:"summary,omitempty"`
	BodyMarkdown  string    `json:"body_markdown"`
	DatePublished time.Time `json:"date_published"`
	DateUpdated   time.Time `json:"date_updated"`
}
