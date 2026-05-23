# Build stage
FROM node:20-alpine AS builder

LABEL maintainer="FelixTwoli <wabwirephelix135@gmail.com>"

RUN npm install -g pnpm@9.0.0

WORKDIR /app

# Copy workspace files
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY packages/tsconfig ./packages/tsconfig
COPY packages/eslint-config ./packages/eslint-config
COPY packages/logger ./packages/logger
COPY packages/config ./packages/config
COPY packages/database ./packages/database
COPY packages/messaging ./packages/messaging
COPY packages/common ./packages/common
COPY apps/auth-service ./apps/auth-service

RUN pnpm install --frozen-lockfile

# Generate Prisma client
RUN cd packages/database && npx prisma generate

# Build
RUN pnpm --filter @rewards/logger build
RUN pnpm --filter @rewards/config build
RUN pnpm --filter @rewards/auth-service build

# Production stage
FROM node:20-alpine AS runner

LABEL maintainer="FelixTwoli <wabwirephelix135@gmail.com>"

RUN npm install -g pnpm@9.0.0
RUN addgroup --system --gid 1001 nodejs && adduser --system --uid 1001 nestjs

WORKDIR /app

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/packages ./packages
COPY --from=builder /app/apps/auth-service/dist ./apps/auth-service/dist
COPY --from=builder /app/apps/auth-service/package.json ./apps/auth-service/package.json

USER nestjs

EXPOSE 3001

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3001/api/v1/health', (r) => process.exit(r.statusCode === 200 ? 0 : 1))"

CMD ["node", "apps/auth-service/dist/main"]
