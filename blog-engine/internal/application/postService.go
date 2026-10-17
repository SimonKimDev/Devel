package application

import (
	"context"
	"database/sql"
	"errors"

	"github.com/SimonKimDev/Devel/blog-engine/internal/domain/blog"
)

// ErrPostNotFound is returned when no post matches the given ID.
var ErrPostNotFound = errors.New("post not found")

// LEARN: handlers depend on this interface, not on Postgres, so any type with these
// methods can serve posts: the database service below, an in-memory store, or a test fake.
type BlogPoster interface {
	CreatePost(ctx context.Context, post *blog.Post) error
	GetAllPost(ctx context.Context) ([]blog.Post, error)
	GetPostByID(ctx context.Context, postID int64) (*blog.Post, error)
	GetPostByCategoryID(ctx context.Context, categoryID int64) ([]blog.Post, error)
	UpdatePost(ctx context.Context, post *blog.Post) error
	DeletePostByID(ctx context.Context, postID int64) error
}

type postService struct {
	db *sql.DB
}

func NewPostService(db *sql.DB) BlogPoster {
	return &postService{db: db}
}

// postColumns matches the field order in scanPost.
const postColumns = `post_id, author_id, category_id, title, slug, summary, body_markdown, date_published, date_updated`

// CreatePost inserts the post and fills in its generated ID and timestamps.
func (s *postService) CreatePost(ctx context.Context, post *blog.Post) error {
	const query = `
        INSERT INTO blog.post (author_id, category_id, title, slug, summary, body_markdown, date_published, date_updated)
        VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
        RETURNING post_id, date_published, date_updated`

	// Postgres doesn't support LastInsertId, so read the ID back with RETURNING.
	return s.db.QueryRowContext(ctx, query,
		post.AuthorID,
		nullable(post.CategoryID),
		post.Title,
		post.Slug,
		nullable(post.Summary),
		post.BodyMarkdown,
	).Scan(&post.PostID, &post.DatePublished, &post.DateUpdated)
}

// TODO: paginate.
func (s *postService) GetAllPost(ctx context.Context) ([]blog.Post, error) {
	const query = `SELECT ` + postColumns + ` FROM blog.post ORDER BY date_published DESC, post_id DESC`

	return s.queryPosts(ctx, query)
}

func (s *postService) GetPostByID(ctx context.Context, postID int64) (*blog.Post, error) {
	const query = `SELECT ` + postColumns + ` FROM blog.post WHERE post_id = $1`

	post, err := scanPost(s.db.QueryRowContext(ctx, query, postID))
	if errors.Is(err, sql.ErrNoRows) {
		return nil, ErrPostNotFound
	}

	if err != nil {
		return nil, err
	}

	return &post, nil
}

// TODO: paginate.
func (s *postService) GetPostByCategoryID(ctx context.Context, categoryID int64) ([]blog.Post, error) {
	const query = `SELECT ` + postColumns + ` FROM blog.post WHERE category_id = $1 ORDER BY date_published DESC, post_id DESC`

	return s.queryPosts(ctx, query, categoryID)
}

func (s *postService) UpdatePost(ctx context.Context, post *blog.Post) error {
	const query = `
        UPDATE blog.post
        SET
            category_id = $1,
            title = $2,
            summary = $3,
            body_markdown = $4,
            date_updated = NOW()
        WHERE post_id = $5`

	result, err := s.db.ExecContext(ctx, query,
		nullable(post.CategoryID),
		post.Title,
		nullable(post.Summary),
		post.BodyMarkdown,
		post.PostID)
	if err != nil {
		return err
	}

	return requireAffected(result)
}

func (s *postService) DeletePostByID(ctx context.Context, postID int64) error {
	const query = `DELETE FROM blog.post WHERE post_id = $1`

	result, err := s.db.ExecContext(ctx, query, postID)
	if err != nil {
		return err
	}

	return requireAffected(result)
}

func (s *postService) queryPosts(ctx context.Context, query string, args ...any) ([]blog.Post, error) {
	rows, err := s.db.QueryContext(ctx, query, args...)
	if err != nil {
		return nil, err
	}

	defer rows.Close()

	// Non-nil so an empty result encodes as [] rather than null.
	posts := make([]blog.Post, 0)

	for rows.Next() {
		post, err := scanPost(rows)
		if err != nil {
			return nil, err
		}

		posts = append(posts, post)
	}

	err = rows.Err()
	if err != nil {
		return nil, err
	}

	return posts, nil
}

type rowScanner interface {
	Scan(dest ...any) error
}

func scanPost(row rowScanner) (blog.Post, error) {
	var post blog.Post

	err := row.Scan(&post.PostID, &post.AuthorID, &post.CategoryID, &post.Title, &post.Slug,
		&post.Summary, &post.BodyMarkdown, &post.DatePublished, &post.DateUpdated)

	return post, err
}

func requireAffected(result sql.Result) error {
	affected, err := result.RowsAffected()
	if err != nil {
		return err
	}

	if affected == 0 {
		return ErrPostNotFound
	}

	return nil
}

// nullable maps a nil pointer to SQL NULL.
func nullable[T any](value *T) sql.Null[T] {
	if value == nil {
		return sql.Null[T]{}
	}

	return sql.Null[T]{V: *value, Valid: true}
}
