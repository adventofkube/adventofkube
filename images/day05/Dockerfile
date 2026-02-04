FROM golang:1.21-alpine AS builder
WORKDIR /app
COPY main.go .
RUN CGO_ENABLED=0 go build -o /flag-app main.go

FROM scratch
COPY --from=builder /flag-app /flag-app
ENTRYPOINT ["/flag-app"]
