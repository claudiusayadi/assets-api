# Stage 1: Build
FROM oven/bun:slim AS builder
WORKDIR /app

# Install only runtime deps for sharp
RUN apt-get update && apt-get install -y libvips42 && rm -rf /var/lib/apt/lists/*

# Copy package files and install dependencies
COPY package.json bun.lock ./
RUN bun install --production

# Copy source code
COPY src ./src

# Stage 2: Runtime
FROM oven/bun:slim
WORKDIR /app

# Install only runtime deps for sharp
RUN apt-get update && apt-get install -y libvips42 && rm -rf /var/lib/apt/lists/*

# Copy only runtime dependencies and app
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/src ./src

# Expose port
EXPOSE 3000

# Run the app
CMD ["bun", "run", "src/index.ts"]