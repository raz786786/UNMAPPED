-- ============================================================
-- UNMAPPED Platform — Supabase Schema
-- Run this in Supabase SQL Editor (Dashboard → SQL Editor → New Query)
-- ============================================================

-- ============================================================
-- 1. PROFILES (extends Supabase Auth)
-- ============================================================
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL DEFAULT '',
  email TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    NEW.email
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ============================================================
-- 2. WORKER PROFILES
-- ============================================================
CREATE TABLE IF NOT EXISTS worker_profiles (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  location TEXT NOT NULL DEFAULT '',
  education_level TEXT NOT NULL DEFAULT '',
  work_history TEXT NOT NULL DEFAULT '',
  country_config TEXT NOT NULL DEFAULT 'global',
  profile_id TEXT, -- SSE-generated profile ID like "SSE-GHA-2025-abcd"
  country_name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_worker_profiles_user ON worker_profiles(user_id);

-- ============================================================
-- 3. WORKER SKILLS (normalized from analysisResult.profile.skills)
-- ============================================================
CREATE TABLE IF NOT EXISTS worker_skills (
  id BIGSERIAL PRIMARY KEY,
  worker_id BIGINT NOT NULL REFERENCES worker_profiles(id) ON DELETE CASCADE,
  esco_uri TEXT,
  label TEXT NOT NULL,
  type TEXT DEFAULT 'skill',
  score REAL DEFAULT 0.7,
  human_label TEXT,
  durability TEXT, -- DURABLE, MEDIUM_RISK, HIGH_RISK
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_worker_skills_worker ON worker_skills(worker_id);
CREATE INDEX idx_worker_skills_label ON worker_skills(label);

-- ============================================================
-- 4. WORKER OCCUPATIONS (normalized from analysisResult.profile.top_occupations)
-- ============================================================
CREATE TABLE IF NOT EXISTS worker_occupations (
  id BIGSERIAL PRIMARY KEY,
  worker_id BIGINT NOT NULL REFERENCES worker_profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  isco_code TEXT,
  confidence REAL DEFAULT 0.5,
  uri TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_worker_occupations_worker ON worker_occupations(worker_id);

-- ============================================================
-- 5. RISK ASSESSMENTS (from analysisResult.risk_assessment)
-- ============================================================
CREATE TABLE IF NOT EXISTS risk_assessments (
  id BIGSERIAL PRIMARY KEY,
  worker_id BIGINT NOT NULL REFERENCES worker_profiles(id) ON DELETE CASCADE,
  occupation TEXT,
  global_risk_score REAL,
  lmic_adjusted_risk REAL,
  trend_2035 TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_risk_assessments_worker ON risk_assessments(worker_id);

-- ============================================================
-- 6. OPPORTUNITY MATCHES (from analysisResult.opportunity_matching)
-- ============================================================
CREATE TABLE IF NOT EXISTS opportunity_matches (
  id BIGSERIAL PRIMARY KEY,
  worker_id BIGINT NOT NULL REFERENCES worker_profiles(id) ON DELETE CASCADE,
  -- Market signals (stored as JSONB for flexibility)
  market_signals JSONB DEFAULT '{}'::jsonb,
  -- Individual opportunities
  title TEXT,
  type TEXT,
  match_score REAL,
  description TEXT,
  wage_estimate TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_opportunity_matches_worker ON opportunity_matches(worker_id);

-- ============================================================
-- 7. JOB POSTINGS
-- ============================================================
CREATE TABLE IF NOT EXISTS job_postings (
  id BIGSERIAL PRIMARY KEY,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  org_name TEXT NOT NULL,
  job_title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  required_skills TEXT DEFAULT '',
  location TEXT DEFAULT '',
  salary_range TEXT DEFAULT '',
  custom_fields JSONB DEFAULT '[]'::jsonb, -- [{label, type, id}]
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_job_postings_created_by ON job_postings(created_by);

-- ============================================================
-- 8. JOB APPLICATIONS
-- ============================================================
CREATE TABLE IF NOT EXISTS job_applications (
  id BIGSERIAL PRIMARY KEY,
  job_id BIGINT NOT NULL REFERENCES job_postings(id) ON DELETE CASCADE,
  applicant_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  applicant_name TEXT NOT NULL,
  applicant_email TEXT NOT NULL,
  answers JSONB DEFAULT '{}'::jsonb, -- free-form answers to custom fields
  submitted_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_job_applications_job ON job_applications(job_id);
CREATE INDEX idx_job_applications_applicant ON job_applications(applicant_id);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE worker_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE worker_skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE worker_occupations ENABLE ROW LEVEL SECURITY;
ALTER TABLE risk_assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE opportunity_matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_postings ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_applications ENABLE ROW LEVEL SECURITY;

-- PROFILES: users can read all, update own
CREATE POLICY "Profiles are viewable by everyone"
  ON profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE USING (auth.uid() = id);

-- WORKER PROFILES: public read, owner insert/update
CREATE POLICY "Worker profiles are viewable by everyone"
  ON worker_profiles FOR SELECT USING (true);
CREATE POLICY "Users can insert own worker profile"
  ON worker_profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own worker profile"
  ON worker_profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own worker profile"
  ON worker_profiles FOR DELETE USING (auth.uid() = user_id);

-- WORKER SKILLS: public read, owner insert via worker_profile ownership
CREATE POLICY "Worker skills are viewable by everyone"
  ON worker_skills FOR SELECT USING (true);
CREATE POLICY "Users can insert skills for own worker profile"
  ON worker_skills FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM worker_profiles wp WHERE wp.id = worker_id AND wp.user_id = auth.uid())
  );
CREATE POLICY "Users can delete skills for own worker profile"
  ON worker_skills FOR DELETE USING (
    EXISTS (SELECT 1 FROM worker_profiles wp WHERE wp.id = worker_id AND wp.user_id = auth.uid())
  );

-- WORKER OCCUPATIONS: same pattern
CREATE POLICY "Worker occupations are viewable by everyone"
  ON worker_occupations FOR SELECT USING (true);
CREATE POLICY "Users can insert occupations for own worker profile"
  ON worker_occupations FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM worker_profiles wp WHERE wp.id = worker_id AND wp.user_id = auth.uid())
  );
CREATE POLICY "Users can delete occupations for own worker profile"
  ON worker_occupations FOR DELETE USING (
    EXISTS (SELECT 1 FROM worker_profiles wp WHERE wp.id = worker_id AND wp.user_id = auth.uid())
  );

-- RISK ASSESSMENTS: same pattern
CREATE POLICY "Risk assessments are viewable by everyone"
  ON risk_assessments FOR SELECT USING (true);
CREATE POLICY "Users can insert risk for own worker profile"
  ON risk_assessments FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM worker_profiles wp WHERE wp.id = worker_id AND wp.user_id = auth.uid())
  );

-- OPPORTUNITY MATCHES: same pattern
CREATE POLICY "Opportunities are viewable by everyone"
  ON opportunity_matches FOR SELECT USING (true);
CREATE POLICY "Users can insert opportunities for own worker profile"
  ON opportunity_matches FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM worker_profiles wp WHERE wp.id = worker_id AND wp.user_id = auth.uid())
  );

-- JOB POSTINGS: public read, owner insert/update/delete
CREATE POLICY "Job postings are viewable by everyone"
  ON job_postings FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create job postings"
  ON job_postings FOR INSERT WITH CHECK (auth.uid() = created_by);
CREATE POLICY "Users can update own job postings"
  ON job_postings FOR UPDATE USING (auth.uid() = created_by);
CREATE POLICY "Users can delete own job postings"
  ON job_postings FOR DELETE USING (auth.uid() = created_by);

-- JOB APPLICATIONS: visible to applicant + job poster, applicant can insert
CREATE POLICY "Applicants can view own applications"
  ON job_applications FOR SELECT USING (auth.uid() = applicant_id);
CREATE POLICY "Job posters can view applications to their jobs"
  ON job_applications FOR SELECT USING (
    EXISTS (SELECT 1 FROM job_postings jp WHERE jp.id = job_id AND jp.created_by = auth.uid())
  );
CREATE POLICY "Authenticated users can submit applications"
  ON job_applications FOR INSERT WITH CHECK (auth.uid() = applicant_id);
