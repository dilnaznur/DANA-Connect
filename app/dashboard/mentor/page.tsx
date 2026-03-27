'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { DashboardNav } from '@/components/DashboardNav'
import { ApplicationCard } from '@/components/ApplicationCard'
import { TagInput } from '@/components/TagInput'
import { OpportunityCardSkeleton } from '@/components/LoadingSkeleton'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
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
import { Plus, Loader2, Beaker, Mail } from 'lucide-react'

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

  const [profile, setProfile] = useState<Profile | null>(null)
  const [opportunities, setOpportunities] = useState<ResearchOpportunity[]>([])
  const [applications, setApplications] = useState<Application[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('opportunities')

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

      await fetchProfile(user.id)
      await fetchOpportunities(user.id)
      setIsLoading(false)
    }
    init()
  }, [supabase, router, fetchProfile, fetchOpportunities])

  useEffect(() => {
    if (opportunities.length > 0) {
      fetchApplications(opportunities.map((o) => o.id))
    }
  }, [opportunities, fetchApplications])

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
      toast.success(`Opportunity ${opp.is_open ? 'closed' : 'opened'}`)
    }
  }

  const handlePostOpportunity = async () => {
    if (!profile) return

    const finalDuration =
      newOpp.duration === 'Custom' ? newOpp.customDuration : newOpp.duration

    if (!newOpp.title.trim() || !newOpp.description.trim()) {
      toast.error('Title and description are required')
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
      toast.success('Opportunity published!')
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
          toast.error('Application accepted, but email notification failed to send')
        }
      } catch {
        toast.error('Application accepted, but email notification failed to send')
      }
    }

    toast.success('Application accepted!')
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
      toast.success('Application rejected')
      fetchApplications(opportunities.map((o) => o.id))
    }
  }

  const handleViewCv = async (cvPath: string) => {
    // Backward compatibility: if old rows still contain full public URL, extract path after /cvs/.
    const normalizedPath = cvPath.includes('/cvs/')
      ? cvPath.split('/cvs/')[1]
      : cvPath

    if (!normalizedPath) {
      toast.error('Invalid CV path')
      return
    }

    const { data, error } = await supabase.storage
      .from('cvs')
      .createSignedUrl(normalizedPath, 60)

    if (error || !data?.signedUrl) {
      toast.error(error?.message || 'Failed to open CV')
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
              Welcome back, {profile.full_name.split(' ')[0]} ✨
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-white/10 rounded-lg px-4 py-3 backdrop-blur-sm">
                <div className="text-white/70 text-sm font-medium">Opportunities</div>
                <div className="font-heading text-3xl font-bold text-white mt-1">
                  {opportunities.length}
                </div>
              </div>
              <div className="bg-white/10 rounded-lg px-4 py-3 backdrop-blur-sm">
                <div className="text-white/70 text-sm font-medium">Applications</div>
                <div className="font-heading text-3xl font-bold text-white mt-1">
                  {applications.length}
                </div>
              </div>
              <div className="bg-white/10 rounded-lg px-4 py-3 backdrop-blur-sm">
                <div className="text-white/70 text-sm font-medium">Pending</div>
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
          <h1 className="font-heading text-3xl font-bold text-[var(--primary)]">
            Manage Your Opportunities
          </h1>
          <p className="text-[var(--text-secondary)] mt-2">
            Track applications and manage your research projects
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="bg-white border border-[var(--border)] mb-6">
            <TabsTrigger value="opportunities">My Opportunities</TabsTrigger>
            <TabsTrigger value="applications" className="relative">
              Applications
              {pendingCount > 0 && (
                <span className="ml-2 bg-amber-100 text-amber-700 text-xs px-2 py-0.5 rounded-full">
                  {pendingCount}
                </span>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="opportunities">
            <div className="flex justify-between items-center mb-6">
              <h2 className="font-heading text-xl font-semibold text-[var(--primary)]">
                Research Opportunities
              </h2>
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger
                  render={
                    <Button className="bg-[var(--primary)] hover:bg-[var(--primary-light)] text-white rounded-lg">
                      <Plus className="w-4 h-4 mr-2" />
                      Post New Opportunity
                    </Button>
                  }
                />
                <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle className="font-heading">
                      Post New Opportunity
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
                    <div className="grid grid-cols-2 gap-4">
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
                          Publishing...
                        </>
                      ) : (
                        'Publish Opportunity'
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
                                {opp.is_open ? 'Open' : 'Closed'}
                              </Badge>
                              <div className="flex items-center gap-2">
                                <span className="text-sm text-[var(--text-muted)]">
                                  {opp.is_open ? 'Close' : 'Open'}
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
                              {opp.filled_spots} / {opp.total_spots} spots filled
                            </span>
                            {opp.duration && (
                              <span className="text-sm text-[var(--text-muted)]">
                                Duration: {opp.duration}
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
                  No Opportunities Yet
                </h3>
                <p className="text-[var(--text-secondary)] mb-6">
                  You haven&apos;t posted any research opportunities yet.
                </p>
                <Button
                  onClick={() => setIsDialogOpen(true)}
                  className="bg-[var(--primary)] hover:bg-[var(--primary-light)] text-white rounded-lg"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Post Your First Opportunity
                </Button>
              </div>
            )}
          </TabsContent>

          <TabsContent value="applications">
            <h2 className="font-heading text-xl font-semibold text-[var(--primary)] mb-6">
              Applications by Opportunity
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
                <h3 className="empty-state-heading">No Applications Yet</h3>
                <p className="empty-state-text">
                  Applications from mentees will appear here once they apply to your research opportunities.
                </p>
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
            <DialogTrigger
              render={
                <Button
                  variant="outline"
                  size="sm"
                  className="border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
                >
                  Delete Account
                </Button>
              }
            />
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
                  <Label htmlFor="delete-confirm-mentor">Type &quot;DELETE&quot; to confirm</Label>
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
    </div>
  )
}
