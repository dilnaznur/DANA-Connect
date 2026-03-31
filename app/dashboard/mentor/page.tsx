'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { DashboardNav } from '@/components/DashboardNav'
import { ApplicationCard } from '@/components/ApplicationCard'
import { TagInput } from '@/components/TagInput'
import { OpportunityCardSkeleton } from '@/components/LoadingSkeleton'
import { OpportunityCard } from '@/components/OpportunityCard'
import { StatusBadge } from '@/components/StatusBadge'
import { useLanguage } from '@/lib/i18n/LanguageContext'
import { translations } from '@/lib/i18n/translations'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { Profile, ResearchOpportunity, Application } from '@/lib/types'
import { Plus, Loader2, Beaker, Mail, Briefcase, FileText, FolderOpen, Search, Linkedin, ExternalLink } from 'lucide-react'
import { format } from 'date-fns'

const DURATION_OPTIONS = [
  '1 month',
  '3 months',
  '6 months',
  '12 months',
  'Ongoing',
  'Custom',
]

export default function MentorDashboard() {
  const router = useRouter()
  const supabase = createClient()
  const { language } = useLanguage()
  const t = translations[language]

  const [profile, setProfile] = useState<Profile | null>(null)
  const [opportunities, setOpportunities] = useState<ResearchOpportunity[]>([])
  const [applications, setApplications] = useState<Application[]>([])
  const [otherOpportunities, setOtherOpportunities] = useState<ResearchOpportunity[]>([])
  const [myApplications, setMyApplications] = useState<Application[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('opportunities')

  // Apply dialog state (copied from mentee dashboard)
  const [selectedOpp, setSelectedOpp] = useState<ResearchOpportunity | null>(null)
  const [motivationText, setMotivationText] = useState('')
  const [cvFile, setCvFile] = useState<File | null>(null)
  const [cvError, setCvError] = useState('')
  const [isSubmittingApplication, setIsSubmittingApplication] = useState(false)

  // Post opportunity dialog state
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [confirmText, setConfirmText] = useState('')
  const [isDeleting, setIsDeleting] = useState(false)
  const [newOpp, setNewOpp] = useState({
    title: '',
    description: '',
    tags: [] as string[],
    total_spots: 2,
    duration: '',
    customDuration: '',
  })

  const appliedIds = useMemo(
    () => new Set(myApplications.map((a) => a.opportunity_id)),
    [myApplications]
  )

  const fetchProfile = useCallback(async (userId: string) => {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()
    setProfile(data)
  }, [supabase])

  const fetchOpportunities = useCallback(async (userId: string) => {
    const { data } = await supabase
      .from('research_opportunities')
      .select('*')
      .eq('mentor_id', userId)
      .order('created_at', { ascending: false })
    setOpportunities(data || [])
  }, [supabase])

  const fetchOtherOpportunities = useCallback(async (userId: string) => {
    const { data } = await supabase
      .from('research_opportunities')
      .select('*, mentor:profiles(full_name, institution)')
      .eq('is_open', true)
      .neq('mentor_id', userId)
      .order('created_at', { ascending: false })
    setOtherOpportunities((data as unknown as ResearchOpportunity[]) || [])
  }, [supabase])

  const fetchMyApplications = useCallback(async (userId: string) => {
    const { data } = await supabase
      .from('applications')
      .select(`
        *,
        opportunity:research_opportunities(title, tags, mentor:profiles(full_name, email, linkedin_url))
      `)
      .eq('mentee_id', userId)
      .order('created_at', { ascending: false })
    setMyApplications(data || [])
  }, [supabase])

  const fetchApplications = useCallback(async (oppIds: string[]) => {
    if (oppIds.length === 0) {
      setApplications([])
      return
    }
    const { data } = await supabase
      .from('applications')
      .select(`
        *,
        mentee:profiles(full_name, email, institution, specialization, linkedin_url),
        opportunity:research_opportunities(title, tags)
      `)
      .in('opportunity_id', oppIds)
      .order('created_at', { ascending: false })
    setApplications(data || [])
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
        fetchOpportunities(user.id),
        fetchOtherOpportunities(user.id),
        fetchMyApplications(user.id),
      ])
      setIsLoading(false)
    }
    init()
  }, [supabase, router, fetchProfile, fetchOpportunities, fetchOtherOpportunities, fetchMyApplications])

  useEffect(() => {
    if (opportunities.length > 0) {
      fetchApplications(opportunities.map((o) => o.id))
    }
  }, [opportunities, fetchApplications])

  const handleApply = (opp: ResearchOpportunity) => {
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

    setIsSubmittingApplication(true)

    let cvPath: string | null = null

    if (cvFile) {
      const fileExt = cvFile.name.split('.').pop()?.toLowerCase()
      if (!fileExt) {
        toast.error(t.dashboard.toasts.invalidCvFileFormat)
        setIsSubmittingApplication(false)
        return
      }

      const filePath = `${profile.id}/${selectedOpp.id}.${fileExt}`
      const { error: uploadError } = await supabase.storage
        .from('cvs')
        .upload(filePath, cvFile, { upsert: true })

      if (uploadError) {
        toast.error(uploadError.message)
        setIsSubmittingApplication(false)
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

    setIsSubmittingApplication(false)
  }

  // Mark pending applications as viewed when Applications tab is opened
  useEffect(() => {
    const markAsViewed = async () => {
      if (activeTab !== 'applications' || opportunities.length === 0) return

      const pendingApps = applications.filter(
        (app) => app.status === 'pending'
      )
      if (pendingApps.length === 0) return

      await supabase
        .from('applications')
        .update({ status: 'viewed' })
        .eq('status', 'pending')
        .in(
          'opportunity_id',
          opportunities.map((o) => o.id)
        )

      // Refetch applications
      fetchApplications(opportunities.map((o) => o.id))
    }
    markAsViewed()
  }, [activeTab, opportunities, applications, supabase, fetchApplications])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/')
  }

  const handleToggleOpen = async (opp: ResearchOpportunity) => {
    const { error } = await supabase
      .from('research_opportunities')
      .update({ is_open: !opp.is_open })
      .eq('id', opp.id)

    if (!error) {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (user) fetchOpportunities(user.id)
      toast.success(
        opp.is_open ? t.dashboard.toasts.opportunityClosed : t.dashboard.toasts.opportunityOpened
      )
    }
  }

  const handlePostOpportunity = async () => {
    if (!profile) return

    const finalDuration =
      newOpp.duration === 'Custom' ? newOpp.customDuration : newOpp.duration

    if (!newOpp.title.trim() || !newOpp.description.trim()) {
      toast.error(t.dashboard.toasts.titleAndDescriptionRequired)
      return
    }

    setIsSubmitting(true)

    const { error } = await supabase.from('research_opportunities').insert({
      mentor_id: profile.id,
      title: newOpp.title.trim(),
      description: newOpp.description.trim(),
      tags: newOpp.tags,
      total_spots: newOpp.total_spots,
      duration: finalDuration || null,
      is_open: true,
      filled_spots: 0,
    })

    if (error) {
      toast.error(error.message)
    } else {
      toast.success(t.dashboard.toasts.opportunityPublished)
      setIsDialogOpen(false)
      setNewOpp({
        title: '',
        description: '',
        tags: [],
        total_spots: 2,
        duration: '',
        customDuration: '',
      })
      fetchOpportunities(profile.id)
    }

    setIsSubmitting(false)
  }

  const handleAcceptApplication = async (app: Application) => {
    const { error } = await supabase
      .from('applications')
      .update({ status: 'accepted' })
      .eq('id', app.id)

    if (error) {
      toast.error(error.message)
      return
    }

    // Increment filled_spots
    const opportunity = opportunities.find((o) => o.id === app.opportunity_id)
    if (opportunity) {
      const newFilledSpots = opportunity.filled_spots + 1
      const updates: { filled_spots: number; is_open?: boolean } = {
        filled_spots: newFilledSpots,
      }
      if (newFilledSpots >= opportunity.total_spots) {
        updates.is_open = false
      }
      await supabase
        .from('research_opportunities')
        .update(updates)
        .eq('id', app.opportunity_id)
    }

    if (profile && app.mentee?.email && app.mentee?.full_name && app.opportunity?.title) {
      try {
        const response = await fetch('/api/notify-accepted', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            menteeEmail: app.mentee.email,
            menteeName: app.mentee.full_name,
            mentorName: profile.full_name,
            mentorEmail: profile.email,
            mentorLinkedin: profile.linkedin_url,
            opportunityTitle: app.opportunity.title,
          }),
        })

        if (!response.ok) {
          toast.error(t.dashboard.toasts.acceptedButEmailFailed)
        }
      } catch {
        toast.error(t.dashboard.toasts.acceptedButEmailFailed)
      }
    }

    toast.success(t.dashboard.toasts.applicationAccepted)
    if (profile) {
      fetchOpportunities(profile.id)
    }
    fetchApplications(opportunities.map((o) => o.id))
  }

  const handleRejectApplication = async (app: Application) => {
    const { error } = await supabase
      .from('applications')
      .update({ status: 'rejected' })
      .eq('id', app.id)

    if (!error) {
      toast.success(t.dashboard.toasts.applicationRejected)
      fetchApplications(opportunities.map((o) => o.id))
    }
  }

  const handleViewCv = async (cvPath: string) => {
    // Backward compatibility: if old rows still contain full public URL, extract path after /cvs/.
    const normalizedPath = cvPath.includes('/cvs/')
      ? cvPath.split('/cvs/')[1]
      : cvPath

    if (!normalizedPath) {
      toast.error(t.dashboard.toasts.invalidCvPath)
      return
    }

    const { data, error } = await supabase.storage
      .from('cvs')
      .createSignedUrl(normalizedPath, 60)

    if (error || !data?.signedUrl) {
      toast.error(error?.message || t.dashboard.toasts.failedToOpenCv)
      return
    }

    window.open(data.signedUrl, '_blank')
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

  const pendingCount = applications.filter((a) => a.status === 'pending').length

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
              {t.auth.welcomeBack}, {profile.full_name.split(' ')[0]} ✨
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-white/10 rounded-lg px-4 py-3 backdrop-blur-sm">
                <div className="text-white/70 text-sm font-medium">{t.dashboard.stats.opportunities}</div>
                <div className="font-heading text-3xl font-bold text-white mt-1">
                  {opportunities.length}
                </div>
              </div>
              <div className="bg-white/10 rounded-lg px-4 py-3 backdrop-blur-sm">
                <div className="text-white/70 text-sm font-medium">{t.dashboard.stats.applications}</div>
                <div className="font-heading text-3xl font-bold text-white mt-1">
                  {applications.length}
                </div>
              </div>
              <div className="bg-white/10 rounded-lg px-4 py-3 backdrop-blur-sm">
                <div className="text-white/70 text-sm font-medium">{t.dashboard.stats.pending}</div>
                <div className="font-heading text-3xl font-bold text-white mt-1">
                  {pendingCount}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="font-heading text-2xl sm:text-3xl font-bold text-[var(--primary)]">
            {t.dashboard.mentor}
          </h1>
          <p className="text-[var(--text-secondary)] mt-2">
            {t.dashboard.subtitleMentor}
          </p>
        </div>

        {/* Two-column layout: Sidebar + Content */}
        <div className="flex flex-col lg:flex-row gap-6 lg:gap-8">
          {/* Left Sidebar */}
          <div className="w-full lg:w-56 flex-shrink-0">
            <div className="bg-white border border-[var(--border)] lg:min-h-[400px] rounded-xl pt-3 sm:pt-6 px-2 sm:px-3">
              <nav className="flex gap-2 overflow-x-auto pb-1 lg:block lg:space-y-1 lg:overflow-visible lg:pb-0">
                <button
                  onClick={() => setActiveTab('browse-apply')}
                  className={`flex-shrink-0 whitespace-nowrap lg:w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors ${
                    activeTab === 'browse-apply'
                      ? 'bg-[#EEEDF8] text-[#1B2A72] font-semibold'
                      : 'text-[var(--text-secondary)] hover:bg-[#F5F5FB]'
                  }`}
                >
                  <Search className="w-5 h-5" />
                  {t.dashboard.sidebar.browseAndApply}
                </button>
                <button
                  onClick={() => setActiveTab('opportunities')}
                  className={`flex-shrink-0 whitespace-nowrap lg:w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors ${
                    activeTab === 'opportunities'
                      ? 'bg-[#EEEDF8] text-[#1B2A72] font-semibold'
                      : 'text-[var(--text-secondary)] hover:bg-[#F5F5FB]'
                  }`}
                >
                  <Briefcase className="w-5 h-5" />
                  {t.dashboard.sidebar.myOpportunities}
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
                  {t.dashboard.sidebar.applications}
                  {pendingCount > 0 && (
                    <span className="ml-auto bg-amber-100 text-amber-700 text-xs px-2 py-0.5 rounded-full font-medium">
                      {pendingCount}
                    </span>
                  )}
                </button>
                <Link
                  href="/projects"
                  className="flex-shrink-0 whitespace-nowrap lg:w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors text-[var(--text-secondary)] hover:bg-[#F5F5FB]"
                >
                  <FolderOpen className="w-5 h-5" />
                  {t.dashboard.sidebar.myProjects}
                </Link>
              </nav>
            </div>
          </div>

          {/* Right Content Area */}
          <div className="flex-1 min-w-0">
            {/* Browse & Apply Tab Content */}
            {activeTab === 'browse-apply' && (
              <div className="space-y-10">
                <div>
                  <h2 className="font-heading text-xl font-semibold text-[var(--primary)] mb-6">
                    {t.dashboard.sidebar.browseOpportunities}
                  </h2>

                  {otherOpportunities.length > 0 ? (
                    <div className="space-y-4">
                      {otherOpportunities.map((opp) => (
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
                </div>

                <div>
                  <h2 className="font-heading text-xl font-semibold text-[var(--primary)] mb-6">
                    {t.dashboard.sidebar.myApplications}
                  </h2>

                  {myApplications.length > 0 ? (
                    <div className="space-y-4">
                      {myApplications.map((app) => {
                        const opp = app.opportunity as {
                          title: string
                          tags: string[]
                          mentor: {
                            full_name: string
                            email: string | null
                            linkedin_url: string | null
                          } | null
                        } | null

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
                          <div key={app.id} className={`relative pl-8 border-l-4 ${statusLineColor}`}>
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
                                  <p className="text-blue-600 text-sm mb-4">{t.dashboard.dialogs.mentorViewed}</p>
                                )}

                                {app.status === 'accepted' && opp?.mentor && (
                                  <div className="bg-green-50 border border-green-200 rounded-lg px-4 py-3 mb-4">
                                    <p className="text-green-700 text-sm font-medium mb-1">
                                      {t.dashboard.dialogs.acceptedCongrats}
                                    </p>
                                    <p className="text-green-700 text-sm mb-2">{t.dashboard.status.contactYourMentor}</p>
                                    <div className="space-y-1">
                                      {opp.mentor.email && (
                                        <a
                                          href={`mailto:${opp.mentor.email}`}
                                          className="inline-flex items-center gap-2 text-sm text-[var(--accent)] hover:underline min-w-0"
                                        >
                                          <Mail className="w-4 h-4" />
                                          <span className="min-w-0 break-all sm:break-normal">
                                            {t.dashboard.status.email}: {opp.mentor.email}
                                          </span>
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
                                  <p className="text-[var(--text-secondary)] text-sm">{app.motivation_text}</p>
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
                      <p className="text-[var(--text-secondary)]">{t.dashboard.empty.noApplicationsYetDescriptionMentee}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Opportunities Tab Content */}
            {activeTab === 'opportunities' && (
              <>
                <div className="flex justify-between items-center mb-6">
                  <h2 className="font-heading text-xl font-semibold text-[var(--primary)]">
                    {t.dashboard.sections.researchOpportunities}
                  </h2>
                  <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogTrigger
                      render={
                        <Button className="bg-[var(--primary)] hover:bg-[var(--primary-light)] text-white rounded-lg">
                          <Plus className="w-4 h-4 mr-2" />
                          {t.dashboard.actions.postNewOpportunity}
                        </Button>
                      }
                    />
                    <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle className="font-heading">
                          {t.dashboard.actions.postNewOpportunity}
                        </DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4 pt-4">
                        <div className="space-y-2">
                          <Label htmlFor="title">Title *</Label>
                          <Input
                            id="title"
                            value={newOpp.title}
                            onChange={(e) =>
                              setNewOpp({ ...newOpp, title: e.target.value })
                            }
                            placeholder="e.g., Machine Learning Research Assistant"
                            className="border-[1.5px] border-[var(--border)] rounded-lg"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="description">Description *</Label>
                          <Textarea
                            id="description"
                            value={newOpp.description}
                            onChange={(e) =>
                              setNewOpp({ ...newOpp, description: e.target.value })
                            }
                            placeholder="Describe the research opportunity, responsibilities, and requirements..."
                            rows={5}
                            className="border-[1.5px] border-[var(--border)] rounded-lg"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Tags</Label>
                          <TagInput
                            value={newOpp.tags}
                            onChange={(tags) => setNewOpp({ ...newOpp, tags })}
                            placeholder="Add tags (e.g., AI, Bioinformatics)"
                          />
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="spots">Total Spots</Label>
                            <Input
                              id="spots"
                              type="number"
                              min={1}
                              value={newOpp.total_spots}
                              onChange={(e) =>
                                setNewOpp({
                                  ...newOpp,
                                  total_spots: parseInt(e.target.value) || 1,
                                })
                              }
                              className="border-[1.5px] border-[var(--border)] rounded-lg"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Duration</Label>
                            <Select
                              value={newOpp.duration}
                              onValueChange={(value) =>
                                setNewOpp({ ...newOpp, duration: value || '' })
                              }
                            >
                              <SelectTrigger className="border-[1.5px] border-[var(--border)] rounded-lg">
                                <SelectValue placeholder="Select duration" />
                              </SelectTrigger>
                              <SelectContent>
                                {DURATION_OPTIONS.map((opt) => (
                                  <SelectItem key={opt} value={opt}>
                                    {opt}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                        {newOpp.duration === 'Custom' && (
                          <div className="space-y-2">
                            <Label htmlFor="customDuration">Custom Duration</Label>
                            <Input
                              id="customDuration"
                              value={newOpp.customDuration}
                              onChange={(e) =>
                                setNewOpp({
                                  ...newOpp,
                                  customDuration: e.target.value,
                                })
                              }
                              placeholder="e.g., 2 weeks, Summer semester"
                              className="border-[1.5px] border-[var(--border)] rounded-lg"
                            />
                          </div>
                        )}
                        <Button
                          onClick={handlePostOpportunity}
                          disabled={isSubmitting}
                          className="w-full bg-[var(--primary)] hover:bg-[var(--primary-light)] text-white rounded-lg"
                        >
                          {isSubmitting ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              {t.dashboard.actions.publishing}
                            </>
                          ) : (
                            t.dashboard.actions.publishOpportunity
                          )}
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>

                {opportunities.length > 0 ? (
                  <div className="space-y-4">
                    {opportunities.map((opp) => (
                      <Card
                        key={opp.id}
                        className="bg-white border border-[var(--border)] rounded-2xl shadow-card"
                      >
                        <CardContent className="p-6">
                          <div className="flex gap-4">
                            <div className="flex-shrink-0">
                              <div className="w-12 h-12 rounded-xl bg-[var(--primary)] flex items-center justify-center">
                                <Beaker className="w-6 h-6 text-white" />
                              </div>
                            </div>
                            <div className="flex-1">
                              <div className="flex justify-between items-start mb-2">
                                <h3 className="font-heading font-semibold text-xl text-[var(--primary)]">
                                  {opp.title}
                                </h3>
                                <div className="flex items-center gap-3">
                                  <Badge
                                    variant={opp.is_open ? 'default' : 'secondary'}
                                    className={
                                      opp.is_open
                                        ? 'bg-green-100 text-green-700'
                                        : 'bg-gray-100 text-gray-600'
                                    }
                                  >
                                    {opp.is_open ? t.dashboard.status.open : t.dashboard.status.closed}
                                  </Badge>
                                  <div className="flex items-center gap-2">
                                    <span className="text-sm text-[var(--text-muted)]">
                                      {opp.is_open ? t.dashboard.status.closeAction : t.dashboard.status.openAction}
                                    </span>
                                    <Switch
                                      checked={opp.is_open}
                                      onCheckedChange={() => handleToggleOpen(opp)}
                                    />
                                  </div>
                                </div>
                              </div>
                              <p className="text-[var(--text-secondary)] text-sm mb-3">
                                {opp.description}
                              </p>
                              <div className="flex flex-wrap items-center gap-4 mb-3">
                                <span className="text-sm text-[var(--text-muted)]">
                                  {opp.filled_spots} / {opp.total_spots} {t.dashboard.status.spotsFilled}
                                </span>
                                {opp.duration && (
                                  <span className="text-sm text-[var(--text-muted)]">
                                    {t.dashboard.status.duration}: {opp.duration}
                                  </span>
                                )}
                              </div>
                              {opp.tags && opp.tags.length > 0 && (
                                <div className="flex flex-wrap gap-2">
                                  {opp.tags.map((tag, i) => (
                                    <span key={i} className="tag-pill">
                                      {tag}
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-20 bg-white rounded-2xl border border-[var(--border)]">
                    <h3 className="font-heading text-xl font-semibold text-[var(--primary)] mb-2">
                      {t.dashboard.empty.noOpportunitiesYetTitle}
                    </h3>
                    <p className="text-[var(--text-secondary)] mb-6">
                      {t.dashboard.empty.noOpportunitiesYetDescription}
                    </p>
                    <Button
                      onClick={() => setIsDialogOpen(true)}
                      className="bg-[var(--primary)] hover:bg-[var(--primary-light)] text-white rounded-lg"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      {t.dashboard.actions.postYourFirstOpportunity}
                    </Button>
                  </div>
                )}
              </>
            )}

            {/* Applications Tab Content */}
            {activeTab === 'applications' && (
              <>
                <h2 className="font-heading text-xl font-semibold text-[var(--primary)] mb-6">
                  {t.dashboard.sections.applicationsByOpportunity}
                </h2>

                {applications.length > 0 ? (
                  <div className="space-y-8">
                    {opportunities.map((opp) => {
                      const oppApplications = applications.filter((app) => app.opportunity_id === opp.id)
                      if (oppApplications.length === 0) return null

                      return (
                        <div key={opp.id}>
                          <div className="flex items-center gap-4 mb-6 pb-4 border-b-2 border-[var(--border)]">
                            <h3 className="font-heading text-xl font-bold text-[var(--primary)]">
                              {opp.title}
                            </h3>
                            <span className="text-sm bg-[var(--bg-hero)] text-[var(--text-secondary)] px-3 py-1 rounded-full font-medium">
                              {oppApplications.length} application{oppApplications.length !== 1 ? 's' : ''}
                            </span>
                          </div>
                          <div className="space-y-3">
                            {oppApplications.map((app) => (
                              <ApplicationCard
                                key={app.id}
                                application={app}
                                showMenteeContact
                                showActions
                                onViewCv={handleViewCv}
                                onAccept={() => handleAcceptApplication(app)}
                                onReject={() => handleRejectApplication(app)}
                              />
                            ))}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <div className="empty-state bg-white rounded-2xl border border-[var(--border)]">
                    <div className="empty-state-icon">
                      <Mail className="w-16 h-16 mx-auto" />
                    </div>
                    <h3 className="empty-state-heading">{t.dashboard.empty.noApplicationsYetTitle}</h3>
                    <p className="empty-state-text">
                      {t.dashboard.empty.noApplicationsYetDescriptionMentor}
                    </p>
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
            <DialogTrigger
              render={
                <Button
                  variant="outline"
                  size="sm"
                  className="border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
                >
                  {t.dashboard.deleteAccount.button}
                </Button>
              }
            />
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle className="font-heading">{t.dashboard.deleteAccount.title}</DialogTitle>
                <DialogDescription className="text-[var(--text-secondary)]">
                  {t.dashboard.deleteAccount.description}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 pt-2">
                <div className="space-y-2">
                  <Label htmlFor="delete-confirm-mentor">{t.dashboard.deleteAccount.typeDeleteToConfirm}</Label>
                  <Input
                    id="delete-confirm-mentor"
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
              <p className="text-sm text-[var(--text-secondary)]">{selectedOpp?.description}</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="motivation">{t.dashboard.dialogs.whyJoin}</Label>
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
                  motivationText.length >= 100 ? 'text-green-600' : 'text-red-500'
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
              {cvError && <p className="text-sm text-red-600">{cvError}</p>}
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
                disabled={isSubmittingApplication || motivationText.length < 100}
                className="bg-[var(--primary)] hover:bg-[var(--primary-light)] text-white rounded-lg"
              >
                {isSubmittingApplication ? (
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
