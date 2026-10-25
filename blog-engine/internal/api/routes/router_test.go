package routes

import (
	"context"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"github.com/SimonKimDev/Devel/blog-engine/internal/domain/blog"
)

// recordingPoster records which service method a route reached.
type recordingPoster struct {
	lastCall string
	lastID   int64
}

func (p *recordingPoster) CreatePost(context.Context, *blog.Post) error {
	p.lastCall = "CreatePost"
	return nil
}

func (p *recordingPoster) GetAllPost(context.Context) ([]blog.Post, error) {
	p.lastCall = "GetAllPost"
	return []blog.Post{}, nil
}

func (p *recordingPoster) GetPostByID(_ context.Context, id int64) (*blog.Post, error) {
	p.lastCall, p.lastID = "GetPostByID", id
	return &blog.Post{PostID: id}, nil
}

func (p *recordingPoster) GetPostByCategoryID(_ context.Context, id int64) ([]blog.Post, error) {
	p.lastCall, p.lastID = "GetPostByCategoryID", id
	return []blog.Post{}, nil
}

func (p *recordingPoster) UpdatePost(context.Context, *blog.Post) error {
	p.lastCall = "UpdatePost"
	return nil
}

func (p *recordingPoster) DeletePostByID(_ context.Context, id int64) error {
	p.lastCall, p.lastID = "DeletePostByID", id
	return nil
}

func do(handler http.Handler, method, target, body string) *httptest.ResponseRecorder {
	rec := httptest.NewRecorder()
	handler.ServeHTTP(rec, httptest.NewRequest(method, target, strings.NewReader(body)))

	return rec
}

func TestNewRouter_HealthRoute(t *testing.T) {
	rec := do(NewRouter(nil, nil), http.MethodGet, "/api/health", "")

	if rec.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d", rec.Code)
	}

	if rec.Body.String() != "ok" {
		t.Errorf("expected body %q, got %q", "ok", rec.Body.String())
	}
}

func TestNewRouter_HealthRouteRejectsOtherMethods(t *testing.T) {
	rec := do(NewRouter(nil, nil), http.MethodPost, "/api/health", "")

	if rec.Code != http.StatusMethodNotAllowed {
		t.Errorf("expected 405, got %d", rec.Code)
	}
}

func TestNewRouter_MessageRouteRetired(t *testing.T) {
	rec := do(NewRouter(nil, nil), http.MethodGet, "/api/message", "")

	if rec.Code != http.StatusNotFound {
		t.Errorf("expected 404, got %d", rec.Code)
	}
}

func TestNewRouter_PostRoutesOffWithoutService(t *testing.T) {
	rec := do(NewRouter(nil, nil), http.MethodGet, "/api/blogpost", "")

	if rec.Code != http.StatusNotFound {
		t.Errorf("expected 404 when the database is disabled, got %d", rec.Code)
	}
}

func TestNewRouter_PostRoutes(t *testing.T) {
	postBody := `{"post_id": 1, "title": "t"}`

	tests := []struct {
		method     string
		target     string
		body       string
		expectCall string
		expectID   int64
	}{
		{http.MethodPost, "/api/blogpost", postBody, "CreatePost", 0},
		{http.MethodGet, "/api/blogpost", "", "GetAllPost", 0},
		{http.MethodGet, "/api/blogpost/12", "", "GetPostByID", 12},
		{http.MethodGet, "/api/blogpost/category/3", "", "GetPostByCategoryID", 3},
		{http.MethodPost, "/api/blogpost/update", postBody, "UpdatePost", 0},
		{http.MethodPost, "/api/blogpost/delete/8", "", "DeletePostByID", 8},
	}

	for _, tt := range tests {
		t.Run(tt.method+" "+tt.target, func(t *testing.T) {
			poster := &recordingPoster{}
			rec := do(NewRouter(poster, nil), tt.method, tt.target, tt.body)

			if rec.Code >= 400 {
				t.Fatalf("expected success, got %d (body %q)", rec.Code, rec.Body.String())
			}

			if poster.lastCall != tt.expectCall {
				t.Errorf("expected %s, got %q", tt.expectCall, poster.lastCall)
			}

			if poster.lastID != tt.expectID {
				t.Errorf("expected ID %d, got %d", tt.expectID, poster.lastID)
			}
		})
	}
}

func TestNewRouter_AppliesCORS(t *testing.T) {
	origin := "http://localhost:3000"

	req := httptest.NewRequest(http.MethodGet, "/api/health", nil)
	req.Header.Set("Origin", origin)

	rec := httptest.NewRecorder()
	NewRouter(nil, []string{origin}).ServeHTTP(rec, req)

	if got := rec.Header().Get("Access-Control-Allow-Origin"); got != origin {
		t.Errorf("expected Access-Control-Allow-Origin %q, got %q", origin, got)
	}
}
