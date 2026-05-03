'use client'

import { useEffect, useMemo, useState } from 'react'
import { NavBar } from '@/components/NavBar'
import { Footer } from '@/components/Footer'
import { HeroBackground } from '@/components/HeroBackground'
import { OpportunityCard } from '@/components/OpportunityCard'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { createClient } from '@/lib/supabase/client'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { useLanguage } from '@/lib/i18n/LanguageContext'
import { translations } from '@/lib/i18n/translations'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'

interface OpportunityWithMentor {
  id: string
  title: string
  description: string
  tags: string[] | null
  total_spots: number
  filled_spots: number
  duration: string | null
  mentor: { full_name: string; institution: string | null } | null
}

interface ResearchPageClientProps {
  opportunities: OpportunityWithMentor[]
}

export default function ResearchPageClient({ opportunities }: ResearchPageClientProps) {
  const supabase = createClient()
  const router = useRouter()
  const searchParams = useSearchParams()
  const { language } = useLanguage()
  const t = translations[language]
  const [selectedTag, setSelectedTag] = useState<string | null>(null)

  const [userId, setUserId] = useState<string | null>(null)
  const [isAuthReady, setIsAuthReady] = useState(false)

  // Apply dialog state (same UX as dashboard)
  const [selectedOpp, setSelectedOpp] = useState<OpportunityWithMentor | null>(null)
  const [motivationText, setMotivationText] = useState('')
  const [cvFile, setCvFile] = useState<File | null>(null)
  const [cvError, setCvError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Collect all unique tags
  const allTags = useMemo(() => {
    const tagSet = new Set<string>()
    opportunities.forEach((opp) => {
      opp.tags?.forEach((tag) => tagSet.add(tag))
    })
    return Array.from(tagSet).sort()
  }, [opportunities])

  // Filter opportunities by selected tag
  const filteredOpportunities = useMemo(() => {
    if (!selectedTag) return opportunities
    return opportunities.filter((opp) => opp.tags?.includes(selectedTag))
  }, [opportunities, selectedTag])

  useEffect(() => {
    const initAuth = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      setUserId(user?.id ?? null)
      setIsAuthReady(true)
    }
    initAuth()
  }, [supabase])

  // If user lands on /research?apply=... (e.g., after login), auto-open the dialog.
  useEffect(() => {
    const applyId = searchParams.get('apply')
    if (!applyId || !isAuthReady) return

    if (!userId) {
      router.push(`/login?redirect=${encodeURIComponent(`/research?apply=${applyId}`)}`)
      return
    }

    const opp = opportunities.find((o) => o.id === applyId) || null
    if (!opp) {
      toast.error('Opportunity not found')
      return
    }

    setSelectedOpp(opp)
    setMotivationText('')
    setCvFile(null)
    setCvError('')
  }, [searchParams, isAuthReady, userId, opportunities, router, t])

  const handleApply = async (oppId: string) => {
    let resolvedUserId = userId

    if (!isAuthReady) {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      resolvedUserId = user?.id ?? null
      setUserId(resolvedUserId)
      setIsAuthReady(true)
    }

    if (!resolvedUserId) {
      router.push(`/login?redirect=${encodeURIComponent(`/research?apply=${oppId}`)}`)
      return
    }

    const opp = opportunities.find((o) => o.id === oppId) || null
    if (!opp) {
      toast.error('Opportunity not found')
      return
    }

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
    if (!userId || !selectedOpp) return

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

      const filePath = `${userId}/${selectedOpp.id}.${fileExt}`
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
      mentee_id: userId,
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
    }

    setIsSubmitting(false)
  }

  return (
    <div className="min-h-screen flex flex-col">
      <NavBar />

      {/* Hero Section */}
      <section className="relative py-12 sm:py-16 lg:py-20 overflow-hidden">
        <HeroBackground />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          <span className="section-label">{t.pages.research.heroLabel}</span>
          <h1 className="font-heading text-3xl sm:text-[42px] lg:text-[52px] font-extrabold text-[#1B2A72] leading-tight">
            {t.pages.research.heroTitle}
          </h1>
          <p className="text-lg sm:text-xl text-[var(--text-secondary)] mt-4 max-w-2xl mx-auto">
            {t.pages.research.heroSubtitle}
          </p>
        </div>
      </section>

      {/* Opportunities */}
      <section className="py-12 sm:py-16 lg:py-24 bg-white flex-1">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {opportunities.length > 0 ? (
            <>
              {/* Tag Filter */}
              {allTags.length > 0 && (
                <div className="flex gap-2 mb-8 overflow-x-auto whitespace-nowrap [-webkit-overflow-scrolling:touch] sm:flex-wrap sm:whitespace-normal">
                  <button
                    onClick={() => setSelectedTag(null)}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                      selectedTag === null
                        ? 'bg-[#1B2A72] text-white'
                        : 'bg-[#EEEDF8] text-[#1B2A72] hover:bg-[#E2E4F0]'
                    }`}
                  >
                    {t.pages.research.filterAll}
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
                    isFull={opp.filled_spots >= opp.total_spots}
                    onApply={() => handleApply(opp.id)}
                  />
                ))}
              </div>

              {filteredOpportunities.length === 0 && (
                <div className="text-center py-12">
                  <p className="text-[var(--text-secondary)]">
                    {t.pages.research.filterNoMatches}
                  </p>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-20 bg-[#EEEDF8] rounded-2xl border border-[var(--border)]">
              <div className="max-w-md mx-auto">
                <h2 className="font-heading text-2xl font-extrabold text-[#1B2A72] mb-4">
                  {t.pages.research.emptyTitle}
                </h2>
                <p className="text-[var(--text-secondary)] mb-8">
                  {t.pages.research.emptyBody}
                </p>
                <Link href="/register">
                  <Button className="bg-[var(--primary)] hover:bg-[var(--primary-light)] text-white rounded-lg px-6">
                    {t.pages.research.emptyButton}
                  </Button>
                </Link>
              </div>
            </div>
          )}
        </div>
      </section>

      <Footer />

      {/* Application Dialog (Research page) */}
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
