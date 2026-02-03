-- Add 'type' column to alerts table if it doesn't exist
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'alerts' AND column_name = 'type') THEN 
        ALTER TABLE alerts ADD COLUMN type text DEFAULT 'health_risk';
    END IF;
END $$;

-- Ensure RLS allows inserting alerts (SOS)
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON alerts;
CREATE POLICY "Enable insert for all users" ON alerts FOR INSERT WITH CHECK (true);

-- Ensure RLS allows updating alerts (Resolving)
DROP POLICY IF EXISTS "Enable update for users" ON alerts;
CREATE POLICY "Enable update for all users" ON alerts FOR UPDATE USING (true);
