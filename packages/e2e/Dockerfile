FROM node:24-alpine

# Install dependencies
RUN apk add --no-cache bash jq
RUN npm install -g pnpm

# Create a working directory
WORKDIR /app

# Copy the built pastoralist binary
COPY dist/ ./pastoralist/

# Make pastoralist executable and add package.json with module type
RUN chmod +x ./pastoralist/index.js
RUN echo '{"type":"module"}' > ./pastoralist/package.json

# Create a test workspace with multiple packages
RUN mkdir -p packages/app packages/utils packages/shared e2e/fixtures/patches

# Copy all fixtures in a single layer for better caching
COPY packages/e2e/fixtures/ ./e2e/fixtures/

# Copy workspace package.json files to their correct locations
COPY packages/e2e/fixtures/root-package.json ./package.json
COPY packages/e2e/fixtures/app-package.json ./packages/app/package.json
COPY packages/e2e/fixtures/utils-package.json ./packages/utils/package.json
COPY packages/e2e/fixtures/shared-package.json ./packages/shared/package.json

# Create some dummy source files to make the packages realistic
RUN echo 'console.log("App module");' > ./packages/app/index.js
RUN echo 'console.log("Utils module");' > ./packages/utils/index.js
RUN echo 'console.log("Shared module");' > ./packages/shared/index.js

# Install workspace dependencies
RUN pnpm install

# Install pastoralist runtime dependencies in root so they can be found
RUN npm install commander@14.0.0 compare-versions@6.1.1 fast-glob@3.3.3 gradient-string@^3.0.0 ora@^8.1.0 p-limit@^6.1.0

# Copy scripts
COPY packages/e2e/scripts/ ./scripts/
RUN chmod +x ./scripts/*.sh

# Set up environment for testing
ENV NODE_PATH=/app/pastoralist
ENV IS_DEBUGGING=true

CMD ["/bin/sh"]
