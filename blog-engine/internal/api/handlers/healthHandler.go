package handlers

import (
	"net/http"
)

// GetHealth reports that the process is up. It deliberately doesn't check the
// database, so a Postgres hiccup doesn't make the API look down.
func GetHealth(w http.ResponseWriter, _ *http.Request) {
	w.Header().Set("Content-Type", "text/plain; charset=utf-8")
	w.WriteHeader(http.StatusOK)
	_, _ = w.Write([]byte("ok"))
}
