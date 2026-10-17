package main

import (
	"context"
	"database/sql"
	"errors"
	"fmt"
	"log"
	"net"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/SimonKimDev/Devel/blog-engine/internal/api/routes"
	"github.com/SimonKimDev/Devel/blog-engine/internal/application"
	"github.com/SimonKimDev/Devel/blog-engine/internal/domain"
	"github.com/SimonKimDev/Devel/blog-engine/internal/infra/config"
	"github.com/SimonKimDev/Devel/blog-engine/internal/infra/db"
)

const (
	appEnvVar          = "APP_ENV"
	dbConnectTimeout   = 30 * time.Second
	shutdownTimeout    = 10 * time.Second
	readHeaderTimeout  = 5 * time.Second
	readWriteTimeout   = 15 * time.Second
	keepAliveIdleLimit = 60 * time.Second
)

func main() {
	err := run()
	if err != nil {
		log.Fatal(err)
	}
}

func run() error {
	ctx, stop := signal.NotifyContext(context.Background(), os.Interrupt, syscall.SIGTERM)
	defer stop()

	workDir, err := os.Getwd()
	if err != nil {
		return fmt.Errorf("get working directory: %w", err)
	}

	cfgPath := config.Path(workDir, os.Getenv(appEnvVar))

	cfg, err := config.Load(cfgPath)
	if err != nil {
		return err
	}

	log.Printf("loaded config %s (env %q)", cfgPath, cfg.Env)

	// LEARN: dependency injection. postSvc is an interface; main picks the implementation
	// (Postgres today, or an in-memory store in exercise #58) and hands it to the router.
	// See docs/LEARNING.md, "Wiring to the Go API".
	var postSvc application.BlogPoster

	if cfg.Database.Enabled {
		database, err := connectDatabase(ctx, cfg)
		if err != nil {
			return err
		}

		defer database.Close()

		postSvc = application.NewPostService(database)
	} else {
		log.Print("database disabled; blog post routes are not registered")
	}

	server := &http.Server{
		Addr:              net.JoinHostPort(cfg.Server.Host, cfg.Server.Port),
		Handler:           routes.NewRouter(postSvc, cfg.Server.AllowedOrigins),
		ReadHeaderTimeout: readHeaderTimeout,
		ReadTimeout:       readWriteTimeout,
		WriteTimeout:      readWriteTimeout,
		IdleTimeout:       keepAliveIdleLimit,
	}

	serveErr := make(chan error, 1)

	go func() {
		log.Printf("listening on %s", server.Addr)
		serveErr <- server.ListenAndServe()
	}()

	select {
	case err := <-serveErr:
		return fmt.Errorf("serve HTTP: %w", err)
	case <-ctx.Done():
	}

	log.Print("shutting down")

	shutdownCtx, cancel := context.WithTimeout(context.Background(), shutdownTimeout)
	defer cancel()

	err = server.Shutdown(shutdownCtx)
	if err != nil {
		return fmt.Errorf("shut down HTTP server: %w", err)
	}

	err = <-serveErr
	if !errors.Is(err, http.ErrServerClosed) {
		return fmt.Errorf("serve HTTP: %w", err)
	}

	return nil
}

func connectDatabase(ctx context.Context, cfg *domain.Config) (*sql.DB, error) {
	connectCtx, cancel := context.WithTimeout(ctx, dbConnectTimeout)
	defer cancel()

	database, err := db.InitDatabase(connectCtx, cfg)
	if err != nil {
		return nil, fmt.Errorf("connect to database: %w", err)
	}

	log.Print("connected to database")

	return database, nil
}
