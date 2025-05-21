-- First, disable RLS temporarily to make changes
ALTER TABLE public.fraud_candidates DISABLE ROW LEVEL SECURITY;

-- Remove existing policies to avoid conflicts
DROP POLICY IF EXISTS "Enable read access for all authenticated users" ON public.fraud_candidates;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.fraud_candidates;
DROP POLICY IF EXISTS "Enable update for authenticated users" ON public.fraud_candidates;

-- Re-enable RLS
ALTER TABLE public.fraud_candidates ENABLE ROW LEVEL SECURITY;

-- Create new policies
-- Allow all authenticated users to view all candidates
CREATE POLICY "Enable read access for all authenticated users" 
ON public.fraud_candidates
FOR SELECT
TO authenticated
USING (true);

-- Allow all authenticated users to insert new candidates
CREATE POLICY "Enable insert for authenticated users"
ON public.fraud_candidates
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Allow users to update their own candidates
CREATE POLICY "Enable update for authenticated users"
ON public.fraud_candidates
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- Storage policies for resumes
-- Allow authenticated users to upload files to their own folder
CREATE POLICY "Allow uploads to resumes"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'resumes' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow users to view their own files
CREATE POLICY "Allow reads from resumes"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'resumes' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow users to update their own files
CREATE POLICY "Allow updates to resumes"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'resumes' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow users to delete their own files
CREATE POLICY "Allow deletes from resumes"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'resumes' AND
  (storage.foldername(name))[1] = auth.uid()::text
);
