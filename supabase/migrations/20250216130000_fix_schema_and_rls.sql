-- =================================================================
-- ASHA AI - FULL SCHEMA SETUP & FIX
-- This script handles:
-- 1. Cleaning up potential partial installs
-- 2. Creating Extensions & Enums
-- 3. Creating Tables (Public Schema)
-- 4. Enabling RLS & Adding Policies
-- =================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. ENUMS (Drop first to ensure clean state if updates needed)
DROP TYPE IF EXISTS user_role CASCADE;
CREATE TYPE user_role AS ENUM ('beneficiary', 'asha_worker', 'partner', 'admin');

DROP TYPE IF EXISTS anemia_status CASCADE;
CREATE TYPE anemia_status AS ENUM ('normal', 'mild', 'moderate', 'severe');

DROP TYPE IF EXISTS risk_level CASCADE;
CREATE TYPE risk_level AS ENUM ('low', 'medium', 'high');

DROP TYPE IF EXISTS alert_severity CASCADE;
CREATE TYPE alert_severity AS ENUM ('low', 'medium', 'high', 'critical');

DROP TYPE IF EXISTS alert_status CASCADE;
CREATE TYPE alert_status AS ENUM ('open', 'resolved');

DROP TYPE IF EXISTS scheme_status CASCADE;
CREATE TYPE scheme_status AS ENUM ('active', 'draft', 'closed');

DROP TYPE IF EXISTS enrollment_status CASCADE;
CREATE TYPE enrollment_status AS ENUM ('pending', 'approved', 'rejected');

-- 3. TABLES

-- USERS (Public table to mirror our Mock Auth for now)
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    phone_number TEXT,
    role user_role NOT NULL,
    avatar TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- BENEFICIARY PROFILES
CREATE TABLE IF NOT EXISTS public.beneficiary_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    user_type TEXT CHECK (user_type IN ('girl', 'pregnant', 'mother')),
    height NUMERIC,
    weight NUMERIC,
    blood_group TEXT,
    pregnancy_stage TEXT, -- trimester_1, etc.
    last_period_date DATE,
    anemia_status anemia_status DEFAULT 'normal',
    risk_level risk_level DEFAULT 'low',
    location JSONB, -- { lat: 0, lng: 0 }
    linked_asha_id UUID REFERENCES public.users(id),
    next_checkup DATE,
    economic_status TEXT, -- bpl, apl
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- REPRODUCTIVE HEALTH DATA (The missing table!)
CREATE TABLE IF NOT EXISTS public.reproductive_health_data (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    beneficiary_id UUID REFERENCES public.beneficiary_profiles(id) ON DELETE CASCADE,
    last_period_date DATE,
    predicted_next_period DATE,
    fertile_window_start DATE,
    fertile_window_end DATE,
    trimester INTEGER,
    ai_generated BOOLEAN DEFAULT FALSE,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- HEALTH LOGS (Visits)
CREATE TABLE IF NOT EXISTS public.health_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    beneficiary_id UUID REFERENCES public.beneficiary_profiles(id) ON DELETE CASCADE,
    recorded_by UUID REFERENCES public.users(id),
    date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    bp_systolic INTEGER,
    bp_diastolic INTEGER,
    symptoms JSONB, -- Array of strings
    mood TEXT,
    is_emergency BOOLEAN DEFAULT FALSE,
    ai_summary TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- DAILY LOGS (User Tracking)
CREATE TABLE IF NOT EXISTS public.daily_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    symptoms JSONB,
    mood TEXT,
    notes TEXT,
    flow TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ALERTS (SOS)
CREATE TABLE IF NOT EXISTS public.alerts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    beneficiary_id UUID REFERENCES public.beneficiary_profiles(id),
    severity alert_severity DEFAULT 'medium',
    status alert_status DEFAULT 'open',
    type TEXT, -- sos, health_risk
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    resolved_by UUID REFERENCES public.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- SCHEMES
CREATE TABLE IF NOT EXISTS public.schemes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    provider TEXT, -- Govt, NGO
    category TEXT, -- financial, nutrition
    description TEXT,
    hero_image TEXT,
    benefits JSONB,
    eligibility_criteria JSONB,
    target_audience JSONB,
    status scheme_status DEFAULT 'active',
    budget NUMERIC DEFAULT 0,
    enrolled_count INTEGER DEFAULT 0,
    start_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ENROLLMENTS
CREATE TABLE IF NOT EXISTS public.enrollments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    scheme_id UUID REFERENCES public.schemes(id) ON DELETE CASCADE,
    beneficiary_id UUID REFERENCES public.beneficiary_profiles(id) ON DELETE CASCADE,
    status enrollment_status DEFAULT 'pending',
    enrolled_by UUID REFERENCES public.users(id),
    date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. SECURITY (RLS)
-- Enable RLS on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.beneficiary_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reproductive_health_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.health_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.schemes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.enrollments ENABLE ROW LEVEL SECURITY;

-- Create "Allow All" Policies for MVP (Since we use Mock Auth)
-- In production, these would be replaced with "auth.uid() = user_id" checks.

CREATE POLICY "Enable all access for users" ON public.users FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Enable all access for profiles" ON public.beneficiary_profiles FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Enable all access for reproductive data" ON public.reproductive_health_data FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Enable all access for health logs" ON public.health_logs FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Enable all access for daily logs" ON public.daily_logs FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Enable all access for alerts" ON public.alerts FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Enable all access for schemes" ON public.schemes FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Enable all access for enrollments" ON public.enrollments FOR ALL USING (true) WITH CHECK (true);

-- 5. SEED DATA (Optional - to get you started)
INSERT INTO public.users (id, name, role) VALUES 
('u1', 'Sunita Devi', 'beneficiary'),
('u2', 'Priya ASHA', 'asha_worker'),
('u3', 'Dr. Rajesh', 'partner')
ON CONFLICT (id) DO NOTHING;
