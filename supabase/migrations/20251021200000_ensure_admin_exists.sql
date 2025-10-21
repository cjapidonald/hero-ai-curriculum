-- Create admins table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.admins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  surname VARCHAR(255) NOT NULL,
  phone VARCHAR(20),
  profile_image_url TEXT,
  is_active BOOLEAN DEFAULT true,
  last_login TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on admins table
ALTER TABLE public.admins ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for admins
DROP POLICY IF EXISTS "Admins can view all admins" ON public.admins;
CREATE POLICY "Admins can view all admins"
  ON public.admins FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Admins can update themselves" ON public.admins;
CREATE POLICY "Admins can update themselves"
  ON public.admins FOR UPDATE
  USING (true);

-- Insert admin user if not exists
INSERT INTO public.admins (email, password, name, surname, phone, is_active)
VALUES ('admin@heroschool.com', 'admin123', 'Admin', 'HeroSchool', '+84123456789', true)
ON CONFLICT (email) DO UPDATE
SET password = 'admin123', is_active = true;

-- Also update teacher donald with login credentials if exists
UPDATE public.teachers
SET
  email = 'donald@heroschool.com',
  password = 'teacher123',
  username = 'donald',
  is_active = true
WHERE name = 'Donald';

-- If donald doesn't exist, check if we need to create them
-- (We'll handle this separately if needed)

SELECT 'Admin setup complete!' AS message;
