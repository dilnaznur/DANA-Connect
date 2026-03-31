'use client'

import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Beaker, Clock, User } from 'lucide-react'
import { useLanguage } from '@/lib/i18n/LanguageContext'
import { translations } from '@/lib/i18n/translations'

interface OpportunityCardProps {
  title: string
  description: string
  tags: string[]
  total_spots: number
  filled_spots: number
  duration: string | null
  mentor_name?: string
  mentor_institution?: string
  showApplyButton?: boolean
  onApply?: () => void
  isApplied?: boolean
  isFull?: boolean
}

export function OpportunityCard({
  title,
  description,
  tags,
  total_spots,
  filled_spots,
  duration,
  mentor_name,
  showApplyButton = false,
  onApply,
  isApplied = false,
  isFull = false,
}: OpportunityCardProps) {
  const { language } = useLanguage()
  const t = translations[language]

  const remainingSpots = Math.max(0, total_spots - filled_spots)

  const action = isApplied ? (
    <Badge className="bg-green-100 text-green-700 hover:bg-green-100">
      ✓ {t.common.applied}
    </Badge>
  ) : isFull ? (
    <Badge className="bg-gray-100 text-gray-600 hover:bg-gray-100">{t.common.full}</Badge>
  ) : (
    <Button
      onClick={onApply}
      className="bg-[#1B2A72] hover:bg-[#2d3f99] text-white rounded-full px-6 btn-hover-lift"
    >
      {t.common.apply}
    </Button>
  )

  return (
    <div className="bg-white border border-[#E2E4F0] rounded-xl p-5 sm:p-6 transition-all duration-200 ease-out hover:-translate-y-[1px] hover:shadow-lg">
      <div className="flex flex-col sm:flex-row gap-4 items-start">
        {/* Icon box - 40px navy rounded square with flask icon */}
        <div className="flex-shrink-0">
          <div className="w-10 h-10 rounded-lg bg-[#1B2A72] flex items-center justify-center">
            <Beaker className="w-5 h-5 text-white" strokeWidth={1.8} />
          </div>
        </div>

        <div className="flex-1 min-w-0">
          {/* Title - bold */}
          <h3 className="font-heading font-bold text-lg text-[#1B2A72] mb-2 line-clamp-2">
            {title}
          </h3>

          {/* Description */}
          <p className="text-[var(--text-secondary)] text-sm mb-3 line-clamp-2">
            {description}
          </p>

          {/* Mentor name with person icon */}
          {mentor_name && (
            <div className="flex items-center gap-2 mb-3">
              <User className="w-4 h-4 text-[var(--text-muted)]" />
              <span className="text-[var(--text-secondary)] text-sm font-medium">
                {mentor_name}
              </span>
            </div>
          )}

          {/* Duration with clock icon */}
          {duration && (
            <div className="flex items-center gap-2 mb-4">
              <Clock className="w-4 h-4 text-[var(--text-muted)]" />
              <span className="text-[var(--text-secondary)] text-sm">
                {duration}
              </span>
            </div>
          )}

          {/* Field tags */}
          <div className="flex flex-wrap gap-2 mb-4">
            {tags.map((tag, index) => (
              <span
                key={index}
                className="bg-[#EEEEF8] text-[#1B2A72] text-xs font-medium px-3 py-1 rounded-full"
              >
                {tag}
              </span>
            ))}
          </div>

          {/* Spots info */}
          <div className="text-xs text-[var(--text-muted)]">
            {t.common.spotsRemaining}: {remainingSpots}
          </div>

          {/* Apply button (mobile) */}
          {showApplyButton && <div className="pt-4 sm:hidden">{action}</div>}
        </div>

        {/* Apply button (desktop/tablet) */}
        {showApplyButton && <div className="hidden sm:block flex-shrink-0">{action}</div>}
      </div>
    </div>
  )
}
