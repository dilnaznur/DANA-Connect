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
  const isAccepted = application.status === 'accepted'
  const isPendingOrViewed = application.status === 'pending' || application.status === 'viewed'

  return (
    <Card className="bg-white border border-[var(--border)] rounded-2xl shadow-card">
      <CardContent className="p-6">
        {/* Header: Name + Status Badge - always shown when showMenteeContact=true */}
        <div className="flex justify-between items-start mb-2">
          <h3 className="font-heading font-bold text-lg text-[#1B2A72]">
            {application.mentee?.full_name}
          </h3>
          <StatusBadge status={application.status} />
        </div>

        {/* Subtitle: Institution and Specialization - always shown when showMenteeContact=true */}
        {showMenteeContact && application.mentee?.institution && (
          <p className="text-[var(--text-secondary)] text-sm">
            {application.mentee.institution}
          </p>
        )}
        {showMenteeContact && application.mentee?.specialization && (
          <p className="text-[var(--text-muted)] text-sm mb-4">
            {application.mentee.specialization}
          </p>
        )}

        {/* Green Success Box - shown when accepted AND showMenteeContact=true */}
        {showMenteeContact && isAccepted && application.mentee && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
            <h4 className="text-green-700 font-semibold text-sm mb-3">
              ✓ Accepted — Contact Information
            </h4>
            <div className="space-y-2">
              {application.mentee.email && (
                <a
                  href={`mailto:${application.mentee.email}`}
                  className="flex items-center gap-2 text-sm text-green-700 hover:underline"
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
                  className="flex items-center gap-2 text-sm text-green-700 hover:underline"
                >
                  <Linkedin className="w-4 h-4" />
                  LinkedIn Profile
                  <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </div>
            <p className="text-green-600 text-xs mt-3">
              Reach out to welcome them to your research project
            </p>
          </div>
        )}

        {/* Subtle Contact Info Box - shown for pending/viewed when showMenteeContact=true */}
        {showMenteeContact && isPendingOrViewed && application.mentee && (
          <div className="bg-[#EEEDF8] rounded-lg p-3 mb-4">
            <p className="text-[#1B2A72] text-sm font-medium mb-2">Applicant Contact</p>
            <div className="flex flex-wrap gap-4">
              {application.mentee.email && (
                <a
                  href={`mailto:${application.mentee.email}`}
                  className="inline-flex items-center gap-2 text-sm text-[#1B2A72] hover:underline"
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
                  className="inline-flex items-center gap-2 text-sm text-[#1B2A72] hover:underline"
                >
                  <Linkedin className="w-4 h-4" />
                  LinkedIn
                  <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </div>
          </div>
        )}

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

        <div className="bg-[#F7F7FB] rounded-xl p-4 mb-4">
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
