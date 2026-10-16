# Build stage
FROM golang:1.27 AS builder

WORKDIR /src

# Download dependencies first so they're cached until go.mod or go.sum changes.
COPY go.mod go.sum ./
RUN go mod download

COPY . .

RUN CGO_ENABLED=0 GOOS=linux go build -trimpath -ldflags="-s -w" -o /out/blog-engine ./cmd/blog-engine

# Runtime stage: no shell or package manager, runs as a non-root user, and
# includes the CA certificates needed for HTTPS calls to Azure.
FROM gcr.io/distroless/static-debian12:nonroot

WORKDIR /app

COPY --from=builder /out/blog-engine ./blog-engine
COPY configs ./configs

# The app reads configs/<env>.yaml relative to the working directory.
ENV APP_ENV=prod

# Must match server.port in configs/prod.yaml and apiTargetPort in infra/main.bicepparam.
EXPOSE 18080

ENTRYPOINT ["/app/blog-engine"]