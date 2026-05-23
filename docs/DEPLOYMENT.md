# Deployment Guide

**Author: FelixTwoli**

## Local Development

```bash
# 1. Start infrastructure
docker-compose up -d

# 2. Run database migrations
cd packages/database
npx prisma migrate dev --name init

# 3. Seed database
npx ts-node prisma/seed.ts

# 4. Start all services
cd ../..
pnpm dev
```

## Production Docker Compose

```bash
# Copy and configure environment
cp .env.example .env

# Build and start all services
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d

# Run migrations against production DB
docker exec rewards-auth-service npx prisma migrate deploy
```

## Environment Variables

| Variable                        | Description                          | Default         |
|---------------------------------|--------------------------------------|-----------------|
| `DATABASE_URL`                  | PostgreSQL connection string         | Required        |
| `REDIS_URL`                     | Redis connection string              | Required        |
| `AUTH_JWT_SECRET`               | JWT signing secret (min 32 chars)   | Required        |
| `AUTH_JWT_EXPIRATION`           | Access token TTL in seconds          | `3600`          |
| `AUTH_JWT_REFRESH_SECRET`       | Refresh token secret                 | Required        |
| `AUTH_JWT_REFRESH_EXPIRATION`   | Refresh token TTL in seconds         | `604800`        |
| `KAFKA_BROKERS`                 | Kafka broker addresses               | `kafka:29092`   |
| `POINTS_TO_MONEY_CONVERSION`    | Points needed for $1                 | `100`           |
| `NODE_ENV`                      | Environment                          | `development`   |
| `LOG_LEVEL`                     | Logging level                        | `info`          |

## Health Checks

Each service exposes:
- `GET /api/v1/health` → `{ status: "ok" }`

## Scaling

```bash
# Scale rewards service horizontally
docker-compose up -d --scale rewards-service=3
```

Services are stateless (JWT, Redis-backed) — safe to scale horizontally behind a load balancer.

---

*FelixTwoli*
