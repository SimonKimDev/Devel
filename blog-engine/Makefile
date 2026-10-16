APP_NAME := blog-engine
BIN_DIR := ./bin

.PHONY: build run test vet clean

build:
	go build -o $(BIN_DIR)/$(APP_NAME) ./cmd/$(APP_NAME)

run:
	go run ./cmd/$(APP_NAME)

test:
	go test -v ./...

vet:
	go vet ./...

clean:
	rm -rf $(BIN_DIR)
