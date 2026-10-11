FROM node:20-alpine AS base

WORKDIR /app

# Install dependencies
COPY package.json package-lock.json* ./
COPY packages/shared/package.json ./packages/shared/
COPY apps/api/package.json ./apps/api/

RUN npm install

# Copy source
COPY packages/shared ./packages/shared
COPY apps/api ./apps/api

# Generate Prisma Client
WORKDIR /app/apps/api
RUN npx prisma generate

# Build
RUN npm run build --workspace=@campusface/shared
RUN npm run build --workspace=@campusface/api

EXPOSE 4000
CMD ["node", "dist/index.js"]
