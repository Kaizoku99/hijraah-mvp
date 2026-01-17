CREATE TYPE "public"."mvp_document_status" AS ENUM('uploaded', 'processing', 'completed', 'failed');--> statement-breakpoint
CREATE TYPE "public"."mvp_education_level" AS ENUM('high_school', 'bachelor', 'master', 'phd', 'other');--> statement-breakpoint
CREATE TYPE "public"."mvp_immigration_pathway" AS ENUM('express_entry', 'study_permit', 'family_sponsorship', 'skilled_independent', 'state_nominated', 'study_visa', 'd1_subordinate_work', 'd2_independent_entrepreneur', 'd7_passive_income', 'd8_digital_nomad', 'job_seeker_pt', 'other');--> statement-breakpoint
CREATE TYPE "public"."mvp_knowledge_category" AS ENUM('express_entry', 'study_permit', 'work_permit', 'family_sponsorship', 'provincial_nominee', 'documents', 'fees', 'timeline', 'other');--> statement-breakpoint
CREATE TYPE "public"."mvp_language" AS ENUM('ar', 'en');--> statement-breakpoint
CREATE TYPE "public"."mvp_language_proficiency" AS ENUM('none', 'basic', 'intermediate', 'advanced', 'native');--> statement-breakpoint
CREATE TYPE "public"."mvp_marital_status" AS ENUM('single', 'married', 'divorced', 'widowed');--> statement-breakpoint
CREATE TYPE "public"."mvp_message_role" AS ENUM('user', 'assistant', 'system');--> statement-breakpoint
CREATE TYPE "public"."mvp_role" AS ENUM('user', 'admin');--> statement-breakpoint
CREATE TYPE "public"."mvp_sender_type" AS ENUM('user', 'agent', 'bot');--> statement-breakpoint
CREATE TYPE "public"."mvp_sop_status" AS ENUM('draft', 'generated', 'revised', 'final');--> statement-breakpoint
CREATE TYPE "public"."mvp_subscription_status" AS ENUM('active', 'canceled', 'expired');--> statement-breakpoint
CREATE TYPE "public"."mvp_subscription_tier" AS ENUM('free', 'essential', 'premium', 'vip');--> statement-breakpoint
CREATE TYPE "public"."mvp_ticket_priority" AS ENUM('low', 'medium', 'high', 'urgent');--> statement-breakpoint
CREATE TYPE "public"."mvp_ticket_status" AS ENUM('open', 'in_progress', 'waiting_user', 'resolved', 'closed');--> statement-breakpoint
CREATE TABLE "mvp_australia_assessments" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"age_score" integer DEFAULT 0 NOT NULL,
	"english_score" integer DEFAULT 0 NOT NULL,
	"overseas_experience_score" integer DEFAULT 0 NOT NULL,
	"australian_experience_score" integer DEFAULT 0 NOT NULL,
	"education_score" integer DEFAULT 0 NOT NULL,
	"specialist_education_score" integer DEFAULT 0 NOT NULL,
	"australian_study_score" integer DEFAULT 0 NOT NULL,
	"professional_year_score" integer DEFAULT 0 NOT NULL,
	"community_language_score" integer DEFAULT 0 NOT NULL,
	"regional_study_score" integer DEFAULT 0 NOT NULL,
	"partner_score" integer DEFAULT 0 NOT NULL,
	"nomination_score" integer DEFAULT 0 NOT NULL,
	"total_score" integer NOT NULL,
	"breakdown" json,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "mvp_conversations" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"title" varchar(255),
	"language" "mvp_language" DEFAULT 'ar' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "mvp_crs_assessments" (
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
CREATE TABLE "mvp_document_checklists" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"source_country" varchar(100) NOT NULL,
	"immigration_pathway" varchar(100) NOT NULL,
	"items" json NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "mvp_documents" (
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
	"status" "mvp_document_status" DEFAULT 'uploaded' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "mvp_guides" (
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
	CONSTRAINT "mvp_guides_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "mvp_knowledge_base" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" varchar(500) NOT NULL,
	"content" text NOT NULL,
	"content_ar" text,
	"category" "mvp_knowledge_category" NOT NULL,
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
CREATE TABLE "mvp_memory_messages" (
	"id" serial PRIMARY KEY NOT NULL,
	"chat_id" text NOT NULL,
	"user_id" text,
	"role" text NOT NULL,
	"content" text NOT NULL,
	"timestamp" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "mvp_messages" (
	"id" serial PRIMARY KEY NOT NULL,
	"conversation_id" integer NOT NULL,
	"role" "mvp_message_role" NOT NULL,
	"content" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "mvp_portugal_assessments" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"visa_type" varchar(50) NOT NULL,
	"eligibility_status" varchar(50),
	"monthly_income" numeric(10, 2),
	"income_source" varchar(100),
	"dependents_count" integer DEFAULT 0,
	"employment_type" varchar(50),
	"has_business_plan" boolean DEFAULT false,
	"has_investment_proof" boolean DEFAULT false,
	"investment_amount" numeric(12, 2),
	"has_remote_contract" boolean DEFAULT false,
	"employer_country" varchar(100),
	"has_accommodation" boolean DEFAULT false,
	"has_criminal_record" boolean DEFAULT false,
	"has_health_insurance" boolean DEFAULT false,
	"breakdown" json,
	"recommendations" json,
	"missing_requirements" json,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "mvp_sop_generations" (
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
	"language" "mvp_language" DEFAULT 'en' NOT NULL,
	"quality_score" integer,
	"suggestions" json,
	"status" "mvp_sop_status" DEFAULT 'draft' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "mvp_support_messages" (
	"id" serial PRIMARY KEY NOT NULL,
	"ticket_id" integer NOT NULL,
	"sender_type" "mvp_sender_type" NOT NULL,
	"sender_name" varchar(255),
	"content" text NOT NULL,
	"is_automated" boolean DEFAULT false,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "mvp_support_tickets" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"subject" varchar(500),
	"status" "mvp_ticket_status" DEFAULT 'open' NOT NULL,
	"priority" "mvp_ticket_priority" DEFAULT 'medium' NOT NULL,
	"whatsapp_number" varchar(50),
	"whatsapp_conversation_id" varchar(255),
	"assigned_to_agent" varchar(255),
	"last_message_at" timestamp with time zone,
	"resolved_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "mvp_usage_tracking" (
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
CREATE TABLE "mvp_user_profiles" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"date_of_birth" timestamp with time zone,
	"nationality" varchar(100),
	"source_country" varchar(100),
	"current_country" varchar(100),
	"marital_status" "mvp_marital_status",
	"education_level" "mvp_education_level",
	"field_of_study" varchar(255),
	"years_of_experience" integer,
	"current_occupation" varchar(255),
	"noc_code" varchar(10),
	"english_level" "mvp_language_proficiency",
	"french_level" "mvp_language_proficiency",
	"ielts_score" numeric(3, 1),
	"tef_score" numeric(3, 1),
	"target_destination" varchar(100) DEFAULT 'Canada' NOT NULL,
	"immigration_pathway" "mvp_immigration_pathway",
	"profile_completeness" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "mvp_users" (
	"id" serial PRIMARY KEY NOT NULL,
	"auth_id" uuid NOT NULL,
	"name" text,
	"email" varchar(320),
	"role" "mvp_role" DEFAULT 'user' NOT NULL,
	"subscription_tier" "mvp_subscription_tier" DEFAULT 'free' NOT NULL,
	"subscription_status" "mvp_subscription_status" DEFAULT 'active' NOT NULL,
	"subscription_expires_at" timestamp with time zone,
	"stripe_customer_id" varchar(255),
	"stripe_subscription_id" varchar(255),
	"preferred_language" "mvp_language" DEFAULT 'ar' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"last_signed_in" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "mvp_users_auth_id_unique" UNIQUE("auth_id")
);
--> statement-breakpoint
CREATE TABLE "mvp_working_memory" (
	"id" text PRIMARY KEY NOT NULL,
	"scope" text NOT NULL,
	"chat_id" text,
	"user_id" text,
	"content" text NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
DROP TABLE "conversations" CASCADE;--> statement-breakpoint
DROP TABLE "crs_assessments" CASCADE;--> statement-breakpoint
DROP TABLE "document_checklists" CASCADE;--> statement-breakpoint
DROP TABLE "documents" CASCADE;--> statement-breakpoint
DROP TABLE "guides" CASCADE;--> statement-breakpoint
DROP TABLE "knowledge_base" CASCADE;--> statement-breakpoint
DROP TABLE "messages" CASCADE;--> statement-breakpoint
DROP TABLE "sop_generations" CASCADE;--> statement-breakpoint
DROP TABLE "support_messages" CASCADE;--> statement-breakpoint
DROP TABLE "support_tickets" CASCADE;--> statement-breakpoint
DROP TABLE "usage_tracking" CASCADE;--> statement-breakpoint
DROP TABLE "user_profiles" CASCADE;--> statement-breakpoint
DROP TABLE "users" CASCADE;--> statement-breakpoint
ALTER TABLE "mvp_australia_assessments" ADD CONSTRAINT "mvp_australia_assessments_user_id_mvp_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."mvp_users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mvp_conversations" ADD CONSTRAINT "mvp_conversations_user_id_mvp_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."mvp_users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mvp_crs_assessments" ADD CONSTRAINT "mvp_crs_assessments_user_id_mvp_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."mvp_users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mvp_document_checklists" ADD CONSTRAINT "mvp_document_checklists_user_id_mvp_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."mvp_users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mvp_documents" ADD CONSTRAINT "mvp_documents_user_id_mvp_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."mvp_users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mvp_documents" ADD CONSTRAINT "mvp_documents_checklist_id_mvp_document_checklists_id_fk" FOREIGN KEY ("checklist_id") REFERENCES "public"."mvp_document_checklists"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mvp_messages" ADD CONSTRAINT "mvp_messages_conversation_id_mvp_conversations_id_fk" FOREIGN KEY ("conversation_id") REFERENCES "public"."mvp_conversations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mvp_portugal_assessments" ADD CONSTRAINT "mvp_portugal_assessments_user_id_mvp_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."mvp_users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mvp_sop_generations" ADD CONSTRAINT "mvp_sop_generations_user_id_mvp_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."mvp_users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mvp_support_messages" ADD CONSTRAINT "mvp_support_messages_ticket_id_mvp_support_tickets_id_fk" FOREIGN KEY ("ticket_id") REFERENCES "public"."mvp_support_tickets"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mvp_support_tickets" ADD CONSTRAINT "mvp_support_tickets_user_id_mvp_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."mvp_users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mvp_usage_tracking" ADD CONSTRAINT "mvp_usage_tracking_user_id_mvp_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."mvp_users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mvp_user_profiles" ADD CONSTRAINT "mvp_user_profiles_user_id_mvp_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."mvp_users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "mvp_australia_assessments_user_id_idx" ON "mvp_australia_assessments" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "mvp_conversations_user_id_idx" ON "mvp_conversations" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "mvp_crs_assessments_user_id_idx" ON "mvp_crs_assessments" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "mvp_document_checklists_user_id_idx" ON "mvp_document_checklists" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "mvp_documents_user_id_idx" ON "mvp_documents" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "mvp_documents_checklist_id_idx" ON "mvp_documents" USING btree ("checklist_id");--> statement-breakpoint
CREATE INDEX "mvp_messages_conversation_id_idx" ON "mvp_messages" USING btree ("conversation_id");--> statement-breakpoint
CREATE INDEX "mvp_portugal_assessments_user_id_idx" ON "mvp_portugal_assessments" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "mvp_portugal_assessments_visa_type_idx" ON "mvp_portugal_assessments" USING btree ("visa_type");--> statement-breakpoint
CREATE INDEX "mvp_sop_generations_user_id_idx" ON "mvp_sop_generations" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "mvp_support_messages_ticket_id_idx" ON "mvp_support_messages" USING btree ("ticket_id");--> statement-breakpoint
CREATE INDEX "mvp_support_tickets_user_id_idx" ON "mvp_support_tickets" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "mvp_usage_tracking_user_id_idx" ON "mvp_usage_tracking" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "mvp_user_profiles_user_id_idx" ON "mvp_user_profiles" USING btree ("user_id");--> statement-breakpoint
DROP TYPE "public"."document_status";--> statement-breakpoint
DROP TYPE "public"."education_level";--> statement-breakpoint
DROP TYPE "public"."immigration_pathway";--> statement-breakpoint
DROP TYPE "public"."knowledge_category";--> statement-breakpoint
DROP TYPE "public"."language";--> statement-breakpoint
DROP TYPE "public"."language_proficiency";--> statement-breakpoint
DROP TYPE "public"."marital_status";--> statement-breakpoint
DROP TYPE "public"."message_role";--> statement-breakpoint
DROP TYPE "public"."role";--> statement-breakpoint
DROP TYPE "public"."sender_type";--> statement-breakpoint
DROP TYPE "public"."sop_status";--> statement-breakpoint
DROP TYPE "public"."subscription_status";--> statement-breakpoint
DROP TYPE "public"."subscription_tier";--> statement-breakpoint
DROP TYPE "public"."ticket_priority";--> statement-breakpoint
DROP TYPE "public"."ticket_status";