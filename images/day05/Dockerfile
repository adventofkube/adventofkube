FROM golang:1.21-alpine AS builder
WORKDIR /app
COPY *.go .
RUN go mod init server && CGO_ENABLED=0 go build -o /flag-app .

FROM scratch
LABEL org.opencontainers.image.source=https://github.com/adventofkube/adventofkube
COPY --from=builder /flag-app /flag-app
ENTRYPOINT ["/flag-app"]
