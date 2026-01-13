CREATE TYPE "public"."document_status" AS ENUM('uploaded', 'processing', 'completed', 'failed');--> statement-breakpoint
CREATE TYPE "public"."education_level" AS ENUM('high_school', 'bachelor', 'master', 'phd', 'other');--> statement-breakpoint
CREATE TYPE "public"."immigration_pathway" AS ENUM('express_entry', 'study_permit', 'family_sponsorship', 'other');--> statement-breakpoint
CREATE TYPE "public"."knowledge_category" AS ENUM('express_entry', 'study_permit', 'work_permit', 'family_sponsorship', 'provincial_nominee', 'documents', 'fees', 'timeline', 'other');--> statement-breakpoint
CREATE TYPE "public"."language" AS ENUM('ar', 'en');--> statement-breakpoint
CREATE TYPE "public"."language_proficiency" AS ENUM('none', 'basic', 'intermediate', 'advanced', 'native');--> statement-breakpoint
CREATE TYPE "public"."marital_status" AS ENUM('single', 'married', 'divorced', 'widowed');--> statement-breakpoint
CREATE TYPE "public"."message_role" AS ENUM('user', 'assistant', 'system');--> statement-breakpoint
CREATE TYPE "public"."role" AS ENUM('user', 'admin');--> statement-breakpoint
CREATE TYPE "public"."sender_type" AS ENUM('user', 'agent', 'bot');--> statement-breakpoint
CREATE TYPE "public"."sop_status" AS ENUM('draft', 'generated', 'revised', 'final');--> statement-breakpoint
CREATE TYPE "public"."subscription_status" AS ENUM('active', 'canceled', 'expired');--> statement-breakpoint
CREATE TYPE "public"."subscription_tier" AS ENUM('free', 'essential', 'premium', 'vip');--> statement-breakpoint
CREATE TYPE "public"."ticket_priority" AS ENUM('low', 'medium', 'high', 'urgent');--> statement-breakpoint
CREATE TYPE "public"."ticket_status" AS ENUM('open', 'in_progress', 'waiting_user', 'resolved', 'closed');--> statement-breakpoint
CREATE TABLE "conversations" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"title" varchar(255),
	"language" "language" DEFAULT 'ar' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "crs_assessments" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"age" integer,
	"education_level" varchar(100),
	"canadian_education" boolean DEFAULT false,
	"first_language_score" json,
	"second_language_score" json,
	"canadian_work_experience" integer,
	"foreign_work_experience" integer,
	"has_spouse" boolean DEFAULT false,
	"spouse_education" varchar(100),
	"spouse_language_score" json,
	"spouse_canadian_work_experience" integer,
	"has_sibling_in_canada" boolean DEFAULT false,
	"has_french_language_skills" boolean DEFAULT false,
	"has_provincial_nomination" boolean DEFAULT false,
	"has_job_offer" boolean DEFAULT false,
	"has_canadian_study_experience" boolean DEFAULT false,
	"total_score" integer NOT NULL,
	"core_score" integer,
	"spouse_score" integer,
	"skill_transferability_score" integer,
	"additional_score" integer,
	"recommendations" json,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "document_checklists" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"source_country" varchar(100) NOT NULL,
	"immigration_pathway" varchar(100) NOT NULL,
	"items" json NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "documents" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"checklist_id" integer,
	"document_type" varchar(100) NOT NULL,
	"file_name" varchar(255) NOT NULL,
	"file_key" varchar(500) NOT NULL,
	"file_url" text NOT NULL,
	"mime_type" varchar(100),
	"file_size" integer,
	"ocr_processed" boolean DEFAULT false,
	"ocr_text" text,
	"translated_text" text,
	"status" "document_status" DEFAULT 'uploaded' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "guides" (
	"id" serial PRIMARY KEY NOT NULL,
	"slug" varchar(255) NOT NULL,
	"title_en" varchar(500) NOT NULL,
	"title_ar" varchar(500) NOT NULL,
	"content_en" text NOT NULL,
	"content_ar" text NOT NULL,
	"category" varchar(100) NOT NULL,
	"tags" json,
	"meta_description_en" text,
	"meta_description_ar" text,
	"is_published" boolean DEFAULT false NOT NULL,
	"published_at" timestamp with time zone,
	"version" integer DEFAULT 1 NOT NULL,
	"last_reviewed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "guides_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "knowledge_base" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" varchar(500) NOT NULL,
	"content" text NOT NULL,
	"content_ar" text,
	"category" "knowledge_category" NOT NULL,
	"source_country" varchar(100),
	"embedding" json,
	"source_url" text,
	"last_verified" timestamp with time zone,
	"version" integer DEFAULT 1 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "messages" (
	"id" serial PRIMARY KEY NOT NULL,
	"conversation_id" integer NOT NULL,
	"role" "message_role" NOT NULL,
	"content" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sop_generations" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"background" text,
	"education" text,
	"work_experience" text,
	"motivations" text,
	"goals" text,
	"why_canada" text,
	"additional_info" text,
	"generated_sop" text,
	"version" integer DEFAULT 1 NOT NULL,
	"language" "language" DEFAULT 'en' NOT NULL,
	"quality_score" integer,
	"suggestions" json,
	"status" "sop_status" DEFAULT 'draft' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "support_messages" (
	"id" serial PRIMARY KEY NOT NULL,
	"ticket_id" integer NOT NULL,
	"sender_type" "sender_type" NOT NULL,
	"sender_name" varchar(255),
	"content" text NOT NULL,
	"is_automated" boolean DEFAULT false,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "support_tickets" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"subject" varchar(500),
	"status" "ticket_status" DEFAULT 'open' NOT NULL,
	"priority" "ticket_priority" DEFAULT 'medium' NOT NULL,
	"whatsapp_number" varchar(50),
	"whatsapp_conversation_id" varchar(255),
	"assigned_to_agent" varchar(255),
	"last_message_at" timestamp with time zone,
	"resolved_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "usage_tracking" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"chat_messages_count" integer DEFAULT 0 NOT NULL,
	"sop_generations_count" integer DEFAULT 0 NOT NULL,
	"document_uploads_count" integer DEFAULT 0 NOT NULL,
	"crs_calculations_count" integer DEFAULT 0 NOT NULL,
	"period_start" timestamp with time zone NOT NULL,
	"period_end" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_profiles" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"date_of_birth" timestamp with time zone,
	"nationality" varchar(100),
	"source_country" varchar(100),
	"current_country" varchar(100),
	"marital_status" "marital_status",
	"education_level" "education_level",
	"field_of_study" varchar(255),
	"years_of_experience" integer,
	"current_occupation" varchar(255),
	"noc_code" varchar(10),
	"english_level" "language_proficiency",
	"french_level" "language_proficiency",
	"ielts_score" numeric(3, 1),
	"tef_score" numeric(3, 1),
	"target_destination" varchar(100) DEFAULT 'Canada' NOT NULL,
	"immigration_pathway" "immigration_pathway",
	"profile_completeness" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"auth_id" uuid NOT NULL,
	"name" text,
	"email" varchar(320),
	"role" "role" DEFAULT 'user' NOT NULL,
	"subscription_tier" "subscription_tier" DEFAULT 'free' NOT NULL,
	"subscription_status" "subscription_status" DEFAULT 'active' NOT NULL,
	"subscription_expires_at" timestamp with time zone,
	"stripe_customer_id" varchar(255),
	"stripe_subscription_id" varchar(255),
	"preferred_language" "language" DEFAULT 'ar' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"last_signed_in" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_auth_id_unique" UNIQUE("auth_id")
);
--> statement-breakpoint
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "crs_assessments" ADD CONSTRAINT "crs_assessments_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "document_checklists" ADD CONSTRAINT "document_checklists_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "documents" ADD CONSTRAINT "documents_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "documents" ADD CONSTRAINT "documents_checklist_id_document_checklists_id_fk" FOREIGN KEY ("checklist_id") REFERENCES "public"."document_checklists"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "messages" ADD CONSTRAINT "messages_conversation_id_conversations_id_fk" FOREIGN KEY ("conversation_id") REFERENCES "public"."conversations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sop_generations" ADD CONSTRAINT "sop_generations_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "support_messages" ADD CONSTRAINT "support_messages_ticket_id_support_tickets_id_fk" FOREIGN KEY ("ticket_id") REFERENCES "public"."support_tickets"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "support_tickets" ADD CONSTRAINT "support_tickets_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "usage_tracking" ADD CONSTRAINT "usage_tracking_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_profiles" ADD CONSTRAINT "user_profiles_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;