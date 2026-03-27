'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { LogOut } from 'lucide-react'

interface DashboardNavProps {
  userName: string
  onSignOut: () => void
}

export function DashboardNav({ userName, onSignOut }: DashboardNavProps) {
  return (
    <nav className="bg-white border-b border-[var(--border)] sticky top-0 z-50 shadow-card">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link href="/" className="flex items-center gap-2">
            <span className="font-heading font-bold text-xl text-[var(--primary)]">
              DANA Connect
            </span>
          </Link>

          <div className="flex items-center gap-4">
            <span className="text-[var(--text-secondary)] font-medium">
              {userName}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={onSignOut}
              className="border-[var(--border)] text-[var(--text-secondary)] hover:text-[var(--primary)] hover:bg-hero btn-hover-lift"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>
      </div>
    </nav>
  )
}
