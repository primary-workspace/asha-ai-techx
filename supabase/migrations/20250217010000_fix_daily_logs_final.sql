-- 1. Create daily_logs table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.daily_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    mood TEXT,
    symptoms TEXT[], -- Array of strings
    notes TEXT,
    flow TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Enable RLS
ALTER TABLE public.daily_logs ENABLE ROW LEVEL SECURITY;

-- 3. Create Policy for Public Access (Mock Auth)
DROP POLICY IF EXISTS "Enable read access for all users" ON public.daily_logs;
CREATE POLICY "Enable read access for all users" ON public.daily_logs
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Enable insert access for all users" ON public.daily_logs;
CREATE POLICY "Enable insert access for all users" ON public.daily_logs
    FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Enable update access for all users" ON public.daily_logs;
CREATE POLICY "Enable update access for all users" ON public.daily_logs
    FOR UPDATE USING (true);

-- 4. Ensure Beneficiary Profile allows NULLs for manual entry
ALTER TABLE public.beneficiary_profiles 
ALTER COLUMN last_period_date DROP NOT NULL,
ALTER COLUMN pregnancy_stage_weeks DROP NOT NULL,
ALTER COLUMN anemia_status DROP NOT NULL,
ALTER COLUMN risk_level DROP NOT NULL;
