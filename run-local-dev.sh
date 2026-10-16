#!/bin/bash

# Define relative paths to your projects
projectRoot=$(dirname "$(realpath "$0")")
frontendPath="$projectRoot/devel-frontend"
backendPath="$projectRoot/blog-engine"
export REACT_APP_API_BASE_URL=http://localhost:18080/api

# Start the Go backend server. It reads configs/dev.yaml relative to blog-engine/.
echo "Starting the Go backend server..."
cd "$backendPath"
go run ./cmd/blog-engine &
BACKEND_PID=$!
sleep 5 # Wait a bit to ensure the backend starts up

# Start the Node.js frontend server
echo "Starting the Node.js frontend server..."
cd "$frontendPath"
npm install
npm start &
FRONTEND_PID=$!

# Function to stop the servers
cleanup() {
  echo "Stopping the Go backend server..."
  kill $BACKEND_PID
  echo "Stopping the Node.js frontend server..."
  kill $FRONTEND_PID
}

# Trap CTRL+C, Script Exit and call cleanup()
trap cleanup SIGINT EXIT

# Wait here until CTRL+C or script exit
wait