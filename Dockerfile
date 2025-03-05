FROM oven/bun:latest
WORKDIR /app

# Install libvips for sharp
RUN apt-get update && apt-get install -y libvips-dev && rm -rf /var/lib/apt/lists/*

COPY package.json bun.lock ./
RUN bun install
COPY . .
EXPOSE 3000
CMD ["bun", "run", "src/index.ts"]