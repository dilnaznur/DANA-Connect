-- Migration: Create projects and project_requests tables
-- Run this in the Supabase SQL Editor

-- PROJECTS table
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

-- Triggers for updated_at
CREATE TRIGGER projects_updated_at
  BEFORE UPDATE ON projects
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER project_requests_updated_at
  BEFORE UPDATE ON project_requests
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Enable RLS
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_requests ENABLE ROW LEVEL SECURITY;

-- PROJECTS POLICIES

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

-- PROJECT REQUESTS POLICIES

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
