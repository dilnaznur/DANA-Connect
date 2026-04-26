'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { useLanguage } from '@/lib/i18n/LanguageContext'
import { translations } from '@/lib/i18n/translations'
import { LogOut } from 'lucide-react'

// Logo icon - octagon/infinity-loop circuit board symbol
function LogoIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M10 2H22L30 10V22L22 30H10L2 22V10L10 2Z"
        stroke="currentColor"
        strokeWidth="2"
        fill="none"
      />
      <path
        d="M8 16C8 16 10 12 13 12C16 12 16 16 16 16C16 16 16 20 19 20C22 20 24 16 24 16C24 16 22 12 19 12C16 12 16 16 16 16C16 16 16 20 13 20C10 20 8 16 8 16Z"
        stroke="currentColor"
        strokeWidth="1.5"
        fill="none"
        strokeLinecap="round"
      />
      <circle cx="10" cy="2" r="1.5" fill="currentColor" />
      <circle cx="22" cy="2" r="1.5" fill="currentColor" />
      <circle cx="30" cy="10" r="1.5" fill="currentColor" />
      <circle cx="30" cy="22" r="1.5" fill="currentColor" />
      <circle cx="22" cy="30" r="1.5" fill="currentColor" />
      <circle cx="10" cy="30" r="1.5" fill="currentColor" />
      <circle cx="2" cy="22" r="1.5" fill="currentColor" />
      <circle cx="2" cy="10" r="1.5" fill="currentColor" />
    </svg>
  )
}

interface DashboardNavProps {
  userName: string
  onSignOut: () => void
}

export function DashboardNav({ userName, onSignOut }: DashboardNavProps) {
  const { language, setLanguage } = useLanguage()
  const t = translations[language]

  return (
    <nav className="bg-white border-b border-[var(--border)] sticky top-0 z-50 shadow-card">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-center justify-between gap-y-2 py-2 sm:py-0 sm:h-16">
          <div className="flex items-center gap-4 w-full sm:w-auto min-w-0">
            <Link href="/" className="flex items-center gap-2">
              <LogoIcon className="w-7 h-7 text-[#1B2A72]" />
              <span className="font-heading font-extrabold text-xl text-[#1B2A72]">
                DANA Connect
              </span>
            </Link>
            <Link
              href="/"
              className="text-sm text-[var(--text-secondary)] hover:text-[#1B2A72] transition-colors"
            >
              ← {t.nav.home}
            </Link>
          </div>

          <div className="flex items-center justify-between gap-3 w-full sm:w-auto sm:justify-end min-w-0">
            <div className="flex items-center gap-1 flex-shrink-0">
              {(['en', 'ru', 'kz'] as const).map((lang) => (
                <button
                  key={lang}
                  onClick={() => setLanguage(lang)}
                  className={`px-2 py-1 text-xs font-bold rounded-md transition-colors ${
                    language === lang
                      ? 'bg-[#1B2A72] text-white'
                      : 'text-[var(--text-secondary)] hover:text-[#1B2A72]'
                  }`}
                >
                  {lang.toUpperCase()}
                </button>
              ))}
            </div>
            <span className="text-[var(--text-secondary)] font-medium min-w-0 truncate max-w-[140px] sm:max-w-none">
              {userName}
            </span>
            <Link href="/profile/edit">
              <Button
                variant="outline"
                size="sm"
                className="border-[var(--border)] text-[var(--text-secondary)] hover:text-[#1B2A72] hover:bg-[#EEEDF8] btn-hover-lift"
              >
                {t.nav.editProfile}
              </Button>
            </Link>
            <Button
              variant="outline"
              size="sm"
              onClick={onSignOut}
              className="border-[var(--border)] text-[var(--text-secondary)] hover:text-[#1B2A72] hover:bg-[#EEEDF8] btn-hover-lift"
            >
              <LogOut className="w-4 h-4 mr-2" />
              {t.nav.signOut}
            </Button>
          </div>
        </div>
      </div>
    </nav>
  )
}
