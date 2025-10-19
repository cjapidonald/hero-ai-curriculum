create type "public"."cambridge_exam" as enum ('starters', 'movers', 'flyers');

create type "public"."cambridge_stage" as enum ('stage_1', 'stage_2', 'stage_3', 'stage_4', 'stage_5', 'stage_6');

create type "public"."class_day" as enum ('monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday');

create type "public"."contact_method" as enum ('zalo', 'email', 'phone');

create type "public"."english_level" as enum ('beginner', 'some_english', 'confident', 'unsure');

create type "public"."event_type" as enum ('workshop', 'exam', 'competition', 'holiday_camp', 'parent_meeting', 'cultural_event');

create type "public"."inquiry_type" as enum ('trial_class', 'curriculum_info', 'center_tour', 'event_registration', 'pricing', 'other');

create type "public"."student_status" as enum ('inquiry', 'trial', 'active', 'inactive', 'graduated');

drop policy "Allow all for contact" on "public"."contact_submissions";

drop policy "Allow all for events" on "public"."event_registrations";

revoke delete on table "public"."assessment" from "anon";

revoke insert on table "public"."assessment" from "anon";

revoke references on table "public"."assessment" from "anon";

revoke select on table "public"."assessment" from "anon";

revoke trigger on table "public"."assessment" from "anon";

revoke truncate on table "public"."assessment" from "anon";

revoke update on table "public"."assessment" from "anon";

revoke delete on table "public"."assessment" from "authenticated";

revoke insert on table "public"."assessment" from "authenticated";

revoke references on table "public"."assessment" from "authenticated";

revoke select on table "public"."assessment" from "authenticated";

revoke trigger on table "public"."assessment" from "authenticated";

revoke truncate on table "public"."assessment" from "authenticated";

revoke update on table "public"."assessment" from "authenticated";

revoke delete on table "public"."assessment" from "service_role";

revoke insert on table "public"."assessment" from "service_role";

revoke references on table "public"."assessment" from "service_role";

revoke select on table "public"."assessment" from "service_role";

revoke trigger on table "public"."assessment" from "service_role";

revoke truncate on table "public"."assessment" from "service_role";

revoke update on table "public"."assessment" from "service_role";

revoke delete on table "public"."blog_posts" from "anon";

revoke insert on table "public"."blog_posts" from "anon";

revoke references on table "public"."blog_posts" from "anon";

revoke select on table "public"."blog_posts" from "anon";

revoke trigger on table "public"."blog_posts" from "anon";

revoke truncate on table "public"."blog_posts" from "anon";

revoke update on table "public"."blog_posts" from "anon";

revoke delete on table "public"."blog_posts" from "authenticated";

revoke insert on table "public"."blog_posts" from "authenticated";

revoke references on table "public"."blog_posts" from "authenticated";

revoke select on table "public"."blog_posts" from "authenticated";

revoke trigger on table "public"."blog_posts" from "authenticated";

revoke truncate on table "public"."blog_posts" from "authenticated";

revoke update on table "public"."blog_posts" from "authenticated";

revoke delete on table "public"."blog_posts" from "service_role";

revoke insert on table "public"."blog_posts" from "service_role";

revoke references on table "public"."blog_posts" from "service_role";

revoke select on table "public"."blog_posts" from "service_role";

revoke trigger on table "public"."blog_posts" from "service_role";

revoke truncate on table "public"."blog_posts" from "service_role";

revoke update on table "public"."blog_posts" from "service_role";

revoke delete on table "public"."contact_submissions" from "anon";

revoke insert on table "public"."contact_submissions" from "anon";

revoke references on table "public"."contact_submissions" from "anon";

revoke select on table "public"."contact_submissions" from "anon";

revoke trigger on table "public"."contact_submissions" from "anon";

revoke truncate on table "public"."contact_submissions" from "anon";

revoke update on table "public"."contact_submissions" from "anon";

revoke delete on table "public"."contact_submissions" from "authenticated";

revoke insert on table "public"."contact_submissions" from "authenticated";

revoke references on table "public"."contact_submissions" from "authenticated";

revoke select on table "public"."contact_submissions" from "authenticated";

revoke trigger on table "public"."contact_submissions" from "authenticated";

revoke truncate on table "public"."contact_submissions" from "authenticated";

revoke update on table "public"."contact_submissions" from "authenticated";

revoke delete on table "public"."contact_submissions" from "service_role";

revoke insert on table "public"."contact_submissions" from "service_role";

revoke references on table "public"."contact_submissions" from "service_role";

revoke select on table "public"."contact_submissions" from "service_role";

revoke trigger on table "public"."contact_submissions" from "service_role";

revoke truncate on table "public"."contact_submissions" from "service_role";

revoke update on table "public"."contact_submissions" from "service_role";

revoke delete on table "public"."curriculum" from "anon";

revoke insert on table "public"."curriculum" from "anon";

revoke references on table "public"."curriculum" from "anon";

revoke select on table "public"."curriculum" from "anon";

revoke trigger on table "public"."curriculum" from "anon";

revoke truncate on table "public"."curriculum" from "anon";

revoke update on table "public"."curriculum" from "anon";

revoke delete on table "public"."curriculum" from "authenticated";

revoke insert on table "public"."curriculum" from "authenticated";

revoke references on table "public"."curriculum" from "authenticated";

revoke select on table "public"."curriculum" from "authenticated";

revoke trigger on table "public"."curriculum" from "authenticated";

revoke truncate on table "public"."curriculum" from "authenticated";

revoke update on table "public"."curriculum" from "authenticated";

revoke delete on table "public"."curriculum" from "service_role";

revoke insert on table "public"."curriculum" from "service_role";

revoke references on table "public"."curriculum" from "service_role";

revoke select on table "public"."curriculum" from "service_role";

revoke trigger on table "public"."curriculum" from "service_role";

revoke truncate on table "public"."curriculum" from "service_role";

revoke update on table "public"."curriculum" from "service_role";

revoke delete on table "public"."dashboard_students" from "anon";

revoke insert on table "public"."dashboard_students" from "anon";

revoke references on table "public"."dashboard_students" from "anon";

revoke select on table "public"."dashboard_students" from "anon";

revoke trigger on table "public"."dashboard_students" from "anon";

revoke truncate on table "public"."dashboard_students" from "anon";

revoke update on table "public"."dashboard_students" from "anon";

revoke delete on table "public"."dashboard_students" from "authenticated";

revoke insert on table "public"."dashboard_students" from "authenticated";

revoke references on table "public"."dashboard_students" from "authenticated";

revoke select on table "public"."dashboard_students" from "authenticated";

revoke trigger on table "public"."dashboard_students" from "authenticated";

revoke truncate on table "public"."dashboard_students" from "authenticated";

revoke update on table "public"."dashboard_students" from "authenticated";

revoke delete on table "public"."dashboard_students" from "service_role";

revoke insert on table "public"."dashboard_students" from "service_role";

revoke references on table "public"."dashboard_students" from "service_role";

revoke select on table "public"."dashboard_students" from "service_role";

revoke trigger on table "public"."dashboard_students" from "service_role";

revoke truncate on table "public"."dashboard_students" from "service_role";

revoke update on table "public"."dashboard_students" from "service_role";

revoke delete on table "public"."event_registrations" from "anon";

revoke insert on table "public"."event_registrations" from "anon";

revoke references on table "public"."event_registrations" from "anon";

revoke select on table "public"."event_registrations" from "anon";

revoke trigger on table "public"."event_registrations" from "anon";

revoke truncate on table "public"."event_registrations" from "anon";

revoke update on table "public"."event_registrations" from "anon";

revoke delete on table "public"."event_registrations" from "authenticated";

revoke insert on table "public"."event_registrations" from "authenticated";

revoke references on table "public"."event_registrations" from "authenticated";

revoke select on table "public"."event_registrations" from "authenticated";

revoke trigger on table "public"."event_registrations" from "authenticated";

revoke truncate on table "public"."event_registrations" from "authenticated";

revoke update on table "public"."event_registrations" from "authenticated";

revoke delete on table "public"."event_registrations" from "service_role";

revoke insert on table "public"."event_registrations" from "service_role";

revoke references on table "public"."event_registrations" from "service_role";

revoke select on table "public"."event_registrations" from "service_role";

revoke trigger on table "public"."event_registrations" from "service_role";

revoke truncate on table "public"."event_registrations" from "service_role";

revoke update on table "public"."event_registrations" from "service_role";

revoke delete on table "public"."homework_completion" from "anon";

revoke insert on table "public"."homework_completion" from "anon";

revoke references on table "public"."homework_completion" from "anon";

revoke select on table "public"."homework_completion" from "anon";

revoke trigger on table "public"."homework_completion" from "anon";

revoke truncate on table "public"."homework_completion" from "anon";

revoke update on table "public"."homework_completion" from "anon";

revoke delete on table "public"."homework_completion" from "authenticated";

revoke insert on table "public"."homework_completion" from "authenticated";

revoke references on table "public"."homework_completion" from "authenticated";

revoke select on table "public"."homework_completion" from "authenticated";

revoke trigger on table "public"."homework_completion" from "authenticated";

revoke truncate on table "public"."homework_completion" from "authenticated";

revoke update on table "public"."homework_completion" from "authenticated";

revoke delete on table "public"."homework_completion" from "service_role";

revoke insert on table "public"."homework_completion" from "service_role";

revoke references on table "public"."homework_completion" from "service_role";

revoke select on table "public"."homework_completion" from "service_role";

revoke trigger on table "public"."homework_completion" from "service_role";

revoke truncate on table "public"."homework_completion" from "service_role";

revoke update on table "public"."homework_completion" from "service_role";

revoke delete on table "public"."skills_evaluation" from "anon";

revoke insert on table "public"."skills_evaluation" from "anon";

revoke references on table "public"."skills_evaluation" from "anon";

revoke select on table "public"."skills_evaluation" from "anon";

revoke trigger on table "public"."skills_evaluation" from "anon";

revoke truncate on table "public"."skills_evaluation" from "anon";

revoke update on table "public"."skills_evaluation" from "anon";

revoke delete on table "public"."skills_evaluation" from "authenticated";

revoke insert on table "public"."skills_evaluation" from "authenticated";

revoke references on table "public"."skills_evaluation" from "authenticated";

revoke select on table "public"."skills_evaluation" from "authenticated";

revoke trigger on table "public"."skills_evaluation" from "authenticated";

revoke truncate on table "public"."skills_evaluation" from "authenticated";

revoke update on table "public"."skills_evaluation" from "authenticated";

revoke delete on table "public"."skills_evaluation" from "service_role";

revoke insert on table "public"."skills_evaluation" from "service_role";

revoke references on table "public"."skills_evaluation" from "service_role";

revoke select on table "public"."skills_evaluation" from "service_role";

revoke trigger on table "public"."skills_evaluation" from "service_role";

revoke truncate on table "public"."skills_evaluation" from "service_role";

revoke update on table "public"."skills_evaluation" from "service_role";

revoke delete on table "public"."teachers" from "anon";

revoke insert on table "public"."teachers" from "anon";

revoke references on table "public"."teachers" from "anon";

revoke select on table "public"."teachers" from "anon";

revoke trigger on table "public"."teachers" from "anon";

revoke truncate on table "public"."teachers" from "anon";

revoke update on table "public"."teachers" from "anon";

revoke delete on table "public"."teachers" from "authenticated";

revoke insert on table "public"."teachers" from "authenticated";

revoke references on table "public"."teachers" from "authenticated";

revoke select on table "public"."teachers" from "authenticated";

revoke trigger on table "public"."teachers" from "authenticated";

revoke truncate on table "public"."teachers" from "authenticated";

revoke update on table "public"."teachers" from "authenticated";

revoke delete on table "public"."teachers" from "service_role";

revoke insert on table "public"."teachers" from "service_role";

revoke references on table "public"."teachers" from "service_role";

revoke select on table "public"."teachers" from "service_role";

revoke trigger on table "public"."teachers" from "service_role";

revoke truncate on table "public"."teachers" from "service_role";

revoke update on table "public"."teachers" from "service_role";

alter table "public"."blog_posts" drop constraint "blog_posts_author_id_fkey";

alter table "public"."homework_completion" drop constraint "homework_completion_curriculum_id_fkey";

alter table "public"."homework_completion" drop constraint "homework_completion_student_id_fkey";

alter table "public"."contact_submissions" drop constraint "contact_submissions_pkey";

drop index if exists "public"."contact_submissions_pkey";

drop table "public"."contact_submissions";

create table "public"."attendance" (
    "id" uuid not null default extensions.uuid_generate_v4(),
    "enrollment_id" uuid not null,
    "class_date" date not null,
    "present" boolean default false,
    "late" boolean default false,
    "notes" text,
    "recorded_by" uuid,
    "created_at" timestamp with time zone default now()
);


alter table "public"."attendance" enable row level security;

create table "public"."classes" (
    "id" uuid not null default extensions.uuid_generate_v4(),
    "class_name" character varying(255) not null,
    "stage" cambridge_stage not null,
    "teacher_name" character varying(255),
    "max_students" integer default 12,
    "current_students" integer default 0,
    "schedule_days" class_day[],
    "start_time" time without time zone,
    "end_time" time without time zone,
    "classroom_location" character varying(100),
    "start_date" date,
    "end_date" date,
    "is_active" boolean default true,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now()
);


alter table "public"."classes" enable row level security;

create table "public"."enrollments" (
    "id" uuid not null default extensions.uuid_generate_v4(),
    "student_id" uuid not null,
    "class_id" uuid not null,
    "enrollment_date" date default CURRENT_DATE,
    "completion_date" date,
    "is_active" boolean default true,
    "attendance_rate" numeric(5,2),
    "progress_notes" text,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now()
);


alter table "public"."enrollments" enable row level security;

create table "public"."events" (
    "id" uuid not null default extensions.uuid_generate_v4(),
    "title" character varying(255) not null,
    "description" text,
    "event_type" event_type not null,
    "event_date" date not null,
    "start_time" time without time zone,
    "end_time" time without time zone,
    "location" character varying(255),
    "max_participants" integer,
    "current_participants" integer default 0,
    "age_min" integer,
    "age_max" integer,
    "price" numeric(10,2) default 0,
    "image_url" text,
    "is_published" boolean default false,
    "registration_deadline" date,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now()
);


alter table "public"."events" enable row level security;

create table "public"."exam_results" (
    "id" uuid not null default extensions.uuid_generate_v4(),
    "student_id" uuid not null,
    "exam_type" cambridge_exam not null,
    "exam_date" date not null,
    "listening_shields" integer,
    "reading_writing_shields" integer,
    "speaking_shields" integer,
    "total_shields" integer generated always as (((COALESCE(listening_shields, 0) + COALESCE(reading_writing_shields, 0)) + COALESCE(speaking_shields, 0))) stored,
    "certificate_number" character varying(100),
    "certificate_url" text,
    "notes" text,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now()
);


alter table "public"."exam_results" enable row level security;

create table "public"."inquiries" (
    "id" uuid not null default extensions.uuid_generate_v4(),
    "parent_id" uuid,
    "parent_name" character varying(255) not null,
    "child_name" character varying(255) not null,
    "child_age" integer not null,
    "current_level" english_level,
    "phone" character varying(20) not null,
    "email" character varying(255),
    "preferred_contact" contact_method default 'zalo'::contact_method,
    "how_did_hear" character varying(100),
    "interested_in" inquiry_type[],
    "message" text not null,
    "status" character varying(50) default 'pending'::character varying,
    "response_notes" text,
    "responded_at" timestamp with time zone,
    "responded_by" uuid,
    "created_at" timestamp with time zone default now()
);


alter table "public"."inquiries" enable row level security;

create table "public"."parents" (
    "id" uuid not null default extensions.uuid_generate_v4(),
    "full_name" character varying(255) not null,
    "email" character varying(255),
    "phone" character varying(20) not null,
    "preferred_contact" contact_method default 'zalo'::contact_method,
    "address" text,
    "how_did_hear" character varying(100),
    "agree_to_updates" boolean default false,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now()
);


alter table "public"."parents" enable row level security;

create table "public"."payments" (
    "id" uuid not null default extensions.uuid_generate_v4(),
    "student_id" uuid not null,
    "enrollment_id" uuid,
    "amount" numeric(10,2) not null,
    "payment_method" character varying(50),
    "payment_date" date default CURRENT_DATE,
    "payment_for" character varying(100),
    "term" character varying(50),
    "receipt_number" character varying(100),
    "notes" text,
    "created_by" uuid,
    "created_at" timestamp with time zone default now()
);


alter table "public"."payments" enable row level security;

create table "public"."student_progress" (
    "id" uuid not null default extensions.uuid_generate_v4(),
    "student_id" uuid not null,
    "enrollment_id" uuid not null,
    "assessment_date" date default CURRENT_DATE,
    "skill_area" character varying(100) not null,
    "level_score" numeric(5,2),
    "notes" text,
    "assessed_by" uuid,
    "created_at" timestamp with time zone default now()
);


alter table "public"."student_progress" enable row level security;

create table "public"."students" (
    "id" uuid not null default extensions.uuid_generate_v4(),
    "parent_id" uuid not null,
    "full_name" character varying(255) not null,
    "date_of_birth" date,
    "age" integer,
    "current_level" english_level,
    "assigned_stage" cambridge_stage,
    "status" student_status default 'inquiry'::student_status,
    "enrollment_date" date,
    "profile_photo_url" text,
    "notes" text,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now()
);


alter table "public"."students" enable row level security;

create table "public"."trial_bookings" (
    "id" uuid not null default extensions.uuid_generate_v4(),
    "parent_name" character varying(255) not null,
    "child_name" character varying(255) not null,
    "child_age" integer not null,
    "phone" character varying(20) not null,
    "email" character varying(255),
    "preferred_date" date,
    "preferred_time" time without time zone,
    "current_level" english_level,
    "assigned_class_id" uuid,
    "scheduled_date" date,
    "scheduled_time" time without time zone,
    "status" character varying(50) default 'pending'::character varying,
    "attended" boolean,
    "feedback" text,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now()
);


alter table "public"."trial_bookings" enable row level security;

create table "public"."users" (
    "id" uuid not null default extensions.uuid_generate_v4(),
    "email" character varying(255) not null,
    "full_name" character varying(255) not null,
    "role" character varying(50) not null,
    "phone" character varying(20),
    "is_active" boolean default true,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now()
);


alter table "public"."users" enable row level security;

alter table "public"."assessment" alter column "id" set default extensions.uuid_generate_v4();

alter table "public"."blog_posts" alter column "id" set default extensions.uuid_generate_v4();

alter table "public"."curriculum" alter column "id" set default extensions.uuid_generate_v4();

alter table "public"."dashboard_students" alter column "id" set default extensions.uuid_generate_v4();

alter table "public"."event_registrations" drop column "created_at";

alter table "public"."event_registrations" drop column "event_name";

alter table "public"."event_registrations" drop column "photo_consent";

alter table "public"."event_registrations" drop column "special_needs";

alter table "public"."event_registrations" add column "attended" boolean;

alter table "public"."event_registrations" add column "event_id" uuid not null;

alter table "public"."event_registrations" add column "notes" text;

alter table "public"."event_registrations" add column "payment_status" character varying(50) default 'pending'::character varying;

alter table "public"."event_registrations" add column "registered_at" timestamp with time zone default now();

alter table "public"."event_registrations" add column "student_id" uuid;

alter table "public"."event_registrations" alter column "child_age" drop not null;

alter table "public"."event_registrations" alter column "child_name" set data type character varying(255) using "child_name"::character varying(255);

alter table "public"."event_registrations" alter column "email" set data type character varying(255) using "email"::character varying(255);

alter table "public"."event_registrations" alter column "id" set default extensions.uuid_generate_v4();

alter table "public"."event_registrations" alter column "parent_name" set data type character varying(255) using "parent_name"::character varying(255);

alter table "public"."event_registrations" alter column "phone" set data type character varying(20) using "phone"::character varying(20);

alter table "public"."homework_completion" alter column "id" set default extensions.uuid_generate_v4();

alter table "public"."skills_evaluation" alter column "id" set default extensions.uuid_generate_v4();

alter table "public"."teachers" alter column "id" set default extensions.uuid_generate_v4();

CREATE UNIQUE INDEX attendance_enrollment_id_class_date_key ON public.attendance USING btree (enrollment_id, class_date);

CREATE UNIQUE INDEX attendance_pkey ON public.attendance USING btree (id);

CREATE UNIQUE INDEX classes_pkey ON public.classes USING btree (id);

CREATE UNIQUE INDEX enrollments_pkey ON public.enrollments USING btree (id);

CREATE UNIQUE INDEX enrollments_student_id_class_id_key ON public.enrollments USING btree (student_id, class_id);

CREATE UNIQUE INDEX event_registrations_event_id_student_id_key ON public.event_registrations USING btree (event_id, student_id);

CREATE UNIQUE INDEX events_pkey ON public.events USING btree (id);

CREATE UNIQUE INDEX exam_results_pkey ON public.exam_results USING btree (id);

CREATE INDEX idx_attendance_date ON public.attendance USING btree (class_date);

CREATE INDEX idx_attendance_enrollment_id ON public.attendance USING btree (enrollment_id);

CREATE INDEX idx_enrollments_active ON public.enrollments USING btree (is_active);

CREATE INDEX idx_enrollments_class_id ON public.enrollments USING btree (class_id);

CREATE INDEX idx_enrollments_student_id ON public.enrollments USING btree (student_id);

CREATE INDEX idx_events_date ON public.events USING btree (event_date);

CREATE INDEX idx_events_published ON public.events USING btree (is_published);

CREATE INDEX idx_exam_results_student_id ON public.exam_results USING btree (student_id);

CREATE INDEX idx_inquiries_created_at ON public.inquiries USING btree (created_at);

CREATE INDEX idx_inquiries_status ON public.inquiries USING btree (status);

CREATE INDEX idx_payments_date ON public.payments USING btree (payment_date);

CREATE INDEX idx_payments_student_id ON public.payments USING btree (student_id);

CREATE INDEX idx_students_parent_id ON public.students USING btree (parent_id);

CREATE INDEX idx_students_status ON public.students USING btree (status);

CREATE INDEX idx_trial_bookings_status ON public.trial_bookings USING btree (status);

CREATE UNIQUE INDEX inquiries_pkey ON public.inquiries USING btree (id);

CREATE UNIQUE INDEX parents_pkey ON public.parents USING btree (id);

CREATE UNIQUE INDEX payments_pkey ON public.payments USING btree (id);

CREATE UNIQUE INDEX payments_receipt_number_key ON public.payments USING btree (receipt_number);

CREATE UNIQUE INDEX student_progress_pkey ON public.student_progress USING btree (id);

CREATE UNIQUE INDEX students_pkey ON public.students USING btree (id);

CREATE UNIQUE INDEX trial_bookings_pkey ON public.trial_bookings USING btree (id);

CREATE UNIQUE INDEX users_email_key ON public.users USING btree (email);

CREATE UNIQUE INDEX users_pkey ON public.users USING btree (id);

alter table "public"."attendance" add constraint "attendance_pkey" PRIMARY KEY using index "attendance_pkey";

alter table "public"."classes" add constraint "classes_pkey" PRIMARY KEY using index "classes_pkey";

alter table "public"."enrollments" add constraint "enrollments_pkey" PRIMARY KEY using index "enrollments_pkey";

alter table "public"."events" add constraint "events_pkey" PRIMARY KEY using index "events_pkey";

alter table "public"."exam_results" add constraint "exam_results_pkey" PRIMARY KEY using index "exam_results_pkey";

alter table "public"."inquiries" add constraint "inquiries_pkey" PRIMARY KEY using index "inquiries_pkey";

alter table "public"."parents" add constraint "parents_pkey" PRIMARY KEY using index "parents_pkey";

alter table "public"."payments" add constraint "payments_pkey" PRIMARY KEY using index "payments_pkey";

alter table "public"."student_progress" add constraint "student_progress_pkey" PRIMARY KEY using index "student_progress_pkey";

alter table "public"."students" add constraint "students_pkey" PRIMARY KEY using index "students_pkey";

alter table "public"."trial_bookings" add constraint "trial_bookings_pkey" PRIMARY KEY using index "trial_bookings_pkey";

alter table "public"."users" add constraint "users_pkey" PRIMARY KEY using index "users_pkey";

alter table "public"."attendance" add constraint "attendance_enrollment_id_class_date_key" UNIQUE using index "attendance_enrollment_id_class_date_key";

alter table "public"."attendance" add constraint "attendance_enrollment_id_fkey" FOREIGN KEY (enrollment_id) REFERENCES enrollments(id) ON DELETE CASCADE not valid;

alter table "public"."attendance" validate constraint "attendance_enrollment_id_fkey";

alter table "public"."enrollments" add constraint "enrollments_class_id_fkey" FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE not valid;

alter table "public"."enrollments" validate constraint "enrollments_class_id_fkey";

alter table "public"."enrollments" add constraint "enrollments_student_id_class_id_key" UNIQUE using index "enrollments_student_id_class_id_key";

alter table "public"."enrollments" add constraint "enrollments_student_id_fkey" FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE not valid;

alter table "public"."enrollments" validate constraint "enrollments_student_id_fkey";

alter table "public"."event_registrations" add constraint "event_registrations_event_id_fkey" FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE not valid;

alter table "public"."event_registrations" validate constraint "event_registrations_event_id_fkey";

alter table "public"."event_registrations" add constraint "event_registrations_event_id_student_id_key" UNIQUE using index "event_registrations_event_id_student_id_key";

alter table "public"."event_registrations" add constraint "event_registrations_student_id_fkey" FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE SET NULL not valid;

alter table "public"."event_registrations" validate constraint "event_registrations_student_id_fkey";

alter table "public"."exam_results" add constraint "exam_results_listening_shields_check" CHECK (((listening_shields >= 1) AND (listening_shields <= 5))) not valid;

alter table "public"."exam_results" validate constraint "exam_results_listening_shields_check";

alter table "public"."exam_results" add constraint "exam_results_reading_writing_shields_check" CHECK (((reading_writing_shields >= 1) AND (reading_writing_shields <= 5))) not valid;

alter table "public"."exam_results" validate constraint "exam_results_reading_writing_shields_check";

alter table "public"."exam_results" add constraint "exam_results_speaking_shields_check" CHECK (((speaking_shields >= 1) AND (speaking_shields <= 5))) not valid;

alter table "public"."exam_results" validate constraint "exam_results_speaking_shields_check";

alter table "public"."exam_results" add constraint "exam_results_student_id_fkey" FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE not valid;

alter table "public"."exam_results" validate constraint "exam_results_student_id_fkey";

alter table "public"."inquiries" add constraint "inquiries_parent_id_fkey" FOREIGN KEY (parent_id) REFERENCES parents(id) ON DELETE SET NULL not valid;

alter table "public"."inquiries" validate constraint "inquiries_parent_id_fkey";

alter table "public"."payments" add constraint "payments_enrollment_id_fkey" FOREIGN KEY (enrollment_id) REFERENCES enrollments(id) ON DELETE SET NULL not valid;

alter table "public"."payments" validate constraint "payments_enrollment_id_fkey";

alter table "public"."payments" add constraint "payments_receipt_number_key" UNIQUE using index "payments_receipt_number_key";

alter table "public"."payments" add constraint "payments_student_id_fkey" FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE not valid;

alter table "public"."payments" validate constraint "payments_student_id_fkey";

alter table "public"."student_progress" add constraint "student_progress_enrollment_id_fkey" FOREIGN KEY (enrollment_id) REFERENCES enrollments(id) ON DELETE CASCADE not valid;

alter table "public"."student_progress" validate constraint "student_progress_enrollment_id_fkey";

alter table "public"."student_progress" add constraint "student_progress_student_id_fkey" FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE not valid;

alter table "public"."student_progress" validate constraint "student_progress_student_id_fkey";

alter table "public"."students" add constraint "students_parent_id_fkey" FOREIGN KEY (parent_id) REFERENCES parents(id) ON DELETE CASCADE not valid;

alter table "public"."students" validate constraint "students_parent_id_fkey";

alter table "public"."trial_bookings" add constraint "trial_bookings_assigned_class_id_fkey" FOREIGN KEY (assigned_class_id) REFERENCES classes(id) ON DELETE SET NULL not valid;

alter table "public"."trial_bookings" validate constraint "trial_bookings_assigned_class_id_fkey";

alter table "public"."users" add constraint "users_email_key" UNIQUE using index "users_email_key";

set check_function_bodies = off;

create or replace view "public"."active_students_with_classes" as  SELECT s.id,
    s.full_name AS student_name,
    s.age,
    s.current_level,
    s.assigned_stage,
    p.full_name AS parent_name,
    p.phone AS parent_phone,
    p.email AS parent_email,
    c.class_name,
    c.stage AS class_stage,
    c.teacher_name,
    e.attendance_rate,
    e.enrollment_date
   FROM (((students s
     JOIN parents p ON ((s.parent_id = p.id)))
     LEFT JOIN enrollments e ON (((s.id = e.student_id) AND (e.is_active = true))))
     LEFT JOIN classes c ON ((e.class_id = c.id)))
  WHERE (s.status = 'active'::student_status);


create or replace view "public"."upcoming_events" as  SELECT id,
    title,
    description,
    event_type,
    event_date,
    start_time,
    end_time,
    location,
    max_participants,
    current_participants,
    (max_participants - current_participants) AS spots_remaining,
    price,
    image_url,
    age_min,
    age_max
   FROM events
  WHERE ((is_published = true) AND (event_date >= CURRENT_DATE))
  ORDER BY event_date, start_time;


CREATE OR REPLACE FUNCTION public.update_class_participant_count()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
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
$function$
;

CREATE OR REPLACE FUNCTION public.update_event_participant_count()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
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
$function$
;

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$function$
;

create policy "Authenticated users have full access to attendance"
on "public"."attendance"
as permissive
for all
to public
using ((auth.role() = 'authenticated'::text));


create policy "Published blogs are viewable by everyone"
on "public"."blog_posts"
as permissive
for select
to public
using ((published = true));


create policy "Authenticated users have full access to classes"
on "public"."classes"
as permissive
for all
to public
using ((auth.role() = 'authenticated'::text));


create policy "Authenticated users have full access to enrollments"
on "public"."enrollments"
as permissive
for all
to public
using ((auth.role() = 'authenticated'::text));


create policy "Anyone can register for events"
on "public"."event_registrations"
as permissive
for insert
to public
with check (true);


create policy "Authenticated users can manage event registrations"
on "public"."event_registrations"
as permissive
for all
to public
using ((auth.role() = 'authenticated'::text));


create policy "Authenticated users can manage events"
on "public"."events"
as permissive
for all
to public
using ((auth.role() = 'authenticated'::text));


create policy "Events are viewable by everyone"
on "public"."events"
as permissive
for select
to public
using ((is_published = true));


create policy "Authenticated users have full access to exam results"
on "public"."exam_results"
as permissive
for all
to public
using ((auth.role() = 'authenticated'::text));


create policy "Anyone can submit inquiries"
on "public"."inquiries"
as permissive
for insert
to public
with check (true);


create policy "Authenticated users can manage inquiries"
on "public"."inquiries"
as permissive
for all
to public
using ((auth.role() = 'authenticated'::text));


create policy "Authenticated users have full access to parents"
on "public"."parents"
as permissive
for all
to public
using ((auth.role() = 'authenticated'::text));


create policy "Authenticated users have full access to payments"
on "public"."payments"
as permissive
for all
to public
using ((auth.role() = 'authenticated'::text));


create policy "Authenticated users have full access to progress"
on "public"."student_progress"
as permissive
for all
to public
using ((auth.role() = 'authenticated'::text));


create policy "Authenticated users have full access to students"
on "public"."students"
as permissive
for all
to public
using ((auth.role() = 'authenticated'::text));


create policy "Anyone can book trial classes"
on "public"."trial_bookings"
as permissive
for insert
to public
with check (true);


create policy "Authenticated users can manage trial bookings"
on "public"."trial_bookings"
as permissive
for all
to public
using ((auth.role() = 'authenticated'::text));


CREATE TRIGGER update_classes_updated_at BEFORE UPDATE ON public.classes FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_class_count AFTER INSERT OR DELETE OR UPDATE ON public.enrollments FOR EACH ROW EXECUTE FUNCTION update_class_participant_count();

CREATE TRIGGER update_enrollments_updated_at BEFORE UPDATE ON public.enrollments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_event_count AFTER INSERT OR DELETE ON public.event_registrations FOR EACH ROW EXECUTE FUNCTION update_event_participant_count();

CREATE TRIGGER update_events_updated_at BEFORE UPDATE ON public.events FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_exam_results_updated_at BEFORE UPDATE ON public.exam_results FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_parents_updated_at BEFORE UPDATE ON public.parents FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_students_updated_at BEFORE UPDATE ON public.students FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_trial_bookings_updated_at BEFORE UPDATE ON public.trial_bookings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();



