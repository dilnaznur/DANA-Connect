'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'
import { useLanguage } from '@/lib/i18n/LanguageContext'
import { translations, type Language } from '@/lib/i18n/translations'
import type { AuthChangeEvent, Session, User } from '@supabase/supabase-js'

export function NavBarClient() {
  const [isScrolled, setIsScrolled] = useState(false)
  const [user, setUser] = useState<User | null>(null)
  const { language, setLanguage } = useLanguage()
  const t = translations[language]

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10)
    }

    window.addEventListener('scroll', handleScroll)

    const supabase = createClient()

    const initAuth = async () => {
      try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession()
        if (sessionError) {
          console.error('Auth init getSession error:', sessionError)
        }

        setUser(session?.user ?? null)
      } catch (e) {
        console.error('Auth init error:', e)
      }
    }

    initAuth()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event: AuthChangeEvent, session: Session | null) => {
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        setUser(session?.user ?? null)
        return
      }

      if (event === 'SIGNED_OUT') {
        setUser(null)
      }
      }
    )

    return () => {
      window.removeEventListener('scroll', handleScroll)
      subscription.unsubscribe()
    }
  }, [])

  // No role fetch here; default to mentee dashboard and let routing/middleware redirect if needed.
  const dashboardUrl = '/dashboard/mentee'

  const languageButtonClass = (lang: Language) => {
    if (lang === language) {
      return 'bg-[#1B2A72] text-white rounded-md px-2 py-1 text-xs font-bold'
    }
    return 'text-[var(--text-secondary)] hover:text-[#1B2A72] px-2 py-1 text-xs'
  }

  return (
    <nav
      className={`bg-white border-b border-[var(--border)] sticky top-0 z-50 transition-all duration-300 ease-out ${
        isScrolled ? 'navbar-scrolled shadow-lg' : 'bg-white/95 backdrop-blur-sm'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-center justify-between gap-y-2 py-2 md:py-0 md:h-16">
          <Link
            href="/"
            className="flex items-center gap-2 flex-shrink-0 w-full md:w-auto"
            aria-label="DANA Connect"
          >
            <Image
              src="/dana-logo.png"
              alt="DANA Connect"
              width={160}
              height={90}
              className="h-10 sm:h-11 w-auto"
              priority
            />
            <span className="sr-only">DANA Connect</span>
          </Link>

          <div className="hidden md:flex items-center gap-8">
            <Link
              href="/mentors"
              className="text-[var(--text-secondary)] hover:text-[var(--primary)] transition-colors font-medium text-sm"
            >
              {t.nav.mentors}
            </Link>
            <Link
              href="/research"
              className="text-[var(--text-secondary)] hover:text-[var(--primary)] transition-colors font-medium text-sm"
            >
              {t.nav.research}
            </Link>
            <Link
              href="/projects"
              className="text-[var(--text-secondary)] hover:text-[var(--primary)] transition-colors font-medium text-sm"
            >
              {t.nav.projects}
            </Link>
            <Link
              href="/about"
              className="text-[var(--text-secondary)] hover:text-[var(--primary)] transition-colors font-medium text-sm"
            >
              {t.nav.about}
            </Link>
            {!user && (
              <Link
                href="/register"
                className="text-[var(--text-secondary)] hover:text-[var(--primary)] transition-colors font-medium text-sm"
              >
                {t.nav.join}
              </Link>
            )}
          </div>

          <div className="flex items-center justify-between gap-2 w-full md:w-auto md:justify-end md:gap-3 flex-shrink-0">
            {/* Language Switcher */}
            <div className="flex items-center gap-1 flex-shrink-0">
              <button
                type="button"
                onClick={() => setLanguage('en')}
                className={languageButtonClass('en')}
              >
                EN
              </button>
              <button
                type="button"
                onClick={() => setLanguage('ru')}
                className={languageButtonClass('ru')}
              >
                RU
              </button>
              <button
                type="button"
                onClick={() => setLanguage('kz')}
                className={languageButtonClass('kz')}
              >
                KZ
              </button>
            </div>

            <div className="flex items-center gap-2 flex-shrink-0">
              {user ? (
                <Link href={dashboardUrl}>
                  <Button className="bg-[var(--primary)] hover:bg-[var(--primary-light)] text-white rounded-lg px-3 md:px-4 text-sm btn-hover-lift">
                    {t.nav.dashboard}
                  </Button>
                </Link>
              ) : (
                <>
                  <Link href="/login">
                    <Button
                      variant="outline"
                      className="border-[1.5px] border-[var(--primary)] text-[var(--primary)] hover:bg-hero rounded-lg px-3 md:px-4 text-sm btn-hover-lift"
                    >
                      {t.nav.login}
                    </Button>
                  </Link>
                  <Link href="/register">
                    <Button className="bg-[var(--primary)] hover:bg-[var(--primary-light)] text-white rounded-lg px-3 md:px-4 text-sm btn-hover-lift">
                      {t.nav.getStarted}
                    </Button>
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Mobile nav links */}
        <div className="md:hidden pb-3">
          <div className="flex items-center gap-4 overflow-x-auto whitespace-nowrap [-webkit-overflow-scrolling:touch]">
            <Link
              href="/mentors"
              className="text-[var(--text-secondary)] hover:text-[var(--primary)] transition-colors font-medium text-sm"
            >
              {t.nav.mentors}
            </Link>
            <Link
              href="/research"
              className="text-[var(--text-secondary)] hover:text-[var(--primary)] transition-colors font-medium text-sm"
            >
              {t.nav.research}
            </Link>
            <Link
              href="/projects"
              className="text-[var(--text-secondary)] hover:text-[var(--primary)] transition-colors font-medium text-sm"
            >
              {t.nav.projects}
            </Link>
            <Link
              href="/about"
              className="text-[var(--text-secondary)] hover:text-[var(--primary)] transition-colors font-medium text-sm"
            >
              {t.nav.about}
            </Link>
            {!user && (
              <Link
                href="/register"
                className="text-[var(--text-secondary)] hover:text-[var(--primary)] transition-colors font-medium text-sm"
              >
                {t.nav.join}
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}
