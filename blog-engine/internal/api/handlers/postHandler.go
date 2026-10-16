package handlers

import (
	"context"
	"errors"
	"net/http"
	"time"

	"github.com/SimonKimDev/Devel/blog-engine/internal/application"
	"github.com/SimonKimDev/Devel/blog-engine/internal/domain/blog"
)

const requestTimeout = 5 * time.Second

type PostHandler struct {
	poster application.BlogPoster
}

func NewPostHandler(p application.BlogPoster) *PostHandler {
	return &PostHandler{poster: p}
}

func (p *PostHandler) CreatePost(w http.ResponseWriter, r *http.Request) {
	var post blog.Post

	err := decodeJSON(w, r, &post)
	if err != nil {
		writeDecodeError(w, err)
		return
	}

	ctx, cancel := context.WithTimeout(r.Context(), requestTimeout)
	defer cancel()

	err = p.poster.CreatePost(ctx, &post)
	if err != nil {
		writeServerError(w, "create post", err)
		return
	}

	writeJSON(w, http.StatusCreated, post)
}

func (p *PostHandler) GetPosts(w http.ResponseWriter, r *http.Request) {
	ctx, cancel := context.WithTimeout(r.Context(), requestTimeout)
	defer cancel()

	posts, err := p.poster.GetAllPost(ctx)
	if err != nil {
		writeServerError(w, "get posts", err)
		return
	}

	writeJSON(w, http.StatusOK, posts)
}

func (p *PostHandler) GetPostByID(w http.ResponseWriter, r *http.Request) {
	id, ok := pathID(w, r)
	if !ok {
		return
	}

	ctx, cancel := context.WithTimeout(r.Context(), requestTimeout)
	defer cancel()

	post, err := p.poster.GetPostByID(ctx, id)
	if errors.Is(err, application.ErrPostNotFound) {
		http.Error(w, "post not found", http.StatusNotFound)
		return
	}

	if err != nil {
		writeServerError(w, "get post by ID", err)
		return
	}

	writeJSON(w, http.StatusOK, post)
}

func (p *PostHandler) GetPostByCategoryID(w http.ResponseWriter, r *http.Request) {
	id, ok := pathID(w, r)
	if !ok {
		return
	}

	ctx, cancel := context.WithTimeout(r.Context(), requestTimeout)
	defer cancel()

	posts, err := p.poster.GetPostByCategoryID(ctx, id)
	if err != nil {
		writeServerError(w, "get posts by category ID", err)
		return
	}

	writeJSON(w, http.StatusOK, posts)
}

func (p *PostHandler) UpdatePost(w http.ResponseWriter, r *http.Request) {
	var post blog.Post

	err := decodeJSON(w, r, &post)
	if err != nil {
		writeDecodeError(w, err)
		return
	}

	if post.PostID <= 0 {
		http.Error(w, "post_id must be a positive integer", http.StatusBadRequest)
		return
	}

	ctx, cancel := context.WithTimeout(r.Context(), requestTimeout)
	defer cancel()

	err = p.poster.UpdatePost(ctx, &post)
	if errors.Is(err, application.ErrPostNotFound) {
		http.Error(w, "post not found", http.StatusNotFound)
		return
	}

	if err != nil {
		writeServerError(w, "update post", err)
		return
	}

	w.WriteHeader(http.StatusOK)
}

func (p *PostHandler) DeletePostByID(w http.ResponseWriter, r *http.Request) {
	id, ok := pathID(w, r)
	if !ok {
		return
	}

	ctx, cancel := context.WithTimeout(r.Context(), requestTimeout)
	defer cancel()

	err := p.poster.DeletePostByID(ctx, id)
	if errors.Is(err, application.ErrPostNotFound) {
		http.Error(w, "post not found", http.StatusNotFound)
		return
	}

	if err != nil {
		writeServerError(w, "delete post", err)
		return
	}

	w.WriteHeader(http.StatusOK)
}
