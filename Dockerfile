FROM golang:1.21 as build
WORKDIR /app

COPY go.mod go.sum ./

RUN go mod download

COPY /business ./business
COPY /texts ./texts
COPY /main.go ./

RUN go build -o /app/trigger ./main.go

# Deployment environment
# ----------------------
FROM ubuntu:latest
RUN apt-get update && apt-get install -y ca-certificates

COPY --from=build /app/trigger /app/trigger

ENTRYPOINT [ "/app/trigger" ]
