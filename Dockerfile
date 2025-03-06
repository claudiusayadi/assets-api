# Stage 1: Build
FROM oven/bun:alpine AS builder
WORKDIR /app

# Copy package files and install dependencies
COPY package.json bun.lock ./
RUN bun install --production

# Copy source code
COPY src ./src

# Stage 2: Runtime
FROM oven/bun:alpine
WORKDIR /app

# Install only the minimal dependencies for vips
RUN apk add --no-cache vips

# Copy only runtime dependencies and app
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/src ./src

# Expose port and run app
EXPOSE 3000
CMD ["bun", "run", "src/index.ts"]
