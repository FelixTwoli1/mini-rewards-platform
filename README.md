# Mini Rewards Platform

[![CI](https://github.com/FelixTwoli1/mini-rewards-platform/actions/workflows/ci.yml/badge.svg)](https://github.com/FelixTwoli1/mini-rewards-platform/actions/workflows/ci.yml)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue.svg)](https://www.typescriptlang.org/)
[![NestJS](https://img.shields.io/badge/NestJS-10-red.svg)](https://nestjs.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![pnpm](https://img.shields.io/badge/pnpm-9-orange.svg)](https://pnpm.io/)
[![Turborepo](https://img.shields.io/badge/Turborepo-1.13-purple.svg)](https://turbo.build/)

**Author: [FelixTwoli](https://github.com/FelixTwoli1)**

A production-grade **Fintech Rewards Points System** — a microservice-ready monorepo demonstrating senior-level backend engineering with NestJS, PostgreSQL, Redis, Kafka, full observability, and clean architecture.

---

## Architecture Overview

```
┌──────────────────────────────────────────────────────────────────────────┐
│                           mini-rewards-platform                          │
├─────────────────────┬────────────────────────┬───────────────────────────┤
│   apps/             │   packages/             │   infrastructure/         │
│   ├─ auth-service   │   ├─ common             │   ├─ docker               │
│   ├─ rewards-svc    │   ├─ config             │   ├─ prometheus            │
│   ├─ wallet-service │   ├─ database (Prisma)  │   ├─ grafana               │
│   ├─ api-gateway    │   ├─ logger (Pino)      │   └─ k8s                  │
│   └─ notif-service  │   ├─ messaging (Kafka)  │                           │
│                     │   ├─ testing            │                           │
│                     │   ├─ tsconfig           │                           │
│                     │   └─ eslint-config      │                           │
└─────────────────────┴────────────────────────┴───────────────────────────┘
```

### Request Flow

```
Client → Auth Service (JWT)
       → Rewards Service  → PostgreSQL (points)
       → Wallet Service   → PostgreSQL (wallet)
                          ↓
                     Kafka Events
                          ↓
                Notification Service (async)
```

### Event-Driven Architecture

```
User Registers  →  user.created         →  Award signup bonus
Purchase Made   →  reward.points.awarded →  Update balance cache
Points Redeemed →  redemption.completed  →  Credit wallet, audit log
Wallet Updated  →  wallet.credited       →  Notification
```

---

## Tech Stack

| Layer            | Technology                                  |
|-----------------|---------------------------------------------|
| Language         | TypeScript 5.3                              |
| Framework        | NestJS 10                                   |
| Monorepo         | pnpm workspaces + Turborepo                |
| Database         | PostgreSQL 16 + Prisma ORM                 |
| Cache            | Redis 7                                     |
| Messaging        | Kafka (KafkaJS)                             |
| Auth             | JWT + Passport + Refresh Tokens            |
| Validation       | class-validator + class-transformer        |
| Logging          | Pino (structured JSON)                     |
| Tracing          | OpenTelemetry + Jaeger                     |
| Metrics          | Prometheus + Grafana                       |
| Rate Limiting    | @nestjs/throttler (Redis-backed)           |
| API Docs         | Swagger / OpenAPI                          |
| Testing          | Jest + Supertest                           |
| CI/CD            | GitHub Actions                             |
| Containers       | Docker + Docker Compose                    |

---

## Quick Start

### Prerequisites

- Node.js 20+
- pnpm 9+
- Docker & Docker Compose

### 1. Clone and Install

```bash
git clone https://github.com/FelixTwoli1/mini-rewards-platform.git
cd mini-rewards-platform
pnpm install
```

### 2. Configure Environment

```bash
cp .env.example .env
# Edit .env with your configuration
```

### 3. Start Infrastructure

```bash
make docker-up
# or
docker-compose up -d
```

### 4. Run Migrations & Seed

```bash
make db-migrate
make db-seed
```

### 5. Start Services

```bash
pnpm dev
```

---

## API Reference

### Base URLs

| Service         | URL                             |
|----------------|----------------------------------|
| Auth Service    | `http://localhost:3001/api/v1`  |
| Rewards Service | `http://localhost:3002/api/v1`  |
| Wallet Service  | `http://localhost:3003/api/v1`  |
| Swagger (Auth)  | `http://localhost:3001/api/docs` |

### Swagger UI

Open `http://localhost:3001/api/docs` for interactive API documentation with bearer auth support.

---

## API Examples

### Register

```bash
curl -X POST http://localhost:3001/api/v1/auth/register \
  -H 'Content-Type: application/json' \
  -d '{
    "email": "john.doe@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "password": "SecurePass@123"
  }'
```

Response:
```json
{
  "success": true,
  "data": {
    "user": { "id": "...", "email": "john.doe@example.com", "role": "CUSTOMER" },
    "tokens": {
      "accessToken": "eyJhbGciOiJIUzI1NiJ9...",
      "refreshToken": "uuid-refresh-token",
      "expiresIn": 3600
    }
  }
}
```

> **Note:** 500 signup bonus points are automatically credited on registration.

### Login

```bash
curl -X POST http://localhost:3001/api/v1/auth/login \
  -H 'Content-Type: application/json' \
  -d '{ "email": "john.doe@example.com", "password": "SecurePass@123" }'
```

### Get Reward Balance

```bash
curl http://localhost:3002/api/v1/rewards/balance \
  -H 'Authorization: Bearer <accessToken>'
```

### Award Points (Purchase)

```bash
curl -X POST http://localhost:3002/api/v1/rewards/award \
  -H 'Authorization: Bearer <accessToken>' \
  -H 'Content-Type: application/json' \
  -d '{
    "userId": "<userId>",
    "eventType": "PURCHASE_REWARD",
    "referenceId": "ORDER-001",
    "metadata": { "amount": 50 }
  }'
```

### Redeem Points

```bash
curl -X POST http://localhost:3003/api/v1/redemption \
  -H 'Authorization: Bearer <accessToken>' \
  -H 'Content-Type: application/json' \
  -d '{
    "points": 500,
    "idempotencyKey": "unique-request-id-001"
  }'
```

Response:
```json
{
  "success": true,
  "data": {
    "id": "redemption-uuid",
    "points": 500,
    "amountAwarded": 5.00,
    "status": "COMPLETED",
    "processedAt": "2026-05-23T10:00:00Z"
  }
}
```

### Get Wallet Balance

```bash
curl http://localhost:3003/api/v1/wallet/balance \
  -H 'Authorization: Bearer <accessToken>'
```

---

## Points Conversion

```
100 points = $1.00
```

Configurable via `POINTS_TO_MONEY_CONVERSION` environment variable.

| Points | Wallet Credit |
|--------|--------------|
| 100    | $1.00        |
| 500    | $5.00        |
| 1,000  | $10.00       |
| 10,000 | $100.00      |

---

## Reward Strategies (Strategy Pattern)

| Event Type           | Points Awarded              | Trigger                     |
|---------------------|-----------------------------|-----------------------------|
| `SIGNUP_BONUS`      | 500 pts (fixed)             | User registration           |
| `PURCHASE_REWARD`   | 10 pts per $1 spent         | Purchase transaction        |
| `PROMOTIONAL_CAMPAIGN` | Configurable (default 200) | Marketing campaigns      |

---

## Security

- **JWT** access tokens (configurable expiry, default 1hr)
- **Refresh tokens** with rotation and revocation
- **bcrypt** password hashing (cost factor 12)
- **RBAC** with `ADMIN` and `CUSTOMER` roles
- **Helmet** HTTP security headers
- **Rate limiting** via `@nestjs/throttler` (100 req/min default)
- **Validation** with `class-validator` on all DTOs
- **Idempotent** redemption via unique `idempotencyKey`

---

## Caching Strategy

| Data              | Cache Key                     | TTL     |
|-------------------|-------------------------------|---------|
| User profile      | `user:profile:{userId}`       | 5 min   |
| Reward balance    | `reward:balance:{userId}`     | 1 min   |
| Wallet balance    | `wallet:balance:{userId}`     | 1 min   |

Cache is invalidated on write operations.

---

## Observability

| Tool       | URL                          | Purpose              |
|-----------|-------------------------------|----------------------|
| Prometheus | http://localhost:9090         | Metrics collection   |
| Grafana    | http://localhost:3000         | Dashboards           |
| Jaeger     | http://localhost:16686        | Distributed tracing  |
| PgAdmin    | http://localhost:5050         | Database UI          |

Metrics tracked:
- API request latency (p50, p95, p99)
- Reward redemption success rate
- Cache hit/miss ratio
- DB query duration
- Kafka consumer lag

---

## Database Schema

```
users ──────────── reward_accounts ──── reward_transactions
  │                     │
  ├── wallets ──────────┘
  │     └── wallet_transactions
  │
  ├── redemption_requests
  ├── refresh_tokens
  └── audit_logs

reward_rules (standalone)
```

---

## Monorepo Structure

```
mini-rewards-platform/
├── apps/
│   ├── auth-service/         # JWT auth, user management
│   ├── rewards-service/      # Points engine with Strategy Pattern
│   ├── wallet-service/       # Wallet + Redemption (atomic transactions)
│   ├── api-gateway/          # (scaffold)
│   └── notification-service/ # (scaffold)
├── packages/
│   ├── common/               # Redis cache, shared utilities
│   ├── config/               # Centralized env validation
│   ├── database/             # Prisma schema + repositories
│   ├── logger/               # Pino structured logger
│   ├── messaging/            # Kafka producer/consumer
│   ├── testing/              # Shared test helpers
│   ├── tsconfig/             # Shared TypeScript config
│   └── eslint-config/        # Shared ESLint rules
├── infrastructure/
│   ├── docker/
│   ├── prometheus/
│   ├── grafana/
│   └── k8s/
├── .github/workflows/        # CI/CD pipeline
├── docker-compose.yml
└── Makefile
```

---

## Running Tests

```bash
# Unit tests (all packages)
pnpm test

# With coverage
pnpm test:cov

# Specific service
cd apps/auth-service && pnpm test

# E2E tests
pnpm test:e2e
```

---

## Docker Commands

```bash
# Start all infrastructure
docker-compose up -d

# View logs
docker-compose logs -f rewards-postgres
docker-compose logs -f rewards-kafka

# Stop everything
docker-compose down

# Full rebuild
docker-compose build --no-cache && docker-compose up -d
```

---

## Scaling Strategy

**Horizontal scaling**: Each service is stateless (JWT, Redis-backed sessions) — add instances behind a load balancer.

**Database**: Read replicas + connection pooling (PgBouncer).

**Kafka**: Partition reward events by `userId` for ordered, parallel processing.

**Cache**: Redis Cluster for high availability.

**Future**: Kubernetes (k8s manifests in `/infrastructure/k8s`) for orchestration.

---

## Bonus Engineering Patterns

- **Idempotency**: Redemption requests are idempotent via `idempotencyKey`
- **Optimistic locking**: `version` field on `RewardAccount` and `Wallet`
- **Outbox pattern**: Ready for implementation via `audit_logs` table
- **CQRS-ready**: Read/write paths are separated in services
- **Soft deletes**: `deletedAt` on users
- **Audit trail**: Every redemption writes an `AuditLog` record

---

*Built by [FelixTwoli](https://github.com/FelixTwoli1)*
