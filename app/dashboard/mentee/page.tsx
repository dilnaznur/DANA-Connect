'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { DashboardNav } from '@/components/DashboardNav'
import { OpportunityCard } from '@/components/OpportunityCard'
import { StatusBadge } from '@/components/StatusBadge'
// StatusBadge used in application cards below
import { OpportunityCardSkeleton } from '@/components/LoadingSkeleton'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
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
import { Profile, ResearchOpportunity, Application } from '@/lib/types'
import { Loader2, Mail, Linkedin, ExternalLink } from 'lucide-react'
import { format } from 'date-fns'

interface OpportunityWithMentor extends Omit<ResearchOpportunity, 'mentor'> {
  mentor: { full_name: string; institution: string | null } | null
}

export default function MenteeDashboard() {
  const router = useRouter()
  const supabase = createClient()

  const [profile, setProfile] = useState<Profile | null>(null)
  const [opportunities, setOpportunities] = useState<OpportunityWithMentor[]>([])
  const [myApplications, setMyApplications] = useState<Application[]>([])
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
        opportunity:research_opportunities(title, tags, mentor:profiles(full_name, email, linkedin_url))
      `)
      .eq('mentee_id', userId)
      .order('created_at', { ascending: false })
    setMyApplications(data || [])
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
      ])
      setIsLoading(false)
    }
    init()
  }, [supabase, router, fetchProfile, fetchOpportunities, fetchMyApplications])

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
      setCvError('Only .pdf, .doc, and .docx files are allowed')
      return
    }

    const maxBytes = 5 * 1024 * 1024
    if (file.size > maxBytes) {
      setCvFile(null)
      setCvError('File size must be 5MB or less')
      return
    }

    setCvFile(file)
  }

  const handleSubmitApplication = async () => {
    if (!profile || !selectedOpp) return

    if (motivationText.length < 100) {
      toast.error('Please write at least 100 characters')
      return
    }

    setIsSubmitting(true)

    let cvPath: string | null = null

    if (cvFile) {
      const fileExt = cvFile.name.split('.').pop()?.toLowerCase()
      if (!fileExt) {
        toast.error('Invalid CV file format')
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
        toast.error('You have already applied to this opportunity')
      } else {
        toast.error(error.message)
      }
    } else {
      toast.success('Application submitted successfully!')
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
      toast.error('Failed to clean up CV files: ' + listError.message)
      setIsDeleting(false)
      return
    }

    if (files && files.length > 0) {
      const paths = files.map((file) => `${profile.id}/${file.name}`)
      const { error: removeError } = await supabase.storage
        .from('cvs')
        .remove(paths)

      if (removeError) {
        toast.error('Failed to clean up CV files: ' + removeError.message)
        setIsDeleting(false)
        return
      }
    }

    const { error } = await supabase.rpc('delete_user_account')

    if (error) {
      toast.error('Failed to delete account: ' + error.message)
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
              Welcome back, {profile.full_name.split(' ')[0]} 🎓
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-white/10 rounded-lg px-4 py-3 backdrop-blur-sm">
                <div className="text-white/70 text-sm font-medium">Active Opportunities</div>
                <div className="font-heading text-3xl font-bold text-white mt-1">
                  {opportunities.length}
                </div>
              </div>
              <div className="bg-white/10 rounded-lg px-4 py-3 backdrop-blur-sm">
                <div className="text-white/70 text-sm font-medium">My Applications</div>
                <div className="font-heading text-3xl font-bold text-white mt-1">
                  {myApplications.length}
                </div>
              </div>
              <div className="bg-white/10 rounded-lg px-4 py-3 backdrop-blur-sm">
                <div className="text-white/70 text-sm font-medium">Profile Completion</div>
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
          <h1 className="font-heading text-3xl font-bold text-[var(--primary)]">
            Explore & Apply
          </h1>
          <p className="text-[var(--text-secondary)] mt-2">
            Browse research opportunities and track your applications
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="bg-white border border-[var(--border)] mb-6">
            <TabsTrigger value="browse">Browse Opportunities</TabsTrigger>
            <TabsTrigger value="applications">
              My Applications
              {myApplications.length > 0 && (
                <span className="ml-2 bg-hero text-[var(--primary)] text-xs px-2 py-0.5 rounded-full">
                  {myApplications.length}
                </span>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="browse">
            {opportunities.length > 0 ? (
              <>
                {/* Tag Filter */}
                {allTags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-6">
                    <button
                      onClick={() => setSelectedTag(null)}
                      className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                        selectedTag === null
                          ? 'bg-[var(--primary)] text-white'
                          : 'bg-hero text-[var(--primary)] hover:bg-[var(--border)]'
                      }`}
                    >
                      All
                    </button>
                    {allTags.map((tag) => (
                      <button
                        key={tag}
                        onClick={() => setSelectedTag(tag)}
                        className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
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
                      No opportunities match the selected filter.
                    </p>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-20 bg-white rounded-2xl border border-[var(--border)]">
                <h3 className="font-heading text-xl font-semibold text-[var(--primary)] mb-2">
                  No Opportunities Available
                </h3>
                <p className="text-[var(--text-secondary)]">
                  No open research opportunities right now. Check back soon!
                </p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="applications">
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
                                Mentor: {opp.mentor.full_name}
                              </p>
                            )}
                          </div>
                          <StatusBadge status={app.status} />
                        </div>

                        <p className="text-[var(--text-muted)] text-sm mb-4">
                          Submitted:{' '}
                          {format(new Date(app.created_at), 'MMMM d, yyyy')}
                        </p>

                        {app.status === 'viewed' && (
                          <p className="text-blue-600 text-sm mb-4">
                            The mentor has viewed your application
                          </p>
                        )}

                        {app.status === 'accepted' && opp?.mentor && (
                          <div className="bg-green-50 border border-green-200 rounded-lg px-4 py-3 mb-4">
                            <p className="text-green-700 text-sm font-medium mb-1">
                              Congratulations! Your application was accepted.
                            </p>
                            <p className="text-green-700 text-sm mb-2">
                              Contact your mentor:
                            </p>
                            <div className="space-y-1">
                              {opp.mentor.email && (
                                <a
                                  href={`mailto:${opp.mentor.email}`}
                                  className="inline-flex items-center gap-2 text-sm text-[var(--accent)] hover:underline"
                                >
                                  <Mail className="w-4 h-4" />
                                  Email: {opp.mentor.email}
                                </a>
                              )}
                              {opp.mentor.linkedin_url && (
                                <a
                                  href={opp.mentor.linkedin_url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-2 text-sm text-[var(--accent)] hover:underline"
                                >
                                  <Linkedin className="w-4 h-4" />
                                  LinkedIn: {opp.mentor.linkedin_url}
                                  <ExternalLink className="w-3 h-3" />
                                </a>
                              )}
                            </div>
                          </div>
                        )}

                        <div className="bg-hero rounded-lg p-4">
                          <Label className="text-xs text-[var(--text-muted)] mb-2 block">
                            Your motivation
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
                  No Applications Yet
                </h3>
                <p className="text-[var(--text-secondary)] mb-6">
                  You haven&apos;t applied to any opportunities yet.
                </p>
                <Button
                  onClick={() => setActiveTab('browse')}
                  className="bg-[var(--primary)] hover:bg-[var(--primary-light)] text-white rounded-lg"
                >
                  Browse Opportunities
                </Button>
              </div>
            )}
          </TabsContent>
        </Tabs>

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
              Delete Account
            </Button>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle className="font-heading">Delete your account?</DialogTitle>
                <DialogDescription className="text-[var(--text-secondary)]">
                  This will permanently delete your account, all your data,
                  research opportunities, and applications. This action cannot
                  be undone.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 pt-2">
                <div className="space-y-2">
                  <Label htmlFor="delete-confirm-mentee">Type &quot;DELETE&quot; to confirm</Label>
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
                    Cancel
                  </Button>
                  <Button
                    onClick={handleDeleteAccount}
                    disabled={isDeleting || confirmText !== 'DELETE'}
                    className="bg-red-600 hover:bg-red-700 text-white"
                  >
                    {isDeleting ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Deleting...
                      </>
                    ) : (
                      'Delete My Account'
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
              Apply to: {selectedOpp?.title}
            </DialogTitle>
            <DialogDescription className="text-[var(--text-secondary)]">
              Mentor: {selectedOpp?.mentor?.full_name}
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
                Why do you want to join this research? *
              </Label>
              <Textarea
                id="motivation"
                value={motivationText}
                onChange={(e) => setMotivationText(e.target.value)}
                placeholder="Explain your interest, relevant experience, and what you hope to learn..."
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
                {motivationText.length} characters
                {motivationText.length < 100 && ' (minimum 100)'}
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="cvFile">Attach your CV (optional)</Label>
              <input
                id="cvFile"
                type="file"
                accept=".pdf,.doc,.docx"
                onChange={handleCvChange}
                className="block w-full text-sm text-[var(--text-secondary)] file:mr-4 file:rounded-lg file:border file:border-[var(--border)] file:bg-white file:px-3 file:py-2 file:text-sm file:font-medium file:text-[var(--primary)] hover:file:bg-hero"
              />
              {cvFile && (
                <p className="text-sm text-[var(--text-secondary)]">
                  Selected file: {cvFile.name}
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
                Cancel
              </Button>
              <Button
                onClick={handleSubmitApplication}
                disabled={isSubmitting || motivationText.length < 100}
                className="bg-[var(--primary)] hover:bg-[var(--primary-light)] text-white rounded-lg"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  'Submit Application →'
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
