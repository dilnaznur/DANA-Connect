'use client'

import { Card, CardContent } from '@/components/ui/card'

interface MentorCardProps {
  full_name: string
  institution: string | null
  specialization: string | null
}

export function MentorCard({ full_name, institution, specialization }: MentorCardProps) {
  const initials = full_name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0])
    .join('')
    .toUpperCase()

  return (
    <Card className="surface-card transition-all duration-300 ease-out h-full">
      <CardContent className="p-6">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-full bg-[var(--bg-hero)] flex items-center justify-center text-[var(--primary)] font-semibold text-base flex-shrink-0">
            {initials}
          </div>

          <div className="flex-1 min-w-0">
            <h3 className="font-heading font-semibold text-[var(--primary)] text-lg leading-tight">
              {full_name}
            </h3>

            {specialization && (
              <p className="text-[var(--text-secondary)] text-sm mt-0.5 line-clamp-2">
                {specialization}
              </p>
            )}

            {institution && (
              <p className="text-[var(--text-muted)] text-xs mt-0.5 line-clamp-1">
                {institution}
              </p>
            )}

            {specialization && (
              <span className="inline-block mt-3 tag-pill">
                {specialization.split(',')[0].trim()}
              </span>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
