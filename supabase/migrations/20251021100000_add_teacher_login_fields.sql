-- Add email, password, and username columns to the teachers table
ALTER TABLE public.teachers
ADD COLUMN email VARCHAR(255) UNIQUE,
ADD COLUMN password VARCHAR(255),
ADD COLUMN username VARCHAR(255) UNIQUE;

-- Optionally, add a NOT NULL constraint and a default value if desired for existing rows
-- For example, if you want to ensure all new teachers have an email:
-- ALTER TABLE public.teachers ALTER COLUMN email SET NOT NULL;

-- Add an index to the email and username columns for faster lookups
CREATE INDEX IF NOT EXISTS idx_teachers_email ON public.teachers(email);
CREATE INDEX IF NOT EXISTS idx_teachers_username ON public.teachers(username);
