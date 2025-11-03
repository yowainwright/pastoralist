#!/bin/bash
set -e

cd "$(dirname "$0")/../.."

echo "Building Docker image for integration tests..."
docker build -f tests/integration/Dockerfile -t pastoralist-integration .

echo "Running integration tests in Docker..."
docker run --rm pastoralist-integration
