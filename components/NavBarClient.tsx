'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

export function NavBarClient() {
  const [isScrolled, setIsScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10)
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <nav
      className={`bg-white border-b border-[var(--border)] sticky top-0 z-50 transition-all duration-300 ease-out ${
        isScrolled ? 'navbar-scrolled shadow-lg' : 'bg-white/95 backdrop-blur-sm'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link href="/" className="flex items-center gap-2 flex-shrink-0">
            <span className="font-heading font-bold text-xl text-[var(--primary)]">
              DANA Connect
            </span>
          </Link>

          <div className="hidden md:flex items-center gap-8">
            <Link
              href="/mentors"
              className="text-[var(--text-secondary)] hover:text-[var(--primary)] transition-colors font-medium text-sm"
            >
              Mentors
            </Link>
            <Link
              href="/research"
              className="text-[var(--text-secondary)] hover:text-[var(--primary)] transition-colors font-medium text-sm"
            >
              Research
            </Link>
            <Link
              href="/about"
              className="text-[var(--text-secondary)] hover:text-[var(--primary)] transition-colors font-medium text-sm"
            >
              About
            </Link>
          </div>

          <div className="flex items-center gap-2 md:gap-3 flex-shrink-0">
            <Link href="/login">
              <Button
                variant="outline"
                className="border-[1.5px] border-[var(--primary)] text-[var(--primary)] hover:bg-hero rounded-lg px-3 md:px-4 text-sm btn-hover-lift"
              >
                Log In
              </Button>
            </Link>
            <Link href="/register">
              <Button
                className="bg-[var(--primary)] hover:bg-[var(--primary-light)] text-white rounded-lg px-3 md:px-4 text-sm btn-hover-lift"
              >
                Get Started
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </nav>
  )
}
