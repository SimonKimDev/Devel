package routes

import (
	"net/http"

	"github.com/SimonKimDev/Devel/blog-engine/internal/api/handlers"
	"github.com/SimonKimDev/Devel/blog-engine/internal/api/middleware"
	"github.com/SimonKimDev/Devel/blog-engine/internal/application"
)

// NewRouter builds the API handler. The blog post routes are registered only
// when postSvc is non-nil, that is, when the database is enabled.
func NewRouter(postSvc application.BlogPoster, allowedOrigins []string) http.Handler {
	mux := http.NewServeMux()

	RegisterHealthRoutes(mux)

	if postSvc != nil {
		RegisterPostRoutes(mux, postSvc)
	}

	return middleware.CORS(allowedOrigins)(mux)
}

func RegisterHealthRoutes(mux *http.ServeMux) {
	mux.HandleFunc("GET /api/health", handlers.GetHealth)
}

// LEARN: this is the URL contract the frontend's services/posts.ts calls. A route here
// plus a handler in internal/api/handlers is all it takes to expose a new endpoint.
func RegisterPostRoutes(mux *http.ServeMux, postSvc application.BlogPoster) {
	handler := handlers.NewPostHandler(postSvc)

	mux.HandleFunc("POST /api/blogpost", handler.CreatePost)
	mux.HandleFunc("GET /api/blogpost", handler.GetPosts)
	mux.HandleFunc("GET /api/blogpost/{id}", handler.GetPostByID)
	mux.HandleFunc("GET /api/blogpost/category/{id}", handler.GetPostByCategoryID)
	mux.HandleFunc("POST /api/blogpost/update", handler.UpdatePost)
	mux.HandleFunc("POST /api/blogpost/delete/{id}", handler.DeletePostByID)
}
