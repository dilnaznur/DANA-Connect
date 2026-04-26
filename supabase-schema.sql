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
  title text,
  photo_url text,
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
  contact_email text NOT NULL,
  contact_telegram text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- APPLICATIONS table
CREATE TABLE applications (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  mentee_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  opportunity_id uuid REFERENCES research_opportunities(id) ON DELETE CASCADE NOT NULL,
  motivation_text text NOT NULL CHECK (char_length(motivation_text) >= 100),
  cv_url text,
  status text DEFAULT 'pending'
    CHECK (status IN ('pending', 'viewed', 'accepted', 'rejected')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(mentee_id, opportunity_id)
);

-- PROJECTS table (Open Projects)
CREATE TABLE projects (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  creator_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  description text NOT NULL,
  tags text[] DEFAULT '{}',
  contact_email text NOT NULL,
  contact_telegram text NOT NULL,
  deadline date,
  max_members integer DEFAULT 5 CHECK (max_members >= 1),
  filled_members integer DEFAULT 1 CHECK (filled_members >= 1),
  is_open boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Compatibility view: app code uses open_projects
CREATE VIEW open_projects AS SELECT * FROM projects;

-- PROJECT REQUESTS table (join requests)
CREATE TABLE project_requests (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id uuid REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
  requester_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  message text,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(project_id, requester_id)
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

CREATE TRIGGER projects_updated_at
  BEFORE UPDATE ON projects
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER project_requests_updated_at
  BEFORE UPDATE ON project_requests
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE research_opportunities ENABLE ROW LEVEL SECURITY;
ALTER TABLE applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_requests ENABLE ROW LEVEL SECURITY;

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
-- PROJECTS POLICIES
-- ============================================

-- Anyone can read open projects
CREATE POLICY "public_read_open_projects" ON projects
  FOR SELECT USING (is_open = true);

-- Users can read their own projects (even if closed)
CREATE POLICY "user_read_own_projects" ON projects
  FOR SELECT USING (creator_id = auth.uid());

-- Authenticated users can insert projects
CREATE POLICY "auth_insert_projects" ON projects
  FOR INSERT WITH CHECK (creator_id = auth.uid());

-- Users can update their own projects
CREATE POLICY "user_update_own_projects" ON projects
  FOR UPDATE USING (creator_id = auth.uid());

-- Users can delete their own projects
CREATE POLICY "user_delete_own_projects" ON projects
  FOR DELETE USING (creator_id = auth.uid());

-- ============================================
-- PROJECT REQUESTS POLICIES
-- ============================================

-- Users can manage their own requests
CREATE POLICY "user_manage_own_requests" ON project_requests
  FOR ALL USING (requester_id = auth.uid());

-- Project creators can read requests for their projects
CREATE POLICY "creator_read_requests" ON project_requests
  FOR SELECT USING (
    project_id IN (SELECT id FROM projects WHERE creator_id = auth.uid())
  );

-- Project creators can update request status
CREATE POLICY "creator_update_requests" ON project_requests
  FOR UPDATE USING (
    project_id IN (SELECT id FROM projects WHERE creator_id = auth.uid())
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
