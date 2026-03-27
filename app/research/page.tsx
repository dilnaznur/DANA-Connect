import { createClient } from '@/lib/supabase/server'
import ResearchPageClient from './ResearchPageClient'

interface OpportunityData {
  id: string
  title: string
  description: string
  tags: string[] | null
  total_spots: number
  filled_spots: number
  duration: string | null
  mentor: { full_name: string; institution: string | null } | null
}

export default async function ResearchPage() {
  const supabase = await createClient()

  const { data: opportunities } = await supabase
    .from('research_opportunities')
    .select(`
      id, title, description, tags, total_spots, filled_spots, duration, created_at,
      mentor:profiles(full_name, institution)
    `)
    .eq('is_open', true)
    .order('created_at', { ascending: false })

  return (
    <ResearchPageClient
      opportunities={(opportunities as unknown as OpportunityData[]) || []}
    />
  )
}
