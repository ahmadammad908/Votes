-- CampusFace Initial PostgreSQL Migration
-- Enables UUID generation and sets up schema with strict constraints

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create Enums
CREATE TYPE "UserRole" AS ENUM ('STUDENT', 'MODERATOR', 'ADMIN');
CREATE TYPE "AccountStatus" AS ENUM ('ACTIVE', 'SUSPENDED', 'DELETED');
CREATE TYPE "ConsentStatus" AS ENUM ('PENDING', 'ACTIVE', 'WITHDRAWN');
CREATE TYPE "ProfileStatus" AS ENUM ('PENDING', 'APPROVED', 'SUSPENDED', 'REMOVED');
CREATE TYPE "BattleStatus" AS ENUM ('ACTIVE', 'CLOSED', 'ARCHIVED');
CREATE TYPE "ModerationStatus" AS ENUM ('VISIBLE', 'HIDDEN', 'REMOVED', 'FLAGGED');
CREATE TYPE "ReportTargetType" AS ENUM ('COMMENT', 'STUDENT', 'BATTLE');
CREATE TYPE "ReportStatus" AS ENUM ('PENDING', 'INVESTIGATING', 'RESOLVED', 'DISMISSED');

-- Create Users Table
CREATE TABLE "users" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "email" VARCHAR(255) NOT NULL,
    "password_hash" VARCHAR(255) NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'STUDENT',
    "account_status" "AccountStatus" NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- Create Students Table
CREATE TABLE "students" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "user_id" UUID,
    "display_name" VARCHAR(100) NOT NULL,
    "department" VARCHAR(150),
    "image_storage_key" VARCHAR(500) NOT NULL,
    "image_url" VARCHAR(1000),
    "consent_status" "ConsentStatus" NOT NULL DEFAULT 'PENDING',
    "consent_recorded_at" TIMESTAMP(3),
    "profile_status" "ProfileStatus" NOT NULL DEFAULT 'PENDING',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "students_pkey" PRIMARY KEY ("id")
);

-- Create Battles Table with check constraint
CREATE TABLE "battles" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "contestant_a_id" UUID NOT NULL,
    "contestant_b_id" UUID NOT NULL,
    "status" "BattleStatus" NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "closed_at" TIMESTAMP(3),

    CONSTRAINT "battles_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "battles_contestants_distinct_check" CHECK ("contestant_a_id" <> "contestant_b_id")
);

-- Create Votes Table
CREATE TABLE "votes" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "user_id" UUID NOT NULL,
    "battle_id" UUID NOT NULL,
    "selected_student_id" UUID NOT NULL,
    "idempotency_key" VARCHAR(128) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "votes_pkey" PRIMARY KEY ("id")
);

-- Create Comments Table
CREATE TABLE "comments" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "user_id" UUID NOT NULL,
    "battle_id" UUID NOT NULL,
    "body" TEXT NOT NULL,
    "moderation_status" "ModerationStatus" NOT NULL DEFAULT 'VISIBLE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "comments_pkey" PRIMARY KEY ("id")
);

-- Create Reports Table
CREATE TABLE "reports" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "reporter_user_id" UUID NOT NULL,
    "target_type" "ReportTargetType" NOT NULL,
    "target_id" UUID NOT NULL,
    "reason" VARCHAR(500) NOT NULL,
    "status" "ReportStatus" NOT NULL DEFAULT 'PENDING',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolved_at" TIMESTAMP(3),

    CONSTRAINT "reports_pkey" PRIMARY KEY ("id")
);

-- Create Consent Records Table
CREATE TABLE "consent_records" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "student_id" UUID NOT NULL,
    "consent_version" VARCHAR(50) NOT NULL,
    "terms_text" TEXT NOT NULL,
    "status" "ConsentStatus" NOT NULL DEFAULT 'ACTIVE',
    "ip_address_hash" VARCHAR(128),
    "recorded_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "withdrawn_at" TIMESTAMP(3),

    CONSTRAINT "consent_records_pkey" PRIMARY KEY ("id")
);

-- Create Leaderboard Aggregates Table
CREATE TABLE "leaderboard_aggregates" (
    "student_id" UUID NOT NULL,
    "total_votes" INTEGER NOT NULL DEFAULT 0,
    "rank" INTEGER NOT NULL DEFAULT 0,
    "last_reconciled_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "leaderboard_aggregates_pkey" PRIMARY KEY ("student_id"),
    CONSTRAINT "leaderboard_total_votes_positive_check" CHECK ("total_votes" >= 0)
);

-- Create Audit Logs Table
CREATE TABLE "audit_logs" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "actor_user_id" UUID,
    "action" VARCHAR(100) NOT NULL,
    "target_entity" VARCHAR(50) NOT NULL,
    "target_id" VARCHAR(100),
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- Unique Constraints
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");
CREATE UNIQUE INDEX "students_user_id_key" ON "students"("user_id");
CREATE UNIQUE INDEX "votes_idempotency_key_key" ON "votes"("idempotency_key");
CREATE UNIQUE INDEX "votes_user_id_battle_id_key" ON "votes"("user_id", "battle_id");

-- Indexes for Fast Querying and Scaling
CREATE INDEX "students_profile_status_consent_status_idx" ON "students"("profile_status", "consent_status");
CREATE INDEX "students_display_name_idx" ON "students"("display_name");
CREATE INDEX "battles_status_created_at_idx" ON "battles"("status", "created_at" DESC);
CREATE INDEX "battles_contestant_a_id_idx" ON "battles"("contestant_a_id");
CREATE INDEX "battles_contestant_b_id_idx" ON "battles"("contestant_b_id");
CREATE INDEX "votes_battle_id_idx" ON "votes"("battle_id");
CREATE INDEX "votes_selected_student_id_idx" ON "votes"("selected_student_id");
CREATE INDEX "votes_user_id_idx" ON "votes"("user_id");
CREATE INDEX "comments_battle_id_created_at_idx" ON "comments"("battle_id", "created_at" DESC);
CREATE INDEX "comments_user_id_idx" ON "comments"("user_id");
CREATE INDEX "comments_moderation_status_idx" ON "comments"("moderation_status");
CREATE INDEX "reports_status_created_at_idx" ON "reports"("status", "created_at" DESC);
CREATE INDEX "reports_target_type_target_id_idx" ON "reports"("target_type", "target_id");
CREATE INDEX "consent_records_student_id_recorded_at_idx" ON "consent_records"("student_id", "recorded_at" DESC);
CREATE INDEX "leaderboard_aggregates_total_votes_idx" ON "leaderboard_aggregates"("total_votes" DESC);
CREATE INDEX "audit_logs_target_entity_target_id_idx" ON "audit_logs"("target_entity", "target_id");
CREATE INDEX "audit_logs_created_at_idx" ON "audit_logs"("created_at" DESC);

-- Foreign Key Constraints
ALTER TABLE "students" ADD CONSTRAINT "students_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "battles" ADD CONSTRAINT "battles_contestant_a_id_fkey" FOREIGN KEY ("contestant_a_id") REFERENCES "students"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "battles" ADD CONSTRAINT "battles_contestant_b_id_fkey" FOREIGN KEY ("contestant_b_id") REFERENCES "students"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "votes" ADD CONSTRAINT "votes_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "votes" ADD CONSTRAINT "votes_battle_id_fkey" FOREIGN KEY ("battle_id") REFERENCES "battles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "votes" ADD CONSTRAINT "votes_selected_student_id_fkey" FOREIGN KEY ("selected_student_id") REFERENCES "students"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "comments" ADD CONSTRAINT "comments_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "comments" ADD CONSTRAINT "comments_battle_id_fkey" FOREIGN KEY ("battle_id") REFERENCES "battles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "reports" ADD CONSTRAINT "reports_reporter_user_id_fkey" FOREIGN KEY ("reporter_user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "consent_records" ADD CONSTRAINT "consent_records_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "leaderboard_aggregates" ADD CONSTRAINT "leaderboard_aggregates_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_actor_user_id_fkey" FOREIGN KEY ("actor_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
