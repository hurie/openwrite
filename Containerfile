FROM docker.io/oven/bun:debian AS builder

WORKDIR /app

# Copy package manifests & lockfile
COPY package.json bun.lock ./
COPY apps/web/package.json ./apps/web/
COPY apps/server/package.json ./apps/server/
COPY apps/docs/package.json ./apps/docs/

# Install dependencies with bun
RUN bun install --frozen-lockfile

# Copy source code
COPY . .

# Build web application static assets
RUN bun run build:web

# Runtime stage with official Node.js (required for Wrangler/workerd inspector stability)
FROM docker.io/library/node:22-bookworm-slim AS runner

WORKDIR /app

# Copy built application and dependencies
COPY --from=builder /app /app

ENV NODE_ENV=production
ENV PORT=3000

# Create volume mount points
RUN mkdir -p /data /config

EXPOSE 3000

WORKDIR /app/apps/server

ENTRYPOINT ["npx", "wrangler", "dev", "--ip", "0.0.0.0", "--port", "3000", "--local", "--persist-to", "/data", "--env-file", "/config/.env", "--show-interactive-dev-session", "false"]
