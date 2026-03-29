import { createBrowserClient } from '@supabase/ssr'

type SupabaseBrowserClient = ReturnType<typeof createBrowserClient>

const globalForSupabase = globalThis as unknown as {
  __danaSupabaseBrowserClient?: SupabaseBrowserClient
}

export function createClient() {
  if (globalForSupabase.__danaSupabaseBrowserClient) {
    return globalForSupabase.__danaSupabaseBrowserClient
  }

  globalForSupabase.__danaSupabaseBrowserClient = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  return globalForSupabase.__danaSupabaseBrowserClient
}
