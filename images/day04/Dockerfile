FROM golang:1.22-alpine AS builder
WORKDIR /app
COPY main.go .
RUN CGO_ENABLED=0 go build -o app main.go

FROM scratch
COPY --from=builder /app/app /app
ENTRYPOINT ["/app"]
