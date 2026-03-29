'use client'

import { Project } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useLanguage } from '@/lib/i18n/LanguageContext'
import { translations } from '@/lib/i18n/translations'
import { Users, Calendar, Mail, Send } from 'lucide-react'
import { format } from 'date-fns'

interface ProjectCardProps {
  project: Project
  currentUserId?: string
  hasRequested?: boolean
  onJoin?: () => void
  onManage?: () => void
}

export function ProjectCard({
  project,
  currentUserId,
  hasRequested = false,
  onJoin,
  onManage,
}: ProjectCardProps) {
  const { language } = useLanguage()
  const t = translations[language]

  const isCreator = currentUserId === project.creator_id
  const canJoin = project.is_open && !isCreator && !hasRequested && currentUserId

  return (
    <div className="bg-white border border-[#E2E4F0] rounded-xl p-5 transition-all duration-200 ease-out hover:-translate-y-[1px] hover:shadow-lg">
      {/* Header: Title + Status Badge */}
      <div className="flex justify-between items-start mb-3">
        <h3 className="font-heading font-bold text-lg text-[#1B2A72] line-clamp-1">
          {project.title}
        </h3>
        <Badge
          className={
            project.is_open
              ? 'bg-green-100 text-green-700 hover:bg-green-100'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-100'
          }
        >
          {project.is_open ? t.projects.status.open : t.projects.status.closed}
        </Badge>
      </div>

      {/* Description */}
      <p className="text-[var(--text-secondary)] text-sm mb-4 line-clamp-2">
        {project.description}
      </p>

      {/* Tags */}
      {project.tags && project.tags.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-4">
          {project.tags.map((tag, index) => (
            <span
              key={index}
              className="bg-[#EEEEF8] text-[#1B2A72] text-xs font-medium px-3 py-1 rounded-full"
            >
              {tag}
            </span>
          ))}
        </div>
      )}

      {/* Footer Row: Members, Deadline, Contact */}
      <div className="flex flex-wrap items-center gap-4 text-sm text-[var(--text-muted)] mb-4">
        <div className="flex items-center gap-1.5">
          <Users className="w-4 h-4" />
          <span>
            {project.filled_members}/{project.max_members} {t.projects.status.members}
          </span>
        </div>

        {project.deadline && (
          <div className="flex items-center gap-1.5">
            <Calendar className="w-4 h-4" />
            <span>{format(new Date(project.deadline), 'MMM d, yyyy')}</span>
          </div>
        )}

        {/* Contact Links */}
        <div className="flex items-center gap-3 ml-auto">
          {project.contact_email && (
            <a
              href={`mailto:${project.contact_email}`}
              className="text-[#1B2A72] hover:text-[#4F63D2] transition-colors"
              title={t.projects.common.email}
            >
              <Mail className="w-4 h-4" />
            </a>
          )}
          {project.contact_telegram && (
            <a
              href={`https://t.me/${project.contact_telegram.replace('@', '')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#1B2A72] hover:text-[#4F63D2] transition-colors"
              title={t.projects.common.telegram}
            >
              <Send className="w-4 h-4" />
            </a>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-end gap-2">
        {isCreator && (
          <Button
            onClick={onManage}
            variant="outline"
            className="border-[#1B2A72] text-[#1B2A72] hover:bg-[#EEEEF8] rounded-lg"
          >
            {t.projects.actions.manage}
          </Button>
        )}

        {hasRequested && !isCreator && (
          <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100 px-4 py-2">
            {t.projects.status.requested}
          </Badge>
        )}

        {canJoin && (
          <Button
            onClick={onJoin}
            variant="outline"
            className="border-[#1B2A72] text-[#1B2A72] hover:bg-[#EEEEF8] rounded-lg"
          >
            {t.projects.actions.join}
          </Button>
        )}
      </div>
    </div>
  )
}
