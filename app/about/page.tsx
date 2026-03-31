'use client'

import dynamic from 'next/dynamic'
import { NavBar } from '@/components/NavBar'
import { Footer } from '@/components/Footer'
import { useLanguage } from '@/lib/i18n/LanguageContext'
import { translations } from '@/lib/i18n/translations'

const HeroBackground = dynamic(
  () => import('@/components/HeroBackground').then((mod) => ({ default: mod.HeroBackground })),
  { ssr: false }
)

export default function AboutPage() {
  const { language } = useLanguage()
  const t = translations[language]

  return (
    <div className="min-h-screen flex flex-col">
      <NavBar />

      {/* Hero Section */}
      <section className="relative py-12 sm:py-16 lg:py-24 overflow-hidden">
        <HeroBackground />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          <span className="section-label">{t.pages.about.heroLabel}</span>
          <h1 className="font-heading text-3xl sm:text-[42px] lg:text-[52px] font-extrabold text-[#1B2A72] leading-tight">
            {t.pages.about.heroTitle}
          </h1>
          <p className="text-lg sm:text-xl text-[var(--text-secondary)] mt-4 sm:mt-6 max-w-2xl mx-auto">
            {t.pages.about.heroSubtitle}
          </p>
        </div>
      </section>

      {/* Content Section */}
      <section className="py-16 lg:py-20 bg-white flex-1">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="prose prose-lg max-w-none">
            <div className="bg-[#EEEDF8] rounded-2xl p-6 sm:p-8 mb-10 sm:mb-12">
              <h2 className="font-heading text-2xl font-bold text-[#1B2A72] mb-4">
                {t.pages.about.visionTitle}
              </h2>
              <p className="text-[var(--text-secondary)] leading-relaxed">
                {t.pages.about.visionBody}
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-6 sm:gap-8 mb-10 sm:mb-12">
              <div className="bg-white border border-[var(--border)] rounded-2xl p-5 sm:p-6 shadow-card">
                <div className="w-12 h-12 bg-[#EEEDF8] rounded-xl flex items-center justify-center mb-4">
                  <span className="text-2xl">🎯</span>
                </div>
                <h3 className="font-heading text-xl font-semibold text-[#1B2A72] mb-3">
                  {t.pages.about.cards.connectTitle}
                </h3>
                <p className="text-[var(--text-secondary)]">
                  {t.pages.about.cards.connectBody}
                </p>
              </div>

              <div className="bg-white border border-[var(--border)] rounded-2xl p-5 sm:p-6 shadow-card">
                <div className="w-12 h-12 bg-[#EEEDF8] rounded-xl flex items-center justify-center mb-4">
                  <span className="text-2xl">🔬</span>
                </div>
                <h3 className="font-heading text-xl font-semibold text-[#1B2A72] mb-3">
                  {t.pages.about.cards.researchTitle}
                </h3>
                <p className="text-[var(--text-secondary)]">
                  {t.pages.about.cards.researchBody}
                </p>
              </div>

              <div className="bg-white border border-[var(--border)] rounded-2xl p-5 sm:p-6 shadow-card">
                <div className="w-12 h-12 bg-[#EEEDF8] rounded-xl flex items-center justify-center mb-4">
                  <span className="text-2xl">🤝</span>
                </div>
                <h3 className="font-heading text-xl font-semibold text-[#1B2A72] mb-3">
                  {t.pages.about.cards.collaborateTitle}
                </h3>
                <p className="text-[var(--text-secondary)]">
                  {t.pages.about.cards.collaborateBody}
                </p>
              </div>

              <div className="bg-white border border-[var(--border)] rounded-2xl p-5 sm:p-6 shadow-card">
                <div className="w-12 h-12 bg-[#EEEDF8] rounded-xl flex items-center justify-center mb-4">
                  <span className="text-2xl">🌟</span>
                </div>
                <h3 className="font-heading text-xl font-semibold text-[#1B2A72] mb-3">
                  {t.pages.about.cards.growTitle}
                </h3>
                <p className="text-[var(--text-secondary)]">
                  {t.pages.about.cards.growBody}
                </p>
              </div>
            </div>

            <div className="text-center bg-gradient-to-r from-[#1B2A72] to-[#4F63D2] rounded-2xl p-6 sm:p-8 text-white">
              <h2 className="font-heading text-2xl font-bold mb-4">
                {t.pages.about.cta.title}
              </h2>
              <p className="text-white/90 mb-6 max-w-xl mx-auto">
                {t.pages.about.cta.body}
              </p>
              <a
                href="/register"
                className="inline-block bg-white text-[#1B2A72] font-semibold px-6 py-3 rounded-lg hover:bg-white/90 transition-colors"
              >
                {t.pages.about.cta.button}
              </a>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}
