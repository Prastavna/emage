# Multi-stage build for optimized production image

# Stage 1: Build
FROM oven/bun:1-alpine AS builder

WORKDIR /app

# Copy dependency manifests first for layer caching
COPY package.json bun.lock ./

# Install dependencies
RUN bun install --frozen-lockfile

# Copy source code and build
COPY . .
RUN bun run build

# Stage 2: Production
FROM nginx:alpine

# Copy custom nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy built files from builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Coolify and other platforms read EXPOSE to detect the port
EXPOSE 80

# Healthcheck for Coolify and Docker health monitoring
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost:80/ || exit 1

CMD ["nginx", "-g", "daemon off;"]
