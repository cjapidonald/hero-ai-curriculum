-- =============================================
-- PROFILE IMAGES STORAGE BUCKET
-- For storing user profile pictures
-- =============================================

-- Create storage bucket for profile images
INSERT INTO storage.buckets (id, name, public)
VALUES ('profile-images', 'profile-images', true)
ON CONFLICT (id) DO NOTHING;

-- RLS policies for profile-images bucket

-- Allow authenticated users to upload their own profile images
CREATE POLICY "Users can upload own profile images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'profile-images' AND
  (storage.foldername(name))[1] IN ('students', 'teachers', 'admins')
);

-- Allow authenticated users to update their own profile images
CREATE POLICY "Users can update own profile images"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'profile-images');

-- Allow authenticated users to delete their own profile images
CREATE POLICY "Users can delete own profile images"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'profile-images');

-- Allow public read access to all profile images
CREATE POLICY "Public read access to profile images"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'profile-images');

COMMENT ON SCHEMA storage IS 'Storage schema for user uploads including profile images';
