package handlers

import (
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"log"
	"net/http"
	"strconv"
)

const maxBodyBytes = 1 << 20 // about 1 MB

// decodeJSON reads exactly one JSON object from the request body into dst.
func decodeJSON(w http.ResponseWriter, r *http.Request, dst any) error {
	r.Body = http.MaxBytesReader(w, r.Body, maxBodyBytes)

	decoder := json.NewDecoder(r.Body)
	decoder.DisallowUnknownFields()

	err := decoder.Decode(dst)
	if err != nil {
		return fmt.Errorf("invalid JSON: %w", err)
	}

	err = decoder.Decode(&struct{}{})
	if !errors.Is(err, io.EOF) {
		return errors.New("request body must contain a single JSON object")
	}

	return nil
}

// writeDecodeError reports a decodeJSON failure as 413 or 400.
func writeDecodeError(w http.ResponseWriter, err error) {
	var tooLarge *http.MaxBytesError
	if errors.As(err, &tooLarge) {
		http.Error(w, "request body too large", http.StatusRequestEntityTooLarge)
		return
	}

	http.Error(w, err.Error(), http.StatusBadRequest)
}

func writeJSON(w http.ResponseWriter, status int, value any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)

	err := json.NewEncoder(w).Encode(value)
	if err != nil {
		log.Printf("write JSON response: %v", err)
	}
}

// writeServerError logs the cause and returns a generic 500, so internal
// details such as SQL errors don't reach the client.
func writeServerError(w http.ResponseWriter, action string, err error) {
	log.Printf("%s: %v", action, err)
	http.Error(w, "internal server error", http.StatusInternalServerError)
}

// pathID parses the {id} path value. It writes a 400 and returns false when
// the value isn't a positive integer.
func pathID(w http.ResponseWriter, r *http.Request) (int64, bool) {
	id, err := strconv.ParseInt(r.PathValue("id"), 10, 64)
	if err != nil || id <= 0 {
		http.Error(w, "id must be a positive integer", http.StatusBadRequest)
		return 0, false
	}

	return id, true
}
