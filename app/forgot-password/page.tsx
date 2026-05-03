'use client'

import { useState } from 'react'
import Link from 'next/link'
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

export default function ForgotPasswordPage() {
  const { language } = useLanguage()
  const t = translations[language]

  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    const supabase = createClient()

    const origin = typeof window !== 'undefined' ? window.location.origin : ''
    const redirectTo = `${origin}/auth/callback?next=/reset-password`

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo,
    })

    if (error) {
      toast.error(error.message)
      setIsLoading(false)
      return
    }

    toast.success(t.pages.forgotPassword.toasts.sent)
    setIsLoading(false)
  }

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
              {t.pages.forgotPassword.title}
            </h1>
            <p className="text-[var(--text-secondary)] text-base">
              {t.pages.forgotPassword.subtitle}
            </p>
          </CardHeader>

          <CardContent className="pt-6">
            <form onSubmit={handleSend} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-[var(--text-primary)] font-medium text-sm">
                  {t.pages.forgotPassword.emailLabel}
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={t.pages.forgotPassword.emailPlaceholder}
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
                    {t.pages.forgotPassword.sending}
                  </>
                ) : (
                  t.pages.forgotPassword.sendButton
                )}
              </Button>
            </form>

            <p className="text-center text-[var(--text-secondary)] text-sm mt-6">
              <Link href="/login" className="text-[#1B2A72] hover:text-[#2d3f99] font-semibold transition-colors">
                {t.pages.forgotPassword.backToLogin}
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
