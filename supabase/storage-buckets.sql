-- =============================================
-- SUPABASE STORAGE BUCKETS CONFIGURATION
-- For curriculum resources and file uploads
-- =============================================

-- Create storage buckets if they don't exist
-- Note: These are typically created via Supabase Dashboard or CLI
-- This is documentation of the required buckets

-- =============================================
-- 1. CURRICULUM RESOURCES BUCKET
-- =============================================
-- Bucket name: curriculum-resources
-- Public: true
-- File size limit: 50MB
-- Allowed MIME types: application/pdf, image/*, video/*, audio/*

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'curriculum-resources',
  'curriculum-resources',
  true,
  52428800, -- 50MB in bytes
  ARRAY['application/pdf', 'image/*', 'video/*', 'audio/*', 'application/vnd.ms-powerpoint', 'application/vnd.openxmlformats-officedocument.presentationml.presentation']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 52428800,
  allowed_mime_types = ARRAY['application/pdf', 'image/*', 'video/*', 'audio/*', 'application/vnd.ms-powerpoint', 'application/vnd.openxmlformats-officedocument.presentationml.presentation'];

-- RLS Policies for curriculum-resources bucket
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
USING ( bucket_id = 'curriculum-resources' );

CREATE POLICY "Authenticated users can upload"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'curriculum-resources' AND
  auth.role() = 'authenticated'
);

CREATE POLICY "Users can update own files"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'curriculum-resources' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete own files"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'curriculum-resources' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- =============================================
-- 2. PROFILE IMAGES BUCKET
-- =============================================
-- Bucket name: profile-images
-- Public: true
-- File size limit: 5MB
-- Allowed MIME types: image/*

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'profile-images',
  'profile-images',
  true,
  5242880, -- 5MB in bytes
  ARRAY['image/*']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 5242880,
  allowed_mime_types = ARRAY['image/*'];

-- RLS Policies for profile-images bucket
CREATE POLICY "Profile Images Public Access"
ON storage.objects FOR SELECT
USING ( bucket_id = 'profile-images' );

CREATE POLICY "Authenticated users can upload profile images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'profile-images' AND
  auth.role() = 'authenticated'
);

CREATE POLICY "Users can update own profile images"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'profile-images' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete own profile images"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'profile-images' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- =============================================
-- 3. STUDENT WORK BUCKET
-- =============================================
-- Bucket name: student-work
-- Public: false (private)
-- File size limit: 10MB
-- Allowed MIME types: application/pdf, image/*, video/*

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'student-work',
  'student-work',
  false,
  10485760, -- 10MB in bytes
  ARRAY['application/pdf', 'image/*', 'video/*', 'audio/*']
)
ON CONFLICT (id) DO UPDATE SET
  public = false,
  file_size_limit = 10485760,
  allowed_mime_types = ARRAY['application/pdf', 'image/*', 'video/*', 'audio/*'];

-- RLS Policies for student-work bucket (private)
CREATE POLICY "Teachers can view student work"
ON storage.objects FOR SELECT
USING ( bucket_id = 'student-work' );

CREATE POLICY "Students and teachers can upload work"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'student-work' AND
  auth.role() = 'authenticated'
);

CREATE POLICY "Owners can update work"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'student-work' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Owners can delete work"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'student-work' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- =============================================
-- FOLDER STRUCTURE
-- =============================================
-- curriculum-resources/
--   ├── {teacher_id}/
--   │   ├── warmup/
--   │   ├── main-activities/
--   │   ├── assessments/
--   │   ├── homework/
--   │   └── printables/
--   └── public/
--       ├── warmup/
--       ├── main-activities/
--       ├── assessments/
--       ├── homework/
--       └── printables/
--
-- profile-images/
--   ├── teachers/{teacher_id}/
--   └── students/{student_id}/
--
-- student-work/
--   └── {student_id}/
--       ├── homework/
--       ├── projects/
--       └── assessments/
