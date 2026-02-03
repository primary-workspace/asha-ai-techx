-- Enable RLS on children table
ALTER TABLE public.children ENABLE ROW LEVEL SECURITY;

-- Create policy for children table (Public access for MVP/Mock Auth)
CREATE POLICY "Enable read access for all users" ON public.children
    FOR SELECT USING (true);

CREATE POLICY "Enable insert access for all users" ON public.children
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable update access for all users" ON public.children
    FOR UPDATE USING (true);

-- Ensure beneficiary_profiles columns exist (idempotent check)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'beneficiary_profiles' AND column_name = 'medical_history') THEN
        ALTER TABLE public.beneficiary_profiles ADD COLUMN medical_history text;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'beneficiary_profiles' AND column_name = 'current_medications') THEN
        ALTER TABLE public.beneficiary_profiles ADD COLUMN current_medications text;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'beneficiary_profiles' AND column_name = 'complications') THEN
        ALTER TABLE public.beneficiary_profiles ADD COLUMN complications text;
    END IF;
END $$;
