
FROM node:20-bookworm-slim AS base

WORKDIR /app

COPY package.json package-lock.json ./
COPY packages/shared/package.json ./packages/shared/package.json
COPY apps/web/package.json ./apps/web/package.json

RUN npm ci

COPY packages/shared ./packages/shared
COPY apps/web ./apps/web

ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production

RUN npm run build --workspace=@campusface/shared
RUN npm run build --workspace=@campusface/web

EXPOSE 3000

CMD ["npm", "run", "start", "--workspace=@campusface/web"]
