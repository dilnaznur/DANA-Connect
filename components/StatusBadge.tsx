'use client'

import { ApplicationStatus } from '@/lib/types'
import { Badge } from '@/components/ui/badge'

interface StatusBadgeProps {
  status: ApplicationStatus
}

const statusConfig: Record<ApplicationStatus, { label: string; className: string; dotClass: string }> = {
  pending: {
    label: 'Pending',
    className: 'bg-amber-100 text-amber-700 hover:bg-amber-100',
    dotClass: 'status-dot status-dot-pending',
  },
  viewed: {
    label: 'Viewed',
    className: 'bg-blue-100 text-blue-700 hover:bg-blue-100',
    dotClass: 'status-dot status-dot-viewed',
  },
  accepted: {
    label: 'Accepted',
    className: 'bg-green-100 text-green-700 hover:bg-green-100',
    dotClass: 'status-dot status-dot-accepted',
  },
  rejected: {
    label: 'Rejected',
    className: 'bg-red-100 text-red-700 hover:bg-red-100',
    dotClass: 'status-dot status-dot-rejected',
  },
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const config = statusConfig[status]

  return (
    <Badge variant="secondary" className={`${config.className} status-with-dot`}>
      <span className={config.dotClass} />
      {config.label}
    </Badge>
  )
}
