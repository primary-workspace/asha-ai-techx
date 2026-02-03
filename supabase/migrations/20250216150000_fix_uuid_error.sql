-- Drop existing tables to reset (Clean Slate)
DROP TABLE IF EXISTS sync_queue CASCADE;
DROP TABLE IF EXISTS aggregated_health_stats CASCADE;
DROP TABLE IF EXISTS scheme_activity_logs CASCADE;
DROP TABLE IF EXISTS scheme_beneficiaries CASCADE;
DROP TABLE IF EXISTS scheme_campaigns CASCADE;
DROP TABLE IF EXISTS schemes CASCADE;
DROP TABLE IF EXISTS content_topics CASCADE;
DROP TABLE IF EXISTS reminders CASCADE;
DROP TABLE IF EXISTS asha_visits CASCADE;
DROP TABLE IF EXISTS alerts CASCADE;
DROP TABLE IF EXISTS daily_logs CASCADE;
DROP TABLE IF EXISTS health_logs CASCADE;
DROP TABLE IF EXISTS reproductive_health_data CASCADE;
DROP TABLE IF EXISTS digital_health_cards CASCADE;
DROP TABLE IF EXISTS beneficiary_profiles CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Drop types if they exist
DROP TYPE IF EXISTS scheme_status CASCADE;
DROP TYPE IF EXISTS visit_type CASCADE;
DROP TYPE IF EXISTS content_type CASCADE;
DROP TYPE IF EXISTS content_category CASCADE;
DROP TYPE IF EXISTS reminder_status CASCADE;
DROP TYPE IF EXISTS reminder_type CASCADE;
DROP TYPE IF EXISTS alert_status CASCADE;
DROP TYPE IF EXISTS alert_severity CASCADE;
DROP TYPE IF EXISTS risk_level CASCADE;
DROP TYPE IF EXISTS anemia_status CASCADE;
DROP TYPE IF EXISTS user_role CASCADE;

-- Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS postgis;

-- Enums
CREATE TYPE user_role AS ENUM ('beneficiary', 'asha_worker', 'partner', 'admin');
CREATE TYPE anemia_status AS ENUM ('normal','mild','severe');
CREATE TYPE risk_level AS ENUM ('low','medium','high');
CREATE TYPE alert_severity AS ENUM ('low','medium','high','critical');
CREATE TYPE alert_status AS ENUM ('open','resolved');
CREATE TYPE reminder_type AS ENUM ('ifa','checkup','visit','vaccination');
CREATE TYPE reminder_status AS ENUM ('pending','completed');
CREATE TYPE content_category AS ENUM ('menstrual_hygiene', 'puberty', 'pregnancy', 'danger_signs', 'nutrition');
CREATE TYPE content_type AS ENUM ('audio','image','text');
CREATE TYPE visit_type AS ENUM ('home','hospital','call');
CREATE TYPE scheme_status AS ENUM ('active','completed','rejected');

-- Tables

CREATE TABLE users (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  phone_number text UNIQUE,
  name text, -- Added name column
  role user_role NOT NULL,
  language text DEFAULT 'hi',
  created_at timestamp DEFAULT now()
);

CREATE TABLE beneficiary_profiles (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  name text,
  age int,
  last_period_date date,
  pregnancy_stage_weeks int,
  anemia_status anemia_status,
  risk_level risk_level DEFAULT 'low',
  location geography(Point, 4326),
  linked_asha_id uuid REFERENCES users(id),
  
  -- New fields from previous requests
  height numeric,
  weight numeric,
  blood_group text,
  user_type text, -- 'girl', 'pregnant', 'mother'
  
  created_at timestamp DEFAULT now()
);

CREATE TABLE digital_health_cards (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  beneficiary_id uuid REFERENCES beneficiary_profiles(id) ON DELETE CASCADE,
  card_uid text UNIQUE NOT NULL,
  qr_payload jsonb,
  is_active boolean DEFAULT true,
  issued_at timestamp DEFAULT now()
);

CREATE TABLE reproductive_health_data (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  beneficiary_id uuid REFERENCES beneficiary_profiles(id) ON DELETE CASCADE,
  last_period_date date,
  predicted_next_period date,
  fertile_window_start date,
  fertile_window_end date,
  trimester int,
  ai_generated boolean DEFAULT false,
  updated_at timestamp DEFAULT now()
);

CREATE TABLE health_logs (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  beneficiary_id uuid REFERENCES beneficiary_profiles(id) ON DELETE CASCADE,
  recorded_by uuid REFERENCES users(id),
  visit_type visit_type,
  symptoms jsonb,
  vitals jsonb,
  voice_note_url text,
  ai_summary text,
  risk_flags jsonb,
  is_emergency boolean DEFAULT false,
  synced boolean DEFAULT false,
  created_at timestamp DEFAULT now()
);

CREATE TABLE daily_logs (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id uuid REFERENCES users(id) ON DELETE CASCADE,
    date date,
    mood text,
    symptoms jsonb,
    notes text,
    created_at timestamp DEFAULT now()
);

CREATE TABLE alerts (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  beneficiary_id uuid REFERENCES beneficiary_profiles(id),
  severity alert_severity,
  reason text,
  status alert_status DEFAULT 'open',
  triggered_by uuid REFERENCES users(id),
  resolved_by uuid REFERENCES users(id),
  created_at timestamp DEFAULT now()
);

CREATE TABLE asha_visits (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  asha_id uuid REFERENCES users(id),
  beneficiary_id uuid REFERENCES beneficiary_profiles(id),
  visit_date date,
  visit_notes text,
  ai_summary text,
  next_followup_date date,
  synced boolean DEFAULT false
);

CREATE TABLE reminders (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  beneficiary_id uuid REFERENCES beneficiary_profiles(id),
  reminder_type reminder_type,
  message text,
  scheduled_date date,
  status reminder_status DEFAULT 'pending',
  created_at timestamp DEFAULT now()
);

CREATE TABLE content_topics (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  title text,
  category content_category,
  language text DEFAULT 'hi',
  content_type content_type,
  content_url text
);

CREATE TABLE schemes (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_by uuid REFERENCES users(id),
  scheme_name text, -- mapped to title in frontend
  description text,
  eligibility_criteria jsonb,
  benefits jsonb,
  start_date date,
  end_date date,
  is_active boolean DEFAULT true,
  
  -- New fields
  provider text, -- 'Govt' or 'NGO'
  category text, -- 'financial', 'nutrition', etc.
  budget numeric,
  hero_image text,
  target_audience jsonb,
  
  created_at timestamp DEFAULT now()
);

CREATE TABLE scheme_campaigns (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  scheme_id uuid REFERENCES schemes(id) ON DELETE CASCADE,
  campaign_name text,
  theme jsonb,
  landing_content jsonb,
  is_live boolean DEFAULT false,
  created_at timestamp DEFAULT now()
);

CREATE TABLE scheme_beneficiaries (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  scheme_id uuid REFERENCES schemes(id),
  beneficiary_id uuid REFERENCES beneficiary_profiles(id),
  enrolled_by uuid REFERENCES users(id),
  enrollment_date date,
  status scheme_status DEFAULT 'active'
);

CREATE TABLE scheme_activity_logs (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  scheme_id uuid REFERENCES schemes(id),
  action text,
  actor_id uuid REFERENCES users(id),
  metadata jsonb,
  created_at timestamp DEFAULT now()
);

CREATE TABLE aggregated_health_stats (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  region text,
  metric text,
  value numeric,
  calculated_at timestamp DEFAULT now()
);

CREATE TABLE sync_queue (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  entity text,
  entity_id uuid,
  action text,
  payload jsonb,
  synced boolean DEFAULT false,
  created_at timestamp DEFAULT now()
);

-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE beneficiary_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE digital_health_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE reproductive_health_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE health_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE asha_visits ENABLE ROW LEVEL SECURITY;
ALTER TABLE reminders ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE schemes ENABLE ROW LEVEL SECURITY;
ALTER TABLE scheme_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE scheme_beneficiaries ENABLE ROW LEVEL SECURITY;
ALTER TABLE scheme_activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE aggregated_health_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE sync_queue ENABLE ROW LEVEL SECURITY;

-- Create Permissive Policies (Mock Auth Mode)
CREATE POLICY "Allow All Access" ON users FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow All Access" ON beneficiary_profiles FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow All Access" ON digital_health_cards FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow All Access" ON reproductive_health_data FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow All Access" ON health_logs FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow All Access" ON daily_logs FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow All Access" ON alerts FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow All Access" ON asha_visits FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow All Access" ON reminders FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow All Access" ON content_topics FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow All Access" ON schemes FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow All Access" ON scheme_campaigns FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow All Access" ON scheme_beneficiaries FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow All Access" ON scheme_activity_logs FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow All Access" ON aggregated_health_stats FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow All Access" ON sync_queue FOR ALL USING (true) WITH CHECK (true);

-- Insert Mock Data with Valid UUIDs
-- Sunita (Beneficiary): 00000000-0000-0000-0000-000000000001
-- Priya (ASHA): 00000000-0000-0000-0000-000000000002
-- Dr. Rajesh (Partner): 00000000-0000-0000-0000-000000000003
-- Anita (Beneficiary 2): 00000000-0000-0000-0000-000000000004

INSERT INTO users (id, name, role) VALUES 
('00000000-0000-0000-0000-000000000001', 'Sunita Devi', 'beneficiary'),
('00000000-0000-0000-0000-000000000002', 'Priya ASHA', 'asha_worker'),
('00000000-0000-0000-0000-000000000003', 'Dr. Rajesh (Govt)', 'partner'),
('00000000-0000-0000-0000-000000000004', 'Anita Kumar', 'beneficiary');

INSERT INTO beneficiary_profiles (id, user_id, name, age, pregnancy_stage_weeks, anemia_status, risk_level, linked_asha_id, height, weight, blood_group, user_type) VALUES
('a0000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'Sunita Devi', 24, 32, 'mild', 'medium', '00000000-0000-0000-0000-000000000002', 158, 62, 'B+', 'pregnant'),
('a0000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000004', 'Anita Kumar', 28, 20, 'severe', 'high', '00000000-0000-0000-0000-000000000002', 160, 55, 'O+', 'mother');

INSERT INTO schemes (id, scheme_name, description, provider, category, budget, hero_image, is_active) VALUES
('b0000000-0000-0000-0000-000000000001', 'Janani Suraksha Yojana', 'Cash assistance for institutional delivery.', 'Govt', 'financial', 5000000, 'https://cdn-icons-png.flaticon.com/512/2382/2382461.png', true),
('b0000000-0000-0000-0000-000000000002', 'Poshan Abhiyaan', 'Nutrition baskets for anemic mothers.', 'NGO', 'nutrition', 1200000, 'https://cdn-icons-png.flaticon.com/512/2913/2913465.png', true);

INSERT INTO scheme_beneficiaries (scheme_id, beneficiary_id, enrolled_by, status) VALUES
('b0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002', 'active');
