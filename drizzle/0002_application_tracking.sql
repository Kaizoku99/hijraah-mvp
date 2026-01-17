-- Migration: Application Tracking System (Phase 1)
-- This migration adds tables for tracking immigration applications,
-- milestones, deadlines, notifications, and Express Entry draws.

-- ============================================
-- ENUMS
-- ============================================

DO $$ BEGIN
    CREATE TYPE "mvp_application_status" AS ENUM (
        'not_started',
        'researching',
        'preparing_documents',
        'language_testing',
        'submitting',
        'waiting_decision',
        'approved',
        'rejected',
        'on_hold'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE "mvp_milestone_status" AS ENUM (
        'pending',
        'in_progress',
        'completed',
        'skipped',
        'blocked'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE "mvp_deadline_type" AS ENUM (
        'document_expiry',
        'application_window',
        'test_validity',
        'medical_exam',
        'biometrics',
        'interview',
        'submission',
        'custom'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE "mvp_notification_type" AS ENUM (
        'deadline_reminder',
        'draw_result',
        'policy_change',
        'document_expiry',
        'milestone_completed',
        'application_update',
        'tip'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- ============================================
-- TABLES
-- ============================================

-- Immigration Applications
CREATE TABLE IF NOT EXISTS "mvp_immigration_applications" (
    "id" serial PRIMARY KEY NOT NULL,
    "user_id" integer NOT NULL REFERENCES "mvp_users"("id") ON DELETE CASCADE,
    "target_destination" varchar(100) NOT NULL,
    "immigration_pathway" "mvp_immigration_pathway" NOT NULL,
    "status" "mvp_application_status" DEFAULT 'not_started' NOT NULL,
    "application_number" varchar(100),
    "submission_date" timestamp with time zone,
    "expected_decision_date" timestamp with time zone,
    "decision_date" timestamp with time zone,
    "notes" text,
    "metadata" json,
    "created_at" timestamp with time zone DEFAULT now() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "mvp_immigration_applications_user_id_idx" ON "mvp_immigration_applications" ("user_id");
CREATE INDEX IF NOT EXISTS "mvp_immigration_applications_status_idx" ON "mvp_immigration_applications" ("status");

-- Application Milestones
CREATE TABLE IF NOT EXISTS "mvp_application_milestones" (
    "id" serial PRIMARY KEY NOT NULL,
    "application_id" integer NOT NULL REFERENCES "mvp_immigration_applications"("id") ON DELETE CASCADE,
    "title" varchar(255) NOT NULL,
    "title_ar" varchar(255),
    "description" text,
    "description_ar" text,
    "status" "mvp_milestone_status" DEFAULT 'pending' NOT NULL,
    "order" integer DEFAULT 0 NOT NULL,
    "due_date" timestamp with time zone,
    "completed_at" timestamp with time zone,
    "metadata" json,
    "created_at" timestamp with time zone DEFAULT now() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "mvp_application_milestones_application_id_idx" ON "mvp_application_milestones" ("application_id");
CREATE INDEX IF NOT EXISTS "mvp_application_milestones_status_idx" ON "mvp_application_milestones" ("status");

-- Deadlines
CREATE TABLE IF NOT EXISTS "mvp_deadlines" (
    "id" serial PRIMARY KEY NOT NULL,
    "user_id" integer NOT NULL REFERENCES "mvp_users"("id") ON DELETE CASCADE,
    "application_id" integer REFERENCES "mvp_immigration_applications"("id") ON DELETE CASCADE,
    "document_id" integer REFERENCES "mvp_documents"("id") ON DELETE CASCADE,
    "type" "mvp_deadline_type" NOT NULL,
    "title" varchar(255) NOT NULL,
    "title_ar" varchar(255),
    "description" text,
    "description_ar" text,
    "due_date" timestamp with time zone NOT NULL,
    "reminder_days" json DEFAULT '[30, 14, 7, 1]',
    "is_completed" boolean DEFAULT false NOT NULL,
    "completed_at" timestamp with time zone,
    "is_recurring" boolean DEFAULT false NOT NULL,
    "recurring_interval_months" integer,
    "metadata" json,
    "created_at" timestamp with time zone DEFAULT now() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "mvp_deadlines_user_id_idx" ON "mvp_deadlines" ("user_id");
CREATE INDEX IF NOT EXISTS "mvp_deadlines_due_date_idx" ON "mvp_deadlines" ("due_date");
CREATE INDEX IF NOT EXISTS "mvp_deadlines_type_idx" ON "mvp_deadlines" ("type");

-- Notifications
CREATE TABLE IF NOT EXISTS "mvp_notifications" (
    "id" serial PRIMARY KEY NOT NULL,
    "user_id" integer NOT NULL REFERENCES "mvp_users"("id") ON DELETE CASCADE,
    "type" "mvp_notification_type" NOT NULL,
    "title" varchar(255) NOT NULL,
    "title_ar" varchar(255),
    "message" text NOT NULL,
    "message_ar" text,
    "link" varchar(500),
    "is_read" boolean DEFAULT false NOT NULL,
    "read_at" timestamp with time zone,
    "metadata" json,
    "created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "mvp_notifications_user_id_idx" ON "mvp_notifications" ("user_id");
CREATE INDEX IF NOT EXISTS "mvp_notifications_is_read_idx" ON "mvp_notifications" ("is_read");
CREATE INDEX IF NOT EXISTS "mvp_notifications_type_idx" ON "mvp_notifications" ("type");

-- Express Entry Draws
CREATE TABLE IF NOT EXISTS "mvp_express_entry_draws" (
    "id" serial PRIMARY KEY NOT NULL,
    "draw_number" integer NOT NULL UNIQUE,
    "draw_date" timestamp with time zone NOT NULL,
    "draw_type" varchar(100) NOT NULL,
    "invitations_issued" integer NOT NULL,
    "crs_minimum" integer NOT NULL,
    "tie_breaking_rule" timestamp with time zone,
    "notes" text,
    "metadata" json,
    "created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "mvp_express_entry_draws_draw_date_idx" ON "mvp_express_entry_draws" ("draw_date");
CREATE INDEX IF NOT EXISTS "mvp_express_entry_draws_draw_type_idx" ON "mvp_express_entry_draws" ("draw_type");
