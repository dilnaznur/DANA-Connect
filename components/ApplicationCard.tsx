'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { StatusBadge } from '@/components/StatusBadge'
import { Application } from '@/lib/types'
import { format } from 'date-fns'
import { Mail, Linkedin, ExternalLink } from 'lucide-react'

interface ApplicationCardProps {
  application: Application
  showMenteeContact?: boolean
  showActions?: boolean
  onAccept?: () => void
  onReject?: () => void
  onViewCv?: (cvPath: string) => void
}

export function ApplicationCard({
  application,
  showMenteeContact = false,
  showActions = false,
  onAccept,
  onReject,
  onViewCv,
}: ApplicationCardProps) {
  const canShowActions =
    showActions && (application.status === 'pending' || application.status === 'viewed')

  return (
    <Card className="surface-card">
      <CardContent className="p-6">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="font-heading font-semibold text-lg text-[var(--primary)]">
              {application.mentee?.full_name}
            </h3>
            {application.mentee?.institution && (
              <p className="text-[var(--text-secondary)] text-sm">
                {application.mentee.institution}
              </p>
            )}
            {application.mentee?.specialization && (
              <p className="text-[var(--text-muted)] text-sm">
                {application.mentee.specialization}
              </p>
            )}
          </div>
          <StatusBadge status={application.status} />
        </div>

        {application.opportunity && (
          <div className="mb-4">
            <Badge variant="outline" className="text-[var(--text-secondary)]">
              For: {application.opportunity.title}
            </Badge>
          </div>
        )}

        <p className="text-[var(--text-muted)] text-sm mb-4">
          Submitted: {format(new Date(application.created_at), 'MMMM d, yyyy')}
        </p>

        <div className="bg-hero rounded-xl p-4 mb-4">
          <p className="text-[var(--text-secondary)] text-sm leading-relaxed">
            {application.motivation_text}
          </p>
        </div>

        {application.cv_url && (
          <div className="mb-4">
            <button
              type="button"
              onClick={() => onViewCv?.(application.cv_url!)}
              className="inline-flex items-center gap-2 text-sm text-[var(--accent)] hover:underline"
            >
              View CV
              <ExternalLink className="w-3 h-3" />
            </button>
          </div>
        )}

        {showMenteeContact && application.mentee && (
          <div className="border-t border-[var(--border)] pt-4 mb-4">
            <h4 className="text-sm font-medium text-[var(--primary)] mb-2">
              Contact Information
            </h4>
            <div className="flex flex-wrap gap-4">
              {application.mentee.email && (
                <a
                  href={`mailto:${application.mentee.email}`}
                  className="inline-flex items-center gap-2 text-sm text-[var(--accent)] hover:underline"
                >
                  <Mail className="w-4 h-4" />
                  {application.mentee.email}
                </a>
              )}
              {application.mentee.linkedin_url && (
                <a
                  href={application.mentee.linkedin_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-sm text-[var(--accent)] hover:underline"
                >
                  <Linkedin className="w-4 h-4" />
                  LinkedIn
                  <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </div>
          </div>
        )}

        {canShowActions && (
          <div className="flex gap-3 justify-end">
            <Button
              variant="outline"
              onClick={onReject}
              className="border-red-300 text-red-600 hover:bg-red-50 btn-hover-lift"
            >
              Reject ✗
            </Button>
            <Button
              variant="outline"
              onClick={onAccept}
              className="border-green-300 text-green-600 hover:bg-green-50 btn-hover-lift"
            >
              Accept ✓
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
