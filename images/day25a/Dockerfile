FROM golang:1.22-alpine AS builder
WORKDIR /app
COPY go.mod .
COPY *.go .
RUN go mod tidy && CGO_ENABLED=0 go build -o server .

FROM scratch
LABEL org.opencontainers.image.source=https://github.com/adventofkube/adventofkube
COPY --from=builder /app/server /server
ENTRYPOINT ["/server"]
