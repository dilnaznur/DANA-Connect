'use client'

import { useState, useMemo } from 'react'
import { NavBar } from '@/components/NavBar'
import { Footer } from '@/components/Footer'
import { HeroBackground } from '@/components/HeroBackground'
import { OpportunityCard } from '@/components/OpportunityCard'
import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface OpportunityWithMentor {
  id: string
  title: string
  description: string
  tags: string[] | null
  total_spots: number
  filled_spots: number
  duration: string | null
  mentor: { full_name: string; institution: string | null } | null
}

interface ResearchPageClientProps {
  opportunities: OpportunityWithMentor[]
}

export default function ResearchPageClient({ opportunities }: ResearchPageClientProps) {
  const router = useRouter()
  const [selectedTag, setSelectedTag] = useState<string | null>(null)

  // Collect all unique tags
  const allTags = useMemo(() => {
    const tagSet = new Set<string>()
    opportunities.forEach((opp) => {
      opp.tags?.forEach((tag) => tagSet.add(tag))
    })
    return Array.from(tagSet).sort()
  }, [opportunities])

  // Filter opportunities by selected tag
  const filteredOpportunities = useMemo(() => {
    if (!selectedTag) return opportunities
    return opportunities.filter((opp) => opp.tags?.includes(selectedTag))
  }, [opportunities, selectedTag])

  const handleApply = (oppId: string) => {
    router.push(`/login?redirect=/research&apply=${oppId}`)
  }

  return (
    <div className="min-h-screen flex flex-col">
      <NavBar />

      {/* Hero Section */}
      <section className="relative py-16 lg:py-20 overflow-hidden">
        <HeroBackground />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          <span className="section-label">PIONEER LAB</span>
          <h1 className="font-heading text-[42px] lg:text-[52px] font-bold text-[var(--primary)] leading-tight">
            Research Opportunities
          </h1>
          <p className="text-xl text-[var(--text-secondary)] mt-4 max-w-2xl mx-auto">
            Discover hands-on research positions with leading scientists and institutions
            across Kazakhstan. Find your next breakthrough.
          </p>
        </div>
      </section>

      {/* Opportunities */}
      <section className="py-16 lg:py-24 bg-page flex-1">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {opportunities.length > 0 ? (
            <>
              {/* Tag Filter */}
              {allTags.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-8">
                  <button
                    onClick={() => setSelectedTag(null)}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                      selectedTag === null
                        ? 'bg-[var(--primary)] text-white'
                        : 'bg-hero text-[var(--primary)] hover:bg-[var(--border)]'
                    }`}
                  >
                    All
                  </button>
                  {allTags.map((tag) => (
                    <button
                      key={tag}
                      onClick={() => setSelectedTag(tag)}
                      className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                        selectedTag === tag
                          ? 'bg-[var(--primary)] text-white'
                          : 'bg-hero text-[var(--primary)] hover:bg-[var(--border)]'
                      }`}
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              )}

              {/* Opportunities List */}
              <div className="space-y-6">
                {filteredOpportunities.map((opp) => (
                  <OpportunityCard
                    key={opp.id}
                    title={opp.title}
                    description={opp.description}
                    tags={opp.tags || []}
                    total_spots={opp.total_spots}
                    filled_spots={opp.filled_spots}
                    duration={opp.duration}
                    mentor_name={opp.mentor?.full_name}
                    mentor_institution={opp.mentor?.institution || undefined}
                    showApplyButton
                    isFull={opp.filled_spots >= opp.total_spots}
                    onApply={() => handleApply(opp.id)}
                  />
                ))}
              </div>

              {filteredOpportunities.length === 0 && (
                <div className="text-center py-12">
                  <p className="text-[var(--text-secondary)]">
                    No opportunities match the selected filter.
                  </p>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-20 surface-card">
              <div className="max-w-md mx-auto">
                <h2 className="font-heading text-2xl font-bold text-[var(--primary)] mb-4">
                  No Opportunities Available
                </h2>
                <p className="text-[var(--text-secondary)] mb-8">
                  There are currently no open research opportunities. Check back soon or
                  register as a mentor to post your own.
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
