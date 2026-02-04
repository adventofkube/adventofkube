FROM golang:1.22-alpine AS builder
WORKDIR /app
COPY main.go .
RUN CGO_ENABLED=0 go build -o server main.go

FROM scratch
LABEL org.opencontainers.image.source=https://github.com/adventofkube/adventofkube
COPY --from=builder /app/server /server
ENTRYPOINT ["/server"]
