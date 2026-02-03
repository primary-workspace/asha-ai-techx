-- Fix policy conflict for children table by dropping existing ones first

-- 1. Ensure RLS is enabled
ALTER TABLE IF EXISTS public.children ENABLE ROW LEVEL SECURITY;

-- 2. Drop existing policies to prevent "already exists" error
DROP POLICY IF EXISTS "Enable read access for all users" ON public.children;
DROP POLICY IF EXISTS "Enable insert access for all users" ON public.children;
DROP POLICY IF EXISTS "Enable update access for all users" ON public.children;
DROP POLICY IF EXISTS "Enable delete access for all users" ON public.children;

-- 3. Re-create policies (Permissive for MVP/Mock Auth)
CREATE POLICY "Enable read access for all users" ON public.children FOR SELECT USING (true);
CREATE POLICY "Enable insert access for all users" ON public.children FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update access for all users" ON public.children FOR UPDATE USING (true);
CREATE POLICY "Enable delete access for all users" ON public.children FOR DELETE USING (true);
