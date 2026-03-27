'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Beaker, Clock, Users } from 'lucide-react'

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
  mentor_institution,
  showApplyButton = false,
  onApply,
  isApplied = false,
  isFull = false,
}: OpportunityCardProps) {
  const spotsRemaining = total_spots - filled_spots
  const fillPercentage = (filled_spots / total_spots) * 100

  const action = isApplied ? (
    <Badge className="bg-green-100 text-green-700 hover:bg-green-100">✓ Applied</Badge>
  ) : isFull ? (
    <Badge className="bg-gray-100 text-gray-600 hover:bg-gray-100">Full</Badge>
  ) : (
    <Button
      onClick={onApply}
      className="bg-[var(--primary)] hover:bg-[var(--primary-light)] text-white rounded-lg px-6 btn-hover-lift"
    >
      Apply
    </Button>
  )

  return (
    <Card className="surface-card transition-all duration-300 ease-out">
      <CardContent className="p-6">
        <div className="flex gap-4 items-start">
          {/* Icon */}
          <div className="flex-shrink-0">
            <div className="w-12 h-12 rounded-lg bg-[var(--primary)] flex items-center justify-center">
              <Beaker className="w-6 h-6 text-white" strokeWidth={1.8} />
            </div>
          </div>

          <div className="flex-1 min-w-0">
            <h3 className="font-heading font-semibold text-lg text-[var(--primary)] mb-2 line-clamp-2">
              {title}
            </h3>
            <p className="text-[var(--text-secondary)] text-sm mb-3 line-clamp-2">
              {description}
            </p>

            {mentor_name && (
              <p className="text-[var(--text-secondary)] text-xs mb-3 font-medium">
                <span className="text-[var(--text-muted)]">Mentor:</span> {mentor_name}
                {mentor_institution && ` · ${mentor_institution}`}
              </p>
            )}

            {/* Duration and spots info */}
            <div className="flex flex-wrap items-center gap-3 mb-4">
              {duration && (
                <span className="inline-flex items-center gap-1.5 bg-[var(--bg-hero)] text-[var(--text-secondary)] text-xs rounded-full px-2.5 py-1 font-medium">
                  <Clock className="w-3 h-3" />
                  {duration}
                </span>
              )}
              <span className="inline-flex items-center gap-1.5 text-xs text-[var(--text-muted)] font-medium">
                <Users className="w-3 h-3" />
                {spotsRemaining} spot{spotsRemaining !== 1 ? 's' : ''} open
              </span>
            </div>

            {/* Tags */}
            <div className="flex flex-wrap gap-2 mb-4">
              {tags.map((tag, index) => (
                <span key={index} className="tag-pill">
                  {tag}
                </span>
              ))}
            </div>

            {/* Spots Progress Bar */}
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-[var(--text-muted)] font-medium">
                  Spots filled
                </span>
                <span className="text-xs font-bold text-[var(--text-secondary)]">
                  {filled_spots}/{total_spots}
                </span>
              </div>
              <div className="progress-bar">
                <div 
                  className="progress-bar-fill"
                  style={{ width: `${fillPercentage}%` }}
                />
              </div>
            </div>
          </div>

          {showApplyButton && <div className="flex-shrink-0">{action}</div>}
        </div>
      </CardContent>
    </Card>
  )
}
