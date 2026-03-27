-- DANA Connect Database Schema
-- Run this entire block in the Supabase SQL Editor

-- ============================================
-- TABLES
-- ============================================

-- PROFILES table
CREATE TABLE profiles (
  id uuid REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  full_name text NOT NULL,
  email text NOT NULL,
  phone text,
  role text CHECK (role IN ('mentor', 'mentee')) NOT NULL,
  specialization text,
  motivation text,
  linkedin_url text,
  institution text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- RESEARCH OPPORTUNITIES table
CREATE TABLE research_opportunities (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  mentor_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  description text NOT NULL,
  tags text[] DEFAULT '{}',
  total_spots integer DEFAULT 2 CHECK (total_spots >= 1),
  filled_spots integer DEFAULT 0 CHECK (filled_spots >= 0),
  is_open boolean DEFAULT true,
  duration text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- APPLICATIONS table
CREATE TABLE applications (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  mentee_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  opportunity_id uuid REFERENCES research_opportunities(id) ON DELETE CASCADE NOT NULL,
  motivation_text text NOT NULL CHECK (char_length(motivation_text) >= 100),
  status text DEFAULT 'pending'
    CHECK (status IN ('pending', 'viewed', 'accepted', 'rejected')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(mentee_id, opportunity_id)
);

-- ============================================
-- TRIGGERS
-- ============================================

-- Auto-update updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for each table
CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER opps_updated_at
  BEFORE UPDATE ON research_opportunities
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER apps_updated_at
  BEFORE UPDATE ON applications
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE research_opportunities ENABLE ROW LEVEL SECURITY;
ALTER TABLE applications ENABLE ROW LEVEL SECURITY;

-- ============================================
-- PROFILES POLICIES
-- ============================================

-- Users can manage their own profile
CREATE POLICY "users_own_profile" ON profiles
  FOR ALL USING (auth.uid() = id);

-- Anyone can read mentor profiles (for public listing)
CREATE POLICY "public_read_mentor_profiles" ON profiles
  FOR SELECT USING (role = 'mentor');

-- ============================================
-- RESEARCH OPPORTUNITIES POLICIES
-- ============================================

-- Anyone can read open opportunities
CREATE POLICY "public_read_open_opps" ON research_opportunities
  FOR SELECT USING (is_open = true);

-- Mentors can read their own opportunities (even if closed)
CREATE POLICY "mentor_read_own_opps" ON research_opportunities
  FOR SELECT USING (mentor_id = auth.uid());

-- Mentors can insert their own opportunities
CREATE POLICY "mentor_insert_opps" ON research_opportunities
  FOR INSERT WITH CHECK (mentor_id = auth.uid());

-- Mentors can update their own opportunities
CREATE POLICY "mentor_update_opps" ON research_opportunities
  FOR UPDATE USING (mentor_id = auth.uid());

-- Mentors can delete their own opportunities
CREATE POLICY "mentor_delete_opps" ON research_opportunities
  FOR DELETE USING (mentor_id = auth.uid());

-- ============================================
-- APPLICATIONS POLICIES
-- ============================================

-- Mentees can manage their own applications
CREATE POLICY "mentee_manage_own_apps" ON applications
  FOR ALL USING (mentee_id = auth.uid());

-- Mentors can read applications for their opportunities
CREATE POLICY "mentor_read_apps_for_own_opps" ON applications
  FOR SELECT USING (
    opportunity_id IN (
      SELECT id FROM research_opportunities WHERE mentor_id = auth.uid()
    )
  );

-- Mentors can update application status for their opportunities
CREATE POLICY "mentor_update_app_status" ON applications
  FOR UPDATE USING (
    opportunity_id IN (
      SELECT id FROM research_opportunities WHERE mentor_id = auth.uid()
    )
  );

-- ============================================
-- ACCOUNT DELETION + STORAGE DELETE POLICY
-- ============================================

-- Deletes profile data (which cascades to opportunities/applications),
-- then removes the auth user record.
CREATE OR REPLACE FUNCTION delete_user_account()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  DELETE FROM profiles WHERE id = auth.uid();
  DELETE FROM auth.users WHERE id = auth.uid();
END;
$$;

-- Allow users to delete files under their own folder in the cvs bucket.
CREATE POLICY "user_delete_own_cvs" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'cvs' AND auth.uid()::text = (storage.foldername(name))[1]
  );
