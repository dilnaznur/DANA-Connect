import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: Record<string, unknown>) {
          request.cookies.set({ name, value, ...options })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({ name, value, ...options })
        },
        remove(name: string, options: Record<string, unknown>) {
          request.cookies.set({ name, value: '', ...options })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({ name, value: '', ...options })
        },
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Protect all dashboard routes
  if (request.nextUrl.pathname.startsWith('/dashboard')) {
    if (!user) {
      return NextResponse.redirect(new URL('/login', request.url))
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    // If user has session but no profile, redirect to complete registration
    if (!profile) {
      return NextResponse.redirect(new URL('/auth/complete-profile', request.url))
    }

    const isMentorRoute = request.nextUrl.pathname.startsWith('/dashboard/mentor')
    const isMenteeRoute = request.nextUrl.pathname.startsWith('/dashboard/mentee')

    if (isMentorRoute && profile.role !== 'mentor') {
      return NextResponse.redirect(new URL('/dashboard/mentee', request.url))
    }
    if (isMenteeRoute && profile.role !== 'mentee') {
      return NextResponse.redirect(new URL('/dashboard/mentor', request.url))
    }
  }

  // Redirect logged-in users away from login/register (only if they have a profile)
  if (
    user &&
    (request.nextUrl.pathname === '/login' ||
      request.nextUrl.pathname === '/register')
  ) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    // Only redirect if profile exists - user may be mid-registration
    if (profile) {
      const dest =
        profile.role === 'mentor' ? '/dashboard/mentor' : '/dashboard/mentee'
      return NextResponse.redirect(new URL(dest, request.url))
    }
  }

  return response
}

export const config = {
  matcher: ['/dashboard/:path*', '/login', '/register'],
}
