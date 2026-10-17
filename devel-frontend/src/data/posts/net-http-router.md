The API started life on the Gin framework. When I rebuilt it, I went with Go's standard library instead, because since Go 1.22 `net/http` can route by method and path parameters on its own.

## Routing without a framework

```go
mux := http.NewServeMux()

mux.HandleFunc("GET /api/blogpost", handler.GetPosts)
mux.HandleFunc("GET /api/blogpost/{id}", handler.GetPostByID)
```

Inside the handler, the path parameter is one call away:

```go
func (p *PostHandler) GetPostByID(w http.ResponseWriter, r *http.Request) {
	id, err := strconv.ParseInt(r.PathValue("id"), 10, 64)
	if err != nil {
		http.Error(w, "id must be a number", http.StatusBadRequest)
		return
	}
	// ...
}
```

## Layers

The code follows the layout I practiced in an earlier project:

- `cmd/` wires everything together.
- `internal/api` holds routes, handlers and middleware. Handlers stay thin.
- `internal/application` holds the business logic.
- `internal/infra` talks to the outside world: config files and the database.

Each layer only knows about the one below it, which makes them easy to test with fakes.

## What I'd tell past me

Reach for the standard library first. You can always add a framework later; removing one is much harder.