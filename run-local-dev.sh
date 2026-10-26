#!/bin/bash
# Starts the Go backend and the Vite frontend for local development.
# Ctrl+C (or SIGTERM) stops both.
set -euo pipefail

projectRoot=$(dirname "$(realpath "$0")")
frontendPath="$projectRoot/devel-frontend"
backendPath="$projectRoot/blog-engine"
backendBin="$backendPath/bin/blog-engine$(cd "$backendPath" && go env GOEXE)"
healthURL="http://localhost:18080/api/health"
readyTimeoutSeconds=30
export VITE_API_BASE_URL=http://localhost:18080/api

BACKEND_PID=""
FRONTEND_PID=""

# Runs once, on any exit path. INT and TERM exit, which triggers the EXIT trap.
cleanup() {
  trap - EXIT INT TERM
  if [[ -n "$FRONTEND_PID" ]] && kill -0 "$FRONTEND_PID" 2>/dev/null; then
    echo "Stopping the frontend..."
    kill "$FRONTEND_PID" 2>/dev/null || true
  fi
  if [[ -n "$BACKEND_PID" ]] && kill -0 "$BACKEND_PID" 2>/dev/null; then
    echo "Stopping the backend..."
    kill "$BACKEND_PID" 2>/dev/null || true
  fi
  wait 2>/dev/null || true
}
trap cleanup EXIT
trap 'exit 130' INT
trap 'exit 143' TERM

# Build and run the binary directly, rather than `go run`, so BACKEND_PID is the
# server itself and SIGTERM reaches its graceful shutdown.
echo "Building the backend..."
if ! (cd "$backendPath" && go build -o "$backendBin" ./cmd/blog-engine); then
  echo "Backend build failed." >&2
  exit 1
fi

# It reads configs/dev.yaml relative to blog-engine/.
echo "Starting the backend..."
cd "$backendPath"
"$backendBin" &
BACKEND_PID=$!

echo "Waiting for $healthURL..."
ready=false
for ((i = 0; i < readyTimeoutSeconds; i++)); do
  if ! kill -0 "$BACKEND_PID" 2>/dev/null; then
    echo "The backend exited before it was ready." >&2
    exit 1
  fi
  if curl -sf --max-time 1 "$healthURL" >/dev/null; then
    ready=true
    break
  fi
  sleep 1
done
if [[ "$ready" != true ]]; then
  echo "The backend wasn't ready after ${readyTimeoutSeconds}s." >&2
  exit 1
fi
echo "The backend is ready."

echo "Starting the frontend..."
cd "$frontendPath"
npm install
npm run dev &
FRONTEND_PID=$!

# Return as soon as either server exits; cleanup stops the other one.
wait -n
