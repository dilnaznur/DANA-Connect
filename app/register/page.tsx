'use client'

import { useState, useRef } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import dynamic from 'next/dynamic'
import { createClient } from '@/lib/supabase/client'
import { SupabaseClient } from '@supabase/supabase-js'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { Eye, EyeOff, Loader2, GraduationCap, Users, Mail, ArrowRight, Camera, X } from 'lucide-react'
import { Role } from '@/lib/types'

// Lazy load HeroBackground to avoid blocking initial render
const HeroBackground = dynamic(
  () => import('@/components/HeroBackground').then((mod) => ({ default: mod.HeroBackground })),
  { ssr: false }
)

interface FormData {
  firstName: string
  lastName: string
  email: string
  password: string
  phone: string
  institution: string
  role: Role | ''
  specialization: string
  title: string
  motivation: string
  linkedinUrl: string
}

export default function RegisterPage() {
  const [formData, setFormData] = useState<FormData>({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    phone: '',
    institution: '',
    role: '',
    specialization: '',
    title: '',
    motivation: '',
    linkedinUrl: '',
  })
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<keyof FormData, string>>>({})
  const [isLoading, setIsLoading] = useState(false)
  const [emailSent, setEmailSent] = useState(false)
  const [photoFile, setPhotoFile] = useState<File | null>(null)
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const updateField = (field: keyof FormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    setFieldErrors((prev) => ({ ...prev, [field]: '' }))
  }

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setError('Photo must be less than 5MB')
        return
      }
      if (!file.type.startsWith('image/')) {
        setError('Please select an image file')
        return
      }
      setPhotoFile(file)
      setPhotoPreview(URL.createObjectURL(file))
      setError('')
    }
  }

  const removePhoto = () => {
    setPhotoFile(null)
    setPhotoPreview(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const validateForm = (): boolean => {
    const errors: Partial<Record<keyof FormData, string>> = {}

    if (!formData.firstName.trim()) errors.firstName = 'First name is required'
    if (!formData.lastName.trim()) errors.lastName = 'Last name is required'
    if (!formData.email.trim()) errors.email = 'Email is required'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = 'Please enter a valid email address'
    }
    if (!formData.password) errors.password = 'Password is required'
    else if (formData.password.length < 8) {
      errors.password = 'Password must be at least 8 characters'
    }
    if (!formData.role) errors.role = 'Please select a role'

    setFieldErrors(errors)
    return Object.keys(errors).length === 0
  }

  // Upload photo in background - returns photo URL or null
  const uploadPhotoInBackground = async (
    supabase: SupabaseClient,
    userId: string,
    file: File
  ): Promise<string | null> => {
    const fileExt = file.name.split('.').pop()
    const filePath = `${userId}/avatar.${fileExt}`

    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(filePath, file, { upsert: true })

    if (uploadError) {
      console.error('Photo upload error:', uploadError)
      return null
    }

    const { data } = supabase.storage.from('avatars').getPublicUrl(filePath)

    // Update the profile with photo_url after upload completes
    await supabase
      .from('profiles')
      .update({ photo_url: data.publicUrl })
      .eq('id', userId)

    return data.publicUrl
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!validateForm()) return

    setIsLoading(true)

    // Create supabase client once
    const supabase = createClient()

    // 1. Create auth user (email confirmation required)
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: formData.email,
      password: formData.password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    })

    if (authError) {
      setError(authError.message)
      setIsLoading(false)
      return
    }

    if (!authData.user) {
      setError('Failed to create account')
      setIsLoading(false)
      return
    }

    // 2. Save profile data to localStorage IMMEDIATELY (don't wait for photo)
    const profileData = {
      id: authData.user.id,
      full_name: `${formData.firstName.trim()} ${formData.lastName.trim()}`,
      email: formData.email.trim(),
      phone: formData.phone.trim() || null,
      role: formData.role as Role,
      specialization: formData.specialization.trim() || null,
      title: formData.title.trim() || null,
      motivation: formData.motivation.trim() || null,
      linkedin_url: formData.linkedinUrl.trim() || null,
      institution: formData.institution.trim() || null,
      photo_url: null, // Will be updated by background upload
    }
    localStorage.setItem('dana_pending_profile', JSON.stringify(profileData))

    // 3. Start photo upload in background (fire and forget)
    if (photoFile) {
      // Don't await - let it run in background
      uploadPhotoInBackground(supabase, authData.user.id, photoFile).catch((err) => {
        console.error('Background photo upload failed:', err)
      })
    }

    // 4. Show check email message immediately
    setIsLoading(false)
    setEmailSent(true)
  }

  // Show check email message after successful signup
  if (emailSent) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#EEEEF8] via-[#EEEEF8] to-[#E8E8F5] relative flex items-center justify-center py-12 px-4">
        <HeroBackground />
        <Card className="w-full max-w-md bg-white border-0 rounded-3xl shadow-[0_20px_60px_rgba(27,42,114,0.15)] relative z-10">
          <CardContent className="pt-8 px-8 pb-8 text-center">
            <div className="w-16 h-16 bg-[var(--bg-hero)] rounded-full flex items-center justify-center mx-auto mb-4">
              <Mail className="w-8 h-8 text-[var(--primary)]" />
            </div>
            <h1 className="font-heading text-2xl font-bold text-[var(--primary)] mb-2">
              Check Your Email
            </h1>
            <p className="text-[var(--text-secondary)] mb-6">
              We&apos;ve sent a confirmation link to <strong>{formData.email}</strong>.
              Please click the link to complete your registration.
            </p>
            <p className="text-sm text-[var(--text-muted)] mb-6">
              If you don&apos;t see the email, check your spam folder.
            </p>
            <Link href="/login">
              <Button className="w-full bg-[var(--primary)] hover:bg-[var(--primary-light)] text-white rounded-lg btn-hover-lift">
                Back to Login
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-2">
      {/* Left Panel - Hero Background with Quote (lazy loaded) */}
      <div className="hidden lg:flex relative overflow-hidden bg-gradient-to-br from-[#1B2A72] to-[#4F63D2]">
        <HeroBackground />
        <div className="relative z-10 flex flex-col items-start justify-between p-12">
          <Link href="/" className="inline-block">
            <span className="font-heading font-bold text-3xl text-white">
              DANA Connect
            </span>
          </Link>

          <div className="max-w-sm">
            <blockquote className="space-y-4">
              <p className="font-heading text-3xl font-bold text-white leading-tight">
                Empowering the next generation of women scientists in Kazakhstan
              </p>
              <p className="text-white/80 text-lg">
                Join a community dedicated to breaking barriers and building futures in STEM.
              </p>
            </blockquote>
          </div>
        </div>
      </div>

      {/* Right Panel - Registration Form */}
      <div className="bg-white flex flex-col items-center justify-center py-12 px-4 lg:py-20 lg:px-12 overflow-y-auto">
        <div className="w-full max-w-md">
          {/* Mobile Header */}
          <div className="lg:hidden mb-8 text-center">
            <Link href="/" className="inline-block mb-6">
              <span className="font-heading font-bold text-3xl bg-gradient-to-r from-[#1B2A72] to-[#4F63D2] bg-clip-text text-transparent">
                DANA Connect
              </span>
            </Link>
            <h1 className="font-heading text-2xl font-bold text-[var(--primary)] mb-2">
              Create Your Account
            </h1>
            <p className="text-[var(--text-secondary)]">
              Join our community of mentors and mentees
            </p>
          </div>

          {/* Desktop Header */}
          <div className="hidden lg:block mb-12">
            <h1 className="font-heading text-3xl font-bold text-[var(--primary)] mb-2">
              Create Your Account
            </h1>
            <p className="text-[var(--text-secondary)]">
              Join our community of mentors and mentees
            </p>
          </div>

          <form onSubmit={handleRegister} className="space-y-6">
            {/* Personal Details */}
            <div className="space-y-3">
              <h3 className="font-heading font-semibold text-[var(--primary)] text-sm uppercase tracking-wide">
                Personal Details
              </h3>

              {/* Photo Upload */}
              <div className="flex items-center gap-4">
                <div className="relative">
                  {photoPreview ? (
                    <div className="relative w-20 h-20">
                      <Image
                        src={photoPreview}
                        alt="Profile preview"
                        fill
                        className="rounded-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={removePhoto}
                        className="absolute -top-1 -right-1 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="w-20 h-20 rounded-full bg-[#E8E9F8] flex items-center justify-center text-[#1B2A72] hover:bg-[#DDDDF0] transition-colors"
                    >
                      <Camera className="w-6 h-6" />
                    </button>
                  )}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoChange}
                    className="hidden"
                  />
                </div>
                <div className="flex-1">
                  <Label className="text-xs font-medium">Profile Photo (Optional)</Label>
                  <p className="text-xs text-[var(--text-muted)] mt-0.5">
                    Add a photo to personalize your profile. Max 5MB.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label htmlFor="firstName" className="text-xs font-medium">First Name *</Label>
                  <Input
                    id="firstName"
                    value={formData.firstName}
                    onChange={(e) => updateField('firstName', e.target.value)}
                    placeholder="Jane"
                    className={`border-[1.5px] rounded-lg px-3 py-2 text-sm ${
                      fieldErrors.firstName ? 'border-red-500' : 'border-[var(--border)]'
                    }`}
                  />
                  {fieldErrors.firstName && (
                    <p className="text-red-500 text-xs">{fieldErrors.firstName}</p>
                  )}
                </div>
                <div className="space-y-1">
                  <Label htmlFor="lastName" className="text-xs font-medium">Last Name *</Label>
                  <Input
                    id="lastName"
                    value={formData.lastName}
                    onChange={(e) => updateField('lastName', e.target.value)}
                    placeholder="Smith"
                    className={`border-[1.5px] rounded-lg px-3 py-2 text-sm ${
                      fieldErrors.lastName ? 'border-red-500' : 'border-[var(--border)]'
                    }`}
                  />
                  {fieldErrors.lastName && (
                    <p className="text-red-500 text-xs">{fieldErrors.lastName}</p>
                  )}
                </div>
              </div>

              <div className="space-y-1">
                <Label htmlFor="email" className="text-xs font-medium">Email Address *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => updateField('email', e.target.value)}
                  placeholder="you@example.com"
                  className={`border-[1.5px] rounded-lg px-3 py-2 text-sm ${
                    fieldErrors.email ? 'border-red-500' : 'border-[var(--border)]'
                  }`}
                />
                {fieldErrors.email && (
                  <p className="text-red-500 text-xs">{fieldErrors.email}</p>
                )}
              </div>

              <div className="space-y-1">
                <Label htmlFor="password" className="text-xs font-medium">Password * (Min 8 characters)</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={(e) => updateField('password', e.target.value)}
                    placeholder="••••••••"
                    className={`border-[1.5px] rounded-lg px-3 py-2 pr-10 text-sm ${
                      fieldErrors.password ? 'border-red-500' : 'border-[var(--border)]'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-secondary)]"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {fieldErrors.password && (
                  <p className="text-red-500 text-xs">{fieldErrors.password}</p>
                )}
              </div>

              <div className="space-y-1">
                <Label htmlFor="phone" className="text-xs font-medium">Phone (Optional)</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => updateField('phone', e.target.value)}
                  placeholder="+7 XXX XXX XXXX"
                  className="border-[1.5px] border-[var(--border)] rounded-lg px-3 py-2 text-sm"
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="title" className="text-xs font-medium">Title / Position</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => updateField('title', e.target.value)}
                  placeholder="e.g., PhD Student, Research Fellow, Professor"
                  className="border-[1.5px] border-[var(--border)] rounded-lg px-3 py-2 text-sm"
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="institution" className="text-xs font-medium">Institution / University</Label>
                <Input
                  id="institution"
                  value={formData.institution}
                  onChange={(e) => updateField('institution', e.target.value)}
                  placeholder="Al-Farabi Kazakh National University"
                  className="border-[1.5px] border-[var(--border)] rounded-lg px-3 py-2 text-sm"
                />
              </div>
            </div>

            {/* Role Selector */}
            <div className="space-y-3 pt-2">
              <h3 className="font-heading font-semibold text-[var(--primary)] text-sm uppercase tracking-wide">
                I want to join as... *
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => updateField('role', 'mentor')}
                  className={`relative p-4 rounded-xl border-2 text-left transition-all group ${
                    formData.role === 'mentor'
                      ? 'border-[var(--primary)] bg-gradient-to-br from-[#1B2A72]/5 to-[#4F63D2]/5'
                      : 'border-[var(--border)] hover:border-[var(--primary)]'
                  }`}
                >
                  {formData.role === 'mentor' && (
                    <div className="absolute top-2 right-2">
                      <div className="w-5 h-5 bg-[var(--primary)] rounded-full flex items-center justify-center">
                        <ArrowRight className="w-3 h-3 text-white" />
                      </div>
                    </div>
                  )}
                  <Users className="w-6 h-6 text-[var(--primary)] mb-2" />
                  <h4 className="font-heading font-semibold text-[var(--primary)] text-sm">
                    Mentor
                  </h4>
                  <p className="text-xs text-[var(--text-secondary)] mt-1">
                    Share expertise
                  </p>
                </button>
                <button
                  type="button"
                  onClick={() => updateField('role', 'mentee')}
                  className={`relative p-4 rounded-xl border-2 text-left transition-all group ${
                    formData.role === 'mentee'
                      ? 'border-[var(--primary)] bg-gradient-to-br from-[#1B2A72]/5 to-[#4F63D2]/5'
                      : 'border-[var(--border)] hover:border-[var(--primary)]'
                  }`}
                >
                  {formData.role === 'mentee' && (
                    <div className="absolute top-2 right-2">
                      <div className="w-5 h-5 bg-[var(--primary)] rounded-full flex items-center justify-center">
                        <ArrowRight className="w-3 h-3 text-white" />
                      </div>
                    </div>
                  )}
                  <GraduationCap className="w-6 h-6 text-[var(--primary)] mb-2" />
                  <h4 className="font-heading font-semibold text-[var(--primary)] text-sm">
                    Mentee
                  </h4>
                  <p className="text-xs text-[var(--text-secondary)] mt-1">
                    Learn & grow
                  </p>
                </button>
              </div>
              {fieldErrors.role && (
                <p className="text-red-500 text-xs">{fieldErrors.role}</p>
              )}
            </div>

            {/* Profile Details */}
            <div className="space-y-3 pt-2">
              <h3 className="font-heading font-semibold text-[var(--primary)] text-sm uppercase tracking-wide">
                Profile Details (Optional)
              </h3>

              <div className="space-y-1">
                <Label htmlFor="specialization" className="text-xs font-medium">Your Specialization (for tag)</Label>
                <Input
                  id="specialization"
                  value={formData.specialization}
                  onChange={(e) => updateField('specialization', e.target.value)}
                  placeholder="e.g., Machine Learning, Biomedical Engineering"
                  className="border-[1.5px] border-[var(--border)] rounded-lg px-3 py-2 text-sm"
                />
                <p className="text-xs text-[var(--text-muted)]">This will appear as a tag on your profile card</p>
              </div>

              <div className="space-y-1">
                <Label htmlFor="motivation" className="text-xs font-medium">Bio / Why join DANA Connect?</Label>
                <Textarea
                  id="motivation"
                  value={formData.motivation}
                  onChange={(e) => updateField('motivation', e.target.value)}
                  placeholder="Tell us about yourself and what you hope to achieve..."
                  rows={3}
                  className="border-[1.5px] border-[var(--border)] rounded-lg px-3 py-2 text-sm"
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="linkedin" className="text-xs font-medium">LinkedIn Profile</Label>
                <Input
                  id="linkedin"
                  type="url"
                  value={formData.linkedinUrl}
                  onChange={(e) => updateField('linkedinUrl', e.target.value)}
                  placeholder="https://linkedin.com/in/yourprofile"
                  className="border-[1.5px] border-[var(--border)] rounded-lg px-3 py-2 text-sm"
                />
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
              className="w-full bg-[var(--primary)] hover:bg-[var(--primary-light)] text-white rounded-lg px-6 py-3 h-auto font-medium btn-hover-lift mt-4"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Creating account...
                </>
              ) : (
                <>
                  Create Account
                  <ArrowRight className="w-4 h-4 ml-2" />
                </>
              )}
            </Button>

            <p className="text-center text-[var(--text-secondary)] text-sm">
              Already have an account?{' '}
              <Link
                href="/login"
                className="text-[var(--primary)] hover:text-[var(--primary-light)] font-semibold transition-colors"
              >
                Sign in
              </Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  )
}
