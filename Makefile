.PHONY: install dev-backend dev-frontend build serve test

install:
	cd frontend && npm install

dev-backend:
	cd backend && go run ./cmd/server

dev-frontend:
	cd frontend && npm run dev

build:
	cd frontend && npm run build
	cd backend && go build -o ../bin/server ./cmd/server

serve:
	./bin/server -static frontend/dist

test:
	cd backend && go vet ./... && go test ./...
	cd frontend && npm run typecheck
