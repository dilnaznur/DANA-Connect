'use client'

import Image from 'next/image'

interface MentorCardProps {
  full_name: string
  institution: string | null
  specialization: string | null
  title?: string | null
  photo_url?: string | null
}

export function MentorCard({ full_name, institution, specialization, title, photo_url }: MentorCardProps) {
  const initials = full_name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0])
    .join('')
    .toUpperCase()

  // Get field tag from specialization (first item if comma-separated)
  const fieldTag = specialization?.split(',')[0].trim()

  return (
    <div className="bg-white border border-[#E2E4F0] rounded-xl p-4 sm:p-5 transition-all duration-200 ease-out hover:-translate-y-[1px] hover:shadow-lg">
      <div className="flex items-start gap-4">
        {/* Avatar - 64px circle */}
        <div className="flex-shrink-0">
          {photo_url ? (
            <Image
              src={photo_url}
              alt={full_name}
              width={64}
              height={64}
              className="w-16 h-16 rounded-full object-cover"
            />
          ) : (
            <div className="w-16 h-16 rounded-full bg-[#E8E9F8] flex items-center justify-center text-[#1B2A72] font-bold text-lg">
              {initials}
            </div>
          )}
        </div>

        {/* Info stacked on right */}
        <div className="flex-1 min-w-0">
          {/* Full name - bold navy */}
          <h3 className="font-heading font-bold text-[#1B2A72] text-base leading-tight">
            {full_name}
          </h3>

          {/* Specialization/title below */}
          {(title || specialization) && (
            <p className="text-[var(--text-secondary)] text-sm mt-1 line-clamp-1">
              {title || specialization}
            </p>
          )}

          {/* Institution below that */}
          {institution && (
            <p className="text-[var(--text-muted)] text-xs mt-0.5 line-clamp-1">
              {institution}
            </p>
          )}

          {/* Field tag pill at bottom */}
          {fieldTag && (
            <span className="inline-block mt-3 bg-[#EEEEF8] text-[#1B2A72] text-xs font-medium px-3 py-1 rounded-full">
              {fieldTag}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}
