FROM golang:1.22-alpine AS builder
WORKDIR /app
COPY *.go .
RUN go mod init server && CGO_ENABLED=0 go build -o app .

FROM scratch
LABEL org.opencontainers.image.source=https://github.com/adventofkube/adventofkube
COPY --from=builder /app/app /app
ENTRYPOINT ["/app"]
