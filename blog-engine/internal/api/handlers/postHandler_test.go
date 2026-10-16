package handlers

import (
	"context"
	"encoding/json"
	"errors"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"github.com/SimonKimDev/Devel/blog-engine/internal/application"
	"github.com/SimonKimDev/Devel/blog-engine/internal/domain/blog"
)

// fakePoster implements application.BlogPoster with per-test behavior and
// records whether the service was called.
type fakePoster struct {
	called bool

	createFn     func(*blog.Post) error
	getAllFn     func() ([]blog.Post, error)
	getByIDFn    func(int64) (*blog.Post, error)
	getByCatFn   func(int64) ([]blog.Post, error)
	updateFn     func(*blog.Post) error
	deleteByIDFn func(int64) error
}

func (f *fakePoster) CreatePost(_ context.Context, post *blog.Post) error {
	f.called = true
	return f.createFn(post)
}

func (f *fakePoster) GetAllPost(context.Context) ([]blog.Post, error) {
	f.called = true
	return f.getAllFn()
}

func (f *fakePoster) GetPostByID(_ context.Context, id int64) (*blog.Post, error) {
	f.called = true
	return f.getByIDFn(id)
}

func (f *fakePoster) GetPostByCategoryID(_ context.Context, id int64) ([]blog.Post, error) {
	f.called = true
	return f.getByCatFn(id)
}

func (f *fakePoster) UpdatePost(_ context.Context, post *blog.Post) error {
	f.called = true
	return f.updateFn(post)
}

func (f *fakePoster) DeletePostByID(_ context.Context, id int64) error {
	f.called = true
	return f.deleteByIDFn(id)
}

var errBoom = errors.New("boom: secret SQL detail")

func newRequest(method, target, body, id string) *http.Request {
	req := httptest.NewRequest(method, target, strings.NewReader(body))
	if id != "" {
		req.SetPathValue("id", id)
	}

	return req
}

func assertStatus(t *testing.T, rec *httptest.ResponseRecorder, expected int) {
	t.Helper()

	if rec.Code != expected {
		t.Fatalf("expected status %d, got %d (body %q)", expected, rec.Code, rec.Body.String())
	}
}

func TestCreatePost(t *testing.T) {
	validBody := `{"author_id": 1, "title": "Hello", "slug": "hello", "body_markdown": "# Hi"}`

	tests := []struct {
		name         string
		body         string
		createErr    error
		expected     int
		expectCalled bool
	}{
		{"valid post", validBody, nil, http.StatusCreated, true},
		{"invalid JSON", `{"title":`, nil, http.StatusBadRequest, false},
		{"unknown field", `{"title": "x", "nope": 1}`, nil, http.StatusBadRequest, false},
		{"trailing data", validBody + `{}`, nil, http.StatusBadRequest, false},
		{"too large", `{"title": "` + strings.Repeat("a", maxBodyBytes) + `"}`, nil, http.StatusRequestEntityTooLarge, false},
		{"service error", validBody, errBoom, http.StatusInternalServerError, true},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			poster := &fakePoster{createFn: func(post *blog.Post) error {
				post.PostID = 42
				return tt.createErr
			}}

			rec := httptest.NewRecorder()
			NewPostHandler(poster).CreatePost(rec, newRequest(http.MethodPost, "/api/blogpost", tt.body, ""))

			assertStatus(t, rec, tt.expected)

			if poster.called != tt.expectCalled {
				t.Errorf("expected service called=%v, got %v", tt.expectCalled, poster.called)
			}

			if strings.Contains(rec.Body.String(), "secret SQL detail") {
				t.Errorf("response leaked internal error: %q", rec.Body.String())
			}

			if tt.expected == http.StatusCreated {
				var created blog.Post
				if err := json.NewDecoder(rec.Body).Decode(&created); err != nil {
					t.Fatalf("decode response: %v", err)
				}

				if created.PostID != 42 || created.Title != "Hello" {
					t.Errorf("unexpected created post: %+v", created)
				}
			}
		})
	}
}

func TestGetPosts(t *testing.T) {
	t.Run("returns posts", func(t *testing.T) {
		poster := &fakePoster{getAllFn: func() ([]blog.Post, error) {
			return []blog.Post{{PostID: 1, Title: "One"}, {PostID: 2, Title: "Two"}}, nil
		}}

		rec := httptest.NewRecorder()
		NewPostHandler(poster).GetPosts(rec, newRequest(http.MethodGet, "/api/blogpost", "", ""))

		assertStatus(t, rec, http.StatusOK)

		if ct := rec.Header().Get("Content-Type"); ct != "application/json" {
			t.Errorf("expected JSON content type, got %q", ct)
		}

		var posts []blog.Post
		if err := json.NewDecoder(rec.Body).Decode(&posts); err != nil {
			t.Fatalf("decode response: %v", err)
		}

		if len(posts) != 2 {
			t.Errorf("expected 2 posts, got %d", len(posts))
		}
	})

	t.Run("service error", func(t *testing.T) {
		poster := &fakePoster{getAllFn: func() ([]blog.Post, error) { return nil, errBoom }}

		rec := httptest.NewRecorder()
		NewPostHandler(poster).GetPosts(rec, newRequest(http.MethodGet, "/api/blogpost", "", ""))

		assertStatus(t, rec, http.StatusInternalServerError)
	})
}

func TestGetPostByID(t *testing.T) {
	tests := []struct {
		name         string
		id           string
		getErr       error
		expected     int
		expectCalled bool
	}{
		{"found", "7", nil, http.StatusOK, true},
		{"not a number", "abc", nil, http.StatusBadRequest, false},
		{"zero", "0", nil, http.StatusBadRequest, false},
		{"negative", "-1", nil, http.StatusBadRequest, false},
		{"not found", "7", application.ErrPostNotFound, http.StatusNotFound, true},
		{"service error", "7", errBoom, http.StatusInternalServerError, true},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			var gotID int64

			poster := &fakePoster{getByIDFn: func(id int64) (*blog.Post, error) {
				gotID = id
				if tt.getErr != nil {
					return nil, tt.getErr
				}

				return &blog.Post{PostID: id}, nil
			}}

			rec := httptest.NewRecorder()
			NewPostHandler(poster).GetPostByID(rec, newRequest(http.MethodGet, "/api/blogpost/"+tt.id, "", tt.id))

			assertStatus(t, rec, tt.expected)

			if poster.called != tt.expectCalled {
				t.Errorf("expected service called=%v, got %v", tt.expectCalled, poster.called)
			}

			if tt.expectCalled && gotID != 7 {
				t.Errorf("expected ID 7, got %d", gotID)
			}
		})
	}
}

func TestGetPostByCategoryID(t *testing.T) {
	tests := []struct {
		name         string
		id           string
		getErr       error
		expected     int
		expectCalled bool
	}{
		{"found", "3", nil, http.StatusOK, true},
		{"not a number", "abc", nil, http.StatusBadRequest, false},
		{"service error", "3", errBoom, http.StatusInternalServerError, true},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			poster := &fakePoster{getByCatFn: func(int64) ([]blog.Post, error) {
				if tt.getErr != nil {
					return nil, tt.getErr
				}

				return []blog.Post{}, nil
			}}

			rec := httptest.NewRecorder()
			NewPostHandler(poster).GetPostByCategoryID(rec, newRequest(http.MethodGet, "/api/blogpost/category/"+tt.id, "", tt.id))

			assertStatus(t, rec, tt.expected)

			if poster.called != tt.expectCalled {
				t.Errorf("expected service called=%v, got %v", tt.expectCalled, poster.called)
			}

			if tt.expected == http.StatusOK && strings.TrimSpace(rec.Body.String()) != "[]" {
				t.Errorf("expected empty JSON array, got %q", rec.Body.String())
			}
		})
	}
}

func TestUpdatePost(t *testing.T) {
	validBody := `{"post_id": 5, "title": "Updated", "body_markdown": "new"}`

	tests := []struct {
		name         string
		body         string
		updateErr    error
		expected     int
		expectCalled bool
	}{
		{"valid update", validBody, nil, http.StatusOK, true},
		{"missing post_id", `{"title": "Updated"}`, nil, http.StatusBadRequest, false},
		{"invalid JSON", `not json`, nil, http.StatusBadRequest, false},
		{"not found", validBody, application.ErrPostNotFound, http.StatusNotFound, true},
		{"service error", validBody, errBoom, http.StatusInternalServerError, true},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			poster := &fakePoster{updateFn: func(*blog.Post) error { return tt.updateErr }}

			rec := httptest.NewRecorder()
			NewPostHandler(poster).UpdatePost(rec, newRequest(http.MethodPost, "/api/blogpost/update", tt.body, ""))

			assertStatus(t, rec, tt.expected)

			if poster.called != tt.expectCalled {
				t.Errorf("expected service called=%v, got %v", tt.expectCalled, poster.called)
			}
		})
	}
}

func TestDeletePostByID(t *testing.T) {
	tests := []struct {
		name         string
		id           string
		deleteErr    error
		expected     int
		expectCalled bool
	}{
		{"deleted", "9", nil, http.StatusOK, true},
		{"not a number", "abc", nil, http.StatusBadRequest, false},
		{"not found", "9", application.ErrPostNotFound, http.StatusNotFound, true},
		{"service error", "9", errBoom, http.StatusInternalServerError, true},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			poster := &fakePoster{deleteByIDFn: func(int64) error { return tt.deleteErr }}

			rec := httptest.NewRecorder()
			NewPostHandler(poster).DeletePostByID(rec, newRequest(http.MethodPost, "/api/blogpost/delete/"+tt.id, "", tt.id))

			assertStatus(t, rec, tt.expected)

			if poster.called != tt.expectCalled {
				t.Errorf("expected service called=%v, got %v", tt.expectCalled, poster.called)
			}
		})
	}
}

func TestGetMessage(t *testing.T) {
	rec := httptest.NewRecorder()
	GetMessage(rec, newRequest(http.MethodGet, "/api/message", "", ""))

	assertStatus(t, rec, http.StatusOK)

	var resp MessageResponse
	if err := json.NewDecoder(rec.Body).Decode(&resp); err != nil {
		t.Fatalf("decode response: %v", err)
	}

	if resp.Message != Message {
		t.Errorf("expected message %q, got %q", Message, resp.Message)
	}
}
