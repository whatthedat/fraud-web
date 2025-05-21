-- Enable Row Level Security
ALTER TABLE IF EXISTS public.fraud_candidates ENABLE ROW LEVEL SECURITY;

-- Create a table for fraud candidates
CREATE TABLE IF NOT EXISTS public.fraud_candidates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  description TEXT,
  resume_url TEXT,
  added_by TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  CONSTRAINT unique_email UNIQUE (email)
);

-- Create a policy to allow authenticated users to view all candidates
CREATE POLICY "Enable read access for all authenticated users" 
ON public.fraud_candidates
FOR SELECT
TO authenticated
USING (true);

-- Create a policy to allow users to insert their own candidates
CREATE POLICY "Enable insert for authenticated users"
ON public.fraud_candidates
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Create a policy to allow users to update their own candidates
CREATE POLICY "Enable update for authenticated users"
ON public.fraud_candidates
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- Create a function to update the updated_at column
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create a trigger to update the updated_at column
CREATE TRIGGER update_fraud_candidates_updated_at
BEFORE UPDATE ON public.fraud_candidates
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Create storage bucket for resumes
INSERT INTO storage.buckets (id, name, public) 
VALUES ('resumes', 'resumes', false)
ON CONFLICT (id) DO NOTHING;

-- Create a policy to allow users to upload their own files
CREATE POLICY "Allow users to upload their own resumes"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'resumes' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Create a policy to allow users to view their own files
CREATE POLICY "Allow users to view their own resumes"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'resumes' AND
auth.uid()::text = (storage.foldername(name))[1]
);

-- Create a policy to allow users to update their own files
CREATE POLICY "Allow users to update their own resumes"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'resumes' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Create a policy to allow users to delete their own files
CREATE POLICY "Allow users to delete their own resumes"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'resumes' AND
  (storage.foldername(name))[1] = auth.uid()::text
);
