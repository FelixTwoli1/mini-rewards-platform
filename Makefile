.PHONY: help install dev build test test-cov test-e2e lint lint-fix format typecheck clean docker-up docker-down docker-logs db-migrate db-seed

help:
	@echo "Mini Rewards Platform - Available Commands"
	@echo ""
	@echo "Setup:"
	@echo "  make install           Install dependencies"
	@echo "  make init-env          Initialize .env file"
	@echo ""
	@echo "Development:"
	@echo "  make dev               Start all services in development mode"
	@echo "  make build             Build all packages"
	@echo ""
	@echo "Testing:"
	@echo "  make test              Run all tests"
	@echo "  make test-cov          Run tests with coverage"
	@echo "  make test-e2e          Run end-to-end tests"
	@echo ""
	@echo "Code Quality:"
	@echo "  make lint              Lint all packages"
	@echo "  make lint-fix          Fix linting issues"
	@echo "  make format            Format code"
	@echo "  make typecheck         Run TypeScript type checking"
	@echo ""
	@echo "Database:"
	@echo "  make db-migrate        Run Prisma migrations"
	@echo "  make db-seed           Seed the database"
	@echo ""
	@echo "Docker:"
	@echo "  make docker-up         Start Docker services"
	@echo "  make docker-down       Stop Docker services"
	@echo "  make docker-logs       View Docker logs"
	@echo "  make docker-rebuild    Rebuild Docker images"
	@echo ""
	@echo "Cleanup:"
	@echo "  make clean             Clean all build artifacts"

install:
	@echo "Installing dependencies..."
	pnpm install

init-env:
	@echo "Creating .env file from .env.example..."
	cp .env.example .env
	@echo ".env file created. Please update with your configuration."

dev:
	@echo "Starting development environment..."
	pnpm dev

build:
	@echo "Building all packages..."
	pnpm build

test:
	@echo "Running all tests..."
	pnpm test

test-cov:
	@echo "Running tests with coverage..."
	pnpm test:cov

test-e2e:
	@echo "Running end-to-end tests..."
	pnpm test:e2e

lint:
	@echo "Linting code..."
	pnpm lint

lint-fix:
	@echo "Fixing linting issues..."
	pnpm lint:fix

format:
	@echo "Formatting code..."
	pnpm format

typecheck:
	@echo "Type checking..."
	pnpm typecheck

clean:
	@echo "Cleaning build artifacts..."
	pnpm clean

docker-up:
	@echo "Starting Docker services..."
	docker-compose up -d
	@echo "Services started. Waiting for postgres to be ready..."
	sleep 5

docker-down:
	@echo "Stopping Docker services..."
	docker-compose down

docker-logs:
	@echo "Showing Docker logs..."
	docker-compose logs -f

docker-rebuild:
	@echo "Rebuilding Docker images..."
	docker-compose build --no-cache

db-migrate:
	@echo "Running database migrations..."
	pnpm prisma:migrate

db-seed:
	@echo "Seeding database..."
	pnpm prisma:seed

setup: install init-env docker-up db-migrate db-seed
	@echo "Setup complete! Run 'make dev' to start development."
