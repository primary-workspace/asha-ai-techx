/*
  # Allow Updates to Children Table
  
  ## Query Description:
  Adds an UPDATE policy to the 'children' table. This is required for the Vaccination Tracker
  to save changes (marking vaccines as done) to existing child records.
  
  ## Metadata:
  - Schema-Category: Safe
  - Impact-Level: Low
  - Reversible: Yes
*/

-- Enable UPDATE access for all users (since we use mock auth for MVP)
CREATE POLICY "Enable update access for all users" ON "public"."children"
FOR UPDATE USING (true);
