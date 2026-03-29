'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Loader2, CheckCircle, XCircle } from 'lucide-react'

type Status = 'loading' | 'success' | 'error'

export default function CompleteProfilePage() {
  const router = useRouter()
  const [status, setStatus] = useState<Status>('loading')
  const [error, setError] = useState('')

  useEffect(() => {
    const completeRegistration = async () => {
      const supabase = createClient()

      // Get the confirmed user
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser()

      if (userError || !user) {
        router.replace('/register')
        return
      }

      // Check if profile already exists (user might have clicked link twice)
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('id, role')
        .eq('id', user.id)
        .single()

      if (existingProfile) {
        // Profile already exists, just redirect
        setStatus('success')
        setTimeout(() => {
          router.push(
            existingProfile.role === 'mentor'
              ? '/dashboard/mentor'
              : '/dashboard/mentee'
          )
        }, 1500)
        return
      }

      // Get profile data from localStorage
      const pendingProfileStr = localStorage.getItem('dana_pending_profile')
      if (!pendingProfileStr) {
        router.replace('/register')
        return
      }

      let profileData
      try {
        profileData = JSON.parse(pendingProfileStr)
      } catch {
        setError('Invalid registration data. Please try registering again.')
        setStatus('error')
        return
      }

      // Insert the profile
      const { error: profileError } = await supabase.from('profiles').insert({
        id: user.id,
        full_name: profileData.full_name,
        email: profileData.email,
        phone: profileData.phone,
        role: profileData.role,
        specialization: profileData.specialization,
        title: profileData.title,
        motivation: profileData.motivation,
        linkedin_url: profileData.linkedin_url,
        institution: profileData.institution,
        photo_url: profileData.photo_url,
      })

      if (profileError) {
        // Check if it's a duplicate key error (profile already exists)
        if (profileError.code === '23505') {
          // Profile already exists, redirect
          setStatus('success')
          setTimeout(() => {
            router.push(
              profileData.role === 'mentor'
                ? '/dashboard/mentor'
                : '/dashboard/mentee'
            )
          }, 1500)
          return
        }
        setError(profileError.message)
        setStatus('error')
        return
      }

      // Clear the pending profile from localStorage
      localStorage.removeItem('dana_pending_profile')

      setStatus('success')

      // Redirect to appropriate dashboard
      setTimeout(() => {
        router.push(
          profileData.role === 'mentor'
            ? '/dashboard/mentor'
            : '/dashboard/mentee'
        )
      }, 1500)
    }

    completeRegistration()
  }, [router])

  return (
    <div className="min-h-screen bg-page flex items-center justify-center py-12 px-4">
      <Card className="bg-white border border-[var(--border)] rounded-2xl shadow-card max-w-md w-full">
        <CardHeader className="text-center pb-2">
          <Link href="/" className="inline-block mb-6">
            <span className="font-heading font-bold text-2xl text-[var(--primary)]">
              DANA Connect
            </span>
          </Link>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          {status === 'loading' && (
            <>
              <div className="w-16 h-16 bg-hero rounded-full flex items-center justify-center mx-auto">
                <Loader2 className="w-8 h-8 text-[var(--primary)] animate-spin" />
              </div>
              <h1 className="font-heading text-xl font-bold text-[var(--primary)]">
                Completing Registration...
              </h1>
              <p className="text-[var(--text-secondary)]">
                Please wait while we set up your account.
              </p>
            </>
          )}

          {status === 'success' && (
            <>
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
              <h1 className="font-heading text-xl font-bold text-[var(--primary)]">
                Email Confirmed!
              </h1>
              <p className="text-[var(--text-secondary)]">
                Your account has been verified. Redirecting to your dashboard...
              </p>
            </>
          )}

          {status === 'error' && (
            <>
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto">
                <XCircle className="w-8 h-8 text-red-600" />
              </div>
              <h1 className="font-heading text-xl font-bold text-[var(--primary)]">
                Something Went Wrong
              </h1>
              <p className="text-red-600 text-sm">{error}</p>
              <div className="flex gap-3 justify-center pt-4">
                <Link href="/register">
                  <Button className="bg-[var(--primary)] hover:bg-[var(--primary-light)] text-white rounded-lg">
                    Try Again
                  </Button>
                </Link>
                <Link href="/login">
                  <Button
                    variant="outline"
                    className="border-[1.5px] border-[var(--primary)] text-[var(--primary)] hover:bg-hero rounded-lg"
                  >
                    Login
                  </Button>
                </Link>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
