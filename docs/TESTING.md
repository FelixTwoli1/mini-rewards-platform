# Testing Guide

**Author: FelixTwoli**

## Test Structure

```
apps/
├── auth-service/src/
│   └── auth/auth.service.spec.ts        # Unit: register, login, refresh
├── rewards-service/src/
│   ├── rewards/rewards.service.spec.ts  # Unit: award points, balance
│   └── rewards/strategies/
│       └── reward-strategy.executor.spec.ts  # Unit: Strategy Pattern
└── wallet-service/src/
    └── redemption/redemption.service.spec.ts # Unit: redeem, idempotency
```

## Running Tests

```bash
# All tests
pnpm test

# With coverage report
pnpm test:cov

# Single service
cd apps/auth-service && pnpm test

# Watch mode (development)
cd apps/rewards-service && pnpm test -- --watch
```

## Unit Test Strategy

Tests use Jest mocks for Prisma and external dependencies:

```typescript
const mockPrismaService = {
  user: { findUnique: jest.fn(), create: jest.fn() },
  rewardAccount: { findUnique: jest.fn(), upsert: jest.fn() },
};
```

This ensures tests run without a database connection.

## Key Test Scenarios

### Auth Service
- Register: duplicate email → `ConflictException`
- Register: success → tokens returned, password not exposed
- Login: wrong email → `UnauthorizedException`
- Login: wrong password → `UnauthorizedException`
- Login: valid credentials → tokens returned

### Rewards Service
- Get balance: not found → `NotFoundException`
- Award SIGNUP_BONUS: 500 points
- Award PURCHASE_REWARD: 10 pts/$1 (25 → 250pts)
- Unknown event type → `BadRequestException`

### Redemption Service
- Duplicate `idempotencyKey`: returns existing record (no re-process)
- Wrong user's idempotency key → `ConflictException`
- No reward account → `NotFoundException`
- Insufficient balance → `BadRequestException`
- Conversion: 500pts = $5.00 (100pts/$1)

## Coverage Targets

| Service         | Target |
|----------------|--------|
| auth-service   | ≥ 80%  |
| rewards-service | ≥ 80% |
| wallet-service  | ≥ 80% |

---

*FelixTwoli*
