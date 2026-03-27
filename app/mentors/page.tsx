import { createClient } from '@/lib/supabase/server'
import { NavBar } from '@/components/NavBar'
import { Footer } from '@/components/Footer'
import { HeroBackground } from '@/components/HeroBackground'
import { MentorCard } from '@/components/MentorCard'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

export default async function MentorsPage() {
  const supabase = await createClient()

  const { data: mentors } = await supabase
    .from('profiles')
    .select('id, full_name, institution, specialization, created_at')
    .eq('role', 'mentor')
    .order('created_at', { ascending: false })

  return (
    <div className="min-h-screen flex flex-col">
      <NavBar />

      {/* Hero Section */}
      <section className="relative py-16 lg:py-20 overflow-hidden">
        <HeroBackground />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          <span className="section-label">OUR COMMUNITY</span>
          <h1 className="font-heading text-[42px] lg:text-[52px] font-bold text-[var(--primary)] leading-tight">
            Meet Our Mentors
          </h1>
          <p className="text-xl text-[var(--text-secondary)] mt-4 max-w-2xl mx-auto">
            Connect with experienced professionals who are passionate about empowering
            the next generation of women in STEM across Kazakhstan.
          </p>
        </div>
      </section>

      {/* Mentors Grid */}
      <section className="py-16 lg:py-24 bg-page flex-1">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {mentors && mentors.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {mentors.map((mentor) => (
                <MentorCard
                  key={mentor.id}
                  full_name={mentor.full_name}
                  institution={mentor.institution}
                  specialization={mentor.specialization}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-20 bg-white rounded-2xl border border-[var(--border)]">
              <div className="max-w-md mx-auto">
                <h2 className="font-heading text-2xl font-bold text-[var(--primary)] mb-4">
                  No Mentors Yet
                </h2>
                <p className="text-[var(--text-secondary)] mb-8">
                  Be the first to join our community of mentors and help shape the future
                  of women in STEM in Kazakhstan.
                </p>
                <Link href="/register">
                  <Button className="bg-[var(--primary)] hover:bg-[var(--primary-light)] text-white rounded-lg px-6">
                    Become a Mentor
                  </Button>
                </Link>
              </div>
            </div>
          )}
        </div>
      </section>

      <Footer />
    </div>
  )
}
