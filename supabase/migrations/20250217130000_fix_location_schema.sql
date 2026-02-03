/*
  # Fix Location Schema and Add Address
  
  1. Add 'address' column (Text) for manual entry
  2. Add 'gps_coords' column (JSONB) for storing {lat, lng} from browser API
  3. Note: We are ADDING new columns instead of converting the old 'location' column
     to avoid the "cannot cast type geography to jsonb" error.
*/

-- Add address column if it doesn't exist
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'beneficiary_profiles' AND column_name = 'address') THEN 
        ALTER TABLE beneficiary_profiles ADD COLUMN address text; 
    END IF; 
END $$;

-- Add gps_coords column if it doesn't exist
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'beneficiary_profiles' AND column_name = 'gps_coords') THEN 
        ALTER TABLE beneficiary_profiles ADD COLUMN gps_coords jsonb; 
    END IF; 
END $$;

-- Ensure RLS policies allow updating these new columns (Update policy usually covers all columns, but good to verify)
-- No extra action needed if "Enable update access for all users" policy exists on beneficiary_profiles
