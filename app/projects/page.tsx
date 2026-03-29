'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import dynamic from 'next/dynamic'
import { createClient } from '@/lib/supabase/client'
import { NavBar } from '@/components/NavBar'
import { Footer } from '@/components/Footer'
import { ProjectCard } from '@/components/ProjectCard'
import { TagInput } from '@/components/TagInput'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { toast } from 'sonner'
import { Project, ProjectRequest } from '@/lib/types'
import { useLanguage } from '@/lib/i18n/LanguageContext'
import { translations } from '@/lib/i18n/translations'
import { Plus, Loader2, Search, FolderOpen, Check, X, User, Trash2 } from 'lucide-react'
import { format } from 'date-fns'

const HeroBackground = dynamic(
  () => import('@/components/HeroBackground').then((mod) => ({ default: mod.HeroBackground })),
  { ssr: false }
)

export default function ProjectsPage() {
  const supabase = createClient()
  const { language } = useLanguage()
  const t = translations[language]

  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [projects, setProjects] = useState<Project[]>([])
  const [myProjects, setMyProjects] = useState<Project[]>([])
  const [myRequests, setMyRequests] = useState<ProjectRequest[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('browse')

  // Post project dialog
  const [isPostDialogOpen, setIsPostDialogOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [newProject, setNewProject] = useState({
    title: '',
    description: '',
    tags: [] as string[],
    contact_email: '',
    contact_telegram: '',
    deadline: '',
    max_members: 5,
  })

  // Join project dialog
  const [selectedProject, setSelectedProject] = useState<Project | null>(null)
  const [joinMessage, setJoinMessage] = useState('')
  const [isJoining, setIsJoining] = useState(false)

  // Manage project dialog
  const [managedProject, setManagedProject] = useState<Project | null>(null)
  const [pendingRequests, setPendingRequests] = useState<ProjectRequest[]>([])
  const [acceptedMembers, setAcceptedMembers] = useState<ProjectRequest[]>([])
  const [isLoadingRequests, setIsLoadingRequests] = useState(false)
  const [processingRequestId, setProcessingRequestId] = useState<string | null>(null)
  const [isDeletingProject, setIsDeletingProject] = useState(false)

  // Tag filter
  const [selectedTag, setSelectedTag] = useState<string | null>(null)

  // Collect all unique tags
  const allTags = useMemo(() => {
    const tagSet = new Set<string>()
    projects.forEach((p) => p.tags?.forEach((tag) => tagSet.add(tag)))
    return Array.from(tagSet).sort()
  }, [projects])

  // Filter projects by tag
  const filteredProjects = useMemo(() => {
    if (!selectedTag) return projects
    return projects.filter((p) => p.tags?.includes(selectedTag))
  }, [projects, selectedTag])

  // Set of project IDs user has requested to join
  const requestedProjectIds = useMemo(
    () => new Set(myRequests.map((r) => r.project_id)),
    [myRequests]
  )

  const fetchProjects = useCallback(async () => {
    const { data } = await supabase
      .from('open_projects')
      .select('*, creator:profiles(full_name, email, institution)')
      .eq('is_open', true)
      .order('created_at', { ascending: false })
    setProjects((data as Project[]) || [])
  }, [supabase])

  const fetchMyProjects = useCallback(async (userId: string) => {
    const { data } = await supabase
      .from('open_projects')
      .select('*, creator:profiles(full_name, email, institution)')
      .eq('creator_id', userId)
      .order('created_at', { ascending: false })
    setMyProjects((data as Project[]) || [])
  }, [supabase])

  const fetchMyRequests = useCallback(async (userId: string) => {
    const { data } = await supabase
      .from('project_requests')
      .select('*, project:projects(title)')
      .eq('requester_id', userId)
    setMyRequests((data as ProjectRequest[]) || [])
  }, [supabase])

  const fetchProjectRequests = useCallback(async (projectId: string) => {
    setIsLoadingRequests(true)
    const { data } = await supabase
      .from('project_requests')
      .select('*, user:profiles(full_name, email, institution)')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false })

    const requests = (data as ProjectRequest[]) || []
    setPendingRequests(requests.filter((r) => r.status === 'pending'))
    setAcceptedMembers(requests.filter((r) => r.status === 'accepted'))
    setIsLoadingRequests(false)
  }, [supabase])

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()

      if (user) {
        setCurrentUserId(user.id)
        await Promise.all([
          fetchProjects(),
          fetchMyProjects(user.id),
          fetchMyRequests(user.id),
        ])
      } else {
        await fetchProjects()
      }
      setIsLoading(false)
    }
    init()
  }, [supabase, fetchProjects, fetchMyProjects, fetchMyRequests])

  const handlePostProject = async () => {
    if (!currentUserId) return

    if (!newProject.title.trim() || !newProject.description.trim()) {
      toast.error(t.projects.validation.titleAndDescriptionRequired)
      return
    }

    setIsSubmitting(true)

    const { error } = await supabase.from('open_projects').insert({
      creator_id: currentUserId,
      title: newProject.title.trim(),
      description: newProject.description.trim(),
      tags: newProject.tags,
      contact_email: newProject.contact_email.trim() || null,
      contact_telegram: newProject.contact_telegram.trim() || null,
      deadline: newProject.deadline || null,
      max_members: newProject.max_members,
      filled_members: 1,
      is_open: true,
    })

    if (error) {
      toast.error(error.message)
    } else {
      toast.success(t.projects.toasts.projectPosted)
      setIsPostDialogOpen(false)
      setNewProject({
        title: '',
        description: '',
        tags: [],
        contact_email: '',
        contact_telegram: '',
        deadline: '',
        max_members: 5,
      })
      fetchProjects()
      fetchMyProjects(currentUserId)
    }

    setIsSubmitting(false)
  }

  const handleJoinProject = async () => {
    if (!currentUserId || !selectedProject) return

    setIsJoining(true)

    const { error } = await supabase.from('project_requests').insert({
      project_id: selectedProject.id,
      requester_id: currentUserId,
      message: joinMessage.trim() || null,
      status: 'pending',
    })

    if (error) {
      if (error.code === '23505') {
        toast.error(t.projects.toasts.alreadyRequested)
      } else {
        toast.error(error.message)
      }
    } else {
      toast.success(t.projects.toasts.joinRequestSent)
      setSelectedProject(null)
      setJoinMessage('')
      fetchMyRequests(currentUserId)
    }

    setIsJoining(false)
  }

  const handleManageProject = (project: Project) => {
    setManagedProject(project)
    fetchProjectRequests(project.id)
  }

  const handleAcceptRequest = async (request: ProjectRequest) => {
    if (!managedProject || !currentUserId) return

    setProcessingRequestId(request.id)

    // Update request status to accepted
    const { error: updateError } = await supabase
      .from('project_requests')
      .update({ status: 'accepted' })
      .eq('id', request.id)

    if (updateError) {
      toast.error(updateError.message)
      setProcessingRequestId(null)
      return
    }

    // Increment filled_members and check if project should close
    const newFilledMembers = managedProject.filled_members + 1
    const shouldClose = newFilledMembers >= managedProject.max_members

    const { error: projectError } = await supabase
      .from('open_projects')
      .update({
        filled_members: newFilledMembers,
        is_open: !shouldClose,
      })
      .eq('id', managedProject.id)

    if (projectError) {
      toast.error(projectError.message)
      setProcessingRequestId(null)
      return
    }

    toast.success(t.projects.toasts.requestAccepted)

    // Update local state
    setManagedProject({ ...managedProject, filled_members: newFilledMembers, is_open: !shouldClose })
    fetchProjectRequests(managedProject.id)
    fetchMyProjects(currentUserId)
    fetchProjects()

    setProcessingRequestId(null)
  }

  const handleRejectRequest = async (request: ProjectRequest) => {
    if (!managedProject) return

    setProcessingRequestId(request.id)

    const { error } = await supabase
      .from('project_requests')
      .update({ status: 'rejected' })
      .eq('id', request.id)

    if (error) {
      toast.error(error.message)
    } else {
      toast.success(t.projects.toasts.requestRejected)
      fetchProjectRequests(managedProject.id)
    }

    setProcessingRequestId(null)
  }

  const handleDeleteProject = async () => {
    if (!managedProject || !currentUserId) return

    const confirmText = `${t.projects.confirm.deleteTitle}\n\n${t.projects.confirm.deleteBody}`
    if (!window.confirm(confirmText)) return

    setIsDeletingProject(true)

    const { error } = await supabase
      .from('open_projects')
      .delete()
      .eq('id', managedProject.id)
      .eq('creator_id', currentUserId)

    if (error) {
      toast.error(`${t.projects.toasts.deleteFailed}: ${error.message}`)
      setIsDeletingProject(false)
      return
    }

    toast.success(t.projects.toasts.projectDeleted)
    setManagedProject(null)
    setPendingRequests([])
    setAcceptedMembers([])
    await Promise.all([fetchProjects(), fetchMyProjects(currentUserId)])
    setIsDeletingProject(false)
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#EEEDF8]">
        <NavBar />
        <div className="flex items-center justify-center py-40">
          <Loader2 className="w-8 h-8 animate-spin text-[#1B2A72]" />
        </div>
        <Footer />
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col">
      <NavBar />

      {/* Hero Section */}
      <section className="relative py-16 lg:py-20 overflow-hidden">
        <HeroBackground />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          <span className="section-label">{t.projects.heroLabel}</span>
          <h1 className="font-heading text-[42px] lg:text-[52px] font-extrabold text-[#1B2A72] leading-tight">
            {t.projects.heroTitle}
          </h1>
          <p className="text-xl text-[var(--text-secondary)] mt-4 max-w-2xl mx-auto">
            {t.projects.heroSubtitle}
          </p>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-12 lg:py-16 bg-white flex-1">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header with Tabs and Post Button */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
            {/* Tabs */}
            <div className="flex gap-2">
              <button
                onClick={() => setActiveTab('browse')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                  activeTab === 'browse'
                    ? 'bg-[#1B2A72] text-white'
                    : 'bg-[#EEEDF8] text-[#1B2A72] hover:bg-[#E2E4F0]'
                }`}
              >
                <Search className="w-4 h-4" />
                {t.projects.tabs.browse}
              </button>
              {currentUserId && (
                <button
                  onClick={() => setActiveTab('my')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                    activeTab === 'my'
                      ? 'bg-[#1B2A72] text-white'
                      : 'bg-[#EEEDF8] text-[#1B2A72] hover:bg-[#E2E4F0]'
                  }`}
                >
                  <FolderOpen className="w-4 h-4" />
                  {t.projects.tabs.my}
                  {myProjects.length > 0 && (
                    <span className="ml-1 bg-white/20 text-xs px-2 py-0.5 rounded-full">
                      {myProjects.length}
                    </span>
                  )}
                </button>
              )}
            </div>

            {/* Post Button */}
            {currentUserId && (
              <Button
                onClick={() => setIsPostDialogOpen(true)}
                className="bg-[#1B2A72] hover:bg-[#2d3f99] text-white rounded-lg"
              >
                <Plus className="w-4 h-4 mr-2" />
                {t.projects.actions.post}
              </Button>
            )}
          </div>

          {/* Browse Tab */}
          {activeTab === 'browse' && (
            <>
              {/* Tag Filter */}
              {allTags.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-6">
                  <button
                    onClick={() => setSelectedTag(null)}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                      selectedTag === null
                        ? 'bg-[#1B2A72] text-white'
                        : 'bg-[#EEEDF8] text-[#1B2A72] hover:bg-[#E2E4F0]'
                    }`}
                  >
                    {t.projects.filter.all}
                  </button>
                  {allTags.map((tag) => (
                    <button
                      key={tag}
                      onClick={() => setSelectedTag(tag)}
                      className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                        selectedTag === tag
                          ? 'bg-[#1B2A72] text-white'
                          : 'bg-[#EEEDF8] text-[#1B2A72] hover:bg-[#E2E4F0]'
                      }`}
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              )}

              {/* Projects Grid */}
              {filteredProjects.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredProjects.map((project) => (
                    <ProjectCard
                      key={project.id}
                      project={project}
                      currentUserId={currentUserId || undefined}
                      hasRequested={requestedProjectIds.has(project.id)}
                      onJoin={() => setSelectedProject(project)}
                      onManage={() => handleManageProject(project)}
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-20 bg-[#EEEDF8] rounded-2xl">
                  <h3 className="font-heading text-xl font-semibold text-[#1B2A72] mb-2">
                    {t.projects.empty.noProjectsAvailableTitle}
                  </h3>
                  <p className="text-[var(--text-secondary)] mb-6">
                    {selectedTag
                      ? t.projects.empty.noProjectsAvailableDescriptionFilter
                      : t.projects.empty.noProjectsAvailableDescriptionDefault}
                  </p>
                  {currentUserId && !selectedTag && (
                    <Button
                      onClick={() => setIsPostDialogOpen(true)}
                      className="bg-[#1B2A72] hover:bg-[#2d3f99] text-white rounded-lg"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      {t.projects.actions.post}
                    </Button>
                  )}
                </div>
              )}
            </>
          )}

          {/* My Projects Tab */}
          {activeTab === 'my' && currentUserId && (
            <>
              {myProjects.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {myProjects.map((project) => (
                    <ProjectCard
                      key={project.id}
                      project={project}
                      currentUserId={currentUserId}
                      onManage={() => handleManageProject(project)}
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-20 bg-[#EEEDF8] rounded-2xl">
                  <h3 className="font-heading text-xl font-semibold text-[#1B2A72] mb-2">
                    {t.projects.empty.noProjectsYetTitle}
                  </h3>
                  <p className="text-[var(--text-secondary)] mb-6">
                    {t.projects.empty.noProjectsYetDescription}
                  </p>
                  <Button
                    onClick={() => setIsPostDialogOpen(true)}
                    className="bg-[#1B2A72] hover:bg-[#2d3f99] text-white rounded-lg"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    {t.projects.actions.postFirst}
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </section>

      <Footer />

      {/* Post Project Dialog */}
      <Dialog open={isPostDialogOpen} onOpenChange={setIsPostDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-heading text-[#1B2A72]">
              {t.projects.dialog.postTitle}
            </DialogTitle>
            <DialogDescription className="text-[var(--text-secondary)]">
              {t.projects.dialog.postDescription}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label htmlFor="title">{t.projects.dialog.titleLabel}</Label>
              <Input
                id="title"
                value={newProject.title}
                onChange={(e) => setNewProject({ ...newProject, title: e.target.value })}
                placeholder={t.projects.dialog.titlePlaceholder}
                className="border-[1.5px] border-[var(--border)] rounded-lg"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">{t.projects.dialog.descriptionLabel}</Label>
              <Textarea
                id="description"
                value={newProject.description}
                onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
                placeholder={t.projects.dialog.descriptionPlaceholder}
                rows={4}
                className="border-[1.5px] border-[var(--border)] rounded-lg"
              />
            </div>

            <div className="space-y-2">
              <Label>{t.projects.dialog.tagsLabel}</Label>
              <TagInput
                value={newProject.tags}
                onChange={(tags) => setNewProject({ ...newProject, tags })}
                placeholder={t.projects.dialog.tagsPlaceholder}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="contact_email">{t.projects.dialog.contactEmailLabel}</Label>
                <Input
                  id="contact_email"
                  type="email"
                  value={newProject.contact_email}
                  onChange={(e) => setNewProject({ ...newProject, contact_email: e.target.value })}
                  placeholder={t.projects.dialog.contactEmailPlaceholder}
                  className="border-[1.5px] border-[var(--border)] rounded-lg"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="contact_telegram">{t.projects.dialog.telegramLabel}</Label>
                <Input
                  id="contact_telegram"
                  value={newProject.contact_telegram}
                  onChange={(e) => setNewProject({ ...newProject, contact_telegram: e.target.value })}
                  placeholder={t.projects.dialog.telegramPlaceholder}
                  className="border-[1.5px] border-[var(--border)] rounded-lg"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="deadline">{t.projects.dialog.deadlineLabel}</Label>
                <Input
                  id="deadline"
                  type="date"
                  value={newProject.deadline}
                  onChange={(e) => setNewProject({ ...newProject, deadline: e.target.value })}
                  className="border-[1.5px] border-[var(--border)] rounded-lg"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="max_members">{t.projects.dialog.maxMembersLabel}</Label>
                <Input
                  id="max_members"
                  type="number"
                  min={2}
                  max={50}
                  value={newProject.max_members}
                  onChange={(e) => setNewProject({ ...newProject, max_members: parseInt(e.target.value) || 5 })}
                  className="border-[1.5px] border-[var(--border)] rounded-lg"
                />
              </div>
            </div>

            <Button
              onClick={handlePostProject}
              disabled={isSubmitting}
              className="w-full bg-[#1B2A72] hover:bg-[#2d3f99] text-white rounded-lg"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {t.projects.actions.posting}
                </>
              ) : (
                t.projects.actions.postProject
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Join Project Dialog */}
      <Dialog open={!!selectedProject} onOpenChange={(open) => !open && setSelectedProject(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="font-heading text-[#1B2A72]">
              {t.projects.dialog.joinTitle}
            </DialogTitle>
            <DialogDescription className="text-[var(--text-secondary)]">
              {t.projects.dialog.joinDescriptionPrefix} &quot;{selectedProject?.title}&quot;
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label htmlFor="joinMessage">
                {t.projects.dialog.joinMessageLabel}
              </Label>
              <Textarea
                id="joinMessage"
                value={joinMessage}
                onChange={(e) => setJoinMessage(e.target.value.slice(0, 500))}
                placeholder={t.projects.dialog.joinMessagePlaceholder}
                rows={4}
                className="border-[1.5px] border-[var(--border)] rounded-lg"
              />
              <p className="text-xs text-[var(--text-muted)]">
                {joinMessage.length}/500 {t.projects.dialog.characters}
              </p>
            </div>

            <div className="flex gap-3 justify-end">
              <Button
                variant="outline"
                onClick={() => setSelectedProject(null)}
                className="border-[var(--border)]"
              >
                {t.projects.actions.cancel}
              </Button>
              <Button
                onClick={handleJoinProject}
                disabled={isJoining}
                className="bg-[#1B2A72] hover:bg-[#2d3f99] text-white rounded-lg"
              >
                {isJoining ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    {t.projects.actions.sending}
                  </>
                ) : (
                  t.projects.actions.sendRequest
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Manage Project Dialog */}
      <Dialog open={!!managedProject} onOpenChange={(open) => !open && setManagedProject(null)}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-heading text-[#1B2A72]">
              {t.projects.dialog.manageTitle}
            </DialogTitle>
            <DialogDescription className="text-[var(--text-secondary)]">
              {managedProject?.title} — {managedProject?.filled_members}/{managedProject?.max_members}{' '}
              {t.projects.dialog.manageDescriptionSuffixMembers}
              {!managedProject?.is_open && (
                <span className="ml-2 text-amber-600 font-medium">{t.projects.dialog.closed}</span>
              )}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 pt-4">
            {isLoadingRequests ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-[#1B2A72]" />
              </div>
            ) : (
              <>
                {/* Pending Requests */}
                <div>
                  <h4 className="font-semibold text-[#1B2A72] mb-3 flex items-center gap-2">
                    {t.projects.dialog.pendingRequests}
                    {pendingRequests.length > 0 && (
                      <span className="bg-amber-100 text-amber-700 text-xs px-2 py-0.5 rounded-full">
                        {pendingRequests.length}
                      </span>
                    )}
                  </h4>

                  {pendingRequests.length > 0 ? (
                    <div className="space-y-3">
                      {pendingRequests.map((request) => {
                        const user = request.user as { full_name: string; email: string; institution: string | null } | undefined
                        return (
                          <div
                            key={request.id}
                            className="bg-[#EEEDF8] rounded-lg p-4"
                          >
                            <div className="flex items-start justify-between gap-4">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                  <User className="w-4 h-4 text-[#1B2A72]" />
                                  <span className="font-medium text-[#1B2A72]">
                                    {user?.full_name || t.projects.common.unknown}
                                  </span>
                                </div>
                                {user?.institution && (
                                  <p className="text-xs text-[var(--text-muted)] mb-2">
                                    {user.institution}
                                  </p>
                                )}
                                {request.message && (
                                  <p className="text-sm text-[var(--text-secondary)] mb-2">
                                    &quot;{request.message}&quot;
                                  </p>
                                )}
                                <p className="text-xs text-[var(--text-muted)]">
                                  {format(new Date(request.created_at), 'MMM d, yyyy')}
                                </p>
                              </div>
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  onClick={() => handleAcceptRequest(request)}
                                  disabled={processingRequestId === request.id}
                                  className="bg-green-600 hover:bg-green-700 text-white h-8 px-3"
                                >
                                  {processingRequestId === request.id ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                  ) : (
                                    <Check className="w-4 h-4" />
                                  )}
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleRejectRequest(request)}
                                  disabled={processingRequestId === request.id}
                                  className="border-red-200 text-red-600 hover:bg-red-50 h-8 px-3"
                                >
                                  <X className="w-4 h-4" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  ) : (
                    <p className="text-sm text-[var(--text-muted)] py-4 text-center bg-[#F5F5FB] rounded-lg">
                      {t.projects.empty.noPendingRequests}
                    </p>
                  )}
                </div>

                {/* Accepted Members */}
                <div>
                  <h4 className="font-semibold text-[#1B2A72] mb-3 flex items-center gap-2">
                    {t.projects.dialog.acceptedMembers}
                    {acceptedMembers.length > 0 && (
                      <span className="bg-green-100 text-green-700 text-xs px-2 py-0.5 rounded-full">
                        {acceptedMembers.length}
                      </span>
                    )}
                  </h4>

                  {acceptedMembers.length > 0 ? (
                    <div className="space-y-2">
                      {acceptedMembers.map((member) => {
                        const user = member.user as { full_name: string; email: string; institution: string | null } | undefined
                        return (
                          <div
                            key={member.id}
                            className="flex items-center gap-3 bg-green-50 border border-green-200 rounded-lg px-4 py-3"
                          >
                            <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                              <User className="w-4 h-4 text-green-700" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-green-800">
                                {user?.full_name || t.projects.common.unknown}
                              </p>
                              {user?.email && (
                                <p className="text-xs text-green-600 truncate">
                                  {user.email}
                                </p>
                              )}
                            </div>
                            <span className="text-xs text-green-600">
                              {format(new Date(member.created_at), 'MMM d')}
                            </span>
                          </div>
                        )
                      })}
                    </div>
                  ) : (
                    <p className="text-sm text-[var(--text-muted)] py-4 text-center bg-[#F5F5FB] rounded-lg">
                      {t.projects.empty.noAcceptedMembers}
                    </p>
                  )}
                </div>
              </>
            )}

            <div className="flex items-center justify-between gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={handleDeleteProject}
                disabled={isDeletingProject}
                className="border-red-200 text-red-600 hover:bg-red-50"
              >
                {isDeletingProject ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    {t.projects.actions.deleting}
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4 mr-2" />
                    {t.projects.actions.deleteProject}
                  </>
                )}
              </Button>
              <Button
                variant="outline"
                onClick={() => setManagedProject(null)}
                className="border-[var(--border)]"
              >
                {t.projects.actions.close}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
