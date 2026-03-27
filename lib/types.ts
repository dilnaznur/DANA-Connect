export type Role = 'mentor' | 'mentee'
export type ApplicationStatus = 'pending' | 'viewed' | 'accepted' | 'rejected'

export interface Profile {
  id: string
  full_name: string
  email: string
  phone: string | null
  role: Role
  specialization: string | null
  motivation: string | null
  linkedin_url: string | null
  institution: string | null
  created_at: string
  updated_at: string
}

export interface ResearchOpportunity {
  id: string
  mentor_id: string
  title: string
  description: string
  tags: string[]
  total_spots: number
  filled_spots: number
  is_open: boolean
  duration: string | null
  created_at: string
  updated_at: string
  mentor?: Pick<Profile, 'full_name' | 'institution' | 'specialization'>
}

export interface Application {
  id: string
  mentee_id: string
  opportunity_id: string
  motivation_text: string
  cv_url: string | null
  status: ApplicationStatus
  created_at: string
  updated_at: string
  mentee?: Pick<Profile, 'full_name' | 'email' | 'institution' | 'specialization' | 'linkedin_url'>
  opportunity?: Pick<ResearchOpportunity, 'title' | 'tags'> & {
    mentor?: Pick<Profile, 'full_name' | 'email' | 'linkedin_url'>
  }
}
