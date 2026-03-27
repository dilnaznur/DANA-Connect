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

export default function LoginPage() {
  const router = useRouter()
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

    // Get user role to redirect correctly
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
      {/* Full background with hero gradient */}
      <HeroBackground />
      
      {/* Content overlay */}
      <div className="min-h-screen flex items-center justify-center px-4 relative z-10">
        <Card className="w-full max-w-[420px] surface-card">
          <CardHeader className="text-center pb-2">
            <Link href="/" className="inline-block mb-8">
              <span className="font-heading font-bold text-3xl bg-gradient-to-r from-[#1B2A72] to-[#4F63D2] bg-clip-text text-transparent">
                DANA Connect
              </span>
            </Link>
            <h1 className="font-heading text-3xl font-bold text-[var(--primary)] mb-2">
              Welcome Back
            </h1>
            <p className="text-[var(--text-secondary)] text-base">
              Sign in to your account to continue
            </p>
          </CardHeader>
          
          <CardContent className="pt-6">
            <form onSubmit={handleLogin} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-[var(--text-primary)] font-medium text-sm">
                  Email Address
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                  className="border-[1.5px] border-[var(--border)] rounded-lg px-4 py-3 text-sm focus:border-[var(--accent)] focus:ring-[3px] focus:ring-[rgba(79,99,210,0.1)] transition-all"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-[var(--text-primary)] font-medium text-sm">
                  Password
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    required
                    className="border-[1.5px] border-[var(--border)] rounded-lg px-4 py-3 pr-10 text-sm focus:border-[var(--accent)] focus:ring-[3px] focus:ring-[rgba(79,99,210,0.1)] transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors"
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
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
                className="w-full bg-[var(--primary)] hover:bg-[var(--primary-light)] text-white rounded-lg px-6 py-3 h-auto font-medium btn-hover-lift mt-2"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  'Sign In'
                )}
              </Button>
            </form>

            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-[var(--border)]"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-[var(--text-muted)]">or</span>
              </div>
            </div>

            <p className="text-center text-[var(--text-secondary)] text-sm">
              Don&apos;t have an account?{' '}
              <Link
                href="/register"
                className="text-[var(--primary)] hover:text-[var(--primary-light)] font-semibold transition-colors"
              >
                Create one →
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
