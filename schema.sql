


SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


CREATE SCHEMA IF NOT EXISTS "public";


ALTER SCHEMA "public" OWNER TO "pg_database_owner";


COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE TYPE "public"."cambridge_exam" AS ENUM (
    'starters',
    'movers',
    'flyers'
);


ALTER TYPE "public"."cambridge_exam" OWNER TO "postgres";


CREATE TYPE "public"."cambridge_stage" AS ENUM (
    'stage_1',
    'stage_2',
    'stage_3',
    'stage_4',
    'stage_5',
    'stage_6'
);


ALTER TYPE "public"."cambridge_stage" OWNER TO "postgres";


CREATE TYPE "public"."class_day" AS ENUM (
    'monday',
    'tuesday',
    'wednesday',
    'thursday',
    'friday',
    'saturday',
    'sunday'
);


ALTER TYPE "public"."class_day" OWNER TO "postgres";


CREATE TYPE "public"."contact_method" AS ENUM (
    'zalo',
    'email',
    'phone'
);


ALTER TYPE "public"."contact_method" OWNER TO "postgres";


CREATE TYPE "public"."english_level" AS ENUM (
    'beginner',
    'some_english',
    'confident',
    'unsure'
);


ALTER TYPE "public"."english_level" OWNER TO "postgres";


CREATE TYPE "public"."event_type" AS ENUM (
    'workshop',
    'exam',
    'competition',
    'holiday_camp',
    'parent_meeting',
    'cultural_event'
);


ALTER TYPE "public"."event_type" OWNER TO "postgres";


CREATE TYPE "public"."inquiry_type" AS ENUM (
    'trial_class',
    'curriculum_info',
    'center_tour',
    'event_registration',
    'pricing',
    'other'
);


ALTER TYPE "public"."inquiry_type" OWNER TO "postgres";


CREATE TYPE "public"."student_status" AS ENUM (
    'inquiry',
    'trial',
    'active',
    'inactive',
    'graduated'
);


ALTER TYPE "public"."student_status" OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_class_participant_count"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  IF TG_OP = 'INSERT' AND NEW.is_active = true THEN
    UPDATE classes
    SET current_students = current_students + 1
    WHERE id = NEW.class_id;
  ELSIF TG_OP = 'UPDATE' AND OLD.is_active = true AND NEW.is_active = false THEN
    UPDATE classes
    SET current_students = current_students - 1
    WHERE id = NEW.class_id;
  ELSIF TG_OP = 'UPDATE' AND OLD.is_active = false AND NEW.is_active = true THEN
    UPDATE classes
    SET current_students = current_students + 1
    WHERE id = NEW.class_id;
  ELSIF TG_OP = 'DELETE' AND OLD.is_active = true THEN
    UPDATE classes
    SET current_students = current_students - 1
    WHERE id = OLD.class_id;
  END IF;
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_class_participant_count"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_event_participant_count"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE events
    SET current_participants = current_participants + 1
    WHERE id = NEW.event_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE events
    SET current_participants = current_participants - 1
    WHERE id = OLD.event_id;
  END IF;
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_event_participant_count"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_updated_at_column"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_updated_at_column"() OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."classes" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "class_name" character varying(255) NOT NULL,
    "stage" "public"."cambridge_stage" NOT NULL,
    "teacher_name" character varying(255),
    "max_students" integer DEFAULT 12,
    "current_students" integer DEFAULT 0,
    "schedule_days" "public"."class_day"[],
    "start_time" time without time zone,
    "end_time" time without time zone,
    "classroom_location" character varying(100),
    "start_date" "date",
    "end_date" "date",
    "is_active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."classes" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."enrollments" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "student_id" "uuid" NOT NULL,
    "class_id" "uuid" NOT NULL,
    "enrollment_date" "date" DEFAULT CURRENT_DATE,
    "completion_date" "date",
    "is_active" boolean DEFAULT true,
    "attendance_rate" numeric(5,2),
    "progress_notes" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."enrollments" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."parents" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "full_name" character varying(255) NOT NULL,
    "email" character varying(255),
    "phone" character varying(20) NOT NULL,
    "preferred_contact" "public"."contact_method" DEFAULT 'zalo'::"public"."contact_method",
    "address" "text",
    "how_did_hear" character varying(100),
    "agree_to_updates" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."parents" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."students" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "parent_id" "uuid" NOT NULL,
    "full_name" character varying(255) NOT NULL,
    "date_of_birth" "date",
    "age" integer,
    "current_level" "public"."english_level",
    "assigned_stage" "public"."cambridge_stage",
    "status" "public"."student_status" DEFAULT 'inquiry'::"public"."student_status",
    "enrollment_date" "date",
    "profile_photo_url" "text",
    "notes" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."students" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."active_students_with_classes" AS
 SELECT "s"."id",
    "s"."full_name" AS "student_name",
    "s"."age",
    "s"."current_level",
    "s"."assigned_stage",
    "p"."full_name" AS "parent_name",
    "p"."phone" AS "parent_phone",
    "p"."email" AS "parent_email",
    "c"."class_name",
    "c"."stage" AS "class_stage",
    "c"."teacher_name",
    "e"."attendance_rate",
    "e"."enrollment_date"
   FROM ((("public"."students" "s"
     JOIN "public"."parents" "p" ON (("s"."parent_id" = "p"."id")))
     LEFT JOIN "public"."enrollments" "e" ON ((("s"."id" = "e"."student_id") AND ("e"."is_active" = true))))
     LEFT JOIN "public"."classes" "c" ON (("e"."class_id" = "c"."id")))
  WHERE ("s"."status" = 'active'::"public"."student_status");


ALTER VIEW "public"."active_students_with_classes" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."assessment" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "teacher_id" "uuid",
    "student_id" "uuid",
    "class" "text",
    "student_name" "text" NOT NULL,
    "test_name" "text" NOT NULL,
    "rubrics" "text",
    "r1" "text",
    "r1_score" numeric(5,2),
    "r2" "text",
    "r2_score" numeric(5,2),
    "r3" "text",
    "r3_score" numeric(5,2),
    "r4" "text",
    "r4_score" numeric(5,2),
    "r5" "text",
    "r5_score" numeric(5,2),
    "total_score" numeric(5,2),
    "published" boolean DEFAULT false,
    "assessment_date" "date" DEFAULT CURRENT_DATE,
    "feedback" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."assessment" OWNER TO "postgres";


COMMENT ON TABLE "public"."assessment" IS 'Student assessments with rubric-based scoring';



CREATE TABLE IF NOT EXISTS "public"."attendance" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "enrollment_id" "uuid" NOT NULL,
    "class_date" "date" NOT NULL,
    "present" boolean DEFAULT false,
    "late" boolean DEFAULT false,
    "notes" "text",
    "recorded_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."attendance" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."blog_posts" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "title" "text" NOT NULL,
    "content" "text" NOT NULL,
    "author" "text",
    "author_id" "uuid",
    "category" "text",
    "image_url" "text",
    "published" boolean DEFAULT false,
    "published_date" "date",
    "tags" "text"[],
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."blog_posts" OWNER TO "postgres";


COMMENT ON TABLE "public"."blog_posts" IS 'Educational blog posts for teachers';



CREATE TABLE IF NOT EXISTS "public"."curriculum" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "teacher_id" "uuid",
    "teacher_name" "text",
    "subject" "text",
    "lesson_title" "text" NOT NULL,
    "lesson_date" "date",
    "lesson_skills" "text",
    "success_criteria" "text",
    "wp1_type" "text",
    "wp1_url" "text",
    "wp1_name" "text",
    "wp2_type" "text",
    "wp2_url" "text",
    "wp2_name" "text",
    "wp3_type" "text",
    "wp3_url" "text",
    "wp3_name" "text",
    "wp4_type" "text",
    "wp4_url" "text",
    "wp4_name" "text",
    "ma1_type" "text",
    "ma1_url" "text",
    "ma1_name" "text",
    "ma2_type" "text",
    "ma2_url" "text",
    "ma2_name" "text",
    "ma3_type" "text",
    "ma3_url" "text",
    "ma3_name" "text",
    "ma4_type" "text",
    "ma4_url" "text",
    "ma4_name" "text",
    "ma5_type" "text",
    "ma5_url" "text",
    "ma5_name" "text",
    "a1_type" "text",
    "a1_url" "text",
    "a1_name" "text",
    "a2_type" "text",
    "a2_url" "text",
    "a2_name" "text",
    "a3_type" "text",
    "a3_url" "text",
    "a3_name" "text",
    "a4_type" "text",
    "a4_url" "text",
    "a4_name" "text",
    "hw1_type" "text",
    "hw1_url" "text",
    "hw1_name" "text",
    "hw2_type" "text",
    "hw2_url" "text",
    "hw2_name" "text",
    "hw3_type" "text",
    "hw3_url" "text",
    "hw3_name" "text",
    "hw4_type" "text",
    "hw4_url" "text",
    "hw4_name" "text",
    "hw5_type" "text",
    "hw5_url" "text",
    "hw5_name" "text",
    "hw6_type" "text",
    "hw6_url" "text",
    "hw6_name" "text",
    "p1_type" "text",
    "p1_url" "text",
    "p1_name" "text",
    "p2_type" "text",
    "p2_url" "text",
    "p2_name" "text",
    "p3_type" "text",
    "p3_url" "text",
    "p3_name" "text",
    "p4_type" "text",
    "p4_url" "text",
    "p4_name" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."curriculum" OWNER TO "postgres";


COMMENT ON TABLE "public"."curriculum" IS 'Lesson plans with all activities and materials';



CREATE TABLE IF NOT EXISTS "public"."dashboard_students" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "name" "text" NOT NULL,
    "surname" "text" NOT NULL,
    "email" "text" NOT NULL,
    "password" "text",
    "class" "text",
    "gender" "text",
    "subject" "text",
    "level" "text",
    "birthday" "date",
    "attendance_rate" numeric(5,2) DEFAULT 0,
    "parent_name" "text",
    "parent_zalo_nr" "text",
    "location" "text",
    "placement_test_speaking" "text",
    "placement_test_listening" "text",
    "placement_test_reading" "text",
    "placement_test_writing" "text",
    "sessions" integer DEFAULT 0,
    "sessions_left" integer DEFAULT 0,
    "profile_image_url" "text",
    "is_active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."dashboard_students" OWNER TO "postgres";


COMMENT ON TABLE "public"."dashboard_students" IS 'Student accounts with detailed tracking information';



CREATE TABLE IF NOT EXISTS "public"."event_registrations" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "event_id" "uuid" NOT NULL,
    "student_id" "uuid",
    "parent_name" character varying(255) NOT NULL,
    "child_name" character varying(255) NOT NULL,
    "child_age" integer,
    "phone" character varying(20) NOT NULL,
    "email" character varying(255),
    "payment_status" character varying(50) DEFAULT 'pending'::character varying,
    "attended" boolean,
    "notes" "text",
    "registered_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."event_registrations" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."events" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "title" character varying(255) NOT NULL,
    "description" "text",
    "event_type" "public"."event_type" NOT NULL,
    "event_date" "date" NOT NULL,
    "start_time" time without time zone,
    "end_time" time without time zone,
    "location" character varying(255),
    "max_participants" integer,
    "current_participants" integer DEFAULT 0,
    "age_min" integer,
    "age_max" integer,
    "price" numeric(10,2) DEFAULT 0,
    "image_url" "text",
    "is_published" boolean DEFAULT false,
    "registration_deadline" "date",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."events" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."exam_results" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "student_id" "uuid" NOT NULL,
    "exam_type" "public"."cambridge_exam" NOT NULL,
    "exam_date" "date" NOT NULL,
    "listening_shields" integer,
    "reading_writing_shields" integer,
    "speaking_shields" integer,
    "total_shields" integer GENERATED ALWAYS AS (((COALESCE("listening_shields", 0) + COALESCE("reading_writing_shields", 0)) + COALESCE("speaking_shields", 0))) STORED,
    "certificate_number" character varying(100),
    "certificate_url" "text",
    "notes" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "exam_results_listening_shields_check" CHECK ((("listening_shields" >= 1) AND ("listening_shields" <= 5))),
    CONSTRAINT "exam_results_reading_writing_shields_check" CHECK ((("reading_writing_shields" >= 1) AND ("reading_writing_shields" <= 5))),
    CONSTRAINT "exam_results_speaking_shields_check" CHECK ((("speaking_shields" >= 1) AND ("speaking_shields" <= 5)))
);


ALTER TABLE "public"."exam_results" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."homework_completion" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "student_id" "uuid",
    "curriculum_id" "uuid",
    "homework_item" "text",
    "completed" boolean DEFAULT false,
    "completed_date" timestamp with time zone,
    "notes" "text",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."homework_completion" OWNER TO "postgres";


COMMENT ON TABLE "public"."homework_completion" IS 'Track which homework items students have completed';



CREATE TABLE IF NOT EXISTS "public"."inquiries" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "parent_id" "uuid",
    "parent_name" character varying(255) NOT NULL,
    "child_name" character varying(255) NOT NULL,
    "child_age" integer NOT NULL,
    "current_level" "public"."english_level",
    "phone" character varying(20) NOT NULL,
    "email" character varying(255),
    "preferred_contact" "public"."contact_method" DEFAULT 'zalo'::"public"."contact_method",
    "how_did_hear" character varying(100),
    "interested_in" "public"."inquiry_type"[],
    "message" "text" NOT NULL,
    "status" character varying(50) DEFAULT 'pending'::character varying,
    "response_notes" "text",
    "responded_at" timestamp with time zone,
    "responded_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."inquiries" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."payments" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "student_id" "uuid" NOT NULL,
    "enrollment_id" "uuid",
    "amount" numeric(10,2) NOT NULL,
    "payment_method" character varying(50),
    "payment_date" "date" DEFAULT CURRENT_DATE,
    "payment_for" character varying(100),
    "term" character varying(50),
    "receipt_number" character varying(100),
    "notes" "text",
    "created_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."payments" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."skills_evaluation" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "teacher_id" "uuid",
    "student_id" "uuid",
    "student_name" "text" NOT NULL,
    "class" "text",
    "skill_name" "text" NOT NULL,
    "skill_category" "text",
    "e1" "text",
    "e1_score" numeric(5,2),
    "e2" "text",
    "e2_score" numeric(5,2),
    "e3" "text",
    "e3_score" numeric(5,2),
    "e4" "text",
    "e4_score" numeric(5,2),
    "e5" "text",
    "e5_score" numeric(5,2),
    "e6" "text",
    "e6_score" numeric(5,2),
    "average_score" numeric(5,2),
    "evaluation_date" "date" DEFAULT CURRENT_DATE,
    "notes" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."skills_evaluation" OWNER TO "postgres";


COMMENT ON TABLE "public"."skills_evaluation" IS 'Detailed skill tracking across four strands';



CREATE TABLE IF NOT EXISTS "public"."student_progress" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "student_id" "uuid" NOT NULL,
    "enrollment_id" "uuid" NOT NULL,
    "assessment_date" "date" DEFAULT CURRENT_DATE,
    "skill_area" character varying(100) NOT NULL,
    "level_score" numeric(5,2),
    "notes" "text",
    "assessed_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."student_progress" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."teachers" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "name" "text" NOT NULL,
    "surname" "text" NOT NULL,
    "email" "text" NOT NULL,
    "password" "text",
    "subject" "text",
    "phone" "text",
    "bio" "text",
    "profile_image_url" "text",
    "is_active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."teachers" OWNER TO "postgres";


COMMENT ON TABLE "public"."teachers" IS 'Teacher accounts and profiles';



CREATE TABLE IF NOT EXISTS "public"."trial_bookings" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "parent_name" character varying(255) NOT NULL,
    "child_name" character varying(255) NOT NULL,
    "child_age" integer NOT NULL,
    "phone" character varying(20) NOT NULL,
    "email" character varying(255),
    "preferred_date" "date",
    "preferred_time" time without time zone,
    "current_level" "public"."english_level",
    "assigned_class_id" "uuid",
    "scheduled_date" "date",
    "scheduled_time" time without time zone,
    "status" character varying(50) DEFAULT 'pending'::character varying,
    "attended" boolean,
    "feedback" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."trial_bookings" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."upcoming_events" AS
 SELECT "id",
    "title",
    "description",
    "event_type",
    "event_date",
    "start_time",
    "end_time",
    "location",
    "max_participants",
    "current_participants",
    ("max_participants" - "current_participants") AS "spots_remaining",
    "price",
    "image_url",
    "age_min",
    "age_max"
   FROM "public"."events"
  WHERE (("is_published" = true) AND ("event_date" >= CURRENT_DATE))
  ORDER BY "event_date", "start_time";


ALTER VIEW "public"."upcoming_events" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."users" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "email" character varying(255) NOT NULL,
    "full_name" character varying(255) NOT NULL,
    "role" character varying(50) NOT NULL,
    "phone" character varying(20),
    "is_active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."users" OWNER TO "postgres";


ALTER TABLE ONLY "public"."assessment"
    ADD CONSTRAINT "assessment_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."attendance"
    ADD CONSTRAINT "attendance_enrollment_id_class_date_key" UNIQUE ("enrollment_id", "class_date");



ALTER TABLE ONLY "public"."attendance"
    ADD CONSTRAINT "attendance_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."blog_posts"
    ADD CONSTRAINT "blog_posts_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."classes"
    ADD CONSTRAINT "classes_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."curriculum"
    ADD CONSTRAINT "curriculum_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."dashboard_students"
    ADD CONSTRAINT "dashboard_students_email_key" UNIQUE ("email");



ALTER TABLE ONLY "public"."dashboard_students"
    ADD CONSTRAINT "dashboard_students_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."enrollments"
    ADD CONSTRAINT "enrollments_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."enrollments"
    ADD CONSTRAINT "enrollments_student_id_class_id_key" UNIQUE ("student_id", "class_id");



ALTER TABLE ONLY "public"."event_registrations"
    ADD CONSTRAINT "event_registrations_event_id_student_id_key" UNIQUE ("event_id", "student_id");



ALTER TABLE ONLY "public"."event_registrations"
    ADD CONSTRAINT "event_registrations_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."events"
    ADD CONSTRAINT "events_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."exam_results"
    ADD CONSTRAINT "exam_results_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."homework_completion"
    ADD CONSTRAINT "homework_completion_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."homework_completion"
    ADD CONSTRAINT "homework_completion_student_id_curriculum_id_homework_item_key" UNIQUE ("student_id", "curriculum_id", "homework_item");



ALTER TABLE ONLY "public"."inquiries"
    ADD CONSTRAINT "inquiries_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."parents"
    ADD CONSTRAINT "parents_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."payments"
    ADD CONSTRAINT "payments_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."payments"
    ADD CONSTRAINT "payments_receipt_number_key" UNIQUE ("receipt_number");



ALTER TABLE ONLY "public"."skills_evaluation"
    ADD CONSTRAINT "skills_evaluation_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."student_progress"
    ADD CONSTRAINT "student_progress_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."students"
    ADD CONSTRAINT "students_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."teachers"
    ADD CONSTRAINT "teachers_email_key" UNIQUE ("email");



ALTER TABLE ONLY "public"."teachers"
    ADD CONSTRAINT "teachers_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."trial_bookings"
    ADD CONSTRAINT "trial_bookings_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."users"
    ADD CONSTRAINT "users_email_key" UNIQUE ("email");



ALTER TABLE ONLY "public"."users"
    ADD CONSTRAINT "users_pkey" PRIMARY KEY ("id");



CREATE INDEX "idx_assessment_published" ON "public"."assessment" USING "btree" ("published");



CREATE INDEX "idx_assessment_student" ON "public"."assessment" USING "btree" ("student_id");



CREATE INDEX "idx_attendance_date" ON "public"."attendance" USING "btree" ("class_date");



CREATE INDEX "idx_attendance_enrollment_id" ON "public"."attendance" USING "btree" ("enrollment_id");



CREATE INDEX "idx_blog_published" ON "public"."blog_posts" USING "btree" ("published");



CREATE INDEX "idx_curriculum_date" ON "public"."curriculum" USING "btree" ("lesson_date");



CREATE INDEX "idx_curriculum_teacher" ON "public"."curriculum" USING "btree" ("teacher_id");



CREATE INDEX "idx_dashboard_students_class" ON "public"."dashboard_students" USING "btree" ("class");



CREATE INDEX "idx_dashboard_students_email" ON "public"."dashboard_students" USING "btree" ("email");



CREATE INDEX "idx_enrollments_active" ON "public"."enrollments" USING "btree" ("is_active");



CREATE INDEX "idx_enrollments_class_id" ON "public"."enrollments" USING "btree" ("class_id");



CREATE INDEX "idx_enrollments_student_id" ON "public"."enrollments" USING "btree" ("student_id");



CREATE INDEX "idx_events_date" ON "public"."events" USING "btree" ("event_date");



CREATE INDEX "idx_events_published" ON "public"."events" USING "btree" ("is_published");



CREATE INDEX "idx_exam_results_student_id" ON "public"."exam_results" USING "btree" ("student_id");



CREATE INDEX "idx_homework_student" ON "public"."homework_completion" USING "btree" ("student_id");



CREATE INDEX "idx_inquiries_created_at" ON "public"."inquiries" USING "btree" ("created_at");



CREATE INDEX "idx_inquiries_status" ON "public"."inquiries" USING "btree" ("status");



CREATE INDEX "idx_payments_date" ON "public"."payments" USING "btree" ("payment_date");



CREATE INDEX "idx_payments_student_id" ON "public"."payments" USING "btree" ("student_id");



CREATE INDEX "idx_skills_category" ON "public"."skills_evaluation" USING "btree" ("skill_category");



CREATE INDEX "idx_skills_student" ON "public"."skills_evaluation" USING "btree" ("student_id");



CREATE INDEX "idx_students_parent_id" ON "public"."students" USING "btree" ("parent_id");



CREATE INDEX "idx_students_status" ON "public"."students" USING "btree" ("status");



CREATE INDEX "idx_teachers_email" ON "public"."teachers" USING "btree" ("email");



CREATE INDEX "idx_trial_bookings_status" ON "public"."trial_bookings" USING "btree" ("status");



CREATE OR REPLACE TRIGGER "update_assessment_updated_at" BEFORE UPDATE ON "public"."assessment" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_blog_updated_at" BEFORE UPDATE ON "public"."blog_posts" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_class_count" AFTER INSERT OR DELETE OR UPDATE ON "public"."enrollments" FOR EACH ROW EXECUTE FUNCTION "public"."update_class_participant_count"();



CREATE OR REPLACE TRIGGER "update_classes_updated_at" BEFORE UPDATE ON "public"."classes" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_curriculum_updated_at" BEFORE UPDATE ON "public"."curriculum" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_enrollments_updated_at" BEFORE UPDATE ON "public"."enrollments" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_event_count" AFTER INSERT OR DELETE ON "public"."event_registrations" FOR EACH ROW EXECUTE FUNCTION "public"."update_event_participant_count"();



CREATE OR REPLACE TRIGGER "update_events_updated_at" BEFORE UPDATE ON "public"."events" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_exam_results_updated_at" BEFORE UPDATE ON "public"."exam_results" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_parents_updated_at" BEFORE UPDATE ON "public"."parents" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_skills_updated_at" BEFORE UPDATE ON "public"."skills_evaluation" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_students_updated_at" BEFORE UPDATE ON "public"."dashboard_students" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_students_updated_at" BEFORE UPDATE ON "public"."students" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_teachers_updated_at" BEFORE UPDATE ON "public"."teachers" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_trial_bookings_updated_at" BEFORE UPDATE ON "public"."trial_bookings" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_users_updated_at" BEFORE UPDATE ON "public"."users" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



ALTER TABLE ONLY "public"."assessment"
    ADD CONSTRAINT "assessment_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "public"."dashboard_students"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."assessment"
    ADD CONSTRAINT "assessment_teacher_id_fkey" FOREIGN KEY ("teacher_id") REFERENCES "public"."teachers"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."attendance"
    ADD CONSTRAINT "attendance_enrollment_id_fkey" FOREIGN KEY ("enrollment_id") REFERENCES "public"."enrollments"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."curriculum"
    ADD CONSTRAINT "curriculum_teacher_id_fkey" FOREIGN KEY ("teacher_id") REFERENCES "public"."teachers"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."enrollments"
    ADD CONSTRAINT "enrollments_class_id_fkey" FOREIGN KEY ("class_id") REFERENCES "public"."classes"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."enrollments"
    ADD CONSTRAINT "enrollments_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "public"."students"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."event_registrations"
    ADD CONSTRAINT "event_registrations_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."event_registrations"
    ADD CONSTRAINT "event_registrations_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "public"."students"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."exam_results"
    ADD CONSTRAINT "exam_results_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "public"."students"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."inquiries"
    ADD CONSTRAINT "inquiries_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "public"."parents"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."payments"
    ADD CONSTRAINT "payments_enrollment_id_fkey" FOREIGN KEY ("enrollment_id") REFERENCES "public"."enrollments"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."payments"
    ADD CONSTRAINT "payments_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "public"."students"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."skills_evaluation"
    ADD CONSTRAINT "skills_evaluation_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "public"."dashboard_students"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."skills_evaluation"
    ADD CONSTRAINT "skills_evaluation_teacher_id_fkey" FOREIGN KEY ("teacher_id") REFERENCES "public"."teachers"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."student_progress"
    ADD CONSTRAINT "student_progress_enrollment_id_fkey" FOREIGN KEY ("enrollment_id") REFERENCES "public"."enrollments"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."student_progress"
    ADD CONSTRAINT "student_progress_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "public"."students"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."students"
    ADD CONSTRAINT "students_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "public"."parents"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."trial_bookings"
    ADD CONSTRAINT "trial_bookings_assigned_class_id_fkey" FOREIGN KEY ("assigned_class_id") REFERENCES "public"."classes"("id") ON DELETE SET NULL;



CREATE POLICY "Allow all for assessment" ON "public"."assessment" USING (true);



CREATE POLICY "Allow all for blog posts" ON "public"."blog_posts" USING (true);



CREATE POLICY "Allow all for curriculum" ON "public"."curriculum" USING (true);



CREATE POLICY "Allow all for homework" ON "public"."homework_completion" USING (true);



CREATE POLICY "Allow all for skills" ON "public"."skills_evaluation" USING (true);



CREATE POLICY "Allow all for students" ON "public"."dashboard_students" USING (true);



CREATE POLICY "Allow all for teachers" ON "public"."teachers" USING (true);



CREATE POLICY "Anyone can book trial classes" ON "public"."trial_bookings" FOR INSERT WITH CHECK (true);



CREATE POLICY "Anyone can register for events" ON "public"."event_registrations" FOR INSERT WITH CHECK (true);



CREATE POLICY "Anyone can submit inquiries" ON "public"."inquiries" FOR INSERT WITH CHECK (true);



CREATE POLICY "Authenticated users can manage event registrations" ON "public"."event_registrations" USING (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Authenticated users can manage events" ON "public"."events" USING (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Authenticated users can manage inquiries" ON "public"."inquiries" USING (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Authenticated users can manage trial bookings" ON "public"."trial_bookings" USING (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Authenticated users have full access to attendance" ON "public"."attendance" USING (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Authenticated users have full access to classes" ON "public"."classes" USING (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Authenticated users have full access to enrollments" ON "public"."enrollments" USING (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Authenticated users have full access to exam results" ON "public"."exam_results" USING (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Authenticated users have full access to parents" ON "public"."parents" USING (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Authenticated users have full access to payments" ON "public"."payments" USING (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Authenticated users have full access to progress" ON "public"."student_progress" USING (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Authenticated users have full access to students" ON "public"."students" USING (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Events are viewable by everyone" ON "public"."events" FOR SELECT USING (("is_published" = true));



CREATE POLICY "Published blogs are viewable by everyone" ON "public"."blog_posts" FOR SELECT USING (("published" = true));



ALTER TABLE "public"."assessment" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."attendance" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."blog_posts" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."classes" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."curriculum" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."dashboard_students" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."enrollments" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."event_registrations" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."events" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."exam_results" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."homework_completion" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."inquiries" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."parents" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."payments" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."skills_evaluation" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."student_progress" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."students" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."teachers" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."trial_bookings" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."users" ENABLE ROW LEVEL SECURITY;


GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";



GRANT ALL ON FUNCTION "public"."update_class_participant_count"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_class_participant_count"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_class_participant_count"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_event_participant_count"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_event_participant_count"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_event_participant_count"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "service_role";



GRANT ALL ON TABLE "public"."classes" TO "anon";
GRANT ALL ON TABLE "public"."classes" TO "authenticated";
GRANT ALL ON TABLE "public"."classes" TO "service_role";



GRANT ALL ON TABLE "public"."enrollments" TO "anon";
GRANT ALL ON TABLE "public"."enrollments" TO "authenticated";
GRANT ALL ON TABLE "public"."enrollments" TO "service_role";



GRANT ALL ON TABLE "public"."parents" TO "anon";
GRANT ALL ON TABLE "public"."parents" TO "authenticated";
GRANT ALL ON TABLE "public"."parents" TO "service_role";



GRANT ALL ON TABLE "public"."students" TO "anon";
GRANT ALL ON TABLE "public"."students" TO "authenticated";
GRANT ALL ON TABLE "public"."students" TO "service_role";



GRANT ALL ON TABLE "public"."active_students_with_classes" TO "anon";
GRANT ALL ON TABLE "public"."active_students_with_classes" TO "authenticated";
GRANT ALL ON TABLE "public"."active_students_with_classes" TO "service_role";



GRANT ALL ON TABLE "public"."assessment" TO "anon";
GRANT ALL ON TABLE "public"."assessment" TO "authenticated";
GRANT ALL ON TABLE "public"."assessment" TO "service_role";



GRANT ALL ON TABLE "public"."attendance" TO "anon";
GRANT ALL ON TABLE "public"."attendance" TO "authenticated";
GRANT ALL ON TABLE "public"."attendance" TO "service_role";



GRANT ALL ON TABLE "public"."blog_posts" TO "anon";
GRANT ALL ON TABLE "public"."blog_posts" TO "authenticated";
GRANT ALL ON TABLE "public"."blog_posts" TO "service_role";



GRANT ALL ON TABLE "public"."curriculum" TO "anon";
GRANT ALL ON TABLE "public"."curriculum" TO "authenticated";
GRANT ALL ON TABLE "public"."curriculum" TO "service_role";



GRANT ALL ON TABLE "public"."dashboard_students" TO "anon";
GRANT ALL ON TABLE "public"."dashboard_students" TO "authenticated";
GRANT ALL ON TABLE "public"."dashboard_students" TO "service_role";



GRANT ALL ON TABLE "public"."event_registrations" TO "anon";
GRANT ALL ON TABLE "public"."event_registrations" TO "authenticated";
GRANT ALL ON TABLE "public"."event_registrations" TO "service_role";



GRANT ALL ON TABLE "public"."events" TO "anon";
GRANT ALL ON TABLE "public"."events" TO "authenticated";
GRANT ALL ON TABLE "public"."events" TO "service_role";



GRANT ALL ON TABLE "public"."exam_results" TO "anon";
GRANT ALL ON TABLE "public"."exam_results" TO "authenticated";
GRANT ALL ON TABLE "public"."exam_results" TO "service_role";



GRANT ALL ON TABLE "public"."homework_completion" TO "anon";
GRANT ALL ON TABLE "public"."homework_completion" TO "authenticated";
GRANT ALL ON TABLE "public"."homework_completion" TO "service_role";



GRANT ALL ON TABLE "public"."inquiries" TO "anon";
GRANT ALL ON TABLE "public"."inquiries" TO "authenticated";
GRANT ALL ON TABLE "public"."inquiries" TO "service_role";



GRANT ALL ON TABLE "public"."payments" TO "anon";
GRANT ALL ON TABLE "public"."payments" TO "authenticated";
GRANT ALL ON TABLE "public"."payments" TO "service_role";



GRANT ALL ON TABLE "public"."skills_evaluation" TO "anon";
GRANT ALL ON TABLE "public"."skills_evaluation" TO "authenticated";
GRANT ALL ON TABLE "public"."skills_evaluation" TO "service_role";



GRANT ALL ON TABLE "public"."student_progress" TO "anon";
GRANT ALL ON TABLE "public"."student_progress" TO "authenticated";
GRANT ALL ON TABLE "public"."student_progress" TO "service_role";



GRANT ALL ON TABLE "public"."teachers" TO "anon";
GRANT ALL ON TABLE "public"."teachers" TO "authenticated";
GRANT ALL ON TABLE "public"."teachers" TO "service_role";



GRANT ALL ON TABLE "public"."trial_bookings" TO "anon";
GRANT ALL ON TABLE "public"."trial_bookings" TO "authenticated";
GRANT ALL ON TABLE "public"."trial_bookings" TO "service_role";



GRANT ALL ON TABLE "public"."upcoming_events" TO "anon";
GRANT ALL ON TABLE "public"."upcoming_events" TO "authenticated";
GRANT ALL ON TABLE "public"."upcoming_events" TO "service_role";



GRANT ALL ON TABLE "public"."users" TO "anon";
GRANT ALL ON TABLE "public"."users" TO "authenticated";
GRANT ALL ON TABLE "public"."users" TO "service_role";



ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";







RESET ALL;
y