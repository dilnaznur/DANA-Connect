"use client"

import Link from 'next/link'
import { useLanguage } from '@/lib/i18n/LanguageContext'
import { translations } from '@/lib/i18n/translations'

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

export function Footer() {
  const currentYear = new Date().getFullYear()
  const { language } = useLanguage()
  const t = translations[language]

  return (
    <footer className="bg-[#1B2A72]">
      {/* Top separator */}
      <div className="border-t border-white/12" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
          {/* Brand Section */}
          <div className="md:col-span-2">
            <Link href="/" className="inline-flex items-center gap-2 mb-4">
              <LogoIcon className="w-7 h-7 text-white" />
              <span className="font-heading font-extrabold text-2xl text-white">
                DANA Connect
              </span>
            </Link>
            <p className="text-white/70 leading-relaxed text-sm max-w-md">
              {t.footer.description}
            </p>
          </div>

          {/* Platform Links */}
          <div>
            <h4 className="font-heading font-bold text-white mb-6 text-sm uppercase tracking-wide">
              {t.footer.platform}
            </h4>
            <ul className="space-y-3">
              <li>
                <Link
                  href="/mentors"
                  className="text-white/70 hover:text-white transition-colors text-sm"
                >
                  {t.nav.mentors}
                </Link>
              </li>
              <li>
                <Link
                  href="/research"
                  className="text-white/70 hover:text-white transition-colors text-sm"
                >
                  {t.nav.research}
                </Link>
              </li>
              <li>
                <Link
                  href="/about"
                  className="text-white/70 hover:text-white transition-colors text-sm"
                >
                  {t.nav.about}
                </Link>
              </li>
            </ul>
          </div>

          {/* Community Links */}
          <div>
            <h4 className="font-heading font-bold text-white mb-6 text-sm uppercase tracking-wide">
              {t.footer.getStarted}
            </h4>
            <ul className="space-y-3">
              <li>
                <Link
                  href="/register"
                  className="text-white/70 hover:text-white transition-colors text-sm"
                >
                  {t.footer.register}
                </Link>
              </li>
              <li>
                <Link
                  href="/login"
                  className="text-white/70 hover:text-white transition-colors text-sm"
                >
                  {t.nav.login}
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom separator with copyright */}
        <div className="border-t border-white/12 pt-8">
          <p className="text-center text-white/50 text-xs">
            &copy; {currentYear} DANA Connect. {t.footer.copyrightSuffix}
          </p>
        </div>
      </div>
    </footer>
  )
}
