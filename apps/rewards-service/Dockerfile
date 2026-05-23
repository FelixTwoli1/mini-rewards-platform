# Build stage
FROM node:20-alpine AS builder

LABEL maintainer="FelixTwoli <wabwirephelix135@gmail.com>"

RUN npm install -g pnpm@9.0.0
WORKDIR /app

COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY packages/tsconfig ./packages/tsconfig
COPY packages/logger ./packages/logger
COPY packages/config ./packages/config
COPY packages/database ./packages/database
COPY packages/messaging ./packages/messaging
COPY packages/common ./packages/common
COPY apps/rewards-service ./apps/rewards-service

RUN pnpm install --frozen-lockfile
RUN cd packages/database && npx prisma generate
RUN pnpm --filter @rewards/logger build
RUN pnpm --filter @rewards/config build
RUN pnpm --filter @rewards/rewards-service build

# Production stage
FROM node:20-alpine AS runner

LABEL maintainer="FelixTwoli <wabwirephelix135@gmail.com>"

RUN npm install -g pnpm@9.0.0
RUN addgroup --system --gid 1001 nodejs && adduser --system --uid 1001 nestjs

WORKDIR /app
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/packages ./packages
COPY --from=builder /app/apps/rewards-service/dist ./apps/rewards-service/dist
COPY --from=builder /app/apps/rewards-service/package.json ./apps/rewards-service/package.json

USER nestjs
EXPOSE 3002

CMD ["node", "apps/rewards-service/dist/main"]
