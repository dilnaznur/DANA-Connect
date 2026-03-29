'use client'

import Link from 'next/link'
import { HeroBackground } from '@/components/HeroBackground'
import { MentorCard } from '@/components/MentorCard'
import { OpportunityCard } from '@/components/OpportunityCard'
import { Button } from '@/components/ui/button'
import { useLanguage } from '@/lib/i18n/LanguageContext'
import { translations } from '@/lib/i18n/translations'
import { Users, TrendingUp, Building2, FlaskConical } from 'lucide-react'

type Mentor = {
  id: string
  full_name: string
  institution: string | null
  specialization: string | null
  title: string | null
  photo_url: string | null
}

type Opportunity = {
  id: string
  title: string
  description: string
  tags: string[] | null
  total_spots: number
  filled_spots: number
  duration: string | null
  mentor: { full_name: string; institution: string } | null
}

export function HomeContent({
  isDeleted,
  mentorCount,
  menteeCount,
  researchCount,
  mentors,
  opportunities,
}: {
  isDeleted: boolean
  mentorCount: number | null
  menteeCount: number | null
  researchCount: number | null
  mentors: Mentor[] | null
  opportunities: Opportunity[] | null
}) {
  const { language } = useLanguage()
  const t = translations[language]

  return (
    <>
      {isDeleted && (
        <div className="bg-green-50 border-b border-green-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
            <p className="text-sm text-green-800 font-medium">{t.common.accountDeleted}</p>
          </div>
        </div>
      )}

      {/* Hero Section */}
      <section className="relative py-24 lg:py-40 overflow-hidden">
        <HeroBackground />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <span className="section-label">{t.hero.label}</span>
            <h1 className="font-heading text-[52px] lg:text-[64px] font-extrabold text-[#1B2A72] leading-[1.1] mb-6">
              {t.hero.title}
            </h1>
            <p className="text-xl text-[var(--text-secondary)] leading-relaxed mb-8 max-w-2xl mx-auto">
              {t.hero.subtitle}
            </p>
            <div className="flex flex-wrap justify-center gap-4 mb-16">
              <Link href="/mentors">
                <Button className="bg-[var(--primary)] hover:bg-[var(--primary-light)] text-white rounded-lg px-8 py-3 text-base h-auto btn-hover-lift">
                  {t.hero.findMentor} →
                </Button>
              </Link>
              <Link href="/research">
                <Button
                  variant="outline"
                  className="border-[1.5px] border-[var(--primary)] text-[var(--primary)] hover:bg-hero rounded-lg px-8 py-3 text-base h-auto btn-hover-lift"
                >
                  {t.hero.exploreResearch}
                </Button>
              </Link>
            </div>

            {/* Live Stats */}
            <div className="flex flex-wrap justify-center gap-8 lg:gap-16">
              <div className="text-center animate-fade-up stagger-1">
                <div className="font-heading text-4xl lg:text-5xl font-extrabold text-[#1B2A72]">
                  {mentorCount || 0}+
                </div>
                <div className="text-[var(--text-muted)] text-sm mt-1">{t.stats.mentors}</div>
              </div>
              <div className="text-center animate-fade-up stagger-2">
                <div className="font-heading text-4xl lg:text-5xl font-extrabold text-[#1B2A72]">
                  {menteeCount || 0}+
                </div>
                <div className="text-[var(--text-muted)] text-sm mt-1">{t.stats.students}</div>
              </div>
              <div className="text-center animate-fade-up stagger-3">
                <div className="font-heading text-4xl lg:text-5xl font-extrabold text-[#1B2A72]">
                  {researchCount || 0}+
                </div>
                <div className="text-[var(--text-muted)] text-sm mt-1">{t.stats.research}</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Section Divider */}
      <div className="section-divider" />

      {/* Mentors Section - lavender background */}
      <section className="py-24 lg:py-30 bg-[#EEEDF8]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <span className="section-label">{t.mentors.label}</span>
            <h2 className="font-heading text-[36px] lg:text-[42px] font-extrabold text-[#1B2A72]">
              {t.mentors.title}
            </h2>
          </div>

          {mentors && mentors.length > 0 ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                {mentors.map((mentor) => (
                  <MentorCard
                    key={mentor.id}
                    full_name={mentor.full_name ?? ''}
                    institution={mentor.institution}
                    specialization={mentor.specialization}
                    title={mentor.title}
                    photo_url={mentor.photo_url}
                  />
                ))}
              </div>
              <div className="text-center">
                <Link href="/mentors">
                  <Button
                    variant="outline"
                    className="border-[1.5px] border-[var(--primary)] text-[var(--primary)] hover:bg-white rounded-lg px-6"
                  >
                    {t.mentors.viewAll} →
                  </Button>
                </Link>
              </div>
            </>
          ) : (
            <div className="text-center py-16 bg-white rounded-2xl border border-[var(--border)]">
              <p className="text-[var(--text-secondary)] text-lg mb-6">{t.common.noMentorsYet}</p>
              <Link href="/register">
                <Button className="bg-[var(--primary)] hover:bg-[var(--primary-light)] text-white rounded-lg px-6">
                  {t.common.registerAsMentor}
                </Button>
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* Research Opportunities Section */}
      <section className="py-24 lg:py-30 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <span className="section-label">{t.research.label}</span>
            <h2 className="font-heading text-[36px] lg:text-[42px] font-extrabold text-[#1B2A72]">
              {t.research.title}
            </h2>
          </div>

          {opportunities && opportunities.length > 0 ? (
            <>
              <div className="space-y-6 mb-8">
                {opportunities.map((opp) => {
                  const mentor = opp.mentor as unknown as {
                    full_name: string
                    institution: string
                  } | null
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
                    {t.research.viewAll} →
                  </Button>
                </Link>
              </div>
            </>
          ) : (
            <div className="text-center py-16 bg-[#EEEDF8] rounded-2xl border border-[var(--border)]">
              <p className="text-[var(--text-secondary)] text-lg">{t.common.noResearchYet}</p>
            </div>
          )}
        </div>
      </section>

      {/* Why It Matters Section - centered */}
      <section className="py-24 lg:py-30 bg-[#EEEDF8]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <span className="section-label">{t.mission.label}</span>
            <h2 className="font-heading text-[36px] lg:text-[42px] font-extrabold text-[#1B2A72] mb-6">
              {t.mission.title}
            </h2>
            <p className="text-xl text-[var(--text-secondary)] leading-relaxed max-w-3xl mx-auto">
              {t.mission.description}
            </p>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Stat Card 1 */}
            <div className="bg-white border border-[var(--border)] rounded-2xl p-6 text-center">
              <div className="w-12 h-12 bg-[#EEEDF8] rounded-xl flex items-center justify-center mx-auto mb-4">
                <Users className="w-6 h-6 text-[#1B2A72]" />
              </div>
              <div className="font-heading text-4xl lg:text-5xl font-extrabold text-[#1B2A72] mb-2">30%</div>
              <p className="text-[var(--text-secondary)] text-sm">{t.mission.stats.researchersWomen}</p>
            </div>

            {/* Stat Card 2 */}
            <div className="bg-white border border-[var(--border)] rounded-2xl p-6 text-center">
              <div className="w-12 h-12 bg-[#EEEDF8] rounded-xl flex items-center justify-center mx-auto mb-4">
                <TrendingUp className="w-6 h-6 text-[#1B2A72]" />
              </div>
              <div className="font-heading text-4xl lg:text-5xl font-extrabold text-[#1B2A72] mb-2">2x</div>
              <p className="text-[var(--text-secondary)] text-sm">{t.mission.stats.retention}</p>
            </div>

            {/* Stat Card 3 */}
            <div className="bg-white border border-[var(--border)] rounded-2xl p-6 text-center">
              <div className="w-12 h-12 bg-[#EEEDF8] rounded-xl flex items-center justify-center mx-auto mb-4">
                <Building2 className="w-6 h-6 text-[#1B2A72]" />
              </div>
              <div className="font-heading text-4xl lg:text-5xl font-extrabold text-[#1B2A72] mb-2">45+</div>
              <p className="text-[var(--text-secondary)] text-sm">{t.mission.stats.universities}</p>
            </div>

            {/* Stat Card 4 */}
            <div className="bg-white border border-[var(--border)] rounded-2xl p-6 text-center">
              <div className="w-12 h-12 bg-[#EEEDF8] rounded-xl flex items-center justify-center mx-auto mb-4">
                <FlaskConical className="w-6 h-6 text-[#1B2A72]" />
              </div>
              <div className="font-heading text-4xl lg:text-5xl font-extrabold text-[#1B2A72] mb-2">120+</div>
              <p className="text-[var(--text-secondary)] text-sm">{t.mission.stats.institutions}</p>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
