package middleware

import (
	"net/http"
)

// CORS allows browser requests from allowedOrigins. With no origins it
// returns next unchanged, which is the production setup: Container Apps
// ingress applies CORS there, and adding the headers twice would break it.
func CORS(allowedOrigins []string) func(http.Handler) http.Handler {
	if len(allowedOrigins) == 0 {
		return func(next http.Handler) http.Handler { return next }
	}

	allowed := make(map[string]struct{}, len(allowedOrigins))
	for _, origin := range allowedOrigins {
		allowed[origin] = struct{}{}
	}

	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			header := w.Header()
			header.Add("Vary", "Origin")

			origin := r.Header.Get("Origin")
			_, isAllowed := allowed[origin]

			if isAllowed {
				header.Set("Access-Control-Allow-Origin", origin)
			}

			isPreflight := r.Method == http.MethodOptions && r.Header.Get("Access-Control-Request-Method") != ""
			if !isPreflight {
				next.ServeHTTP(w, r)
				return
			}

			if !isAllowed {
				w.WriteHeader(http.StatusForbidden)
				return
			}

			header.Set("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
			header.Set("Access-Control-Allow-Headers", "Content-Type, Authorization")
			header.Set("Access-Control-Max-Age", "600")
			w.WriteHeader(http.StatusNoContent)
		})
	}
}
