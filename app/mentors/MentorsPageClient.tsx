'use client'

import Link from 'next/link'
import { NavBar } from '@/components/NavBar'
import { Footer } from '@/components/Footer'
import { HeroBackground } from '@/components/HeroBackground'
import { MentorCard } from '@/components/MentorCard'
import { Button } from '@/components/ui/button'
import { useLanguage } from '@/lib/i18n/LanguageContext'
import { translations } from '@/lib/i18n/translations'

interface MentorData {
  id: string
  full_name: string
  institution: string | null
  specialization: string | null
  title: string | null
  photo_url: string | null
}

interface MentorsPageClientProps {
  mentors: MentorData[]
}

export default function MentorsPageClient({ mentors }: MentorsPageClientProps) {
  const { language } = useLanguage()
  const t = translations[language]

  return (
    <div className="min-h-screen flex flex-col">
      <NavBar />

      {/* Hero Section */}
      <section className="relative py-16 lg:py-20 overflow-hidden">
        <HeroBackground />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          <span className="section-label">{t.pages.mentors.heroLabel}</span>
          <h1 className="font-heading text-[42px] lg:text-[52px] font-extrabold text-[#1B2A72] leading-tight">
            {t.pages.mentors.heroTitle}
          </h1>
          <p className="text-xl text-[var(--text-secondary)] mt-4 max-w-2xl mx-auto">
            {t.pages.mentors.heroSubtitle}
          </p>
        </div>
      </section>

      {/* Mentors Grid */}
      <section className="py-16 lg:py-24 bg-[#EEEDF8] flex-1">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {mentors.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {mentors.map((mentor) => (
                <MentorCard
                  key={mentor.id}
                  full_name={mentor.full_name || ''}
                  institution={mentor.institution}
                  specialization={mentor.specialization}
                  title={mentor.title}
                  photo_url={mentor.photo_url}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-20 bg-white rounded-2xl border border-[var(--border)]">
              <div className="max-w-md mx-auto">
                <h2 className="font-heading text-2xl font-extrabold text-[#1B2A72] mb-4">
                  {t.pages.mentors.emptyTitle}
                </h2>
                <p className="text-[var(--text-secondary)] mb-8">
                  {t.pages.mentors.emptyBody}
                </p>
                <Link href="/register">
                  <Button className="bg-[var(--primary)] hover:bg-[var(--primary-light)] text-white rounded-lg px-6">
                    {t.pages.mentors.emptyButton}
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
