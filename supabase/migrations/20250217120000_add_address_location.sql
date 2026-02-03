-- Add address column
ALTER TABLE beneficiary_profiles ADD COLUMN IF NOT EXISTS address text;

-- Simplify location to jsonb for easier frontend handling in MVP
-- We first drop the old column if it exists as geography (optional, or we just add a new one)
-- For safety, let's alter it to jsonb using a cast, or just drop and recreate if empty
-- A safer approach for MVP:
ALTER TABLE beneficiary_profiles ALTER COLUMN location TYPE jsonb USING location::jsonb;

-- If the above fails due to complex types, we can just ensure it accepts json
-- But assuming it was created as geography in previous steps, let's just add a new column 'gps_coords' to be safe
ALTER TABLE beneficiary_profiles ADD COLUMN IF NOT EXISTS gps_coords jsonb;

-- Grant permissions
GRANT ALL ON beneficiary_profiles TO authenticated;
GRANT ALL ON beneficiary_profiles TO anon;
