'use client'

import { ApplicationStatus } from '@/lib/types'
import { Badge } from '@/components/ui/badge'
import { useLanguage } from '@/lib/i18n/LanguageContext'
import { translations } from '@/lib/i18n/translations'

interface StatusBadgeProps {
  status: ApplicationStatus
}

const statusConfig: Record<ApplicationStatus, { className: string; dotClass: string }> = {
  pending: {
    className: 'bg-amber-100 text-amber-700 hover:bg-amber-100',
    dotClass: 'status-dot status-dot-pending',
  },
  viewed: {
    className: 'bg-blue-100 text-blue-700 hover:bg-blue-100',
    dotClass: 'status-dot status-dot-viewed',
  },
  accepted: {
    className: 'bg-green-100 text-green-700 hover:bg-green-100',
    dotClass: 'status-dot status-dot-accepted',
  },
  rejected: {
    className: 'bg-red-100 text-red-700 hover:bg-red-100',
    dotClass: 'status-dot status-dot-rejected',
  },
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const { language } = useLanguage()
  const t = translations[language]
  const config = statusConfig[status]
  const label = t.dashboard.statusBadges[status]

  return (
    <Badge variant="secondary" className={`${config.className} status-with-dot`}>
      <span className={config.dotClass} />
      {label}
    </Badge>
  )
}
