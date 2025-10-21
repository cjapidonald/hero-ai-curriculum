-- Add email, password, and username columns to the teachers table (if they don't exist)
DO $$
BEGIN
    -- Add email column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_schema = 'public'
                   AND table_name = 'teachers'
                   AND column_name = 'email') THEN
        ALTER TABLE public.teachers ADD COLUMN email VARCHAR(255) UNIQUE;
    END IF;

    -- Add password column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_schema = 'public'
                   AND table_name = 'teachers'
                   AND column_name = 'password') THEN
        ALTER TABLE public.teachers ADD COLUMN password VARCHAR(255);
    END IF;

    -- Add username column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_schema = 'public'
                   AND table_name = 'teachers'
                   AND column_name = 'username') THEN
        ALTER TABLE public.teachers ADD COLUMN username VARCHAR(255) UNIQUE;
    END IF;
END $$;

-- Optionally, add a NOT NULL constraint and a default value if desired for existing rows
-- For example, if you want to ensure all new teachers have an email:
-- ALTER TABLE public.teachers ALTER COLUMN email SET NOT NULL;

-- Add an index to the email and username columns for faster lookups
CREATE INDEX IF NOT EXISTS idx_teachers_email ON public.teachers(email);
CREATE INDEX IF NOT EXISTS idx_teachers_username ON public.teachers(username);
