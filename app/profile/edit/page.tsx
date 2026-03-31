'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import dynamic from 'next/dynamic'
import { createClient } from '@/lib/supabase/client'
import { NavBar } from '@/components/NavBar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { toast } from 'sonner'
import { Profile } from '@/lib/types'
import { Loader2, Camera, X, Mail } from 'lucide-react'

const HeroBackground = dynamic(
  () => import('@/components/HeroBackground').then((mod) => ({ default: mod.HeroBackground })),
  { ssr: false }
)

interface FormData {
  firstName: string
  lastName: string
  title: string
  institution: string
  specialization: string
  motivation: string
  linkedinUrl: string
}

export default function EditProfilePage() {
  const router = useRouter()
  const supabase = createClient()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [profile, setProfile] = useState<Profile | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [formData, setFormData] = useState<FormData>({
    firstName: '',
    lastName: '',
    title: '',
    institution: '',
    specialization: '',
    motivation: '',
    linkedinUrl: '',
  })
  const [photoFile, setPhotoFile] = useState<File | null>(null)
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const [currentPhotoUrl, setCurrentPhotoUrl] = useState<string | null>(null)

  useEffect(() => {
    const fetchProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        router.push('/login')
        return
      }

      const { data: profileData, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      if (error || !profileData) {
        toast.error('Failed to load profile')
        router.push('/')
        return
      }

      setProfile(profileData)
      setCurrentPhotoUrl(profileData.photo_url)

      // Split full_name into first and last
      const nameParts = profileData.full_name?.split(' ') || []
      const firstName = nameParts[0] || ''
      const lastName = nameParts.slice(1).join(' ') || ''

      setFormData({
        firstName,
        lastName,
        title: profileData.title || '',
        institution: profileData.institution || '',
        specialization: profileData.specialization || '',
        motivation: profileData.motivation || '',
        linkedinUrl: profileData.linkedin_url || '',
      })

      setIsLoading(false)
    }

    fetchProfile()
  }, [supabase, router])

  const updateField = (field: keyof FormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Photo must be less than 5MB')
        return
      }
      if (!file.type.startsWith('image/')) {
        toast.error('Please select an image file')
        return
      }
      setPhotoFile(file)
      setPhotoPreview(URL.createObjectURL(file))
    }
  }

  const removePhoto = () => {
    setPhotoFile(null)
    setPhotoPreview(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleSave = async () => {
    if (!profile) return

    if (!formData.firstName.trim() || !formData.lastName.trim()) {
      toast.error('First and last name are required')
      return
    }

    setIsSaving(true)

    let photoUrl = currentPhotoUrl

    // Upload new photo if selected
    if (photoFile) {
      const fileExt = photoFile.name.split('.').pop()
      const filePath = `${profile.id}/avatar.${fileExt}`

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, photoFile, { upsert: true })

      if (uploadError) {
        toast.error('Failed to upload photo: ' + uploadError.message)
        setIsSaving(false)
        return
      }

      const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(filePath)
      photoUrl = urlData.publicUrl
    }

    // Update profile
    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        full_name: `${formData.firstName.trim()} ${formData.lastName.trim()}`,
        title: formData.title.trim() || null,
        institution: formData.institution.trim() || null,
        specialization: formData.specialization.trim() || null,
        motivation: formData.motivation.trim() || null,
        linkedin_url: formData.linkedinUrl.trim() || null,
        photo_url: photoUrl,
      })
      .eq('id', profile.id)

    if (updateError) {
      toast.error('Failed to update profile: ' + updateError.message)
      setIsSaving(false)
      return
    }

    toast.success('Profile updated successfully!')

    // Redirect to appropriate dashboard
    const dashboardUrl = profile.role === 'mentor' ? '/dashboard/mentor' : '/dashboard/mentee'
    router.push(dashboardUrl)
  }

  const handleCancel = () => {
    if (!profile) {
      router.push('/')
      return
    }
    const dashboardUrl = profile.role === 'mentor' ? '/dashboard/mentor' : '/dashboard/mentee'
    router.push(dashboardUrl)
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#EEEDF8]">
        <NavBar />
        <div className="flex items-center justify-center py-40">
          <Loader2 className="w-8 h-8 animate-spin text-[#1B2A72]" />
        </div>
      </div>
    )
  }

  const displayPhoto = photoPreview || currentPhotoUrl

  return (
    <div className="min-h-screen bg-[#EEEDF8]">
      <NavBar />

      {/* Hero Section */}
      <section className="relative py-12 lg:py-16 overflow-hidden">
        <HeroBackground />
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          <h1 className="font-heading text-2xl sm:text-[32px] lg:text-[42px] font-extrabold text-[#1B2A72] leading-tight">
            Edit Your Profile
          </h1>
          <p className="text-base sm:text-lg text-[var(--text-secondary)] mt-2">
            Update your information and personalize your profile
          </p>
        </div>
      </section>

      {/* Form Section */}
      <section className="pb-16 lg:pb-24">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
          <Card className="bg-white border-0 rounded-3xl shadow-[0_20px_60px_rgba(27,42,114,0.1)]">
            <CardContent className="p-6 sm:p-8">
              <div className="space-y-6">
                {/* Photo Upload */}
                <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6">
                  <div className="relative">
                    {displayPhoto ? (
                      <div className="relative w-20 h-20 sm:w-24 sm:h-24">
                        <Image
                          src={displayPhoto}
                          alt="Profile photo"
                          fill
                          className="rounded-full object-cover"
                        />
                        {photoPreview && (
                          <button
                            type="button"
                            onClick={removePhoto}
                            className="absolute -top-1 -right-1 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-[#E8E9F8] flex items-center justify-center text-[#1B2A72] hover:bg-[#DDDDF0] transition-colors"
                      >
                        <Camera className="w-7 h-7 sm:w-8 sm:h-8" />
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
                  <div className="flex-1 min-w-0">
                    <Label className="text-sm font-medium text-[#1B2A72]">Profile Photo</Label>
                    <p className="text-sm text-[var(--text-muted)] mt-1">
                      Upload a photo to personalize your profile. Max 5MB.
                    </p>
                    {displayPhoto && !photoPreview && (
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="text-sm text-[var(--accent)] hover:underline mt-2"
                      >
                        Change photo
                      </button>
                    )}
                  </div>
                </div>

                {/* Name Fields */}
                <div className="space-y-4">
                  <h3 className="font-heading font-semibold text-[#1B2A72] text-sm uppercase tracking-wide">
                    Personal Information
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="firstName" className="text-sm font-medium">
                        First Name *
                      </Label>
                      <Input
                        id="firstName"
                        value={formData.firstName}
                        onChange={(e) => updateField('firstName', e.target.value)}
                        placeholder="Jane"
                        className="border-[1.5px] border-[var(--border)] rounded-lg"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lastName" className="text-sm font-medium">
                        Last Name *
                      </Label>
                      <Input
                        id="lastName"
                        value={formData.lastName}
                        onChange={(e) => updateField('lastName', e.target.value)}
                        placeholder="Smith"
                        className="border-[1.5px] border-[var(--border)] rounded-lg"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="title" className="text-sm font-medium">
                      Title / Position
                    </Label>
                    <Input
                      id="title"
                      value={formData.title}
                      onChange={(e) => updateField('title', e.target.value)}
                      placeholder="e.g., PhD Student, Research Fellow, Professor"
                      className="border-[1.5px] border-[var(--border)] rounded-lg"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="institution" className="text-sm font-medium">
                      Institution / University
                    </Label>
                    <Input
                      id="institution"
                      value={formData.institution}
                      onChange={(e) => updateField('institution', e.target.value)}
                      placeholder="Al-Farabi Kazakh National University"
                      className="border-[1.5px] border-[var(--border)] rounded-lg"
                    />
                  </div>
                </div>

                {/* Profile Details */}
                <div className="space-y-4 pt-4 border-t border-[var(--border)]">
                  <h3 className="font-heading font-semibold text-[#1B2A72] text-sm uppercase tracking-wide">
                    Profile Details
                  </h3>

                  <div className="space-y-2">
                    <Label htmlFor="specialization" className="text-sm font-medium">
                      Specialization
                    </Label>
                    <Input
                      id="specialization"
                      value={formData.specialization}
                      onChange={(e) => updateField('specialization', e.target.value)}
                      placeholder="e.g., Machine Learning, Biomedical Engineering"
                      className="border-[1.5px] border-[var(--border)] rounded-lg"
                    />
                    <p className="text-xs text-[var(--text-muted)]">
                      This appears as a tag on your profile card
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="motivation" className="text-sm font-medium">
                      Bio
                    </Label>
                    <Textarea
                      id="motivation"
                      value={formData.motivation}
                      onChange={(e) => updateField('motivation', e.target.value)}
                      placeholder="Tell us about yourself, your interests, and what you hope to achieve..."
                      rows={4}
                      className="border-[1.5px] border-[var(--border)] rounded-lg"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="linkedin" className="text-sm font-medium">
                      LinkedIn URL
                    </Label>
                    <Input
                      id="linkedin"
                      type="url"
                      value={formData.linkedinUrl}
                      onChange={(e) => updateField('linkedinUrl', e.target.value)}
                      placeholder="https://linkedin.com/in/yourprofile"
                      className="border-[1.5px] border-[var(--border)] rounded-lg"
                    />
                  </div>
                </div>

                {/* Contact Email (Read-only) */}
                <div className="space-y-4 pt-4 border-t border-[var(--border)]">
                  <h3 className="font-heading font-semibold text-[#1B2A72] text-sm uppercase tracking-wide">
                    Account Information
                  </h3>

                  <div className="bg-[#F5F5FB] rounded-lg p-4">
                    <div className="flex items-center gap-3">
                      <Mail className="w-5 h-5 text-[var(--text-muted)]" />
                      <div>
                        <Label className="text-sm font-medium text-[var(--text-muted)]">
                          Email Address
                        </Label>
                        <p className="text-sm text-[#1B2A72] font-medium">
                          {profile?.email}
                        </p>
                      </div>
                    </div>
                    <p className="text-xs text-[var(--text-muted)] mt-2">
                      Contact support if you need to change your email address
                    </p>
                  </div>

                  <div className="bg-[#F5F5FB] rounded-lg p-4">
                    <div className="flex items-center gap-3">
                      <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                        profile?.role === 'mentor'
                          ? 'bg-purple-100 text-purple-700'
                          : 'bg-blue-100 text-blue-700'
                      }`}>
                        {profile?.role === 'mentor' ? 'Mentor' : 'Mentee'}
                      </div>
                      <p className="text-sm text-[var(--text-muted)]">
                        Your account role
                      </p>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-4 pt-6">
                  <Button
                    variant="outline"
                    onClick={handleCancel}
                    disabled={isSaving}
                    className="flex-1 border-[var(--border)] text-[var(--text-secondary)] hover:bg-[#F5F5FB] rounded-lg"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="flex-1 bg-[#1B2A72] hover:bg-[#2d3f99] text-white rounded-lg"
                  >
                    {isSaving ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      'Save Changes'
                    )}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  )
}
