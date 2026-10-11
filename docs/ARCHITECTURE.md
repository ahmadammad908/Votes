# CampusFace architecture (Phase 1)

## Shape
A **modular monolith**: one Fastify API (`apps/api`), one Next.js app (`apps/web`, Phase 2+),
and a separate **worker process** from the same codebase (queue consumers). Workers scale
independently of the API. PostgreSQL is the single source of truth; Redis is a cache,
rate-limit store and queue backend only and is never trusted for vote state.

```
Browser -> CDN/WAF -> Next.js (SSR/static)  -> API (Fastify, stateless, N instances) -> PostgreSQL
                  \-> images via CDN from S3 storage                              \-> Redis (cache, limits, queue)
                                                         Workers -> leaderboard, moderation, image jobs
```

## Data model and integrity
See `apps/api/prisma/schema.prisma` and `migrations/0001_init/migration.sql`.

| Rule | Enforced by |
|---|---|
| One vote per user per battle | `UNIQUE(user_id, battle_id)` |
| Idempotent retries | `UNIQUE(user_id, idempotency_key)`; same key returns the stored result |
| Selected student is a contestant, approved, consented, not the voter; battle OPEN | `BEFORE INSERT` trigger on `votes` (with `FOR SHARE` locks so closing a battle or withdrawing consent serialises with in-flight votes) |
| No self-pairing or reversed duplicate pairs | `CHECK (contestant_a_id < contestant_b_id)` + `UNIQUE(a, b)`; app inserts `LEAST/GREATEST` |
| Public profile implies active consent + photo | `CHECK` on `students` (withdrawal must also move `profile_status` off `APPROVED` in the same UPDATE) |
| Votes are an audit record | immutable trigger; all FKs `RESTRICT` (only `sessions` cascade) |
| Lowercase emails, bounded text | `CHECK` constraints |

Prisma does not model CHECKs or triggers: they live in raw SQL and must be preserved by future migrations.
`reports.target_id` is polymorphic and deliberately has no FK; the API validates the target.

Added beyond the spec, with justification: `sessions` (server-side sessions with hashed tokens, revocable),
`audit_logs` (admin/moderation accountability), `student_vote_totals` (pre-aggregated leaderboard),
`consent_records.evidence_ref` (pointer to the documented permission, never its contents),
`students.selection_key` (see below).

## Battle selection (design; implemented in Phase 3)
- Each student has a random `selection_key` in [0,1), indexed with `(profile_status, consent_status, selection_key)`.
- To pick a pair: draw `r = random()`, take eligible students with `selection_key >= r` ordered by key, `LIMIT` a small
  candidate window (wrap around to the start if fewer than needed), then choose two and `INSERT ... ON CONFLICT DO NOTHING`
  on the normalised pair. No `ORDER BY random()` and no quadratic pair pre-generation.
- Skip pairs the user already voted on (`NOT EXISTS` against `votes(user_id, battle_id)`), retrying a bounded number of times.
- Trade-offs: selection is only approximately uniform (gaps in the key distribution bias slightly toward students after
  large gaps; periodically re-randomising keys mitigates this). Under high traffic many users may race on the same pair;
  the unique pair index makes that safe and cheap. Fewer than two eligible students returns an empty-state response.

## Retention and deletion (policy; needs review by the university's privacy/legal contact)
- **Account deletion** tombstones the user row (email replaced, credentials cleared, status `DELETED`); it is never
  hard-deleted because votes/comments/reports reference it with `RESTRICT`. Comments are removed or anonymised.
- **Consent withdrawal** sets consent `WITHDRAWN`, profile `REMOVED`, deletes the stored photo and thumbnails, drops the
  student from the leaderboard and future battles. The `consent_records` history is retained to prove permission existed.
- **Votes** are retained as pseudonymous integrity records with no public exposure; voter identity is never shown.
- Audit logs retained for a fixed period to be set by policy. The numbers above are not decided here.

## Status
Implemented in Phase 1: repo layout, schema, migration, local compose, env template, CI, constraint tests.
**Not yet run:** no network, Docker or PostgreSQL were available in the authoring sandbox, so dependencies are not
installed, no lockfile exists, the migration has not been applied, and the tests have not been executed.
Not started: API, web app, auth, workers, infrastructure code.
