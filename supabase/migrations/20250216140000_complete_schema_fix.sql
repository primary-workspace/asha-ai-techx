-- =================================================================
-- ASHA AI - COMPLETE SCHEMA FIX (Resets & Re-creates Tables)
-- =================================================================

-- 1. CLEANUP (Drop existing tables to prevent conflicts)
DROP TABLE IF EXISTS scheme_activity_logs CASCADE;
DROP TABLE IF EXISTS scheme_beneficiaries CASCADE;
DROP TABLE IF EXISTS scheme_campaigns CASCADE;
DROP TABLE IF EXISTS schemes CASCADE;
DROP TABLE IF EXISTS content_topics CASCADE;
DROP TABLE IF EXISTS reminders CASCADE;
DROP TABLE IF EXISTS asha_visits CASCADE;
DROP TABLE IF EXISTS alerts CASCADE;
DROP TABLE IF EXISTS health_logs CASCADE;
DROP TABLE IF EXISTS reproductive_health_data CASCADE;
DROP TABLE IF EXISTS digital_health_cards CASCADE;
DROP TABLE IF EXISTS beneficiary_profiles CASCADE;
DROP TABLE IF EXISTS daily_logs CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TYPE IF EXISTS user_role CASCADE;
DROP TYPE IF EXISTS anemia_status CASCADE;
DROP TYPE IF EXISTS risk_level CASCADE;
DROP TYPE IF EXISTS alert_severity CASCADE;
DROP TYPE IF EXISTS alert_status CASCADE;
DROP TYPE IF EXISTS reminder_type CASCADE;
DROP TYPE IF EXISTS reminder_status CASCADE;
DROP TYPE IF EXISTS content_category CASCADE;
DROP TYPE IF EXISTS content_type CASCADE;
DROP TYPE IF EXISTS visit_type CASCADE;
DROP TYPE IF EXISTS scheme_status CASCADE;

-- 2. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 3. ENUMS
CREATE TYPE user_role AS ENUM ('beneficiary', 'asha_worker', 'partner', 'admin');
CREATE TYPE anemia_status AS ENUM ('normal', 'mild', 'moderate', 'severe');
CREATE TYPE risk_level AS ENUM ('low', 'medium', 'high');
CREATE TYPE alert_severity AS ENUM ('low', 'medium', 'high', 'critical');
CREATE TYPE alert_status AS ENUM ('open', 'resolved');
CREATE TYPE reminder_type AS ENUM ('ifa', 'checkup', 'visit', 'vaccination');
CREATE TYPE reminder_status AS ENUM ('pending', 'completed');
CREATE TYPE content_category AS ENUM ('menstrual_hygiene', 'puberty', 'pregnancy', 'danger_signs', 'nutrition');
CREATE TYPE content_type AS ENUM ('audio', 'image', 'text');
CREATE TYPE visit_type AS ENUM ('home', 'hospital', 'call');
CREATE TYPE scheme_status AS ENUM ('active', 'completed', 'rejected');

-- 4. TABLES

-- Users Table (Fixed: Added 'name' column)
CREATE TABLE users (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  phone_number text UNIQUE,
  name text, -- Added this column
  role user_role NOT NULL,
  language text DEFAULT 'hi',
  created_at timestamp DEFAULT now()
);

-- Beneficiary Profiles
CREATE TABLE beneficiary_profiles (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  name text,
  user_type text CHECK (user_type IN ('girl', 'pregnant', 'mother')),
  height numeric,
  weight numeric,
  blood_group text,
  age int,
  last_period_date date,
  pregnancy_stage text, -- trimester_1, etc.
  anemia_status anemia_status DEFAULT 'normal',
  risk_level risk_level DEFAULT 'low',
  location jsonb, -- Storing lat/lng as JSON for simplicity in MVP
  linked_asha_id uuid REFERENCES users(id),
  next_checkup date,
  economic_status text DEFAULT 'apl',
  created_at timestamp DEFAULT now()
);

-- Digital Health Cards
CREATE TABLE digital_health_cards (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  beneficiary_id uuid REFERENCES beneficiary_profiles(id) ON DELETE CASCADE,
  card_uid text UNIQUE NOT NULL,
  qr_payload jsonb,
  is_active boolean DEFAULT true,
  issued_at timestamp DEFAULT now()
);

-- Reproductive Data
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

-- Daily Logs (New Feature)
CREATE TABLE daily_logs (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  date date,
  mood text,
  symptoms jsonb,
  notes text,
  created_at timestamp DEFAULT now()
);

-- Health Logs (Visits)
CREATE TABLE health_logs (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  beneficiary_id uuid REFERENCES beneficiary_profiles(id) ON DELETE CASCADE,
  recorded_by uuid REFERENCES users(id),
  visit_type visit_type,
  date timestamp DEFAULT now(),
  bp_systolic int,
  bp_diastolic int,
  symptoms jsonb,
  mood text,
  voice_note_url text,
  ai_summary text,
  risk_flags jsonb,
  is_emergency boolean DEFAULT false,
  synced boolean DEFAULT false,
  created_at timestamp DEFAULT now()
);

-- Alerts
CREATE TABLE alerts (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  beneficiary_id uuid REFERENCES beneficiary_profiles(id),
  severity alert_severity,
  type text, -- 'sos' or 'health_risk'
  status alert_status DEFAULT 'open',
  timestamp timestamp DEFAULT now(),
  triggered_by uuid REFERENCES users(id),
  resolved_by uuid REFERENCES users(id),
  created_at timestamp DEFAULT now()
);

-- Schemes
CREATE TABLE schemes (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  title text,
  provider text,
  category text,
  description text,
  hero_image text,
  benefits jsonb,
  eligibility_criteria jsonb,
  target_audience jsonb,
  status text DEFAULT 'active',
  budget numeric,
  enrolled_count int DEFAULT 0,
  start_date date,
  created_at timestamp DEFAULT now()
);

-- Enrollments
CREATE TABLE scheme_beneficiaries (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  scheme_id uuid REFERENCES schemes(id) ON DELETE CASCADE,
  beneficiary_id uuid REFERENCES beneficiary_profiles(id) ON DELETE CASCADE,
  enrolled_by uuid REFERENCES users(id),
  enrollment_date date DEFAULT now(),
  status text DEFAULT 'approved'
);

-- 5. ENABLE RLS (Security)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE beneficiary_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE health_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE schemes ENABLE ROW LEVEL SECURITY;
ALTER TABLE scheme_beneficiaries ENABLE ROW LEVEL SECURITY;

-- 6. CREATE POLICIES (Allow Public Access for MVP/Mock Auth)
CREATE POLICY "Public Access Users" ON users FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public Access Profiles" ON beneficiary_profiles FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public Access Daily Logs" ON daily_logs FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public Access Health Logs" ON health_logs FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public Access Alerts" ON alerts FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public Access Schemes" ON schemes FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public Access Enrollments" ON scheme_beneficiaries FOR ALL USING (true) WITH CHECK (true);

-- 7. INSERT MOCK DATA
-- Users
INSERT INTO public.users (id, name, role) VALUES 
  ('u1', 'Sunita Devi', 'beneficiary'),
  ('u2', 'Priya ASHA', 'asha_worker'),
  ('u3', 'Dr. Rajesh', 'partner'),
  ('u4', 'Anita Kumar', 'beneficiary');

-- Beneficiaries
INSERT INTO public.beneficiary_profiles (id, user_id, name, user_type, height, weight, blood_group, pregnancy_stage, last_period_date, anemia_status, risk_level, location, linked_asha_id, next_checkup, economic_status) VALUES
  ('b1', 'u1', 'Sunita Devi', 'pregnant', 158, 62, 'B+', 'trimester_3', '2024-08-15', 'mild', 'medium', '{"lat": 28.6139, "lng": 77.2090}', 'u2', '2025-05-20', 'bpl'),
  ('b2', 'u4', 'Anita Kumar', 'mother', 160, 55, 'O+', 'trimester_2', '2024-11-01', 'severe', 'high', '{"lat": 28.6200, "lng": 77.2100}', 'u2', '2025-05-18', 'apl');

-- Alerts
INSERT INTO public.alerts (id, beneficiary_id, severity, status, timestamp, type) VALUES
  ('a1', 'b2', 'high', 'open', now(), 'health_risk');

-- Schemes
INSERT INTO public.schemes (id, title, provider, category, description, hero_image, benefits, eligibility_criteria, target_audience, status, budget, enrolled_count, start_date) VALUES
  ('s1', 'Janani Suraksha Yojana', 'Govt', 'financial', 'Cash assistance for institutional delivery.', 'https://cdn-icons-png.flaticon.com/512/2382/2382461.png', '["₹1400 Cash Assistance", "Free Transport", "Free Medicines"]', '["Below Poverty Line (BPL)", "Age > 19 Years"]', '{"economicStatus": ["bpl"], "pregnancyStage": ["trimester_3", "postpartum"]}', 'active', 5000000, 1240, '2024-01-01'),
  ('s2', 'Poshan Abhiyaan', 'NGO', 'nutrition', 'Nutrition baskets for anemic mothers.', 'https://cdn-icons-png.flaticon.com/512/2913/2913465.png', '["Weekly Fruit Basket", "Iron Supplements", "Protein Powder"]', '["Anemia: Moderate/Severe", "All Trimesters"]', '{"riskLevel": ["medium", "high"]}', 'active', 1200000, 450, '2024-03-15');

-- Enrollments
INSERT INTO public.scheme_beneficiaries (id, scheme_id, beneficiary_id, enrolled_by, status, enrollment_date) VALUES
  ('e1', 's1', 'b1', 'u2', 'approved', '2024-04-10');
