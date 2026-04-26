# DANA Connect — Programming Reference (per-file)

This document is a programming-focused reference for the DANA Connect codebase.

## Scope

- Included: source files under `app/`, `components/`, `lib/`, `tests/`, plus root configuration/docs/SQL files.
- Excluded (generated/dependencies): `.next/`, `node_modules/`, `.git/`.
- Sensitive local files: `.env.local` is **not reproduced** (values omitted).

## How to read “DB queries”

- This project uses Supabase.
- In frontend code, “queries” are usually Supabase PostgREST calls (e.g., `supabase.from('profiles').select(...)`).
- For accuracy, the **exact query calls as written in code** are shown; each is categorized as SELECT/INSERT/UPDATE/DELETE/RPC/Storage.

---

## Root configuration & docs

### File: `package.json` (root)

**Purpose**

- Declares the Node/Next.js project metadata, scripts, runtime dependencies, and dev dependencies.

**Functions/Methods**

- None (JSON manifest).

**Key snippet**

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "test": "vitest run"
  }
}
```

**DB queries**

- None.

---

### File: `package-lock.json` (root)

**Purpose**

- Locks dependency versions/resolution metadata for reproducible installs with npm.

**Functions/Methods**

- None (lockfile).

**Key snippet**

```json
{
  "lockfileVersion": 3,
  "packages": {
    "": {
      "dependencies": { "next": "14.2.35" }
    }
  }
}
```

**DB queries**

- None.

---

### File: `next.config.mjs` (root)

**Purpose**

- Next.js configuration entrypoint (currently defaults/empty config).

**Functions/Methods**

- None.

**Key snippet**

```js
/** @type {import('next').NextConfig} */
const nextConfig = {};

export default nextConfig;
```

**DB queries**

- None.

---

### File: `tsconfig.json` (root)

**Purpose**

- TypeScript compiler configuration for the project (strict, noEmit, Next.js plugin, path alias `@/*`).

**Functions/Methods**

- None.

**Key snippet**

```json
{
  "compilerOptions": {
    "strict": true,
    "noEmit": true,
    "moduleResolution": "bundler",
    "paths": {
      "@/*": ["./*"]
    }
  }
}
```

**DB queries**

- None.

---

### File: `tailwind.config.ts` (root)

**Purpose**

- TailwindCSS config: content globs + theme extensions mapped to CSS variables used across the design system.

**Functions/Methods**

- None (exports a config object).

**Key snippet**

```ts
const config: Config = {
  theme: {
    extend: {
      colors: {
        primary: { DEFAULT: "var(--primary)", light: "var(--primary-light)" },
        accent: "var(--accent)",
        border: "var(--border)",
      },
    },
  },
};
```

**DB queries**

- None.

---

### File: `postcss.config.mjs` (root)

**Purpose**

- PostCSS config enabling TailwindCSS processing.

**Functions/Methods**

- None.

**Key snippet**

```js
const config = {
  plugins: {
    tailwindcss: {},
  },
};

export default config;
```

**DB queries**

- None.

---

### File: `vitest.config.ts` (root)

**Purpose**

- Vitest configuration (React plugin, `happy-dom` environment, test include globs, `@` path alias).

**Functions/Methods**

- `defineConfig(config)` (library call)
  - What it does: creates a typed Vitest/Vite configuration object.
  - Parameters: `config` object.
  - Returns: Vite config (exported as default).

**Key snippet**

```ts
export default defineConfig({
  test: {
    environment: "happy-dom",
    setupFiles: ["./tests/setup.ts"],
  },
});
```

**DB queries**

- None.

---

### File: `middleware.ts` (root)

**Purpose**

- Next.js Middleware that enforces authentication and role-based routing for dashboard pages, and redirects logged-in users away from `/login` and `/register` once a profile exists.

**Functions/Methods**

- `middleware(request: NextRequest)`
  - What it does: loads Supabase user from cookies, gates routes, performs redirects.
  - Parameters: `request` (Next.js request wrapper).
  - Returns/Affects: returns a `NextResponse` (either `next()` or `redirect()`), and may set/remove auth cookies.
- Cookie adapter methods (passed to `createServerClient`):
  - `cookies.get(name: string)` → returns cookie value (string | undefined)
  - `cookies.set(name: string, value: string, options: Record<string, unknown>)` → mutates request/response cookies
  - `cookies.remove(name: string, options: Record<string, unknown>)` → clears cookie in request/response
- `config` export
  - What it does: tells Next.js which routes the middleware applies to.
  - Returns/Affects: used by Next.js at build/runtime.

**Key snippet**

```ts
if (request.nextUrl.pathname.startsWith("/dashboard")) {
  if (!user) return NextResponse.redirect(new URL("/login", request.url));

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profile) {
    return NextResponse.redirect(
      new URL("/auth/complete-profile", request.url),
    );
  }
}
```

**DB queries**

- SELECT (`profiles`):
  - `supabase.from('profiles').select('role').eq('id', user.id).single()`
- Auth session read:
  - `supabase.auth.getUser()`

---

### File: `components.json` (root)

**Purpose**

- shadcn/ui generator configuration: paths, styling preset, Tailwind integration, component aliases.

**Functions/Methods**

- None.

**Key snippet**

```json
{
  "tailwind": { "config": "tailwind.config.ts", "css": "app/globals.css" },
  "aliases": { "ui": "@/components/ui", "utils": "@/lib/utils" }
}
```

**DB queries**

- None.

---

### File: `.eslintrc.json` (root)

**Purpose**

- ESLint configuration for Next.js core web vitals + TypeScript.

**Functions/Methods**

- None.

**Key snippet**

```json
{ "extends": ["next/core-web-vitals", "next/typescript"] }
```

**DB queries**

- None.

---

### File: `next-env.d.ts` (root)

**Purpose**

- Next.js-generated TypeScript ambient type references.

**Functions/Methods**

- None.

**Key snippet**

```ts
/// <reference types="next" />
/// <reference types="next/image-types/global" />
```

**DB queries**

- None.

---

### File: `.gitignore` (root)

**Purpose**

- Git ignore rules to avoid committing dependencies, build outputs, local env files, and other noise.

**Functions/Methods**

- None.

**Key snippet**

```gitignore
/node_modules
/.next/
.env*.local
*.tsbuildinfo
```

**DB queries**

- None.

---

### File: `.env.local` (root)

**Purpose**

- Local-only environment variables (Supabase keys, Resend key, etc.).

**Functions/Methods**

- None.

**Key snippet**

- Omitted (may contain secrets).

**DB queries**

- None.

---

### File: `README.md` (root)

**Purpose**

- Project-level readme (currently the default Next.js template).

**Functions/Methods**

- None.

**Key snippet**

```md
## Getting Started

First, run the development server:

npm run dev
```

**DB queries**

- None.

---

### File: `TESTING.md` (root)

**Purpose**

- Testing checklist/evidence guidance and a table of automated/manual test cases.

**Functions/Methods**

- None.

**Key snippet**

```md
## Automated tests (Vitest)

Run:

- `npm test`
```

**DB queries**

- None.

---

### File: `TECHNICAL_OVERVIEW.md` (root)

**Purpose**

- High-level technical documentation describing architecture, structure, and Supabase schema notes.

**Functions/Methods**

- None.

**Key snippet**

- N/A (documentation).

**DB queries**

- None.

---

### File: `PROCESS_FLOWS.md` (root)

**Purpose**

- Flowchart-ready documentation of implemented user/system processes (auth, applications, projects, etc.).

**Functions/Methods**

- None.

**Key snippet**

- N/A (documentation).

**DB queries**

- None.

---

## app/

### File: `app/layout.tsx`

**Purpose**

- Defines the root HTML layout for all routes, sets up global fonts, wraps the app in `LanguageProvider`, and mounts the global toast `Toaster`.

**Functions/Methods**

- `RootLayout({ children })`
  - What it does: renders `<html>`/`<body>` wrapper, provides language context, and injects toast provider.
  - Parameters: `children` (React node).
  - Returns/Affects: returns layout JSX used by Next.js App Router.
- `Inter(options)` (library call)
  - What it does: configures the Inter font and CSS variable.
  - Parameters: `subsets`, `variable`, `display`.
  - Returns: font object used for className variables.
- `DM_Sans(options)` (library call)
  - What it does: configures DM Sans font and CSS variable.
  - Parameters: `subsets`, `variable`, `display`.
  - Returns: font object used for className variables.

**Key snippet**

```tsx
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} ${dmSans.variable}`}>
      <body className="font-body antialiased bg-page text-primary">
        <LanguageProvider>
          {children}
          <Toaster position="top-right" />
        </LanguageProvider>
      </body>
    </html>
  );
}
```

**DB queries**

- None.

---

### File: `app/globals.css`

**Purpose**

- Global CSS: defines the design-system CSS variables and Tailwind layers/utilities used throughout the UI.

**Functions/Methods**

- None (CSS).

**Key snippet**

```css
:root {
  --primary: #1b2a72;
  --accent: #4f63d2;
  --bg-page: #f7f7fb;
  --text-secondary: #5a6480;
}

@layer base {
  body {
    @apply bg-[var(--bg-page)] text-[var(--text-primary)] leading-relaxed;
  }
}
```

**DB queries**

- None.

---

### File: `app/page.tsx`

**Purpose**

- Server-rendered home page: fetches summary stats and recent mentors/opportunities from Supabase, then renders `HomeContent`.

**Functions/Methods**

- `HomePage({ searchParams })` (async server component)
  - What it does: reads `?deleted=true`, queries Supabase for counts and recent records, renders the landing page.
  - Parameters: `searchParams?: Promise<{ deleted?: string }>`.
  - Returns/Affects: returns JSX (server-rendered).

**Key snippet**

```ts
const { data: opportunities } = await supabase
  .from("research_opportunities")
  .select(
    `
		id, title, description, tags, total_spots, filled_spots, duration, created_at,
		mentor:profiles(full_name, institution)
	`,
  )
  .eq("is_open", true)
  .order("created_at", { ascending: false })
  .limit(3);
```

**DB queries**

- SELECT count (`profiles`, mentors):
  - `supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'mentor')`
- SELECT count (`profiles`, mentees):
  - `supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'mentee')`
- SELECT count (`research_opportunities`):
  - `supabase.from('research_opportunities').select('*', { count: 'exact', head: true })`
- SELECT list (`profiles`, mentors):
  - `supabase.from('profiles').select('id, full_name, institution, specialization, title, photo_url, created_at').eq('role','mentor').order('created_at',{ ascending:false }).limit(6)`
- SELECT list (`research_opportunities` + joined mentor profile):
  - `supabase.from('research_opportunities').select(`... mentor:profiles(full_name, institution) ...`).eq('is_open', true).order('created_at',{ ascending:false }).limit(3)`

---

### File: `app/about/page.tsx`

**Purpose**

- Client-rendered About page that displays marketing/mission content and pulls localized strings from the language context.

**Functions/Methods**

- `AboutPage()`
  - What it does: renders About page content using current language translations.
  - Parameters: none.
  - Returns: JSX.

**Key snippet**

```ts
const { language } = useLanguage();
const t = translations[language];
```

**DB queries**

- None.

---

### File: `app/login/page.tsx`

**Purpose**

- Client-rendered login page: signs users in via Supabase Auth, then routes them to mentor/mentee dashboards based on `profiles.role`.

**Functions/Methods**

- `LogoIcon({ className })`
  - What it does: renders an inline SVG logo.
  - Parameters: `className?: string`.
  - Returns: JSX (`<svg>`).
- `LoginPage()`
  - What it does: renders login form UI and binds submit handler.
  - Parameters: none.
  - Returns: JSX.
- `handleLogin(e: React.FormEvent)` (async)
  - What it does: prevents default form submit, calls Supabase `signInWithPassword`, fetches the user and profile role, then routes accordingly.
  - Parameters: form event.
  - Returns/Affects: navigates via `router.push(...)` and updates component state (`error`, `isLoading`).

**Key snippet**

```ts
const { error: authError } = await supabase.auth.signInWithPassword({
  email,
  password,
});
if (authError) {
  setError(authError.message);
  setIsLoading(false);
  return;
}

const { data: profile } = await supabase
  .from("profiles")
  .select("role")
  .eq("id", user.id)
  .single();

router.push(
  profile?.role === "mentor" ? "/dashboard/mentor" : "/dashboard/mentee",
);
```

**DB queries**

- Auth:
  - `supabase.auth.signInWithPassword({ email, password })`
  - `supabase.auth.getUser()`
- SELECT (`profiles`):
  - `supabase.from('profiles').select('role').eq('id', user.id).single()`

---

### File: `app/register/page.tsx`

**Purpose**

- Client-rendered registration page: validates fields, signs up via Supabase Auth, inserts a `profiles` row, and optionally uploads an avatar to Supabase Storage.

**Functions/Methods**

- `RegisterPage()`
  - What it does: renders registration form, performs client-side validation, triggers sign-up and profile creation.
  - Parameters: none.
  - Returns: JSX.
- `updateField(field, value)`
  - What it does: updates `formData[field]` and clears `fieldErrors[field]`.
  - Parameters: `field: keyof FormData`, `value: string`.
  - Returns/Affects: state updates.
- `handlePhotoChange(e)`
  - What it does: validates image file size/type; stores file + preview URL.
  - Parameters: input change event.
  - Returns/Affects: state updates (`photoFile`, `photoPreview`, `error`).
- `removePhoto()`
  - What it does: clears selected avatar file + preview and resets the hidden file input.
  - Parameters: none.
  - Returns/Affects: state + DOM input value.
- `validateForm()`
  - What it does: validates required fields + email regex + password length; sets `fieldErrors`.
  - Parameters: none.
  - Returns: boolean (is valid).
- `uploadPhotoInBackground(supabase, userId, file)` (async)
  - What it does: uploads avatar to `avatars` bucket and updates `profiles.photo_url` with the public URL.
  - Parameters: Supabase client, user id, File.
  - Returns: `Promise<string | null>` (public URL or null).
- `handleRegister(e)` (async)
  - What it does: runs validation; calls `auth.signUp`; stores a pending profile in localStorage; inserts `profiles` row; triggers background photo upload; redirects to dashboard.
  - Parameters: form submit event.
  - Returns/Affects: state updates, storage writes, DB writes, router navigation.

**Key snippet**

```ts
const { data: authData, error: authError } = await supabase.auth.signUp({
  email: formData.email,
  password: formData.password,
  options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
});

const { error: profileError } = await supabase.from("profiles").insert({
  id: authData.user.id,
  full_name: `${formData.firstName.trim()} ${formData.lastName.trim()}`,
  email: formData.email.trim(),
  role: formData.role as Role,
  // ...optional fields...
});
```

**DB queries**

- Auth:
  - `supabase.auth.signUp({ email, password, options: { emailRedirectTo: ... } })`
- INSERT (`profiles`):
  - `supabase.from('profiles').insert({ ... })`
- Storage (avatars):
  - `supabase.storage.from('avatars').upload(filePath, file, { upsert: true })`
  - `supabase.storage.from('avatars').getPublicUrl(filePath)`
- UPDATE (`profiles`):
  - `supabase.from('profiles').update({ photo_url: data.publicUrl }).eq('id', userId)`

---

### File: `app/auth/callback/route.ts`

**Purpose**

- Auth callback endpoint used by Supabase email confirmation redirect. Exchanges `code` for a session cookie and redirects to `/auth/complete-profile`.

**Functions/Methods**

- `GET(request: Request)`
  - What it does: reads `code` query param and calls `exchangeCodeForSession(code)`.
  - Parameters: `request`.
  - Returns: `NextResponse.redirect(...)`.

**Key snippet**

```ts
if (code) {
  const supabase = await createClient();
  await supabase.auth.exchangeCodeForSession(code);
}
return NextResponse.redirect(new URL("/auth/complete-profile", request.url));
```

**DB queries**

- Auth:
  - `supabase.auth.exchangeCodeForSession(code)`

---

### File: `app/auth/complete-profile/page.tsx`

**Purpose**

- Client page that finalizes registration after email confirmation by creating the `profiles` row if missing, using `localStorage.dana_pending_profile`.

**Functions/Methods**

- `CompleteProfilePage()`
  - What it does: runs a completion flow in `useEffect` and renders loading/success/error UI.
  - Parameters: none.
  - Returns: JSX.
- `completeRegistration()` (async, inside `useEffect`)
  - What it does: gets user from Supabase, checks for existing profile, reads pending profile from localStorage, inserts profile if needed, then redirects.
  - Parameters: none.
  - Returns/Affects: updates component state, writes/removes localStorage, navigates via router.

**Key snippet**

```ts
const { data: existingProfile } = await supabase
  .from("profiles")
  .select("id, role")
  .eq("id", user.id)
  .single();

if (!existingProfile) {
  const pendingProfileStr = localStorage.getItem("dana_pending_profile");
  // parse + insert profile...
}
```

**DB queries**

- Auth:
  - `supabase.auth.getUser()`
- SELECT (`profiles`):
  - `supabase.from('profiles').select('id, role').eq('id', user.id).single()`
- INSERT (`profiles`):
  - `supabase.from('profiles').insert({ id: user.id, full_name: ..., role: ..., ... })`

---

### File: `app/api/notify-accepted/route.ts`

**Purpose**

- API route handler that sends an “accepted application” email via Resend.

**Functions/Methods**

- `POST(request: Request)` (async)
  - What it does: parses JSON payload, validates `menteeEmail`, sends an HTML email via Resend, and returns JSON success/error.
  - Parameters: `request` (Fetch API Request).
  - Returns: `Promise<NextResponse>`.

**Key snippet**

```ts
const { data, error } = await resend.emails.send({
  from: "DANA Connect <onboarding@resend.dev>",
  to: menteeEmail,
  subject: "Your application was accepted — DANA Connect",
  html: `...`,
});
```

**DB queries**

- None.

---

### File: `app/profile/edit/page.tsx`

**Purpose**

- Client profile edit page: loads the current user’s `profiles` row, lets them update fields, and optionally uploads a new avatar to the `avatars` Storage bucket.

**Functions/Methods**

- `EditProfilePage()`
  - What it does: renders the edit form and wires up handlers.
  - Parameters: none.
  - Returns: JSX.
- `fetchProfile()` (async, inside `useEffect`)
  - What it does: reads the current user, fetches the full profile row, and initializes form state.
  - Parameters: none.
  - Returns/Affects: updates React state; redirects via `router.push(...)` on missing user or errors.
- `updateField(field: keyof FormData, value: string)`
  - What it does: updates a specific form field in state.
  - Parameters: `field`, `value`.
  - Returns/Affects: state update.
- `handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>)`
  - What it does: validates selected image (type/size) and stores it + a preview URL.
  - Parameters: file input change event.
  - Returns/Affects: state update; shows toast on validation failure.
- `removePhoto()`
  - What it does: clears the selected avatar and resets the hidden file input.
  - Parameters: none.
  - Returns/Affects: state + input reset.
- `handleSave()` (async)
  - What it does: uploads avatar (optional), then updates the `profiles` row and redirects to the correct dashboard.
  - Parameters: none.
  - Returns/Affects: DB writes, storage write, toasts, navigation.
- `handleCancel()`
  - What it does: navigates back to the user’s dashboard (or home if profile missing).
  - Parameters: none.
  - Returns/Affects: navigation.

**Key snippet**

```ts
const { error: updateError } = await supabase
  .from("profiles")
  .update({
    full_name: `${formData.firstName.trim()} ${formData.lastName.trim()}`,
    linkedin_url: formData.linkedinUrl.trim() || null,
    photo_url: photoUrl,
  })
  .eq("id", profile.id);
```

**DB queries**

- Auth:
  - `supabase.auth.getUser()`
- SELECT (`profiles`):
  - `supabase.from('profiles').select('*').eq('id', user.id).single()`
- Storage (avatars):
  - `supabase.storage.from('avatars').upload(filePath, photoFile, { upsert: true })`
  - `supabase.storage.from('avatars').getPublicUrl(filePath)`
- UPDATE (`profiles`):
  - `supabase.from('profiles').update({ ... }).eq('id', profile.id)`

---

### File: `app/projects/page.tsx`

**Purpose**

- Client projects page: browse open projects, post a new project, request to join, and manage join requests for projects you created.

**Functions/Methods**

- `ProjectsPage()`
  - What it does: renders browse/my tabs and multiple dialogs, initializes auth state, and drives CRUD via Supabase.
  - Parameters: none.
  - Returns: JSX.
- `fetchProjects()` (async; `useCallback`)
  - What it does: loads open projects with creator profile data.
  - Parameters: none.
  - Returns/Affects: sets `projects` state.
- `fetchMyProjects(userId: string)` (async; `useCallback`)
  - What it does: loads projects where `creator_id` matches the current user.
  - Parameters: `userId`.
  - Returns/Affects: sets `myProjects` state.
- `fetchMyRequests(userId: string)` (async; `useCallback`)
  - What it does: loads project join requests created by the current user.
  - Parameters: `userId`.
  - Returns/Affects: sets `myRequests` state.
- `fetchProjectRequests(projectId: string)` (async; `useCallback`)
  - What it does: loads requests for a project and partitions them into pending vs accepted lists.
  - Parameters: `projectId`.
  - Returns/Affects: sets `pendingRequests`, `acceptedMembers`, and loading state.
- `handlePostProject()` (async)
  - What it does: validates fields and inserts a new `open_projects` record; refreshes browse/my lists.
  - Parameters: none.
  - Returns/Affects: INSERT + UI state updates.
- `handleJoinProject()` (async)
  - What it does: inserts a `project_requests` row for the selected project; handles duplicate request error code `23505`.
  - Parameters: none.
  - Returns/Affects: INSERT + UI state updates.
- `handleManageProject(project: Project)`
  - What it does: opens manage dialog and loads requests for that project.
  - Parameters: `project`.
  - Returns/Affects: state updates.
- `handleAcceptRequest(request: ProjectRequest)` (async)
  - What it does: updates request to `accepted`, increments `open_projects.filled_members`, and auto-closes the project when full.
  - Parameters: `request`.
  - Returns/Affects: UPDATE(s) + refreshes lists.
- `handleRejectRequest(request: ProjectRequest)` (async)
  - What it does: updates request to `rejected` and refreshes project requests.
  - Parameters: `request`.
  - Returns/Affects: UPDATE + refresh.
- `handleDeleteProject()` (async)
  - What it does: confirms via `window.confirm`, then deletes the project (scoped by `id` and `creator_id`) and refreshes lists.
  - Parameters: none.
  - Returns/Affects: DELETE + refresh.

**Key snippet**

```ts
const { error: updateError } = await supabase
  .from("project_requests")
  .update({ status: "accepted" })
  .eq("id", request.id);
```

**DB queries**

- Auth:
  - `supabase.auth.getUser()`
- SELECT (`open_projects` + joined creator profile):
  - `supabase.from('open_projects').select('*, creator:profiles(full_name, email, institution)').eq('is_open', true).order('created_at', { ascending: false })`
  - `supabase.from('open_projects').select('*, creator:profiles(full_name, email, institution)').eq('creator_id', userId).order('created_at', { ascending: false })`
- SELECT (`project_requests` + joined project title):
  - `supabase.from('project_requests').select('*, project:projects(title)').eq('requester_id', userId)`
- SELECT (`project_requests` + joined requester profile):
  - `supabase.from('project_requests').select('*, user:profiles(full_name, email, institution)').eq('project_id', projectId).order('created_at', { ascending: false })`
- INSERT (`open_projects`):
  - `supabase.from('open_projects').insert({ ... })`
- INSERT (`project_requests`):
  - `supabase.from('project_requests').insert({ project_id: ..., requester_id: ..., message: ..., status: 'pending' })`
- UPDATE (`project_requests`):
  - `supabase.from('project_requests').update({ status: 'accepted' }).eq('id', request.id)`
  - `supabase.from('project_requests').update({ status: 'rejected' }).eq('id', request.id)`
- UPDATE (`open_projects`):
  - `supabase.from('open_projects').update({ filled_members: newFilledMembers, is_open: !shouldClose }).eq('id', managedProject.id)`
- DELETE (`open_projects`):
  - `supabase.from('open_projects').delete().eq('id', managedProject.id).eq('creator_id', currentUserId)`

---

### File: `app/mentors/page.tsx`

**Purpose**

- Server-rendered mentors listing page: fetches mentor profiles and passes normalized data to the client page.

**Functions/Methods**

- `MentorsPage()` (async server component)
  - What it does: loads mentors from `profiles`, normalizes nullable fields, renders `MentorsPageClient`.
  - Parameters: none.
  - Returns: JSX.

**Key snippet**

```ts
const { data: mentors } = await supabase
  .from("profiles")
  .select(
    "id, full_name, institution, specialization, title, photo_url, created_at",
  )
  .eq("role", "mentor")
  .order("created_at", { ascending: false });
```

**DB queries**

- SELECT (`profiles`):
  - `supabase.from('profiles').select('id, full_name, institution, specialization, title, photo_url, created_at').eq('role', 'mentor').order('created_at', { ascending: false })`

---

### File: `app/mentors/MentorsPageClient.tsx`

**Purpose**

- Client UI for the mentors listing page: renders hero section + mentor cards using localized strings.

**Functions/Methods**

- `MentorsPageClient({ mentors })`
  - What it does: renders mentors grid and an empty state.
  - Parameters: `mentors: MentorData[]`.
  - Returns: JSX.

**Key snippet**

```ts
const { language } = useLanguage();
const t = translations[language];
```

**DB queries**

- None.

---

### File: `app/research/page.tsx`

**Purpose**

- Server-rendered research opportunities listing page: fetches open opportunities with mentor profile details and passes them to the client page.

**Functions/Methods**

- `ResearchPage()` (async server component)
  - What it does: queries `research_opportunities` for open listings (joined to mentor `profiles`) and renders `ResearchPageClient`.
  - Parameters: none.
  - Returns: JSX.

**Key snippet**

```ts
const { data: opportunities } = await supabase
  .from("research_opportunities")
  .select(
    `
		id, title, description, tags, total_spots, filled_spots, duration, created_at,
		mentor:profiles(full_name, institution)
	`,
  )
  .eq("is_open", true)
  .order("created_at", { ascending: false });
```

**DB queries**

- SELECT (`research_opportunities` + joined mentor profile):
  - `supabase.from('research_opportunities').select(`... mentor:profiles(full_name, institution) ...`).eq('is_open', true).order('created_at', { ascending: false })`

---

### File: `app/research/ResearchPageClient.tsx`

**Purpose**

- Client UI for the research listings page: supports tag filtering and an “apply” action that routes unauthenticated users to login with a redirect.

**Functions/Methods**

- `ResearchPageClient({ opportunities })`
  - What it does: renders tags, filtered opportunities list, and empty states.
  - Parameters: `opportunities: OpportunityWithMentor[]`.
  - Returns: JSX.
- `handleApply(oppId: string)`
  - What it does: routes to `/login?redirect=/research&apply=${oppId}`.
  - Parameters: `oppId`.
  - Returns/Affects: navigation.

**Key snippet**

```ts
const handleApply = (oppId: string) => {
  router.push(`/login?redirect=/research&apply=${oppId}`);
};
```

**DB queries**

- None.

---

### File: `app/dashboard/mentee/page.tsx`

**Purpose**

- Client mentee dashboard: browse open research opportunities, submit applications (with optional CV upload), view application statuses, view project join request statuses, and delete the account.

**Functions/Methods**

- `MenteeDashboard()`
  - What it does: initializes user session, loads data, and renders dashboard tabs + dialogs.
  - Parameters: none.
  - Returns: JSX.
- `fetchProfile(userId: string)` (async; `useCallback`)
  - What it does: loads the user’s `profiles` row.
  - Parameters: `userId`.
  - Returns/Affects: sets `profile` state.
- `fetchOpportunities()` (async; `useCallback`)
  - What it does: loads open `research_opportunities` joined to mentor `profiles`.
  - Parameters: none.
  - Returns/Affects: sets `opportunities` state.
- `fetchMyApplications(userId: string)` (async; `useCallback`)
  - What it does: loads the current mentee’s `applications` joined to opportunity + mentor details.
  - Parameters: `userId`.
  - Returns/Affects: sets `myApplications` state.
- `fetchMyProjectRequests(userId: string)` (async; `useCallback`)
  - What it does: loads `project_requests` joined to the `open_projects` row and creator profile details.
  - Parameters: `userId`.
  - Returns/Affects: sets `myProjectRequests` state.
- `handleSignOut()` (async)
  - What it does: signs out via Supabase Auth and navigates home.
  - Parameters: none.
  - Returns/Affects: auth state change + navigation.
- `handleApply(opp: OpportunityWithMentor)`
  - What it does: opens the application dialog for an opportunity and resets dialog state.
  - Parameters: `opp`.
  - Returns/Affects: state updates.
- `handleCvChange(e: React.ChangeEvent<HTMLInputElement>)`
  - What it does: validates CV extension/size and stores selected file.
  - Parameters: file input change event.
  - Returns/Affects: state updates; sets validation error string.
- `handleSubmitApplication()` (async)
  - What it does: optionally uploads a CV to the `cvs` bucket, then inserts an `applications` row.
  - Parameters: none.
  - Returns/Affects: storage write + INSERT + refresh.
- `handleDeleteAccount()` (async)
  - What it does: deletes user’s CV files under `cvs/<userId>/`, calls RPC `delete_user_account`, signs out, and redirects to `/?deleted=true`.
  - Parameters: none.
  - Returns/Affects: storage cleanup + RPC + auth signout + navigation.

**Key snippet**

```ts
const { error } = await supabase.from("applications").insert({
  mentee_id: profile.id,
  opportunity_id: selectedOpp.id,
  motivation_text: motivationText.trim(),
  cv_url: cvPath,
  status: "pending",
});
```

**DB queries**

- Auth:
  - `supabase.auth.getUser()`
  - `supabase.auth.signOut()`
- SELECT (`profiles`):
  - `supabase.from('profiles').select('*').eq('id', userId).single()`
- SELECT (`research_opportunities` + joined mentor profile):
  - `supabase.from('research_opportunities').select(`... mentor:profiles(full_name, institution) ...`).eq('is_open', true).order('created_at', { ascending: false })`
- SELECT (`applications` + joined opportunity + mentor contact):
  - `supabase.from('applications').select(`\*, opportunity:research_opportunities(title, tags, mentor:profiles(full_name, email, linkedin_url))`).eq('mentee_id', userId).order('created_at', { ascending: false })`
- SELECT (`project_requests` + joined open project + creator):
  - `supabase.from('project_requests').select(`\*, project:open_projects(title, description, tags, contact_email, contact_telegram, creator_id, creator:profiles(full_name, email))`).eq('requester_id', userId).order('created_at', { ascending: false })`
- Storage (cvs):
  - `supabase.storage.from('cvs').upload(filePath, cvFile, { upsert: true })`
  - `supabase.storage.from('cvs').list(profile.id)`
  - `supabase.storage.from('cvs').remove(paths)`
- INSERT (`applications`):
  - `supabase.from('applications').insert({ mentee_id: ..., opportunity_id: ..., motivation_text: ..., cv_url: ..., status: 'pending' })`
- RPC:
  - `supabase.rpc('delete_user_account')`

---

### File: `app/dashboard/mentor/page.tsx`

**Purpose**

- Client mentor dashboard: create/toggle your own research opportunities, review incoming mentee applications (including viewing CVs), accept/reject applications (with email notification), browse/apply to other mentors’ opportunities, and delete the account.

**Functions/Methods**

- `MentorDashboard()`
  - What it does: initializes auth session, loads profile + opportunities + applications, and renders the dashboard tabs + dialogs.
  - Parameters: none.
  - Returns: JSX.
- `fetchProfile(userId: string)` (async; `useCallback`)
  - What it does: loads the user’s `profiles` row.
  - Parameters: `userId`.
  - Returns/Affects: sets `profile` state.
- `fetchOpportunities(userId: string)` (async; `useCallback`)
  - What it does: loads mentor-owned `research_opportunities`.
  - Parameters: `userId`.
  - Returns/Affects: sets `opportunities` state.
- `fetchOtherOpportunities(userId: string)` (async; `useCallback`)
  - What it does: loads open opportunities not owned by the user, joined to mentor `profiles`.
  - Parameters: `userId`.
  - Returns/Affects: sets `otherOpportunities` state.
- `fetchMyApplications(userId: string)` (async; `useCallback`)
  - What it does: loads the current user’s (mentor acting as mentee) applications list.
  - Parameters: `userId`.
  - Returns/Affects: sets `myApplications` state.
- `fetchApplications(oppIds: string[])` (async; `useCallback`)
  - What it does: loads all applications for the mentor’s opportunities, joining mentee profile details and opportunity summary.
  - Parameters: `oppIds`.
  - Returns/Affects: sets `applications` state.
- `handleApply(opp: ResearchOpportunity)`
  - What it does: opens the application dialog for an opportunity and resets dialog state.
  - Parameters: `opp`.
  - Returns/Affects: state updates.
- `handleCvChange(e: React.ChangeEvent<HTMLInputElement>)`
  - What it does: validates CV extension/size and stores the selected file.
  - Parameters: file input change event.
  - Returns/Affects: state updates.
- `handleSubmitApplication()` (async)
  - What it does: uploads CV (optional) and inserts an `applications` row.
  - Parameters: none.
  - Returns/Affects: storage write + INSERT + refresh.
- `markAsViewed()` (async, inside `useEffect`)
  - What it does: when the Applications tab opens, updates pending apps to `viewed` for the mentor’s opportunity IDs and refetches.
  - Parameters: none.
  - Returns/Affects: UPDATE + refresh.
- `handleSignOut()` (async)
  - What it does: signs out and navigates home.
  - Parameters: none.
  - Returns/Affects: auth state change + navigation.
- `handleToggleOpen(opp: ResearchOpportunity)` (async)
  - What it does: toggles `research_opportunities.is_open` and refetches the mentor’s opportunities.
  - Parameters: `opp`.
  - Returns/Affects: UPDATE + refresh.
- `handlePostOpportunity()` (async)
  - What it does: inserts a new research opportunity using `newOpp` state and `DURATION_OPTIONS` selection.
  - Parameters: none.
  - Returns/Affects: INSERT + refresh.
- `handleAcceptApplication(app: Application)` (async)
  - What it does: marks application `accepted`, increments `filled_spots` (and closes opportunity if full), then calls `/api/notify-accepted` to email the mentee.
  - Parameters: `app`.
  - Returns/Affects: UPDATE(s) + network request + refresh.
- `handleRejectApplication(app: Application)` (async)
  - What it does: marks application `rejected` and refreshes applications.
  - Parameters: `app`.
  - Returns/Affects: UPDATE + refresh.
- `handleViewCv(cvPath: string)` (async)
  - What it does: normalizes stored CV path, creates a signed URL for 60 seconds, and opens it in a new tab.
  - Parameters: `cvPath`.
  - Returns/Affects: Storage signed URL + `window.open`.
- `handleDeleteAccount()` (async)
  - What it does: deletes user’s CV files under `cvs/<userId>/`, calls RPC `delete_user_account`, signs out, and redirects to `/?deleted=true`.
  - Parameters: none.
  - Returns/Affects: storage cleanup + RPC + auth signout + navigation.

**Key snippet**

```ts
await supabase
  .from("applications")
  .update({ status: "viewed" })
  .eq("status", "pending")
  .in(
    "opportunity_id",
    opportunities.map((o) => o.id),
  );
```

**DB queries**

- Auth:
  - `supabase.auth.getUser()`
  - `supabase.auth.signOut()`
- SELECT (`profiles`):
  - `supabase.from('profiles').select('*').eq('id', userId).single()`
- SELECT (`research_opportunities`):
  - `supabase.from('research_opportunities').select('*').eq('mentor_id', userId).order('created_at', { ascending: false })`
- SELECT (`research_opportunities` + joined mentor profile):
  - `supabase.from('research_opportunities').select('*, mentor:profiles(full_name, institution)').eq('is_open', true).neq('mentor_id', userId).order('created_at', { ascending: false })`
- SELECT (`applications` + joined opportunity + mentor contact) (mentor acting as mentee):
  - `supabase.from('applications').select(`\*, opportunity:research_opportunities(title, tags, mentor:profiles(full_name, email, linkedin_url))`).eq('mentee_id', userId).order('created_at', { ascending: false })`
- SELECT (`applications` + joined mentee profile + opportunity summary):
  - `supabase.from('applications').select(`\*, mentee:profiles(full_name, email, institution, specialization, linkedin_url), opportunity:research_opportunities(title, tags)`).in('opportunity_id', oppIds).order('created_at', { ascending: false })`
- Storage (cvs):
  - `supabase.storage.from('cvs').upload(filePath, cvFile, { upsert: true })`
  - `supabase.storage.from('cvs').createSignedUrl(normalizedPath, 60)`
  - `supabase.storage.from('cvs').list(profile.id)`
  - `supabase.storage.from('cvs').remove(paths)`
- INSERT (`applications`):
  - `supabase.from('applications').insert({ mentee_id: ..., opportunity_id: ..., motivation_text: ..., cv_url: ..., status: 'pending' })`
- INSERT (`research_opportunities`):
  - `supabase.from('research_opportunities').insert({ mentor_id: ..., title: ..., description: ..., tags: ..., total_spots: ..., duration: ..., is_open: true, filled_spots: 0 })`
- UPDATE (`applications`):
  - `supabase.from('applications').update({ status: 'accepted' }).eq('id', app.id)`
  - `supabase.from('applications').update({ status: 'rejected' }).eq('id', app.id)`
  - `supabase.from('applications').update({ status: 'viewed' }).eq('status', 'pending').in('opportunity_id', opportunities.map((o) => o.id))`
- UPDATE (`research_opportunities`):
  - `supabase.from('research_opportunities').update({ is_open: !opp.is_open }).eq('id', opp.id)`
  - `supabase.from('research_opportunities').update(updates).eq('id', app.opportunity_id)`
- RPC:
  - `supabase.rpc('delete_user_account')`

---

## components/

### File: `components/ApplicationCard.tsx`

**Purpose**

- UI card that renders an application, optional mentee contact info, and optional accept/reject actions.

**Functions/Methods**

- `ApplicationCard(props: ApplicationCardProps)`
  - What it does: renders the application summary, motivation text, optional CV button, and conditional action buttons.
  - Parameters: `application`, flags (`showMenteeContact`, `showActions`), and callbacks (`onAccept`, `onReject`, `onViewCv`).
  - Returns: JSX.

**Key snippet**

```tsx
{
  application.cv_url && (
    <button type="button" onClick={() => onViewCv?.(application.cv_url!)}>
      View CV
    </button>
  );
}
```

**DB queries**

- None.

---

### File: `components/DashboardNav.tsx`

**Purpose**

- Top navigation bar for dashboard pages: brand, language switcher, username, and sign-out button.

**Functions/Methods**

- `DashboardNav({ userName, onSignOut }: DashboardNavProps)`
  - What it does: renders dashboard nav and wires sign-out callback.
  - Parameters: `userName: string`, `onSignOut: () => void`.
  - Returns: JSX.
- `LogoIcon({ className })` (internal)
  - What it does: renders inline SVG logo.
  - Parameters: `className?: string`.
  - Returns: JSX.

**Key snippet**

```ts
const { language, setLanguage } = useLanguage();
const t = translations[language];
```

**DB queries**

- None.

---

### File: `components/Footer.tsx`

**Purpose**

- Site footer with localized links and copyright string.

**Functions/Methods**

- `Footer()`
  - What it does: renders footer content using translations.
  - Parameters: none.
  - Returns: JSX.
- `LogoIcon({ className })` (internal)
  - What it does: renders inline SVG logo.
  - Parameters: `className?: string`.
  - Returns: JSX.

**Key snippet**

```ts
const currentYear = new Date().getFullYear();
```

**DB queries**

- None.

---

### File: `components/HeroBackground.tsx`

**Purpose**

- Decorative hero background: layered gradients + subtle SVG illustrations.

**Functions/Methods**

- `HeroBackground()`
  - What it does: renders background gradient overlays plus SVG art.
  - Parameters: none.
  - Returns: JSX.

**Key snippet**

```tsx
<div className="absolute inset-0 bg-gradient-to-br from-[#EEEDF8] via-[#EEEDF8] to-[#E8E8F5]" />
```

**DB queries**

- None.

---

### File: `components/HomeContent.tsx`

**Purpose**

- Client UI for the home page: hero, stats, mentors preview, and research opportunities preview.

**Functions/Methods**

- `HomeContent(props)`
  - What it does: renders home sections using passed-in counts and lists plus localized strings.
  - Parameters: `isDeleted`, counts, `mentors`, `opportunities`.
  - Returns: JSX.

**Key snippet**

```tsx
{
  isDeleted && (
    <p className="text-sm text-green-800 font-medium">
      {t.common.accountDeleted}
    </p>
  );
}
```

**DB queries**

- None (data is passed in from the server page `app/page.tsx`).

---

### File: `components/LoadingSkeleton.tsx`

**Purpose**

- Loading skeleton components used by pages/dashboards.

**Functions/Methods**

- `MentorCardSkeleton()` → JSX
- `OpportunityCardSkeleton()` → JSX
- `ApplicationCardSkeleton()` → JSX
- `StatCardSkeleton()` → JSX

**Key snippet**

```tsx
<Skeleton className="h-6 w-20 rounded-full" />
```

**DB queries**

- None.

---

### File: `components/MentorCard.tsx`

**Purpose**

- UI card for displaying a mentor profile preview (photo/initials, specialization, institution).

**Functions/Methods**

- `MentorCard(props: MentorCardProps)`
  - What it does: renders a mentor card; derives `initials` and a `fieldTag` from specialization.
  - Parameters: `full_name`, `institution`, `specialization`, `title?`, `photo_url?`.
  - Returns: JSX.

**Key snippet**

```ts
const initials = full_name
  .split(" ")
  .filter(Boolean)
  .slice(0, 2)
  .map((word) => word[0])
  .join("")
  .toUpperCase();
```

**DB queries**

- None.

---

### File: `components/NavBar.tsx`

**Purpose**

- Thin wrapper component that mounts `NavBarClient`.

**Functions/Methods**

- `NavBar()`
  - What it does: renders `NavBarClient`.
  - Parameters: none.
  - Returns: JSX.

**Key snippet**

```tsx
export function NavBar() {
  return (
    <>
      <NavBarClient />
      <nav className="hidden" />
    </>
  );
}
```

**DB queries**

- None.

---

### File: `components/NavBarClient.tsx`

**Purpose**

- Client navigation bar: handles scroll state, displays primary navigation, and reacts to Supabase auth session changes.

**Functions/Methods**

- `NavBarClient()`
  - What it does: loads current session user, subscribes to auth state changes, and renders nav links/buttons.
  - Parameters: none.
  - Returns: JSX.
- `LogoIcon({ className })` (internal)
  - What it does: renders inline SVG logo.
  - Parameters: `className?: string`.
  - Returns: JSX.
- `initAuth()` (async, inside `useEffect`)
  - What it does: calls `supabase.auth.getSession()` and sets `user` state.
  - Parameters: none.
  - Returns/Affects: state update.
- `languageButtonClass(lang: Language)`
  - What it does: returns the CSS class string for language buttons.
  - Parameters: `lang`.
  - Returns: string.
- Auth subscription callback (inside `supabase.auth.onAuthStateChange`)
  - What it does: updates `user` state for `SIGNED_IN`, `TOKEN_REFRESHED`, `SIGNED_OUT`.

**Key snippet**

```ts
const {
  data: { subscription },
} = supabase.auth.onAuthStateChange((event, session) => {
  if (event === "SIGNED_OUT") setUser(null);
  if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED")
    setUser(session?.user ?? null);
});
```

**DB queries**

- Auth:
  - `supabase.auth.getSession()`
  - `supabase.auth.onAuthStateChange((event, session) => { ... })`

---

### File: `components/OpportunityCard.tsx`

**Purpose**

- UI card for a research opportunity preview, with optional apply button and applied/full state.

**Functions/Methods**

- `OpportunityCard(props: OpportunityCardProps)`
  - What it does: renders title/description/tags, computes remaining spots, and conditionally renders apply badge/button.
  - Parameters: opportunity fields plus optional apply-related props.
  - Returns: JSX.

**Key snippet**

```ts
const remainingSpots = Math.max(0, total_spots - filled_spots);
```

**DB queries**

- None.

---

### File: `components/ProjectCard.tsx`

**Purpose**

- UI card for project listings: shows status, members, deadline, contact links, and join/manage actions.

**Functions/Methods**

- `ProjectCard(props: ProjectCardProps)`
  - What it does: renders a project card and decides whether the current user can join or manage.
  - Parameters: `project`, optional `currentUserId`, `hasRequested`, and callbacks `onJoin`/`onManage`.
  - Returns: JSX.

**Key snippet**

```ts
const isCreator = currentUserId === project.creator_id;
const canJoin = project.is_open && !isCreator && !hasRequested && currentUserId;
```

**DB queries**

- None.

---

### File: `components/StatusBadge.tsx`

**Purpose**

- Status badge UI for application statuses (`pending`, `viewed`, `accepted`, `rejected`).

**Functions/Methods**

- `StatusBadge({ status }: StatusBadgeProps)`
  - What it does: maps status to label/classes and renders a badge with a dot.
  - Parameters: `status`.
  - Returns: JSX.

**Key snippet**

```ts
const config = statusConfig[status];
```

**DB queries**

- None.

---

### File: `components/TagInput.tsx`

**Purpose**

- Reusable tag entry input: allows adding tags with Enter/comma and removing existing tags.

**Functions/Methods**

- `TagInput({ value, onChange, placeholder }: TagInputProps)`
  - What it does: renders tag pills + text input, managing local input state.
  - Parameters: `value: string[]`, `onChange(tags)`, `placeholder?`.
  - Returns: JSX.
- `addTag(tag: string)` (internal)
  - What it does: trims/uniquifies tag then calls `onChange`.
  - Parameters: `tag`.
  - Returns/Affects: calls `onChange` and clears `inputValue`.
- `removeTag(tagToRemove: string)` (internal)
  - What it does: removes a tag and calls `onChange`.
  - Parameters: `tagToRemove`.
  - Returns/Affects: calls `onChange`.
- `handleKeyDown(e: KeyboardEvent<HTMLInputElement>)` (internal)
  - What it does: adds tag on Enter/comma; removes last tag on Backspace when input empty.
  - Parameters: keydown event.
  - Returns/Affects: state updates.

**Key snippet**

```ts
if (e.key === "Enter" || e.key === ",") {
  e.preventDefault();
  addTag(inputValue);
}
```

**DB queries**

- None.

---

### File: `components/ui/avatar.tsx`

**Purpose**

- Base UI avatar primitives with project styling (`Avatar`, `AvatarImage`, `AvatarFallback`, etc.).

**Functions/Methods**

- `Avatar(props)` → JSX
- `AvatarImage(props)` → JSX
- `AvatarFallback(props)` → JSX
- `AvatarBadge(props)` → JSX
- `AvatarGroup(props)` → JSX
- `AvatarGroupCount(props)` → JSX

**Key snippet**

```ts
className={cn("group/avatar relative flex size-8 ...", className)}
```

**DB queries**

- None.

---

### File: `components/ui/badge.tsx`

**Purpose**

- Styled badge component with variants powered by `class-variance-authority` and Base UI render helpers.

**Functions/Methods**

- `Badge(props)`
  - What it does: renders a `<span>` badge using `useRender` with variant classes.
  - Parameters: `variant?`, `render?`, plus span props.
  - Returns: JSX.
- `badgeVariants` (cva config)
  - What it does: centralizes variant → className mapping.

**Key snippet**

```ts
const badgeVariants = cva("group/badge inline-flex ...", { variants: { ... } })
```

**DB queries**

- None.

---

### File: `components/ui/button.tsx`

**Purpose**

- Styled button component built on Base UI’s button primitive.

**Functions/Methods**

- `Button(props)`
  - What it does: renders `ButtonPrimitive` with variant/size classes.
  - Parameters: Base UI button props plus `variant` and `size`.
  - Returns: JSX.
- `buttonVariants` (cva config)
  - What it does: maps `variant` and `size` to className strings.

**Key snippet**

```ts
className={cn(buttonVariants({ variant, size, className }))}
```

**DB queries**

- None.

---

### File: `components/ui/card.tsx`

**Purpose**

- Styled card components (`Card`, `CardHeader`, `CardContent`, etc.).

**Functions/Methods**

- `Card(props)`
- `CardHeader(props)`
- `CardTitle(props)`
- `CardDescription(props)`
- `CardAction(props)`
- `CardContent(props)`
- `CardFooter(props)`
  - What they do: compose common card structure with consistent Tailwind classes.
  - Parameters: standard React props for the underlying HTML elements.
  - Returns: JSX.

**Key snippet**

```ts
className={cn("group/card flex flex-col ...", className)}
```

**DB queries**

- None.

---

### File: `components/ui/dialog.tsx`

**Purpose**

- Dialog components built on Base UI’s dialog primitive (overlay, content, header/footer, etc.).

**Functions/Methods**

- `Dialog(props)`
- `DialogTrigger(props)`
- `DialogPortal(props)`
- `DialogClose(props)`
- `DialogOverlay(props)`
- `DialogContent(props)`
- `DialogHeader(props)`
- `DialogFooter(props)`
- `DialogTitle(props)`
- `DialogDescription(props)`
  - What they do: provide styled wrappers around Base UI dialog parts.
  - Parameters: Base UI props; some wrappers accept extra options like `showCloseButton`.
  - Returns: JSX.

**Key snippet**

```tsx
<DialogPortal>
  <DialogOverlay />
  <DialogPrimitive.Popup
    data-slot="dialog-content"
    className={cn("fixed top-1/2 ...", className)}
  >
    {children}
  </DialogPrimitive.Popup>
</DialogPortal>
```

**DB queries**

- None.

---

### File: `components/ui/input.tsx`

**Purpose**

- Styled input component built on Base UI’s input primitive.

**Functions/Methods**

- `Input(props)`
  - What it does: renders `InputPrimitive` with consistent styling.
  - Parameters: standard input props.
  - Returns: JSX.

**Key snippet**

```ts
<InputPrimitive data-slot="input" className={cn("h-8 w-full ...", className)} {...props} />
```

**DB queries**

- None.

---

### File: `components/ui/label.tsx`

**Purpose**

- Styled label component.

**Functions/Methods**

- `Label(props)`
  - What it does: renders a `<label>` with consistent styling.
  - Parameters: standard label props.
  - Returns: JSX.

**Key snippet**

```ts
<label data-slot="label" className={cn("flex items-center gap-2 ...", className)} {...props} />
```

**DB queries**

- None.

---

### File: `components/ui/select.tsx`

**Purpose**

- Select/dropdown components built on Base UI’s select primitive.

**Functions/Methods**

- `Select` (alias to `SelectPrimitive.Root`)
- `SelectGroup(props)`
- `SelectValue(props)`
- `SelectTrigger(props)`
- `SelectContent(props)`
- `SelectLabel(props)`
- `SelectItem(props)`
- `SelectSeparator(props)`
- `SelectScrollUpButton(props)`
- `SelectScrollDownButton(props)`
  - What they do: compose a styled select with trigger + popup + items.
  - Parameters: Base UI select props.
  - Returns: JSX.

**Key snippet**

```tsx
<SelectPrimitive.Positioner side={side} sideOffset={sideOffset} align={align}>
  <SelectPrimitive.Popup data-slot="select-content">
    {children}
  </SelectPrimitive.Popup>
</SelectPrimitive.Positioner>
```

**DB queries**

- None.

---

### File: `components/ui/separator.tsx`

**Purpose**

- Styled separator component built on Base UI’s separator primitive.

**Functions/Methods**

- `Separator(props)`
  - What it does: renders horizontal/vertical separators.
  - Parameters: Base UI props; `orientation` defaults to `horizontal`.
  - Returns: JSX.

**Key snippet**

```ts
<SeparatorPrimitive orientation={orientation} className={cn("shrink-0 bg-border ...", className)} />
```

**DB queries**

- None.

---

### File: `components/ui/skeleton.tsx`

**Purpose**

- Generic animated skeleton placeholder.

**Functions/Methods**

- `Skeleton(props)`
  - What it does: renders a `<div>` skeleton with pulse animation.
  - Parameters: standard div props.
  - Returns: JSX.

**Key snippet**

```ts
className={cn("animate-pulse rounded-md bg-muted", className)}
```

**DB queries**

- None.

---

### File: `components/ui/sonner.tsx`

**Purpose**

- App toast provider wrapper around `sonner`, using `next-themes` for theme selection and custom icons.

**Functions/Methods**

- `Toaster(props: ToasterProps)`
  - What it does: renders `Sonner` toaster with theme + icon overrides.
  - Parameters: toaster props.
  - Returns: JSX.

**Key snippet**

```ts
const { theme = "system" } = useTheme();
```

**DB queries**

- None.

---

### File: `components/ui/switch.tsx`

**Purpose**

- Styled toggle switch built on Base UI’s switch primitive.

**Functions/Methods**

- `Switch(props)`
  - What it does: renders a switch root + thumb with styling.
  - Parameters: Base UI props plus `size?`.
  - Returns: JSX.

**Key snippet**

```tsx
<SwitchPrimitive.Root
  data-slot="switch"
  className={cn("peer group/switch ...", className)}
>
  <SwitchPrimitive.Thumb
    data-slot="switch-thumb"
    className="pointer-events-none ..."
  />
</SwitchPrimitive.Root>
```

**DB queries**

- None.

---

### File: `components/ui/tabs.tsx`

**Purpose**

- Tabs components built on Base UI’s tabs primitive.

**Functions/Methods**

- `Tabs(props)`
- `TabsList(props)`
- `TabsTrigger(props)`
- `TabsContent(props)`
- `tabsListVariants` (cva config)
  - What they do: compose a styled tabs UI.
  - Parameters: Base UI props; variants control styling.
  - Returns: JSX.

**Key snippet**

```ts
const tabsListVariants = cva("group/tabs-list inline-flex ...", { variants: { ... } })
```

**DB queries**

- None.

---

### File: `components/ui/textarea.tsx`

**Purpose**

- Styled `<textarea>` component.

**Functions/Methods**

- `Textarea(props)`
  - What it does: renders a `<textarea>` with consistent styling.
  - Parameters: standard textarea props.
  - Returns: JSX.

**Key snippet**

```ts
className={cn("flex field-sizing-content min-h-16 ...", className)}
```

**DB queries**

- None.

---

## lib/

### File: `lib/types.ts`

**Purpose**

- Central TypeScript types for core domain objects (profiles, research opportunities, applications, projects, project requests).

**Functions/Methods**

- None (type declarations only).

**Key snippet**

```ts
export type Role = "mentor" | "mentee";
export type ApplicationStatus = "pending" | "viewed" | "accepted" | "rejected";

export interface Application {
  id: string;
  mentee_id: string;
  opportunity_id: string;
  motivation_text: string;
  cv_url: string | null;
  status: ApplicationStatus;
  mentee?: Pick<
    Profile,
    "full_name" | "email" | "institution" | "specialization" | "linkedin_url"
  >;
}
```

**DB queries**

- None.

---

### File: `lib/utils.ts`

**Purpose**

- Utility helper(s) used across UI components.

**Functions/Methods**

- `cn(...inputs: ClassValue[])`
  - What it does: merges conditional class names (`clsx`) and resolves Tailwind conflicts (`tailwind-merge`).
  - Parameters: `...inputs` (class values accepted by `clsx`).
  - Returns: a merged class string.

**Key snippet**

```ts
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

**DB queries**

- None.

---

### File: `lib/i18n/LanguageContext.tsx`

**Purpose**

- Client-side language state management (React Context) backed by `localStorage`.

**Functions/Methods**

- `LanguageProvider({ children })`
  - What it does: provides `{ language, setLanguage }` via context.
  - Reads initial language from `localStorage` key `dana_language` (allowed values: `en`, `ru`, `kz`).
  - Persists changes back to `localStorage` (errors are ignored).
  - Parameters: `children`.
  - Returns: JSX provider wrapper.
- `useLanguage()`
  - What it does: returns the context value.
  - Throws: error if used outside a `LanguageProvider`.
  - Returns: `{ language, setLanguage }`.

**Key snippet**

```ts
const STORAGE_KEY = "dana_language";

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return ctx;
}
```

**DB queries**

- None.

---

### File: `lib/i18n/translations.ts`

**Purpose**

- The translation dictionary for UI strings.

**Functions/Methods**

- None (exports an object + types).

**Key snippet**

```ts
export const translations = {
  en: {
    /* ... */
  },
  ru: {
    /* ... */
  },
  kz: {
    /* ... */
  },
} as const;

export type Language = keyof typeof translations;
export type TranslationKey = typeof translations.en;
```

**DB queries**

- None.

---

### File: `lib/supabase/client.ts`

**Purpose**

- Creates a browser Supabase client (and memoizes it on `globalThis` to avoid re-creating it).

**Functions/Methods**

- `createClient()`
  - What it does: returns a singleton instance of `createBrowserClient(...)`.
  - Uses env vars: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
  - Returns: Supabase browser client.

**Key snippet**

```ts
export function createClient() {
  if (globalForSupabase.__danaSupabaseBrowserClient) {
    return globalForSupabase.__danaSupabaseBrowserClient;
  }

  globalForSupabase.__danaSupabaseBrowserClient = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );

  return globalForSupabase.__danaSupabaseBrowserClient;
}
```

**DB queries**

- None (client factory only).

---

### File: `lib/supabase/server.ts`

**Purpose**

- Creates a server Supabase client configured with a Next.js cookie adapter (used for SSR/server components).

**Functions/Methods**

- `createClient()`
  - What it does: reads the request cookie store and creates a `createServerClient(...)` with custom cookie get/set/remove.
  - Uses env vars: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
  - Returns: Supabase server client.
  - Notes: cookie `set/remove` are wrapped in `try/catch` (ignored in server component contexts where mutation may error).

**Key snippet**

```ts
export const createClient = async () => {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
      },
    },
  );
};
```

**DB queries**

- None (client factory only).

---

## tests/

### File: `tests/setup.ts`

**Purpose**

- Test environment setup for Vitest + Testing Library.
- Registers `@testing-library/jest-dom` matchers for assertions like `toBeInTheDocument()`.

**Functions/Methods**

- None (side-effect import only).

**Key snippet**

```ts
import "@testing-library/jest-dom/vitest";
```

**DB queries**

- None.

---

### File: `tests/TagInput.test.tsx`

**Purpose**

- Unit tests for the `TagInput` component behavior (adding/removing tags, validation).

**Functions/Methods**

- `describe('TagInput', () => { ... })`
  - What it does: groups related tests for `TagInput`.
- Test cases:
  - `it('adds a tag on Enter (normal case)', ...)`
  - `it('does not add empty/whitespace tags (erroneous case)', ...)`
  - `it('prevents duplicates (extreme/repeat input)', ...)`
  - `it('removes last tag on Backspace when input is empty', ...)`

**Key snippet**

```ts
const input = screen.getByRole("textbox");
fireEvent.change(input, { target: { value: "AI" } });
fireEvent.keyDown(input, { key: "Enter" });
```

**DB queries**

- None.

---

### File: `tests/utils.test.ts`

**Purpose**

- Unit tests for the `cn` utility (class name merging and Tailwind conflict resolution).

**Functions/Methods**

- `describe('cn', () => { ... })`
  - What it does: groups tests for `cn`.
- Test cases:
  - `it('merges class names', ...)`
  - `it('deduplicates tailwind conflicts (twMerge)', ...)`

**Key snippet**

```ts
expect(cn("p-2", "p-4")).toBe("p-4");
```

**DB queries**

- None.

---

## SQL / Supabase

### File: `supabase-schema.sql` (root)

**Purpose**

- Baseline Supabase Postgres schema for DANA Connect: core tables, triggers, RLS policies, and an account-deletion RPC.

**Functions/Methods (SQL)**

- `update_updated_at()` (trigger function)
  - What it does: sets `NEW.updated_at = now()` on row updates.
  - Used by triggers on `profiles`, `research_opportunities`, `applications`.
- `delete_user_account()` (RPC)
  - What it does: deletes the caller’s `profiles` row (cascades), then deletes the matching `auth.users` row.
  - Security: `SECURITY DEFINER`.
  - Used by: app code via `supabase.rpc('delete_user_account')`.

**Key snippet**

```sql
CREATE OR REPLACE FUNCTION delete_user_account()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  DELETE FROM profiles WHERE id = auth.uid();
  DELETE FROM auth.users WHERE id = auth.uid();
END;
$$;
```

**DB objects created/managed**

- Tables: `profiles`, `research_opportunities`, `applications`.
- Triggers: `profiles_updated_at`, `opps_updated_at`, `apps_updated_at`.
- RLS enabled on: `profiles`, `research_opportunities`, `applications`.
- Policies (examples):
  - `profiles`: own-profile management; public SELECT of mentors only.
  - `research_opportunities`: public SELECT open; mentor CRUD on own.
  - `applications`: mentee manage own; mentor SELECT/UPDATE for own opps.
  - `storage.objects`: DELETE policy for per-user folder in `cvs` bucket.

---

### File: `supabase-migration-photo.sql` (root)

**Purpose**

- Adds profile presentation fields and configures the `avatars` storage bucket + RLS policies.

**Functions/Methods (SQL)**

- None (DDL + policies).

**Key snippet**

```sql
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS title text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS photo_url text;

INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;
```

**DB objects created/managed**

- Table alterations: `profiles.title`, `profiles.photo_url`.
- Storage bucket: `avatars` (public).
- `storage.objects` policies:
  - INSERT/UPDATE/DELETE limited to `auth.uid()` folder.
  - SELECT public read for `avatars`.

---

### File: `supabase-migration-projects.sql` (root)

**Purpose**

- Adds collaborative project posting and join-request workflow tables + policies.

**Functions/Methods (SQL)**

- None (DDL + triggers + policies).

**Key snippet**

```sql
CREATE TABLE projects (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  creator_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  is_open boolean DEFAULT true
);

CREATE TABLE project_requests (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id uuid REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
  UNIQUE(project_id, user_id)
);
```

**DB objects created/managed**

- Tables: `projects`, `project_requests`.
- Triggers: `projects_updated_at`, `project_requests_updated_at` (both use `update_updated_at()`).
- RLS enabled on: `projects`, `project_requests`.
- Policies (examples):
  - `projects`: public SELECT open; creator CRUD on own.
  - `project_requests`: requester manage own; creator SELECT/UPDATE for their projects.
