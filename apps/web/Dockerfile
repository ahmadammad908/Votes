FROM node:20-alpine AS base

WORKDIR /app

# Install dependencies
COPY package.json package-lock.json* ./
COPY packages/shared/package.json ./packages/shared/
COPY apps/web/package.json ./apps/web/

RUN npm install

# Copy source
COPY packages/shared ./packages/shared
COPY apps/web ./apps/web

WORKDIR /app/apps/web

ENV NEXT_TELEMETRY_DISABLED 1
ENV NODE_ENV production

RUN npm run build

EXPOSE 3000
CMD ["npm", "start"]
