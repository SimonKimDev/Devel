package middleware

import (
	"net/http"
	"net/http/httptest"
	"testing"
)

const allowedOrigin = "http://localhost:3000"

func serve(t *testing.T, origins []string, method, origin, requestMethod string) (*httptest.ResponseRecorder, bool) {
	t.Helper()

	nextCalled := false
	next := http.HandlerFunc(func(w http.ResponseWriter, _ *http.Request) {
		nextCalled = true
		w.WriteHeader(http.StatusOK)
	})

	req := httptest.NewRequest(method, "/api/health", nil)
	if origin != "" {
		req.Header.Set("Origin", origin)
	}

	if requestMethod != "" {
		req.Header.Set("Access-Control-Request-Method", requestMethod)
	}

	rec := httptest.NewRecorder()
	CORS(origins)(next).ServeHTTP(rec, req)

	return rec, nextCalled
}

func TestCORS_NoOriginsPassesThrough(t *testing.T) {
	rec, nextCalled := serve(t, nil, http.MethodOptions, allowedOrigin, http.MethodGet)

	if !nextCalled {
		t.Error("expected request to reach the next handler")
	}

	if got := rec.Header().Get("Access-Control-Allow-Origin"); got != "" {
		t.Errorf("expected no CORS header, got %q", got)
	}
}

func TestCORS_AllowedOrigin(t *testing.T) {
	rec, nextCalled := serve(t, []string{allowedOrigin}, http.MethodGet, allowedOrigin, "")

	if !nextCalled {
		t.Error("expected request to reach the next handler")
	}

	if got := rec.Header().Get("Access-Control-Allow-Origin"); got != allowedOrigin {
		t.Errorf("expected Access-Control-Allow-Origin %q, got %q", allowedOrigin, got)
	}

	if got := rec.Header().Get("Vary"); got != "Origin" {
		t.Errorf("expected Vary: Origin, got %q", got)
	}
}

func TestCORS_DisallowedOriginGetsNoHeader(t *testing.T) {
	rec, nextCalled := serve(t, []string{allowedOrigin}, http.MethodGet, "https://evil.example", "")

	if !nextCalled {
		t.Error("expected request to reach the next handler; the browser enforces CORS")
	}

	if got := rec.Header().Get("Access-Control-Allow-Origin"); got != "" {
		t.Errorf("expected no CORS header, got %q", got)
	}
}

func TestCORS_PreflightAllowed(t *testing.T) {
	rec, nextCalled := serve(t, []string{allowedOrigin}, http.MethodOptions, allowedOrigin, http.MethodPost)

	if nextCalled {
		t.Error("expected preflight to be answered by the middleware")
	}

	if rec.Code != http.StatusNoContent {
		t.Errorf("expected 204, got %d", rec.Code)
	}

	if got := rec.Header().Get("Access-Control-Allow-Methods"); got == "" {
		t.Error("expected Access-Control-Allow-Methods to be set")
	}
}

func TestCORS_PreflightDisallowed(t *testing.T) {
	rec, nextCalled := serve(t, []string{allowedOrigin}, http.MethodOptions, "https://evil.example", http.MethodPost)

	if nextCalled {
		t.Error("expected preflight to be rejected by the middleware")
	}

	if rec.Code != http.StatusForbidden {
		t.Errorf("expected 403, got %d", rec.Code)
	}
}

func TestCORS_PlainOptionsIsNotPreflight(t *testing.T) {
	_, nextCalled := serve(t, []string{allowedOrigin}, http.MethodOptions, allowedOrigin, "")

	if !nextCalled {
		t.Error("expected OPTIONS without Access-Control-Request-Method to reach the next handler")
	}
}
