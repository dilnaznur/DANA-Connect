import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { NavBar } from '@/components/NavBar'
import { Footer } from '@/components/Footer'
import { HeroBackground } from '@/components/HeroBackground'
import { MentorCard } from '@/components/MentorCard'
import { OpportunityCard } from '@/components/OpportunityCard'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

interface HomePageProps {
  searchParams?: Promise<{ deleted?: string }>
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
    .eq('is_open', true)

  // Fetch 6 most recent mentors
  const { data: mentors } = await supabase
    .from('profiles')
    .select('id, full_name, institution, specialization, created_at')
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

      {isDeleted && (
        <div className="bg-green-50 border-b border-green-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
            <p className="text-sm text-green-800 font-medium">
              Your account has been successfully deleted.
            </p>
          </div>
        </div>
      )}

      {/* Hero Section */}
      <section className="relative py-24 lg:py-40 overflow-hidden">
        <HeroBackground />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <span className="section-label">WOMEN IN STEM · KAZAKHSTAN</span>
            <h1 className="font-heading text-[52px] lg:text-[64px] font-bold text-[var(--primary)] leading-tight mb-6">
              Building the Future of Science for Women in Kazakhstan
            </h1>
            <p className="text-xl text-[var(--text-secondary)] leading-relaxed mb-8 max-w-2xl mx-auto">
              Connect with inspiring mentors, discover research opportunities, and join a
              community dedicated to empowering the next generation of women scientists
              and engineers.
            </p>
            <div className="flex flex-wrap justify-center gap-4 mb-16">
              <Link href="/mentors">
                <Button className="bg-[var(--primary)] hover:bg-[var(--primary-light)] text-white rounded-lg px-8 py-3 text-base h-auto btn-hover-lift">
                  Find a Mentor →
                </Button>
              </Link>
              <Link href="/research">
                <Button
                  variant="outline"
                  className="border-[1.5px] border-[var(--primary)] text-[var(--primary)] hover:bg-hero rounded-lg px-8 py-3 text-base h-auto btn-hover-lift"
                >
                  Explore Research
                </Button>
              </Link>
            </div>

            {/* Live Stats */}
            <div className="flex flex-wrap justify-center gap-8 lg:gap-16">
              <div className="text-center animate-fade-up stagger-1">
                <div className="font-heading text-4xl lg:text-5xl font-bold text-[var(--primary)]">
                  {mentorCount || 0}+
                </div>
                <div className="text-[var(--text-muted)] text-sm mt-1">Mentors</div>
              </div>
              <div className="text-center animate-fade-up stagger-2">
                <div className="font-heading text-4xl lg:text-5xl font-bold text-[var(--primary)]">
                  {menteeCount || 0}+
                </div>
                <div className="text-[var(--text-muted)] text-sm mt-1">Students</div>
              </div>
              <div className="text-center animate-fade-up stagger-3">
                <div className="font-heading text-4xl lg:text-5xl font-bold text-[var(--primary)]">
                  {researchCount || 0}+
                </div>
                <div className="text-[var(--text-muted)] text-sm mt-1">Research Projects</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Section Divider */}
      <div className="section-divider" />
      <section className="py-24 lg:py-30 bg-page">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <span className="section-label">ROLE MODELS</span>
          <h2 className="font-heading text-[36px] lg:text-[42px] font-bold text-[var(--primary)] mb-12">
            Meet Our Mentors
          </h2>

          {mentors && mentors.length > 0 ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                {mentors.map((mentor) => (
                  <MentorCard
                    key={mentor.id}
                    full_name={mentor.full_name}
                    institution={mentor.institution}
                    specialization={mentor.specialization}
                  />
                ))}
              </div>
              <div className="text-center">
                <Link href="/mentors">
                  <Button
                    variant="outline"
                    className="border-[1.5px] border-[var(--primary)] text-[var(--primary)] hover:bg-hero rounded-lg px-6"
                  >
                    View All Mentors →
                  </Button>
                </Link>
              </div>
            </>
          ) : (
            <div className="text-center py-16 bg-white rounded-2xl border border-[var(--border)]">
              <p className="text-[var(--text-secondary)] text-lg mb-6">
                No mentors have joined yet. Be the first!
              </p>
              <Link href="/register">
                <Button className="bg-[var(--primary)] hover:bg-[var(--primary-light)] text-white rounded-lg px-6">
                  Register as a Mentor
                </Button>
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* Research Opportunities Section */}
      <section className="py-24 lg:py-30 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <span className="section-label">PIONEER LAB</span>
          <h2 className="font-heading text-[36px] lg:text-[42px] font-bold text-[var(--primary)] mb-12">
            Research Opportunities
          </h2>

          {opportunities && opportunities.length > 0 ? (
            <>
              <div className="space-y-6 mb-8">
                {opportunities.map((opp) => {
                  const mentor = opp.mentor as unknown as { full_name: string; institution: string } | null
                  return (
                    <OpportunityCard
                      key={opp.id}
                      title={opp.title}
                      description={opp.description}
                      tags={opp.tags || []}
                      total_spots={opp.total_spots}
                      filled_spots={opp.filled_spots}
                      duration={opp.duration}
                      mentor_name={mentor?.full_name}
                      mentor_institution={mentor?.institution}
                    />
                  )
                })}
              </div>
              <div className="text-center">
                <Link href="/research">
                  <Button
                    variant="outline"
                    className="border-[1.5px] border-[var(--primary)] text-[var(--primary)] hover:bg-hero rounded-lg px-6"
                  >
                    View All Opportunities →
                  </Button>
                </Link>
              </div>
            </>
          ) : (
            <div className="text-center py-16 bg-hero rounded-2xl border border-[var(--border)]">
              <p className="text-[var(--text-secondary)] text-lg">
                No research opportunities posted yet. Check back soon!
              </p>
            </div>
          )}
        </div>
      </section>

      {/* Why It Matters Section */}
      <section className="py-24 lg:py-30 bg-page">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <span className="section-label">OUR MISSION</span>
          <h2 className="font-heading text-[36px] lg:text-[42px] font-bold text-[var(--primary)] mb-8">
            Why It Matters
          </h2>
          <p className="text-xl text-[var(--text-secondary)] leading-relaxed mb-16 max-w-3xl">
            Women remain underrepresented in STEM fields across Kazakhstan and Central Asia.
            DANA Connect bridges the gap by creating meaningful connections between experienced
            professionals and aspiring scientists, fostering the next generation of women leaders
            in science and technology.
          </p>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="bg-white border border-[var(--border)] rounded-2xl shadow-card">
              <CardContent className="p-6 text-center">
                <div className="font-heading text-4xl lg:text-5xl font-bold text-[var(--primary)] mb-2">
                  30%
                </div>
                <p className="text-[var(--text-secondary)] text-sm">
                  of researchers in Kazakhstan are women
                </p>
              </CardContent>
            </Card>
            <Card className="bg-white border border-[var(--border)] rounded-2xl shadow-card">
              <CardContent className="p-6 text-center">
                <div className="font-heading text-4xl lg:text-5xl font-bold text-[var(--primary)] mb-2">
                  2x
                </div>
                <p className="text-[var(--text-secondary)] text-sm">
                  higher retention with mentorship
                </p>
              </CardContent>
            </Card>
            <Card className="bg-white border border-[var(--border)] rounded-2xl shadow-card">
              <CardContent className="p-6 text-center">
                <div className="font-heading text-4xl lg:text-5xl font-bold text-[var(--primary)] mb-2">
                  45+
                </div>
                <p className="text-[var(--text-secondary)] text-sm">
                  universities across Kazakhstan
                </p>
              </CardContent>
            </Card>
            <Card className="bg-white border border-[var(--border)] rounded-2xl shadow-card">
              <CardContent className="p-6 text-center">
                <div className="font-heading text-4xl lg:text-5xl font-bold text-[var(--primary)] mb-2">
                  120+
                </div>
                <p className="text-[var(--text-secondary)] text-sm">
                  research institutions in the region
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}
