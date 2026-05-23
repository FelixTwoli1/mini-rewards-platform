# Architecture Decision Record

**Author: FelixTwoli**

## Overview

Mini Rewards Platform is designed as a **microservice-ready monorepo** — services share code via internal packages but are deployed independently, each with their own database connection and HTTP server.

---

## 1. Monorepo with pnpm + Turborepo

**Decision**: pnpm workspaces with Turborepo for build orchestration.

**Why**:
- Turborepo caches task outputs (build, test, lint) by input hash — unchanged packages skip re-execution in CI.
- pnpm's symlinked `node_modules` prevents phantom dependency bugs.
- Single lint/tsconfig source of truth across all packages.

---

## 2. Clean Architecture per Service

Each NestJS service follows layered architecture:

```
Controller (HTTP) → Service (Business Logic) → Prisma (Data Access)
                          ↑
                    Strategy Pattern
                    (Reward Calculation)
```

Business logic never leaks into controllers. Controllers only orchestrate request/response transformation.

---

## 3. Strategy Pattern for Reward Calculation

**Problem**: Multiple reward event types (signup, purchase, promotion) with different calculation rules.

**Solution**: `RewardStrategy` interface + `RewardStrategyExecutor` dispatcher.

```typescript
executor.execute('PURCHASE_REWARD', { userId, metadata: { amount: 50 } })
// → dispatches to PurchaseRewardStrategy → 500 points
```

Adding a new reward type = implement one `RewardStrategy`, register it in executor. Zero controller changes.

---

## 4. Idempotent Redemption

**Problem**: Network retries can cause duplicate wallet credits.

**Solution**: Client sends a unique `idempotencyKey` per redemption. The DB has a `UNIQUE` constraint on this key. If the key already exists, the existing result is returned without re-processing.

```
POST /redemption { points: 500, idempotencyKey: "order-abc-redeem-1" }
→ First call:  creates redemption, processes atomically
→ Retry call:  finds existing record, returns it immediately
```

---

## 5. Atomic Redemption Transaction

Redeeming points touches 4 tables. Any partial failure must roll back completely:

```
BEGIN TRANSACTION
  1. UPDATE reward_accounts SET balance -= points   (check >= 0)
  2. INSERT reward_transactions (DEBIT)
  3. UPDATE wallets SET balance += amountAwarded
  4. INSERT wallet_transactions (CREDIT)
  5. UPDATE redemption_requests SET status = COMPLETED
  6. INSERT audit_logs
COMMIT
```

Prisma `$transaction` ensures ACID atomicity.

---

## 6. JWT + Refresh Token Rotation

- Access tokens: short-lived (1hr), signed JWT
- Refresh tokens: UUID stored in DB with expiry, revoked on use (rotation)
- On logout: all active refresh tokens for user are revoked

---

## 7. Event-Driven with Kafka

Domain events are published after state changes:

| Trigger             | Topic                       |
|--------------------|-----------------------------|
| User registered     | `user.created`              |
| Points awarded      | `reward.points.awarded`     |
| Points redeemed     | `reward.points.redeemed`    |
| Wallet credited     | `wallet.credited`           |

Consumers (notification-service) handle async side effects without coupling services.

---

## 8. Caching Strategy

Redis caches hot-path reads:
- User profile: 5min TTL, invalidated on profile update
- Reward balance: 1min TTL, invalidated on award/redeem
- Wallet balance: 1min TTL, invalidated on credit/debit

Cache keys are namespaced: `reward:balance:{userId}`

---

## 9. Optimistic Locking

`RewardAccount` and `Wallet` have a `version` field incremented on every update. Under high concurrency, two concurrent debits see the same `version`, and only one succeeds — the other gets a `P2025` (record not found) or constraint violation, prompting a retry.

---

## 10. Audit Logging

Every redemption writes to `audit_logs` inside the same transaction. This gives:
- Tamper-evident audit trail
- Replay capability for reconciliation
- Fraud detection input (unusual redemption patterns)

---

*FelixTwoli*
