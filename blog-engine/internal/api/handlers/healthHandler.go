package handlers

import (
	"log"
	"net/http"
)

// GetHealth reports that the process is up. It deliberately doesn't check the
// database, so a Postgres hiccup doesn't make the API look down.
func GetHealth(w http.ResponseWriter, _ *http.Request) {
	w.Header().Set("Content-Type", "text/plain; charset=utf-8")
	// A cached "ok" could hide an outage, so every check must reach the server.
	w.Header().Set("Cache-Control", "no-store")
	w.WriteHeader(http.StatusOK)

	_, err := w.Write([]byte("ok"))
	if err != nil {
		log.Printf("write health response: %v", err)
	}
}
