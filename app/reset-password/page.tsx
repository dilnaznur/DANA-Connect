'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { HeroBackground } from '@/components/HeroBackground'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { useLanguage } from '@/lib/i18n/LanguageContext'
import { translations } from '@/lib/i18n/translations'

export default function ResetPasswordPage() {
  const router = useRouter()
  const { language } = useLanguage()
  const t = translations[language]

  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [hasSession, setHasSession] = useState<boolean | null>(null)

  useEffect(() => {
    const check = async () => {
      const supabase = createClient()
      const { data } = await supabase.auth.getSession()
      setHasSession(!!data.session)
    }
    check()
  }, [])

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault()

    if (password.length < 8) {
      toast.error(t.pages.resetPassword.toasts.minLength)
      return
    }

    if (password !== confirmPassword) {
      toast.error(t.pages.resetPassword.toasts.mismatch)
      return
    }

    setIsLoading(true)

    const supabase = createClient()
    const { error } = await supabase.auth.updateUser({ password })

    if (error) {
      toast.error(error.message)
      setIsLoading(false)
      return
    }

    toast.success(t.pages.resetPassword.toasts.success)
    setIsLoading(false)
    router.push('/login')
  }

  const isExpired = hasSession === false

  return (
    <div className="min-h-screen relative overflow-hidden">
      <HeroBackground />

      <div className="min-h-screen flex items-center justify-center px-4 relative z-10">
        <Card className="w-full max-w-[420px] bg-white border border-[#E2E4F0] rounded-2xl shadow-lg">
          <CardHeader className="text-center pb-2">
            <Link href="/" className="inline-flex items-center justify-center gap-2 mb-6 sm:mb-8">
              <span className="font-heading font-extrabold text-3xl text-[#1B2A72]">DANA Connect</span>
            </Link>
            <h1 className="font-heading text-2xl sm:text-3xl font-extrabold text-[#1B2A72] mb-2">
              {t.pages.resetPassword.title}
            </h1>
            <p className="text-[var(--text-secondary)] text-base">
              {t.pages.resetPassword.subtitle}
            </p>
          </CardHeader>

          <CardContent className="pt-6">
            {isExpired ? (
              <div className="space-y-4">
                <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">
                  {t.pages.resetPassword.invalidLink}
                </div>
                <Link href="/forgot-password" className="text-[#1B2A72] hover:text-[#2d3f99] font-semibold transition-colors text-sm">
                  {t.pages.resetPassword.tryAgain}
                </Link>
              </div>
            ) : (
              <form onSubmit={handleReset} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-[var(--text-primary)] font-medium text-sm">
                    {t.pages.resetPassword.newPasswordLabel}
                  </Label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={t.pages.resetPassword.newPasswordPlaceholder}
                    required
                    className="border-[1.5px] border-[var(--border)] rounded-lg px-4 py-3 text-sm focus:border-[var(--accent)] focus:ring-[3px] focus:ring-[rgba(79,99,210,0.1)] transition-all"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword" className="text-[var(--text-primary)] font-medium text-sm">
                    {t.pages.resetPassword.confirmPasswordLabel}
                  </Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder={t.pages.resetPassword.confirmPasswordPlaceholder}
                    required
                    className="border-[1.5px] border-[var(--border)] rounded-lg px-4 py-3 text-sm focus:border-[var(--accent)] focus:ring-[3px] focus:ring-[rgba(79,99,210,0.1)] transition-all"
                  />
                </div>

                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-[#1B2A72] hover:bg-[#2d3f99] text-white rounded-lg px-6 py-3 h-auto font-medium btn-hover-lift mt-2"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      {t.pages.resetPassword.saving}
                    </>
                  ) : (
                    t.pages.resetPassword.saveButton
                  )}
                </Button>

                <p className="text-center text-[var(--text-secondary)] text-sm mt-2">
                  <Link href="/login" className="text-[#1B2A72] hover:text-[#2d3f99] font-semibold transition-colors">
                    {t.pages.resetPassword.backToLogin}
                  </Link>
                </p>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
