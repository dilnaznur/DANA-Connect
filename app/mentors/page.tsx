import { createClient } from '@/lib/supabase/server'
import MentorsPageClient from './MentorsPageClient'

type MentorRow = {
  id: string
  full_name: string
  institution: string | null
  specialization: string | null
  title: string | null
  photo_url: string | null
}

export default async function MentorsPage() {
  const supabase = await createClient()

  const { data: mentors } = await supabase
    .from('profiles')
    .select('id, full_name, institution, specialization, title, photo_url, created_at')
    .eq('role', 'mentor')
    .order('created_at', { ascending: false })

  const rawMentors = (mentors || []) as unknown as Array<{
    id: string
    full_name: string | null
    institution: string | null
    specialization: string | null
    title: string | null
    photo_url: string | null
  }>

  const normalizedMentors: MentorRow[] = rawMentors.map((m) => ({
    id: m.id,
    full_name: m.full_name ?? '',
    institution: m.institution ?? null,
    specialization: m.specialization ?? null,
    title: m.title ?? null,
    photo_url: m.photo_url ?? null,
  }))

  return <MentorsPageClient mentors={normalizedMentors} />
}
