-- Drop website-related tables that are no longer needed
-- These tables were used for the public-facing website which has been removed

-- Drop blog_posts table (public blog feature)
DROP TABLE IF EXISTS public.blog_posts CASCADE;

-- Drop event_registrations table (public event registration form)
DROP TABLE IF EXISTS public.event_registrations CASCADE;

-- Note: contact_submissions was already dropped in migration 20251024140000_drop_unused_tables.sql
-- Note: inquiries, trial_bookings, events were already dropped in migration 20251024140000_drop_unused_tables.sql
