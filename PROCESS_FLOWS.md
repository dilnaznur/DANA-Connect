# DANA Connect — Process Flows (flowchart-ready)

This document describes the step-by-step process flows implemented in the current DANA Connect project.

For each process:

- Steps are listed in strict execution order.
- Every decision point is written as **Decision:** with Yes/No branches.
- “Server” refers to Next.js server components, middleware, and route handlers.
- “Database” refers to Supabase Postgres tables.
- “Auth” refers to Supabase Auth.

> Important: This project contains **no payment/order system** and **no admin role** in the current codebase. The sections for Admin Login and Payments/Orders are therefore “not implemented”.

---

## 1) User registration flow (end-to-end)

### A. From opening the app to reaching the registration page

1. User opens the app at `/`.
2. User clicks “Get Started” / “Join” or navigates directly to `/register`.
3. Request hits `middleware.ts` (middleware matcher includes `/register`).
4. Middleware loads the Supabase session from cookies and calls `supabase.auth.getUser()`.
5. **Decision:** Is there an authenticated Supabase user in the session cookie?
   - **No:** Allow request to continue to the `/register` page.
   - **Yes:** Middleware queries `profiles` for the current `user.id`.
     - **Decision:** Does the user already have a `profiles` row?
       - **Yes:** Redirect away from `/register` to the role dashboard:
         - mentor → `/dashboard/mentor`
         - mentee → `/dashboard/mentee`
       - **No:** Allow `/register` page to render (user might be mid-registration).

### B. Registration form fill + client-side validations

On `app/register/page.tsx`:

6. The page renders a form with fields:
   - firstName (required)
   - lastName (required)
   - email (required)
   - password (required)
   - phone (optional)
   - title (optional)
   - institution (optional)
   - role (required; mentor/mentee)
   - specialization (optional)
   - motivation (optional)
   - linkedinUrl (optional)
   - profile photo (optional file input)

7. Optional photo upload interaction:
   - User selects a file.
   - **Decision:** Is `file.size <= 5MB`?
     - **No:** Set page-level error message and keep existing photo state.
     - **Yes:** Continue.
   - **Decision:** Does `file.type` start with `image/`?
     - **No:** Set page-level error message.
     - **Yes:** Store file in state and show preview.

8. On submit, `validateForm()` runs and builds a `fieldErrors` map.
9. **Decision:** Is `firstName` non-empty after trimming?
   - **No:** Set `fieldErrors.firstName`, abort submit.
   - **Yes:** Continue.
10. **Decision:** Is `lastName` non-empty after trimming?
    - **No:** Set `fieldErrors.lastName`, abort submit.
    - **Yes:** Continue.
11. **Decision:** Is `email` non-empty after trimming?
    - **No:** Set `fieldErrors.email`, abort submit.
    - **Yes:** Continue.
12. **Decision:** Does `email` match `^[^\s@]+@[^\s@]+\.[^\s@]+$`?
    - **No:** Set `fieldErrors.email`, abort submit.
    - **Yes:** Continue.
13. **Decision:** Is `password` present?
    - **No:** Set `fieldErrors.password`, abort submit.
    - **Yes:** Continue.
14. **Decision:** Is `password.length >= 8`?
    - **No:** Set `fieldErrors.password`, abort submit.
    - **Yes:** Continue.
15. **Decision:** Is `role` selected?
    - **No:** Set `fieldErrors.role`, abort submit.
    - **Yes:** All validations pass → proceed to Supabase.

### C. Supabase Auth sign-up + profile creation

16. UI sets loading state (`isLoading=true`) and clears prior error.
17. Client creates a Supabase browser client (`lib/supabase/client.ts`).
18. Client calls `supabase.auth.signUp({ email, password, options: { emailRedirectTo: <origin>/auth/callback } })`.
19. **Decision:** Did Supabase return `authError`?
    - **Yes:** Display `authError.message`, set `isLoading=false`, stop.
    - **No:** Continue.
20. **Decision:** Did Supabase return `authData.user`?
    - **No:** Show “failed to create account” message, set `isLoading=false`, stop.
    - **Yes:** Continue.

21. Build `profileData` object in client code:
    - `id` = `authData.user.id`
    - `full_name` = `${firstName} ${lastName}`
    - `email`, `phone`, `role`, `specialization`, `title`, `motivation`, `linkedin_url`, `institution`
    - `photo_url` initially `null`

22. Save `profileData` into `localStorage` under key `dana_pending_profile`.
    - Purpose: if the user completes email confirmation via `/auth/callback`, `/auth/complete-profile` can reconstruct the profile.

23. Insert profile into DB immediately:
    - Client calls `supabase.from('profiles').insert({...})`.
24. **Decision:** Did the insert return an error other than duplicate key `23505`?
    - **Yes:** Display `profileError.message`, set `isLoading=false`, stop.
    - **No:** Continue.

25. Remove `dana_pending_profile` from `localStorage`.

### D. Optional avatar upload (non-blocking background task)

26. **Decision:** Did the user select a photo file?
    - **No:** Skip upload.
    - **Yes:** Start `uploadPhotoInBackground()`:
      1. Upload to Supabase Storage bucket `avatars` at path `<userId>/avatar.<ext>` with `{ upsert: true }`.
      2. **Decision:** Upload error?
         - **Yes:** Log error; return `null` (UI does not block or surface this error).
         - **No:** Continue.
      3. Get public URL from Supabase Storage.
      4. Update DB: `profiles.photo_url = publicUrl`.

### E. Final redirect after sign-up

27. Client redirects user based on selected role:
    - mentor → `/dashboard/mentor`
    - mentee → `/dashboard/mentee`

### F. Email confirmation callback flow (only if your Supabase Auth requires it)

This is a separate flow triggered by clicking the email confirmation link:

28. User clicks email confirmation link (generated by Supabase). Link includes `code` and redirects to `/auth/callback`.
29. Server route handler `app/auth/callback/route.ts` runs.
30. It extracts `code` from the URL.
31. **Decision:** Is there a `code`?
    - **No:** Skip session exchange.
    - **Yes:** Server creates Supabase server client and calls `supabase.auth.exchangeCodeForSession(code)` to set auth cookies.
32. Redirect to `/auth/complete-profile`.

33. `app/auth/complete-profile/page.tsx` runs in the browser.
34. It calls `supabase.auth.getUser()`.
35. **Decision:** Do we have a valid user?
    - **No:** Redirect to `/register`.
    - **Yes:** Continue.
36. It queries `profiles` for `user.id`.
37. **Decision:** Does a profile already exist?
    - **Yes:** Show success and redirect to dashboard based on `existingProfile.role`.
    - **No:** Continue.
38. Read `localStorage.dana_pending_profile`.
39. **Decision:** Is it present?
    - **No:** Redirect to `/register`.
    - **Yes:** Parse JSON.
40. **Decision:** JSON parse succeeded?
    - **No:** Show error state.
    - **Yes:** Insert into `profiles`.
41. **Decision:** Insert returned error?
    - **Yes:**
      - **Decision:** Is it duplicate key `23505`?
        - **Yes:** Treat as success and redirect.
        - **No:** Show error state with message.
    - **No:** Remove localStorage key, show success, redirect.

---

## 2) User login flow

### A. Navigation to login page

1. User navigates to `/login`.
2. Request hits `middleware.ts` (matcher includes `/login`).
3. Middleware loads Supabase user from cookies.
4. **Decision:** Is the user logged in (cookie session)?
   - **No:** Allow `/login` to render.
   - **Yes:** Middleware fetches `profiles.role`.
     - **Decision:** Does a profile exist?
       - **Yes:** Redirect to dashboard for that role.
       - **No:** Allow `/login` to render (user may be mid-registration).

### B. Form validation + Supabase sign-in

On `app/login/page.tsx`:

5. User enters email + password.
6. Browser-level validation enforces required fields (`required` attributes) and email input type.
7. User submits.
8. UI clears existing error and sets `isLoading=true`.
9. Client calls `supabase.auth.signInWithPassword({ email, password })`.
10. **Decision:** Did Supabase return `authError`?
    - **Yes:** Display `authError.message`, set `isLoading=false`, stop.
    - **No:** Continue.

11. Client calls `supabase.auth.getUser()`.
12. **Decision:** Is `user` present?

- **No:** No redirect happens; the page stays on the login form (and `isLoading` remains `true` in the current implementation).
- **Yes:** Continue.

13. Fetch profile role: `supabase.from('profiles').select('role').eq('id', user.id).single()`.
14. **Decision:** Is profile found and role is `mentor`?
    - **Yes:** Redirect to `/dashboard/mentor`.
    - **No:** Redirect to `/dashboard/mentee` (default fallback in code).

---

## 3) Admin login flow

### Status in current project

There is **no admin concept** implemented.

- No admin role in `profiles.role` (only `mentor` and `mentee`).
- No admin-only routes.
- No separate admin login UI.

### Therefore

- **Admin Login flow is not implemented**.
- Any “admin login” would currently be the same as a normal user login, but without admin authorization features.

---

## 4) Payment / order creation flow

### Status in current project

A payment/order system is **not implemented** in this codebase:

- No payment provider integration.
- No “services” catalog.
- No `orders` tables/migrations.
- No checkout UI.

### Therefore

- **Payment / Order creation flow is not implemented**.

---

## 5) Admin order management flow

### Status in current project

Admin order management is **not implemented** because:

- There are no orders.
- There is no admin role.

---

## 6) Data flow (user ⇄ server ⇄ database)

This section describes what is sent, processed, stored, and returned for specific operations.

### A. Registration

**User → Client UI**

- Sends form inputs via browser events: name, email, password, role, optional profile fields.
- Optionally selects an image file for avatar.

**Client UI → Supabase Auth (server-side managed by Supabase)**

- Calls `auth.signUp(email, password, emailRedirectTo)`.

**Client UI → Database (Supabase Postgres)**

- Inserts one row in `profiles` with `id = auth.user.id` and other profile fields.

**Client UI → Supabase Storage**

- Optional upload: writes avatar to `storage.objects` in bucket `avatars`.
- Then updates `profiles.photo_url` with the public URL.

**Server processing (Next.js)**

- Registration itself is mostly client-driven; server-side involvement is limited to:
  - Middleware redirects (if already logged in).
  - Auth callback handler (only if email confirmation is used) exchanging `code` for session cookies.

**What is returned to the user**

- On success: redirect to dashboard.
- On error: error message displayed on the register page.

### B. Login

**User → Client UI**

- Enters email and password.

**Client UI → Supabase Auth**

- Calls `auth.signInWithPassword(email, password)`.

**Client UI → Database**

- Reads `profiles.role` for routing.

**Server processing (Next.js)**

- Middleware can redirect away from `/login` if the user already has a session + profile.

**What is returned to the user**

- On success: redirect to mentor/mentee dashboard.
- On error: error text displayed in login form.

### C. Placing an order

Not applicable — no orders/payments exist.

### D. Admin updating an order

Not applicable — no admin or orders exist.

---

## 7) Other important processes in this project

These are major flows you will likely want flowcharts for.

### A. Dashboard route protection + role routing

1. User navigates to `/dashboard/...`.
2. Middleware checks Supabase cookie session.
3. **Decision:** Is user authenticated?
   - **No:** Redirect to `/login`.
   - **Yes:** Query `profiles.role`.
4. **Decision:** Does `profiles` row exist?
   - **No:** Redirect to `/auth/complete-profile`.
   - **Yes:** Continue.
5. **Decision:** Is route `/dashboard/mentor` but role is not mentor?
   - **Yes:** Redirect to `/dashboard/mentee`.
   - **No:** Continue.
6. **Decision:** Is route `/dashboard/mentee` but role is not mentee?
   - **Yes:** Redirect to `/dashboard/mentor`.
   - **No:** Continue to requested dashboard.

### B. Mentee applies to a research opportunity (with optional CV)

(Implemented in both dashboards’ “Apply” dialog.)

1. User clicks Apply on an opportunity.
2. Application dialog opens.
3. User types motivation text.
4. **Decision:** Is `motivationText.length >= 100`?
   - **No:** Show error toast and stop.
   - **Yes:** Continue.
5. Optional CV upload:
   - User selects a file.
   - **Decision:** File extension in `{pdf, doc, docx}`?
     - **No:** Set CV error message, stop.
     - **Yes:** Continue.
   - **Decision:** `file.size <= 5MB`?
     - **No:** Set CV error message, stop.
     - **Yes:** Upload to bucket `cvs` at path `<profileId>/<opportunityId>.<ext>` with `upsert: true`.
   - **Decision:** Upload error?
     - **Yes:** Show error toast, stop.
     - **No:** Continue and record `cvPath`.
6. Insert application row:
   - `applications.insert({ mentee_id, opportunity_id, motivation_text, cv_url, status:'pending' })`
7. **Decision:** Insert error?
   - **Yes:**
     - **Decision:** Unique violation `23505` (already applied)?
       - **Yes:** Show “already applied” toast.
       - **No:** Show error message toast.
   - **No:** Show success toast.
8. Refetch “my applications” list.

### C. Mentor posts a research opportunity

1. Mentor opens the mentor dashboard.
2. Mentor opens the “Post opportunity” dialog.
3. Mentor fills fields (at minimum: title + description; plus tags, total_spots, duration/customDuration).
4. Compute `finalDuration`:
   - If duration is `Custom` → use `customDuration`.
   - Else → use `duration`.
5. **Decision:** Are `title` and `description` non-empty after trimming?
   - **No:** Show error toast and stop.
   - **Yes:** Continue.
6. Insert row into `research_opportunities` with:
   - `mentor_id = profile.id`
   - `title`, `description`, `tags`, `total_spots`
   - `duration = finalDuration || null`
   - `filled_spots = 0`, `is_open = true`
7. **Decision:** Insert error?
   - **Yes:** Show error toast.
   - **No:** Show success toast, close dialog, reset dialog state, refetch opportunities.

### D. Mentor toggles an opportunity open/closed

1. Mentor clicks the open/closed toggle on an opportunity.
2. Update DB: `research_opportunities.update({ is_open: !opp.is_open }).eq('id', opp.id)`.
3. **Decision:** Update error?
   - **Yes:** Stop (no success toast is shown in current implementation).
   - **No:** Refetch opportunities and show a success toast (“opened” or “closed”).

### E. Mentor reviews applications (auto-mark “pending” as “viewed”)

1. Mentor opens dashboard.
2. Mentor clicks “Applications” tab.
3. Mentor client filters applications with status `pending`.
4. **Decision:** Are there any pending applications?
   - **No:** Do nothing.
   - **Yes:** Bulk update:
     - `applications.update({ status:'viewed' }).eq('status','pending').in('opportunity_id', myOpportunityIds)`
5. Refetch applications.

### F. Mentor accepts an application (spots + email notification)

1. Mentor clicks Accept on an application.
2. Update application status:
   - `applications.update({ status:'accepted' }).eq('id', application.id)`
3. **Decision:** Update error?
   - **Yes:** Show error toast, stop.
   - **No:** Continue.
4. Increment opportunity filled spots:
   - Find related opportunity in state.
   - Compute `newFilledSpots = filled_spots + 1`.
   - **Decision:** `newFilledSpots >= total_spots`?
     - **Yes:** Update `research_opportunities` with `{ filled_spots: newFilledSpots, is_open: false }`.
     - **No:** Update with `{ filled_spots: newFilledSpots }`.
5. Email notification:
   - **Decision:** Do we have enough data to email (mentor profile + mentee email + name + opportunity title)?
     - **No:** Skip email.
     - **Yes:** POST to `/api/notify-accepted` with mentee/mentor/opportunity details.
       - **Decision:** Did API respond OK?
         - **No:** Show “accepted but email failed” toast (acceptance still stands).
         - **Yes:** Continue.
6. Show success toast.
7. Refetch opportunities + applications.

### G. Mentor rejects an application

1. Mentor clicks Reject.
2. `applications.update({ status:'rejected' }).eq('id', application.id)`.
3. **Decision:** Update error?
   - **Yes:** Stop (no success toast is shown in current implementation).
   - **No:** Show success toast and refetch.

### H. View CV (signed URL)

1. User clicks “View CV”.
2. Normalize stored path:
   - **Decision:** Does stored value contain `/cvs/`?
     - **Yes:** Extract substring after `/cvs/`.
     - **No:** Use value as-is.
3. **Decision:** Is normalized path non-empty?
   - **No:** Show error toast.
   - **Yes:** Continue.
4. Call `supabase.storage.from('cvs').createSignedUrl(path, 60 seconds)`.
5. **Decision:** Signed URL creation error?
   - **Yes:** Show error toast.
   - **No:** `window.open(signedUrl)`.

### I. Projects: post, request to join, manage requests, delete

**Post project**

1. User is authenticated (UI only shows Post actions when logged in).
2. User opens the “Post project” dialog and fills fields (title, description, tags, optional contact info, optional deadline, max_members).
3. **Decision:** Title and description non-empty after trim?
   - **No:** Show error toast and stop.
   - **Yes:** Continue.
4. Insert into `open_projects` with:
   - `creator_id = currentUserId`
   - `title`, `description`, `tags`
   - `contact_email = trimmed || null`, `contact_telegram = trimmed || null`
   - `deadline = deadline || null`
   - `max_members`, `filled_members = 1`, `is_open = true`
5. **Decision:** Insert error?
   - **Yes:** Show error toast.
   - **No:** Show success toast, close dialog, reset dialog state, refetch browse + my projects lists.

**Join request**

1. User clicks Join on a project.
2. User optionally types a join message.
3. Insert into `project_requests`:
   - `project_id`, `requester_id = currentUserId`
   - `message = trimmed || null`
   - `status = 'pending'`
4. **Decision:** Insert error?
   - **Yes:**
     - **Decision:** Unique violation `23505`?
       - **Yes:** Show “already requested” toast.
       - **No:** Show error toast.
   - **No:** Show success toast and refetch.

**Creator accepts request**

1. Creator clicks Accept.
2. Update request status to `accepted`.
3. Compute `newFilledMembers = managedProject.filled_members + 1`.
4. **Decision:** Is `newFilledMembers >= managedProject.max_members`?
   - **Yes:** Update project `filled_members = newFilledMembers` and `is_open = false`.
   - **No:** Update project `filled_members = newFilledMembers` and `is_open = true`.
5. Refetch requests + projects lists.

**Creator rejects request**

1. Creator clicks Reject.
2. Update request status to `rejected`.
3. **Decision:** Update error?
   - **Yes:** Show error toast.
   - **No:** Show success toast and refetch requests.

**Creator deletes project**

1. Creator opens Manage dialog.
2. Creator clicks Delete.
3. Browser confirm dialog appears.
4. **Decision:** User confirms?
   - **No:** Stop.
   - **Yes:** Delete from `open_projects` where `id = project.id` and `creator_id = currentUserId`.
5. **Decision:** Delete error?
   - **Yes:** Show “delete failed” toast.
   - **No:** Show success toast, close manage dialog, refetch browse + my projects lists.

### J. Account deletion

1. User clicks “Delete account”.
2. **Decision:** Confirm text equals `DELETE`?
   - **No:** Block deletion.
   - **Yes:** Continue.
3. List CV files in `cvs/<profileId>/`.
4. **Decision:** List error?
   - **Yes:** Show error toast, stop.
   - **No:** If files exist, remove them.
5. Call `supabase.rpc('delete_user_account')`.
6. **Decision:** RPC error?
   - **Yes:** Show error toast.
   - **No:** Sign out and redirect to `/?deleted=true`.

### K. Profile edit + avatar update

1. User visits `/profile/edit`.
2. Client loads `auth.getUser()`.
3. **Decision:** Authenticated?
   - **No:** Redirect to `/login`.
   - **Yes:** Fetch `profiles.*`.
4. User edits fields.
5. **Decision:** First and last name both non-empty?
   - **No:** Show error toast.
   - **Yes:** Continue.
6. Optional photo change:
   - Validate size <= 5MB, type is image.
   - Upload to `avatars/<userId>/avatar.<ext>`.
   - Get public URL.
7. Update `profiles` row.
8. **Decision:** Update error?
   - **Yes:** Show error toast.
   - **No:** Success toast; redirect to dashboard by role.

### L. Language switching (i18n)

This is implemented via a React context provider.

1. On app load, `LanguageProvider` mounts.
2. It reads `localStorage['dana_language']`.
3. **Decision:** Is stored value one of `{en, ru, kz}`?
   - **No:** Keep default `en`.
   - **Yes:** Set the app language to that value.
4. When user changes language in the UI, the app calls `setLanguage(nextLanguage)`.
5. Provider updates React state and writes `localStorage['dana_language'] = nextLanguage`.
