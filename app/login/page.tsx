'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { HeroBackground } from '@/components/HeroBackground'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Eye, EyeOff, Loader2 } from 'lucide-react'
import { useLanguage } from '@/lib/i18n/LanguageContext'
import { translations } from '@/lib/i18n/translations'

function LogoIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M10 2H22L30 10V22L22 30H10L2 22V10L10 2Z"
        stroke="currentColor"
        strokeWidth="2"
        fill="none"
      />
      <path
        d="M8 16C8 16 10 12 13 12C16 12 16 16 16 16C16 16 16 20 19 20C22 20 24 16 24 16C24 16 22 12 19 12C16 12 16 16 16 16C16 16 16 20 13 20C10 20 8 16 8 16Z"
        stroke="currentColor"
        strokeWidth="1.5"
        fill="none"
        strokeLinecap="round"
      />
      <circle cx="10" cy="2" r="1.5" fill="currentColor" />
      <circle cx="22" cy="2" r="1.5" fill="currentColor" />
      <circle cx="30" cy="10" r="1.5" fill="currentColor" />
      <circle cx="30" cy="22" r="1.5" fill="currentColor" />
      <circle cx="22" cy="30" r="1.5" fill="currentColor" />
      <circle cx="10" cy="30" r="1.5" fill="currentColor" />
      <circle cx="2" cy="22" r="1.5" fill="currentColor" />
      <circle cx="2" cy="10" r="1.5" fill="currentColor" />
    </svg>
  )
}

export default function LoginPage() {
  const router = useRouter()
  const { language } = useLanguage()
  const t = translations[language]

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    const supabase = createClient()

    const { error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (authError) {
      setError(authError.message)
      setIsLoading(false)
      return
    }

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

      router.push(profile?.role === 'mentor' ? '/dashboard/mentor' : '/dashboard/mentee')
    }
  }

  return (
    <div className="min-h-screen relative overflow-hidden">
      <HeroBackground />

      <div className="min-h-screen flex items-center justify-center px-4 relative z-10">
        <Card className="w-full max-w-[420px] bg-white border border-[#E2E4F0] rounded-2xl shadow-lg">
          <CardHeader className="text-center pb-2">
            <Link href="/" className="inline-flex items-center justify-center gap-2 mb-6 sm:mb-8">
              <LogoIcon className="w-8 h-8 text-[#1B2A72]" />
              <span className="font-heading font-extrabold text-3xl text-[#1B2A72]">DANA Connect</span>
            </Link>
            <h1 className="font-heading text-2xl sm:text-3xl font-extrabold text-[#1B2A72] mb-2">{t.pages.login.title}</h1>
            <p className="text-[var(--text-secondary)] text-base">{t.pages.login.subtitle}</p>
          </CardHeader>

          <CardContent className="pt-6">
            <form onSubmit={handleLogin} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-[var(--text-primary)] font-medium text-sm">
                  {t.pages.login.emailLabel}
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={t.pages.login.emailPlaceholder}
                  required
                  className="border-[1.5px] border-[var(--border)] rounded-lg px-4 py-3 text-sm focus:border-[var(--accent)] focus:ring-[3px] focus:ring-[rgba(79,99,210,0.1)] transition-all"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-[var(--text-primary)] font-medium text-sm">
                  {t.pages.login.passwordLabel}
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={t.pages.login.passwordPlaceholder}
                    required
                    className="border-[1.5px] border-[var(--border)] rounded-lg px-4 py-3 pr-10 text-sm focus:border-[var(--accent)] focus:ring-[3px] focus:ring-[rgba(79,99,210,0.1)] transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg px-4 py-3">
                  {error}
                </div>
              )}

              <Button
                type="submit"
                disabled={isLoading}
                className="w-full bg-[#1B2A72] hover:bg-[#2d3f99] text-white rounded-lg px-6 py-3 h-auto font-medium btn-hover-lift mt-2"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    {t.pages.login.signingIn}
                  </>
                ) : (
                  t.pages.login.signIn
                )}
              </Button>
            </form>

            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-[var(--border)]" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-[var(--text-muted)]">{t.pages.login.dividerOr}</span>
              </div>
            </div>

            <p className="text-center text-[var(--text-secondary)] text-sm">
              {t.pages.login.noAccount}{' '}
              <Link
                href="/register"
                className="text-[#1B2A72] hover:text-[#2d3f99] font-semibold transition-colors"
              >
                {t.pages.login.createOne}
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
