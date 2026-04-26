'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useLanguage } from '@/lib/i18n/LanguageContext'
import { translations } from '@/lib/i18n/translations'
import { DashboardNav } from '@/components/DashboardNav'
import { OpportunityCard } from '@/components/OpportunityCard'
import { StatusBadge } from '@/components/StatusBadge'
import { OpportunityCardSkeleton } from '@/components/LoadingSkeleton'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { Profile, ResearchOpportunity, Application, ProjectRequestStatus } from '@/lib/types'
import { Loader2, Mail, Linkedin, ExternalLink, Search, FileText, FolderOpen, Send } from 'lucide-react'
import { format } from 'date-fns'

interface OpportunityWithMentor extends Omit<ResearchOpportunity, 'mentor'> {
  mentor: { full_name: string; institution: string | null } | null
}

interface ProjectRequestWithDetails {
  id: string
  project_id: string
  requester_id: string
  message: string | null
  status: ProjectRequestStatus
  created_at: string
  updated_at: string
  project: {
    title: string
    description: string
    tags: string[]
    contact_email: string | null
    contact_telegram: string | null
    creator_id: string
    creator: {
      full_name: string
      email: string
    } | null
  } | null
}

export default function MenteeDashboard() {
  const router = useRouter()
  const supabase = createClient()
  const { language } = useLanguage()
  const t = translations[language]

  const [profile, setProfile] = useState<Profile | null>(null)
  const [opportunities, setOpportunities] = useState<OpportunityWithMentor[]>([])
  const [myApplications, setMyApplications] = useState<Application[]>([])
  const [myProjectRequests, setMyProjectRequests] = useState<ProjectRequestWithDetails[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('browse')

  // Apply dialog state
  const [selectedOpp, setSelectedOpp] = useState<OpportunityWithMentor | null>(null)
  const [motivationText, setMotivationText] = useState('')
  const [cvFile, setCvFile] = useState<File | null>(null)
  const [cvError, setCvError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Tag filter state
  const [selectedTag, setSelectedTag] = useState<string | null>(null)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [confirmText, setConfirmText] = useState('')
  const [isDeleting, setIsDeleting] = useState(false)

  const appliedIds = useMemo(
    () => new Set(myApplications.map((a) => a.opportunity_id)),
    [myApplications]
  )

  const allTags = useMemo(() => {
    const tagSet = new Set<string>()
    opportunities.forEach((opp) => {
      opp.tags?.forEach((tag) => tagSet.add(tag))
    })
    return Array.from(tagSet).sort()
  }, [opportunities])

  const filteredOpportunities = useMemo(() => {
    if (!selectedTag) return opportunities
    return opportunities.filter((opp) => opp.tags?.includes(selectedTag))
  }, [opportunities, selectedTag])

  const fetchProfile = useCallback(async (userId: string) => {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()
    setProfile(data)
  }, [supabase])

  const fetchOpportunities = useCallback(async () => {
    const { data } = await supabase
      .from('research_opportunities')
      .select(`
        id, title, description, tags, total_spots, filled_spots, duration, created_at, mentor_id, is_open, updated_at,
        mentor:profiles(full_name, institution)
      `)
      .eq('is_open', true)
      .order('created_at', { ascending: false })
    setOpportunities((data as unknown as OpportunityWithMentor[]) || [])
  }, [supabase])

  const fetchMyApplications = useCallback(async (userId: string) => {
    const { data } = await supabase
      .from('applications')
      .select(`
        *,
        opportunity:research_opportunities(title, tags, contact_email, contact_telegram, mentor:profiles(full_name, email, linkedin_url))
      `)
      .eq('mentee_id', userId)
      .order('created_at', { ascending: false })
    setMyApplications(data || [])
  }, [supabase])

  const fetchMyProjectRequests = useCallback(async (userId: string) => {
    const { data } = await supabase
      .from('project_requests')
      .select(`
        *,
        project:projects(title, description, tags, contact_email, contact_telegram, creator_id, creator:profiles(full_name, email))
      `)
      .eq('requester_id', userId)
      .order('created_at', { ascending: false })
    setMyProjectRequests((data as ProjectRequestWithDetails[]) || [])
  }, [supabase])

  useEffect(() => {
    const init = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        router.push('/login')
        return
      }

      await Promise.all([
        fetchProfile(user.id),
        fetchOpportunities(),
        fetchMyApplications(user.id),
        fetchMyProjectRequests(user.id),
      ])
      setIsLoading(false)
    }
    init()
  }, [supabase, router, fetchProfile, fetchOpportunities, fetchMyApplications, fetchMyProjectRequests])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/')
  }

  const handleApply = (opp: OpportunityWithMentor) => {
    setSelectedOpp(opp)
    setMotivationText('')
    setCvFile(null)
    setCvError('')
  }

  const handleCvChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    setCvError('')

    if (!file) {
      setCvFile(null)
      return
    }

    const allowedExtensions = ['pdf', 'doc', 'docx']
    const fileExt = file.name.split('.').pop()?.toLowerCase()

    if (!fileExt || !allowedExtensions.includes(fileExt)) {
      setCvFile(null)
      setCvError(t.dashboard.validation.onlyPdfDocDocxAllowed)
      return
    }

    const maxBytes = 5 * 1024 * 1024
    if (file.size > maxBytes) {
      setCvFile(null)
      setCvError(t.dashboard.validation.fileSizeMax5mb)
      return
    }

    setCvFile(file)
  }

  const handleSubmitApplication = async () => {
    if (!profile || !selectedOpp) return

    if (motivationText.length < 100) {
      toast.error(t.dashboard.toasts.appliedMinChars)
      return
    }

    setIsSubmitting(true)

    let cvPath: string | null = null

    if (cvFile) {
      const fileExt = cvFile.name.split('.').pop()?.toLowerCase()
      if (!fileExt) {
        toast.error(t.dashboard.toasts.invalidCvFileFormat)
        setIsSubmitting(false)
        return
      }

      const filePath = `${profile.id}/${selectedOpp.id}.${fileExt}`
      const { error: uploadError } = await supabase.storage
        .from('cvs')
        .upload(filePath, cvFile, { upsert: true })

      if (uploadError) {
        toast.error(uploadError.message)
        setIsSubmitting(false)
        return
      }

      cvPath = filePath
    }

    const { error } = await supabase.from('applications').insert({
      mentee_id: profile.id,
      opportunity_id: selectedOpp.id,
      motivation_text: motivationText.trim(),
      cv_url: cvPath,
      status: 'pending',
    })

    if (error) {
      if (error.code === '23505') {
        toast.error(t.dashboard.toasts.alreadyApplied)
      } else {
        toast.error(error.message)
      }
    } else {
      toast.success(t.dashboard.toasts.applicationSubmitted)
      setSelectedOpp(null)
      setMotivationText('')
      setCvFile(null)
      setCvError('')
      fetchMyApplications(profile.id)
    }

    setIsSubmitting(false)
  }

  const handleDeleteAccount = async () => {
    if (!profile || confirmText !== 'DELETE') return

    setIsDeleting(true)

    const { data: files, error: listError } = await supabase.storage
      .from('cvs')
      .list(profile.id)

    if (listError) {
      toast.error(`${t.dashboard.toasts.failedToCleanUpCvFiles}: ${listError.message}`)
      setIsDeleting(false)
      return
    }

    if (files && files.length > 0) {
      const paths = files.map((file: { name: string }) => `${profile.id}/${file.name}`)
      const { error: removeError } = await supabase.storage
        .from('cvs')
        .remove(paths)

      if (removeError) {
        toast.error(`${t.dashboard.toasts.failedToCleanUpCvFiles}: ${removeError.message}`)
        setIsDeleting(false)
        return
      }
    }

    const { error } = await supabase.rpc('delete_user_account')

    if (error) {
      toast.error(`${t.dashboard.toasts.failedToDeleteAccount}: ${error.message}`)
      setIsDeleting(false)
      return
    }

    await supabase.auth.signOut()
    router.push('/?deleted=true')
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-page">
        <div className="bg-white border-b border-[var(--border)] h-16" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="space-y-6">
            {[1, 2, 3].map((i) => (
              <OpportunityCardSkeleton key={i} />
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-page">
      <DashboardNav
        userName={profile?.full_name || ''}
        onSignOut={handleSignOut}
      />

      {/* Welcome Banner */}
      {profile && (
        <div className="bg-gradient-to-r from-[#1B2A72] to-[#4F63D2] border-b border-[var(--border)]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <h2 className="font-heading text-3xl font-bold text-white mb-6">
              {t.auth.welcomeBack}, {profile.full_name.split(' ')[0]} 🎓
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-white/10 rounded-lg px-4 py-3 backdrop-blur-sm">
                <div className="text-white/70 text-sm font-medium">{t.dashboard.stats.activeOpportunities}</div>
                <div className="font-heading text-3xl font-bold text-white mt-1">
                  {opportunities.length}
                </div>
              </div>
              <div className="bg-white/10 rounded-lg px-4 py-3 backdrop-blur-sm">
                <div className="text-white/70 text-sm font-medium">{t.dashboard.stats.myApplications}</div>
                <div className="font-heading text-3xl font-bold text-white mt-1">
                  {myApplications.length}
                </div>
              </div>
              <div className="bg-white/10 rounded-lg px-4 py-3 backdrop-blur-sm">
                <div className="text-white/70 text-sm font-medium">{t.dashboard.stats.profileCompletion}</div>
                <div className="font-heading text-3xl font-bold text-white mt-1">
                  100%
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="font-heading text-2xl sm:text-3xl font-bold text-[var(--primary)]">
            {t.dashboard.mentee}
          </h1>
          <p className="text-[var(--text-secondary)] mt-2">
            {t.dashboard.subtitleMentee}
          </p>
        </div>

        {/* Two-column layout: Sidebar + Content */}
        <div className="flex flex-col lg:flex-row gap-6 lg:gap-8">
          {/* Left Sidebar */}
          <div className="w-full lg:w-56 flex-shrink-0">
            <div className="bg-white border border-[var(--border)] lg:min-h-[400px] rounded-xl pt-3 sm:pt-6 px-2 sm:px-3">
              <nav className="flex gap-2 overflow-x-auto pb-1 lg:block lg:space-y-1 lg:overflow-visible lg:pb-0">
                <button
                  onClick={() => setActiveTab('browse')}
                  className={`flex-shrink-0 whitespace-nowrap lg:w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors ${
                    activeTab === 'browse'
                      ? 'bg-[#EEEDF8] text-[#1B2A72] font-semibold'
                      : 'text-[var(--text-secondary)] hover:bg-[#F5F5FB]'
                  }`}
                >
                  <Search className="w-5 h-5" />
                  {t.dashboard.sidebar.browseOpportunities}
                </button>
                <button
                  onClick={() => setActiveTab('applications')}
                  className={`flex-shrink-0 whitespace-nowrap lg:w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors ${
                    activeTab === 'applications'
                      ? 'bg-[#EEEDF8] text-[#1B2A72] font-semibold'
                      : 'text-[var(--text-secondary)] hover:bg-[#F5F5FB]'
                  }`}
                >
                  <FileText className="w-5 h-5" />
                  {t.dashboard.sidebar.myApplications}
                  {myApplications.length > 0 && (
                    <span className="ml-auto bg-[#EEEDF8] text-[#1B2A72] text-xs px-2 py-0.5 rounded-full font-medium">
                      {myApplications.length}
                    </span>
                  )}
                </button>
                <button
                  onClick={() => setActiveTab('projects')}
                  className={`flex-shrink-0 whitespace-nowrap lg:w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors ${
                    activeTab === 'projects'
                      ? 'bg-[#EEEDF8] text-[#1B2A72] font-semibold'
                      : 'text-[var(--text-secondary)] hover:bg-[#F5F5FB]'
                  }`}
                >
                  <FolderOpen className="w-5 h-5" />
                  {t.dashboard.sidebar.myProjects}
                  {myProjectRequests.filter(r => r.status === 'pending' || r.status === 'accepted').length > 0 && (
                    <span className="ml-auto bg-[#EEEDF8] text-[#1B2A72] text-xs px-2 py-0.5 rounded-full font-medium">
                      {myProjectRequests.filter(r => r.status === 'pending' || r.status === 'accepted').length}
                    </span>
                  )}
                </button>
              </nav>
            </div>
          </div>

          {/* Right Content Area */}
          <div className="flex-1 min-w-0">
            {/* Browse Tab Content */}
            {activeTab === 'browse' && (
              <>
                {opportunities.length > 0 ? (
                  <>
                    {/* Tag Filter */}
                    {allTags.length > 0 && (
                      <div className="flex gap-2 overflow-x-auto pb-2 mb-6 sm:flex-wrap sm:overflow-visible sm:pb-0">
                        <button
                          onClick={() => setSelectedTag(null)}
                          className={`flex-shrink-0 whitespace-nowrap px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                            selectedTag === null
                              ? 'bg-[var(--primary)] text-white'
                              : 'bg-hero text-[var(--primary)] hover:bg-[var(--border)]'
                          }`}
                        >
                          {t.dashboard.filter.all}
                        </button>
                        {allTags.map((tag) => (
                          <button
                            key={tag}
                            onClick={() => setSelectedTag(tag)}
                            className={`flex-shrink-0 whitespace-nowrap px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                              selectedTag === tag
                                ? 'bg-[var(--primary)] text-white'
                                : 'bg-hero text-[var(--primary)] hover:bg-[var(--border)]'
                            }`}
                          >
                            {tag}
                          </button>
                        ))}
                      </div>
                    )}

                    {/* Opportunities List */}
                    <div className="space-y-6">
                      {filteredOpportunities.map((opp) => (
                        <OpportunityCard
                          key={opp.id}
                          title={opp.title}
                          description={opp.description}
                          tags={opp.tags || []}
                          total_spots={opp.total_spots}
                          filled_spots={opp.filled_spots}
                          duration={opp.duration}
                          mentor_name={opp.mentor?.full_name}
                          mentor_institution={opp.mentor?.institution || undefined}
                          showApplyButton
                          isApplied={appliedIds.has(opp.id)}
                          isFull={opp.filled_spots >= opp.total_spots}
                          onApply={() => handleApply(opp)}
                        />
                      ))}
                    </div>

                    {filteredOpportunities.length === 0 && (
                      <div className="text-center py-12">
                        <p className="text-[var(--text-secondary)]">
                          {t.dashboard.filter.noMatches}
                        </p>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="text-center py-20 bg-white rounded-2xl border border-[var(--border)]">
                    <h3 className="font-heading text-xl font-semibold text-[var(--primary)] mb-2">
                      {t.dashboard.empty.noOpportunitiesAvailableTitle}
                    </h3>
                    <p className="text-[var(--text-secondary)]">
                      {t.dashboard.empty.noOpportunitiesAvailableDescription}
                    </p>
                  </div>
                )}
              </>
            )}

            {/* Applications Tab Content */}
            {activeTab === 'applications' && (
              <>
                {myApplications.length > 0 ? (
                  <div className="space-y-4">
                    {myApplications.map((app) => {
                      const opp = app.opportunity as {
                        title: string
                        tags: string[]
                        contact_email: string | null
                        contact_telegram: string | null
                        mentor: {
                          full_name: string
                          email: string | null
                          linkedin_url: string | null
                        } | null
                      } | null

                      const formatContactLink = (value: string) => {
                        const trimmed = value.trim()
                        if (!trimmed) return '#'
                        if (/^https?:\/\//i.test(trimmed)) return trimmed

                        const withoutAt = trimmed.startsWith('@') ? trimmed.slice(1) : trimmed
                        const looksLikeHandle = /^[a-zA-Z0-9_]{3,}$/.test(withoutAt)
                        if (looksLikeHandle) return `https://t.me/${withoutAt}`

                        const looksLikePhone = /^[+0-9][0-9\s()\-]{6,}$/.test(trimmed)
                        if (looksLikePhone) return `tel:${trimmed.replace(/\s+/g, '')}`

                        return '#'
                      }

                      // Status dot color mapping
                      const statusDotColor = {
                        pending: 'bg-amber-500',
                        viewed: 'bg-blue-500',
                        accepted: 'bg-green-600',
                        rejected: 'bg-red-600',
                      }[app.status] || 'bg-gray-400'

                      const statusLineColor = {
                        pending: 'border-l-amber-500',
                        viewed: 'border-l-blue-500',
                        accepted: 'border-l-green-600',
                        rejected: 'border-l-red-600',
                      }[app.status] || 'border-l-gray-400'

                      return (
                        <div
                          key={app.id}
                          className={`relative pl-8 border-l-4 ${statusLineColor}`}
                        >
                          {/* Status Timeline Dot */}
                          <div
                            className={`absolute -left-2 top-6 w-3 h-3 rounded-full ${statusDotColor} ${
                              app.status === 'pending' ? 'animate-pulse-badge' : ''
                            }`}
                          />

                          <Card className="bg-white border border-[var(--border)] rounded-2xl shadow-card">
                            <CardContent className="p-6">
                              <div className="flex justify-between items-start mb-4">
                                <div>
                                  <h3 className="font-heading font-semibold text-lg text-[var(--primary)]">
                                    {opp?.title}
                                  </h3>
                                  {opp?.mentor && (
                                    <p className="text-[var(--text-secondary)] text-sm">
                                      {t.dashboard.status.mentor}: {opp.mentor.full_name}
                                    </p>
                                  )}
                                </div>
                                <StatusBadge status={app.status} />
                              </div>

                              <p className="text-[var(--text-muted)] text-sm mb-4">
                                {t.dashboard.status.submitted}:{' '}
                                {format(new Date(app.created_at), 'MMMM d, yyyy')}
                              </p>

                              {app.status === 'viewed' && (
                                <p className="text-blue-600 text-sm mb-4">
                                  {t.dashboard.dialogs.mentorViewed}
                                </p>
                              )}

                              {app.status === 'accepted' && opp?.mentor && (
                                <div className="bg-green-50 border border-green-200 rounded-lg px-4 py-3 mb-4">
                                  <p className="text-green-700 text-sm font-medium mb-1">
                                    {t.dashboard.dialogs.acceptedCongrats}
                                  </p>
                                  <p className="text-green-700 text-sm mb-2">
                                    {t.dashboard.status.contactYourMentor}
                                  </p>
                                  <div className="space-y-1">
                                    {(opp.contact_email || opp.mentor.email) && (
                                      <a
                                        href={`mailto:${opp.contact_email || opp.mentor.email}`}
                                        className="inline-flex items-center gap-2 text-sm text-[var(--accent)] hover:underline min-w-0"
                                      >
                                        <Mail className="w-4 h-4" />
                                        <span className="min-w-0 break-all sm:break-normal">
                                          {t.dashboard.status.email}: {opp.contact_email || opp.mentor.email}
                                        </span>
                                      </a>
                                    )}

                                    {opp.contact_telegram && (
                                      <a
                                        href={formatContactLink(opp.contact_telegram)}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-2 text-sm text-[var(--accent)] hover:underline min-w-0"
                                      >
                                        <Send className="w-4 h-4" />
                                        <span className="min-w-0 break-all sm:break-normal">
                                          {t.dashboard.status.telegram}: {opp.contact_telegram}
                                        </span>
                                        <ExternalLink className="w-3 h-3" />
                                      </a>
                                    )}

                                    {opp.mentor.linkedin_url && (
                                      <a
                                        href={opp.mentor.linkedin_url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-2 text-sm text-[var(--accent)] hover:underline min-w-0"
                                      >
                                        <Linkedin className="w-4 h-4" />
                                        <span className="min-w-0 break-all sm:break-normal">
                                          {t.dashboard.status.linkedin}: {opp.mentor.linkedin_url}
                                        </span>
                                        <ExternalLink className="w-3 h-3" />
                                      </a>
                                    )}
                                  </div>
                                </div>
                              )}

                              <div className="bg-hero rounded-lg p-4">
                                <Label className="text-xs text-[var(--text-muted)] mb-2 block">
                                  {t.dashboard.dialogs.yourMotivation}
                                </Label>
                                <p className="text-[var(--text-secondary)] text-sm">
                                  {app.motivation_text}
                                </p>
                              </div>

                              {opp?.tags && opp.tags.length > 0 && (
                                <div className="flex flex-wrap gap-2 mt-4">
                                  {opp.tags.map((tag, i) => (
                                    <span key={i} className="tag-pill">
                                      {tag}
                                    </span>
                                  ))}
                                </div>
                              )}
                            </CardContent>
                          </Card>
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <div className="text-center py-20 bg-white rounded-2xl border border-[var(--border)]">
                    <h3 className="font-heading text-xl font-semibold text-[var(--primary)] mb-2">
                      {t.dashboard.empty.noApplicationsYetTitle}
                    </h3>
                    <p className="text-[var(--text-secondary)] mb-6">
                      {t.dashboard.empty.noApplicationsYetDescriptionMentee}
                    </p>
                    <Button
                      onClick={() => setActiveTab('browse')}
                      className="bg-[var(--primary)] hover:bg-[var(--primary-light)] text-white rounded-lg"
                    >
                      {t.dashboard.actions.browseOpportunities}
                    </Button>
                  </div>
                )}
              </>
            )}

            {/* My Projects Tab Content */}
            {activeTab === 'projects' && (
              <>
                {myProjectRequests.length > 0 ? (
                  <div className="space-y-4">
                    {myProjectRequests.map((request) => {
                      const project = request.project

                      const statusDotColor = {
                        pending: 'bg-amber-500',
                        accepted: 'bg-green-600',
                        rejected: 'bg-red-600',
                      }[request.status] || 'bg-gray-400'

                      const statusLineColor = {
                        pending: 'border-l-amber-500',
                        accepted: 'border-l-green-600',
                        rejected: 'border-l-red-600',
                      }[request.status] || 'border-l-gray-400'

                      const formatTelegramLink = (telegram: string) => {
                        const username = telegram.startsWith('@') ? telegram.slice(1) : telegram
                        return `https://t.me/${username}`
                      }

                      return (
                        <div
                          key={request.id}
                          className={`relative pl-8 border-l-4 ${statusLineColor}`}
                        >
                          {/* Status Timeline Dot */}
                          <div
                            className={`absolute -left-2 top-6 w-3 h-3 rounded-full ${statusDotColor} ${
                              request.status === 'pending' ? 'animate-pulse-badge' : ''
                            }`}
                          />

                          <Card className="bg-white border border-[var(--border)] rounded-2xl shadow-card">
                            <CardContent className="p-6">
                              <div className="flex justify-between items-start mb-4">
                                <div>
                                  <h3 className="font-heading font-semibold text-lg text-[var(--primary)]">
                                    {project?.title}
                                  </h3>
                                </div>
                                <StatusBadge status={request.status} />
                              </div>

                              <p className="text-[var(--text-muted)] text-sm mb-4">
                                {t.dashboard.status.submitted}:{' '}
                                {format(new Date(request.created_at), 'MMMM d, yyyy')}
                              </p>

                              {request.status === 'accepted' && project && (
                                <div className="bg-green-50 border border-green-200 rounded-lg px-4 py-3 mb-4">
                                  <p className="text-green-700 text-sm font-medium mb-1">
                                    {t.dashboard.dialogs.acceptedProject}
                                  </p>
                                  <p className="text-green-700 text-sm mb-2">
                                    {t.dashboard.status.contactProjectCreator}
                                  </p>
                                  <div className="space-y-1">
                                    {project.creator && (
                                      <p className="text-sm text-green-800 font-medium">
                                        {project.creator.full_name}
                                      </p>
                                    )}
                                    {project.contact_email && (
                                      <a
                                        href={`mailto:${project.contact_email}`}
                                        className="inline-flex items-center gap-2 text-sm text-[var(--accent)] hover:underline min-w-0"
                                      >
                                        <Mail className="w-4 h-4" />
                                        <span className="min-w-0 break-all sm:break-normal">
                                          {project.contact_email}
                                        </span>
                                      </a>
                                    )}
                                    {project.contact_telegram && (
                                      <a
                                        href={formatTelegramLink(project.contact_telegram)}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-2 text-sm text-[var(--accent)] hover:underline min-w-0"
                                      >
                                        <Send className="w-4 h-4" />
                                        <span className="min-w-0 break-all sm:break-normal">
                                          {t.dashboard.status.telegram}: {project.contact_telegram}
                                        </span>
                                        <ExternalLink className="w-3 h-3" />
                                      </a>
                                    )}
                                  </div>
                                </div>
                              )}

                              {request.status === 'pending' && (
                                <p className="text-amber-600 text-sm mb-4">
                                  {t.dashboard.dialogs.waitingCreator}
                                </p>
                              )}

                              {request.status === 'rejected' && (
                                <p className="text-red-600 text-sm mb-4">
                                  {t.dashboard.dialogs.rejectedRequest}
                                </p>
                              )}

                              {request.message && (
                                <div className="bg-hero rounded-lg p-4">
                                  <Label className="text-xs text-[var(--text-muted)] mb-2 block">
                                    {t.dashboard.dialogs.yourMessage}
                                  </Label>
                                  <p className="text-[var(--text-secondary)] text-sm">
                                    {request.message}
                                  </p>
                                </div>
                              )}

                              {project?.tags && project.tags.length > 0 && (
                                <div className="flex flex-wrap gap-2 mt-4">
                                  {project.tags.map((tag, i) => (
                                    <span key={i} className="tag-pill">
                                      {tag}
                                    </span>
                                  ))}
                                </div>
                              )}
                            </CardContent>
                          </Card>
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <div className="text-center py-20 bg-white rounded-2xl border border-[var(--border)]">
                    <h3 className="font-heading text-xl font-semibold text-[var(--primary)] mb-2">
                      {t.dashboard.empty.noProjectRequestsYetTitle}
                    </h3>
                    <p className="text-[var(--text-secondary)] mb-6">
                      {t.dashboard.empty.noProjectRequestsYetDescription}
                    </p>
                    <Button
                      onClick={() => router.push('/projects')}
                      className="bg-[var(--primary)] hover:bg-[var(--primary-light)] text-white rounded-lg"
                    >
                      {t.dashboard.actions.browseOpenProjects}
                    </Button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        <div className="mt-10 flex justify-end">
          <Dialog
            open={isDeleteDialogOpen}
            onOpenChange={(open) => {
              if (isDeleting) return
              setIsDeleteDialogOpen(open)
              if (!open) setConfirmText('')
            }}
          >
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsDeleteDialogOpen(true)}
              className="border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
            >
              {t.dashboard.deleteAccount.button}
            </Button>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle className="font-heading">{t.dashboard.deleteAccount.title}</DialogTitle>
                <DialogDescription className="text-[var(--text-secondary)]">
                  {t.dashboard.deleteAccount.description}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 pt-2">
                <div className="space-y-2">
                  <Label htmlFor="delete-confirm-mentee">{t.dashboard.deleteAccount.typeDeleteToConfirm}</Label>
                  <Input
                    id="delete-confirm-mentee"
                    value={confirmText}
                    onChange={(e) => setConfirmText(e.target.value)}
                    placeholder="DELETE"
                    disabled={isDeleting}
                    className="border-[1.5px] border-[var(--border)] rounded-lg"
                  />
                </div>
                <div className="flex justify-end gap-3">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setIsDeleteDialogOpen(false)
                      setConfirmText('')
                    }}
                    disabled={isDeleting}
                  >
                    {t.common.cancel}
                  </Button>
                  <Button
                    onClick={handleDeleteAccount}
                    disabled={isDeleting || confirmText !== 'DELETE'}
                    className="bg-red-600 hover:bg-red-700 text-white"
                  >
                    {isDeleting ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        {t.dashboard.deleteAccount.deleting}
                      </>
                    ) : (
                      t.dashboard.deleteAccount.deleteMyAccount
                    )}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Application Dialog */}
      <Dialog
        open={!!selectedOpp}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedOpp(null)
            setCvFile(null)
            setCvError('')
          }
        }}
      >
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-heading">
              {t.dashboard.dialogs.applyTo}: {selectedOpp?.title}
            </DialogTitle>
            <DialogDescription className="text-[var(--text-secondary)]">
              {t.dashboard.status.mentor}: {selectedOpp?.mentor?.full_name}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 pt-4">
            <div className="bg-hero rounded-lg p-4 max-h-40 overflow-y-auto">
              <p className="text-sm text-[var(--text-secondary)]">
                {selectedOpp?.description}
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="motivation">
                {t.dashboard.dialogs.whyJoin}
              </Label>
              <Textarea
                id="motivation"
                value={motivationText}
                onChange={(e) => setMotivationText(e.target.value)}
                placeholder={t.dashboard.dialogs.motivationPlaceholder}
                rows={6}
                className="border-[1.5px] border-[var(--border)] rounded-lg"
              />
              <p
                className={`text-sm ${
                  motivationText.length >= 100
                    ? 'text-green-600'
                    : 'text-red-500'
                }`}
              >
                {motivationText.length} {t.dashboard.dialogs.characters}
                {motivationText.length < 100 && ` (${t.dashboard.dialogs.minimum100})`}
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="cvFile">{t.dashboard.dialogs.attachCvOptional}</Label>
              <input
                id="cvFile"
                type="file"
                accept=".pdf,.doc,.docx"
                onChange={handleCvChange}
                className="block w-full text-sm text-[var(--text-secondary)] file:mr-4 file:rounded-lg file:border file:border-[var(--border)] file:bg-white file:px-3 file:py-2 file:text-sm file:font-medium file:text-[var(--primary)] hover:file:bg-hero"
              />
              {cvFile && (
                <p className="text-sm text-[var(--text-secondary)]">
                  {t.dashboard.dialogs.selectedFile} {cvFile.name}
                </p>
              )}
              {cvError && (
                <p className="text-sm text-red-600">{cvError}</p>
              )}
            </div>

            <div className="flex gap-3 justify-end">
              <Button
                variant="outline"
                onClick={() => setSelectedOpp(null)}
                className="border-[var(--border)]"
              >
                {t.common.cancel}
              </Button>
              <Button
                onClick={handleSubmitApplication}
                disabled={isSubmitting || motivationText.length < 100}
                className="bg-[var(--primary)] hover:bg-[var(--primary-light)] text-white rounded-lg"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    {t.dashboard.actions.submitting}
                  </>
                ) : (
                  t.dashboard.actions.submitApplication
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
