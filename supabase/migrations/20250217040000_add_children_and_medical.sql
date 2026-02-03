-- Create children table
CREATE TABLE IF NOT EXISTS children (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  beneficiary_id uuid REFERENCES beneficiary_profiles(id) ON DELETE CASCADE,
  name text NOT NULL,
  dob date,
  gender text,
  blood_group text,
  vaccinations jsonb DEFAULT '[]'::jsonb,
  created_at timestamp DEFAULT now()
);

-- Add columns to beneficiary_profiles for extensive details
ALTER TABLE beneficiary_profiles 
ADD COLUMN IF NOT EXISTS medical_history text,
ADD COLUMN IF NOT EXISTS current_medications text,
ADD COLUMN IF NOT EXISTS complications text;

-- Enable RLS for children
ALTER TABLE children ENABLE ROW LEVEL SECURITY;

-- Policies for children (Public for MVP/Mock Auth)
CREATE POLICY "Enable read access for all users" ON children FOR SELECT USING (true);
CREATE POLICY "Enable insert access for all users" ON children FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update access for all users" ON children FOR UPDATE USING (true);
CREATE POLICY "Enable delete access for all users" ON children FOR DELETE USING (true);
