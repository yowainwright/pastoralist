FROM oven/bun:1.3-alpine

# Install git (needed for some tests)
RUN apk add --no-cache git

WORKDIR /app

# Copy source files
COPY src/ ./src/
COPY tests/integration/ ./tests/integration/
COPY tests/fixtures/ ./tests/fixtures/
COPY app/ ./app/
COPY scripts/ ./scripts/
COPY tsconfig.json package.json ./

# Install dependencies
RUN bun install

# Run integration tests
CMD ["bun", "test", "tests/integration/"]
