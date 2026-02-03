/*
  # Fix Children Table Policies (Retry)
  
  This script creates a clean slate for the children table security policies.
  It drops all existing policies to prevent conflicts and then recreates them
  to allow SELECT, INSERT, and UPDATE operations.
*/

-- First, drop ALL existing policies to ensure a clean state
DROP POLICY IF EXISTS "Enable read access for all users" ON public.children;
DROP POLICY IF EXISTS "Enable insert access for all users" ON public.children;
DROP POLICY IF EXISTS "Enable update access for all users" ON public.children;
DROP POLICY IF EXISTS "Enable delete access for all users" ON public.children;
DROP POLICY IF EXISTS "Allow public read access" ON public.children;
DROP POLICY IF EXISTS "Allow public insert access" ON public.children;
DROP POLICY IF EXISTS "Allow public update access" ON public.children;

-- Enable RLS (idempotent)
ALTER TABLE public.children ENABLE ROW LEVEL SECURITY;

-- Create comprehensive policies
CREATE POLICY "Enable read access for all users"
ON public.children FOR SELECT
USING (true);

CREATE POLICY "Enable insert access for all users"
ON public.children FOR INSERT
WITH CHECK (true);

CREATE POLICY "Enable update access for all users"
ON public.children FOR UPDATE
USING (true);
