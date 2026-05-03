import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next')

  if (code) {
    const supabase = await createClient()
    await supabase.auth.exchangeCodeForSession(code)
  }

  const isSafeNext =
    !!next &&
    next.startsWith('/') &&
    !next.startsWith('//') &&
    !next.includes('\n') &&
    !next.includes('\r')

  // Default behavior remains the same (complete profile).
  return NextResponse.redirect(
    new URL(isSafeNext ? next : '/auth/complete-profile', request.url)
  )
}
