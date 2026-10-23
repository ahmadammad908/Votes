
FROM node:20-bookworm-slim AS base

WORKDIR /app

# Install OpenSSL for Prisma
RUN apt-get update \
    && apt-get install -y --no-install-recommends openssl \
    && rm -rf /var/lib/apt/lists/*

# Copy root package files
COPY package.json package-lock.json* ./

# Copy workspace package files
COPY packages/shared/package.json ./packages/shared/
COPY apps/api/package.json ./apps/api/

# Install dependencies
RUN npm install

# Copy source code
COPY packages/shared ./packages/shared
COPY apps/api ./apps/api

# Generate Prisma Client
WORKDIR /app/apps/api
RUN npx prisma generate

# Build shared package
WORKDIR /app
RUN npm run build --workspace=@campusface/shared

# Build API
RUN npm run build --workspace=@campusface/api

# Set production working directory
WORKDIR /app

# Render API port
EXPOSE 4000

# Start API server
CMD ["node", "apps/api/dist/index.js"]
