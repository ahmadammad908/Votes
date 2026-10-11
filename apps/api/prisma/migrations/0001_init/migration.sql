-- CampusFace initial schema.
-- Hand-reviewed: contains CHECK constraints and triggers that Prisma does not model.
-- NOT yet executed against a live PostgreSQL (none was available when written).

-- Enums
CREATE TYPE "user_role" AS ENUM ('USER', 'MODERATOR', 'ADMIN');
CREATE TYPE "account_status" AS ENUM ('ACTIVE', 'SUSPENDED', 'DELETED');
CREATE TYPE "consent_status" AS ENUM ('PENDING', 'ACTIVE', 'WITHDRAWN');
CREATE TYPE "profile_status" AS ENUM ('DRAFT', 'PENDING_REVIEW', 'APPROVED', 'SUSPENDED', 'REMOVED');
CREATE TYPE "battle_status" AS ENUM ('OPEN', 'CLOSED', 'VOID');
CREATE TYPE "moderation_status" AS ENUM ('PENDING', 'VISIBLE', 'HIDDEN', 'REMOVED');
CREATE TYPE "report_target_type" AS ENUM ('COMMENT', 'STUDENT', 'BATTLE');
CREATE TYPE "report_status" AS ENUM ('OPEN', 'RESOLVED', 'DISMISSED');

-- users
CREATE TABLE "users" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "email" TEXT NOT NULL,
  "password_hash" TEXT,
  "external_auth_id" TEXT,
  "role" "user_role" NOT NULL DEFAULT 'USER',
  "account_status" "account_status" NOT NULL DEFAULT 'ACTIVE',
  "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "users_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "users_email_lowercase_chk" CHECK ("email" = lower("email")),
  -- Deleted accounts are tombstoned (credentials cleared); live accounts need a credential.
  CONSTRAINT "users_credential_chk" CHECK (
    "account_status" = 'DELETED' OR "password_hash" IS NOT NULL OR "external_auth_id" IS NOT NULL
  )
);
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");
CREATE UNIQUE INDEX "users_external_auth_id_key" ON "users"("external_auth_id");

-- sessions
CREATE TABLE "sessions" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "user_id" UUID NOT NULL,
  "token_hash" TEXT NOT NULL,
  "expires_at" TIMESTAMPTZ(3) NOT NULL,
  "revoked_at" TIMESTAMPTZ(3),
  "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "sessions_token_hash_key" ON "sessions"("token_hash");
CREATE INDEX "sessions_user_id_idx" ON "sessions"("user_id");
CREATE INDEX "sessions_expires_at_idx" ON "sessions"("expires_at");

-- students
CREATE TABLE "students" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "user_id" UUID,
  "display_name" TEXT NOT NULL,
  "department" TEXT,
  "image_storage_key" TEXT,
  "consent_status" "consent_status" NOT NULL DEFAULT 'PENDING',
  "consent_recorded_at" TIMESTAMPTZ(3),
  "profile_status" "profile_status" NOT NULL DEFAULT 'DRAFT',
  "selection_key" DOUBLE PRECISION NOT NULL DEFAULT random(),
  "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "students_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "students_display_name_chk" CHECK (char_length(btrim("display_name")) BETWEEN 1 AND 80),
  -- A profile can only be public if consent is active and a photo exists.
  -- Withdrawal must therefore move profile_status off APPROVED in the same UPDATE.
  CONSTRAINT "students_approved_requires_consent_chk" CHECK (
    "profile_status" <> 'APPROVED'
    OR ("consent_status" = 'ACTIVE' AND "image_storage_key" IS NOT NULL)
  )
);
CREATE UNIQUE INDEX "students_user_id_key" ON "students"("user_id");
CREATE INDEX "students_profile_status_consent_status_selection_key_idx"
  ON "students"("profile_status", "consent_status", "selection_key");

-- battles
CREATE TABLE "battles" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "contestant_a_id" UUID NOT NULL,
  "contestant_b_id" UUID NOT NULL,
  "status" "battle_status" NOT NULL DEFAULT 'OPEN',
  "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "closed_at" TIMESTAMPTZ(3),
  CONSTRAINT "battles_pkey" PRIMARY KEY ("id"),
  -- Normalised ordering: forbids a contestant facing themselves AND reversed duplicates.
  -- Application must insert LEAST(x,y), GREATEST(x,y).
  CONSTRAINT "battles_distinct_ordered_chk" CHECK ("contestant_a_id" < "contestant_b_id"),
  CONSTRAINT "battles_closed_consistency_chk" CHECK (
    ("status" = 'OPEN' AND "closed_at" IS NULL) OR ("status" <> 'OPEN' AND "closed_at" IS NOT NULL)
  )
);
CREATE UNIQUE INDEX "battles_contestant_a_id_contestant_b_id_key" ON "battles"("contestant_a_id", "contestant_b_id");
CREATE INDEX "battles_contestant_b_id_idx" ON "battles"("contestant_b_id");
CREATE INDEX "battles_status_created_at_idx" ON "battles"("status", "created_at");

-- votes
CREATE TABLE "votes" (
  "id" BIGSERIAL NOT NULL,
  "user_id" UUID NOT NULL,
  "battle_id" UUID NOT NULL,
  "selected_student_id" UUID NOT NULL,
  "idempotency_key" TEXT NOT NULL,
  "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "votes_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "votes_idempotency_key_chk" CHECK (char_length("idempotency_key") BETWEEN 16 AND 128)
);
CREATE UNIQUE INDEX "votes_user_id_battle_id_key" ON "votes"("user_id", "battle_id");
CREATE UNIQUE INDEX "votes_user_id_idempotency_key_key" ON "votes"("user_id", "idempotency_key");
CREATE INDEX "votes_battle_id_selected_student_id_idx" ON "votes"("battle_id", "selected_student_id");
CREATE INDEX "votes_selected_student_id_idx" ON "votes"("selected_student_id");

-- comments
CREATE TABLE "comments" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "user_id" UUID NOT NULL,
  "battle_id" UUID NOT NULL,
  "body" TEXT NOT NULL,
  "moderation_status" "moderation_status" NOT NULL DEFAULT 'VISIBLE',
  "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "comments_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "comments_body_length_chk" CHECK (char_length(btrim("body")) BETWEEN 1 AND 1000)
);
CREATE INDEX "comments_battle_id_created_at_id_idx" ON "comments"("battle_id", "created_at" DESC, "id" DESC);
CREATE INDEX "comments_user_id_created_at_idx" ON "comments"("user_id", "created_at");
CREATE INDEX "comments_moderation_status_created_at_idx" ON "comments"("moderation_status", "created_at");

-- reports (target_id is polymorphic, intentionally no FK)
CREATE TABLE "reports" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "reporter_user_id" UUID NOT NULL,
  "target_type" "report_target_type" NOT NULL,
  "target_id" UUID NOT NULL,
  "reason" TEXT NOT NULL,
  "status" "report_status" NOT NULL DEFAULT 'OPEN',
  "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "resolved_at" TIMESTAMPTZ(3),
  CONSTRAINT "reports_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "reports_reason_length_chk" CHECK (char_length(btrim("reason")) BETWEEN 1 AND 2000),
  CONSTRAINT "reports_resolved_consistency_chk" CHECK (
    ("status" = 'OPEN' AND "resolved_at" IS NULL) OR ("status" <> 'OPEN' AND "resolved_at" IS NOT NULL)
  )
);
CREATE INDEX "reports_status_created_at_idx" ON "reports"("status", "created_at");
CREATE INDEX "reports_target_type_target_id_idx" ON "reports"("target_type", "target_id");

-- consent_records (append-only history)
CREATE TABLE "consent_records" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "student_id" UUID NOT NULL,
  "consent_version" TEXT NOT NULL,
  "status" "consent_status" NOT NULL,
  "evidence_ref" TEXT,
  "recorded_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "withdrawn_at" TIMESTAMPTZ(3),
  CONSTRAINT "consent_records_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "consent_records_withdrawn_chk" CHECK (("status" = 'WITHDRAWN') = ("withdrawn_at" IS NOT NULL))
);
CREATE INDEX "consent_records_student_id_recorded_at_idx" ON "consent_records"("student_id", "recorded_at");

-- audit_logs
CREATE TABLE "audit_logs" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "actor_user_id" UUID,
  "action" TEXT NOT NULL,
  "target_type" TEXT NOT NULL,
  "target_id" TEXT,
  "metadata" JSONB,
  "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "audit_logs_actor_user_id_created_at_idx" ON "audit_logs"("actor_user_id", "created_at");
CREATE INDEX "audit_logs_target_type_target_id_idx" ON "audit_logs"("target_type", "target_id");

-- student_vote_totals (derived; reconcilable from votes)
CREATE TABLE "student_vote_totals" (
  "student_id" UUID NOT NULL,
  "total_votes" BIGINT NOT NULL DEFAULT 0,
  "updated_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "student_vote_totals_pkey" PRIMARY KEY ("student_id"),
  CONSTRAINT "student_vote_totals_nonneg_chk" CHECK ("total_votes" >= 0)
);
CREATE INDEX "student_vote_totals_total_votes_student_id_idx" ON "student_vote_totals"("total_votes" DESC, "student_id");

-- Foreign keys (RESTRICT everywhere except sessions: audit/vote history must never cascade away)
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "students" ADD CONSTRAINT "students_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "battles" ADD CONSTRAINT "battles_contestant_a_id_fkey" FOREIGN KEY ("contestant_a_id") REFERENCES "students"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "battles" ADD CONSTRAINT "battles_contestant_b_id_fkey" FOREIGN KEY ("contestant_b_id") REFERENCES "students"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "votes" ADD CONSTRAINT "votes_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "votes" ADD CONSTRAINT "votes_battle_id_fkey" FOREIGN KEY ("battle_id") REFERENCES "battles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "votes" ADD CONSTRAINT "votes_selected_student_id_fkey" FOREIGN KEY ("selected_student_id") REFERENCES "students"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "comments" ADD CONSTRAINT "comments_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "comments" ADD CONSTRAINT "comments_battle_id_fkey" FOREIGN KEY ("battle_id") REFERENCES "battles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "reports" ADD CONSTRAINT "reports_reporter_user_id_fkey" FOREIGN KEY ("reporter_user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "consent_records" ADD CONSTRAINT "consent_records_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_actor_user_id_fkey" FOREIGN KEY ("actor_user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "student_vote_totals" ADD CONSTRAINT "student_vote_totals_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Vote integrity trigger.
-- Guarantees, inside the inserting transaction and regardless of application bugs:
--   * the battle exists and is OPEN
--   * the selected student is one of the two contestants
--   * the selected student is APPROVED with ACTIVE consent
--   * the voter is not voting for their own profile
-- FOR SHARE locks make a concurrent battle close or consent withdrawal serialise with the vote.
CREATE FUNCTION "votes_validate"() RETURNS trigger AS $$
DECLARE
  b "battles"%ROWTYPE;
  s "students"%ROWTYPE;
BEGIN
  SELECT * INTO b FROM "battles" WHERE "id" = NEW."battle_id" FOR SHARE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'battle % not found', NEW."battle_id" USING ERRCODE = 'foreign_key_violation';
  END IF;
  IF b."status" <> 'OPEN' THEN
    RAISE EXCEPTION 'battle % is not open', NEW."battle_id" USING ERRCODE = 'check_violation';
  END IF;
  IF NEW."selected_student_id" <> b."contestant_a_id" AND NEW."selected_student_id" <> b."contestant_b_id" THEN
    RAISE EXCEPTION 'student is not a contestant in this battle' USING ERRCODE = 'check_violation';
  END IF;
  SELECT * INTO s FROM "students" WHERE "id" = NEW."selected_student_id" FOR SHARE;
  IF s."profile_status" <> 'APPROVED' OR s."consent_status" <> 'ACTIVE' THEN
    RAISE EXCEPTION 'student is not eligible' USING ERRCODE = 'check_violation';
  END IF;
  IF s."user_id" IS NOT NULL AND s."user_id" = NEW."user_id" THEN
    RAISE EXCEPTION 'users cannot vote for themselves' USING ERRCODE = 'check_violation';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER "votes_validate_trg" BEFORE INSERT ON "votes"
  FOR EACH ROW EXECUTE FUNCTION "votes_validate"();

-- Votes are an audit record: no UPDATE or DELETE (TRUNCATE is still possible for test resets).
CREATE FUNCTION "votes_immutable"() RETURNS trigger AS $$
BEGIN
  RAISE EXCEPTION 'votes are immutable' USING ERRCODE = 'restrict_violation';
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER "votes_immutable_trg" BEFORE UPDATE OR DELETE ON "votes"
  FOR EACH ROW EXECUTE FUNCTION "votes_immutable"();
