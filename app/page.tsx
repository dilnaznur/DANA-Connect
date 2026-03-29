import { createClient } from '@/lib/supabase/server'
import { NavBar } from '@/components/NavBar'
import { Footer } from '@/components/Footer'
import { HomeContent } from '@/components/HomeContent'

interface HomePageProps {
  searchParams?: Promise<{ deleted?: string }>
}

type HomeOpportunity = {
  id: string
  title: string
  description: string
  tags: string[] | null
  total_spots: number
  filled_spots: number
  duration: string | null
  mentor: { full_name: string; institution: string } | null
}

export default async function HomePage({ searchParams }: HomePageProps) {
  const resolvedSearchParams = await searchParams
  const isDeleted = resolvedSearchParams?.deleted === 'true'
  const supabase = await createClient()

  // Fetch counts for stats
  const { count: mentorCount } = await supabase
    .from('profiles')
    .select('*', { count: 'exact', head: true })
    .eq('role', 'mentor')

  const { count: menteeCount } = await supabase
    .from('profiles')
    .select('*', { count: 'exact', head: true })
    .eq('role', 'mentee')

  const { count: researchCount } = await supabase
    .from('research_opportunities')
    .select('*', { count: 'exact', head: true })

  // Fetch 6 most recent mentors
  const { data: mentors } = await supabase
    .from('profiles')
    .select('id, full_name, institution, specialization, title, photo_url, created_at')
    .eq('role', 'mentor')
    .order('created_at', { ascending: false })
    .limit(6)

  // Fetch 3 most recent open opportunities with mentor name
  const { data: opportunities } = await supabase
    .from('research_opportunities')
    .select(`
      id, title, description, tags, total_spots, filled_spots, duration, created_at,
      mentor:profiles(full_name, institution)
    `)
    .eq('is_open', true)
    .order('created_at', { ascending: false })
    .limit(3)

  return (
    <div className="min-h-screen flex flex-col">
      <NavBar />

      <HomeContent
        isDeleted={isDeleted}
        mentorCount={mentorCount}
        menteeCount={menteeCount}
        researchCount={researchCount}
        mentors={mentors}
        opportunities={opportunities as unknown as HomeOpportunity[] | null}
      />

      <Footer />
    </div>
  )
}
