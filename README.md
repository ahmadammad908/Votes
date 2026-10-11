# CampusFace — High-Performance University Beauty Voting Platform

CampusFace is a production-oriented, scalable, privacy-conscious university beauty voting web application. It enables users to compare two consenting student participants side-by-side, vote for one contestant per battle with atomic PostgreSQL transaction guarantees, and immediately view the next battle with prefetched assets without page reload.

---

## 🏛️ System Architecture

- **Frontend (`apps/web`)**: Next.js 14 App Router, React 18, Tailwind CSS, Lucide Icons, Dark-mode UX, sub-50ms instant battle transitions with asset prefetching, keyboard hotkeys (`1` and `2`), cursor-paginated comments, and live leaderboard.
- **Backend (`apps/api`)**: Fastify, TypeScript, Prisma ORM, JWT authentication with secure HttpOnly cookies, atomic PostgreSQL transactions, idempotency key verification, and battle pairing engine.
- **Data & Caching**: PostgreSQL 16 (source of truth with custom check constraints, foreign keys, and indexes) + Redis 7 (caching, rate limiting, and aggregate counters).
- **Security & Privacy**: 100% explicit participant consent agreement recording, immediate consent withdrawal and media delisting workflow, XSS sanitization, rate limiting, and role-based access control (`STUDENT`, `MODERATOR`, `ADMIN`).

---

## 🚀 Quick Start (Local Development)

### 1. Prerequisites
- Node.js >= 20.0.0
- npm >= 10.0.0
- PostgreSQL & Redis (or Docker Compose)

### 2. Install Dependencies
```bash
npm install
```

### 3. Configure Environment Variables
Copy `.env.example` to `.env` in the root or `apps/api`:
```bash
cp .env.example .env
```

### 4. Database Setup & Seeding
Start PostgreSQL and Redis (e.g. via `docker compose up postgres redis -d` or your local instances), then run:
```bash
# Generate Prisma client
npm run db:generate

# Push schema or run migrations
npm run db:push

# Seed realistic consenting contestants, initial battles, and admin accounts
npm run db:seed
```

### 5. Start Development Servers
```bash
# Start both API (port 4000) and Next.js Web (port 3000)
npm run dev

# Or start individually:
npm run dev:api
npm run dev:web
```

---

## 🔑 Demo Accounts

| Role | Email | Password |
|---|---|---|
| **Admin** | `admin@campusface.edu` | `CampusFace2026!` |
| **Moderator** | `moderator@campusface.edu` | `CampusFace2026!` |
| **Voter** | `student.voter@campusface.edu` | `CampusFace2026!` |

---

## 🧪 Testing & Quality Assurance

### Run Automated Tests
```bash
npm test
```
Includes:
- Voting transaction atomicity and duplicate rejection
- Idempotency key replay verification
- Self-voting prevention
- Contestant consent withdrawal delisting checks
- XSS and abusive content sanitization
- Leaderboard caching and aggregate reconciliation

### Run Load Testing (k6)
```bash
k6 run tests/load/k6-battle-vote.js
```

---

## 🔒 Privacy & Consent Compliance

1. **Zero Scraping Policy**: No media is scraped or harvested. All student profiles must sign the consent agreement (`CURRENT_CONSENT_VERSION = 'v1.0'`).
2. **Immediate Consent Revocation**: When a student clicks **Withdraw Consent**, their profile is immediately marked `WITHDRAWN`, all active battles featuring them are closed, and cached leaderboard rankings are cleared.
3. **Ballot Secrecy**: Individual user voting history is never displayed publicly.

---

## 🐳 Docker Deployment

```bash
docker compose up --build -d
```
Starts PostgreSQL, Redis, Fastify API (`http://localhost:4000`), and Next.js Web (`http://localhost:3000`).
