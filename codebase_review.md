# KundAI Frontend — Codebase Review

**Reviewer:** Claude Code (claude-sonnet-4-6)  
**Date:** 2026-05-30  
**Branch:** `ocr`

---

## Overall Health

This is a feature-rich edtech SPA covering teacher, student, school-admin, and sys-admin portals. The auth flow is well-designed (in-memory token + HttpOnly refresh cookie, no token in localStorage), the OCR pipeline is genuinely impressive, and the env config (`src/config/env.ts`) is a good practice. The codebase shows real engineering effort.

The main problems are structural: auth state and course selection are conflated in a misnamed context, there is zero route-level code splitting (all ~40+ page components load eagerly), and the teacher Dashboard fires O(2N) API calls per load. Several "critical" findings below will cause visible user-facing failures or production security issues. The a11y story is weak throughout.

---

## Severity Legend

- **CRITICAL** — crashes, security holes, or data-loss risks
- **IMPORTANT** — performance regressions, misleading patterns, or UX failures that will hurt real users
- **NICE-TO-HAVE** — code quality, maintainability, minor correctness

---

## 1. Architecture & Structure

### IMPORTANT — `AuthContext` is misnamed and misleading

[src/context/AuthContext.tsx](src/context/AuthContext.tsx)

`AuthContext` and `useAuth()` hold `selectedCourse` and `selectedClassGroups` — **not** authentication state. The actual auth state (`isAuthenticated`, `authChecked`) lives as local `useState` in `App.tsx`, passed nowhere via context. Any component that calls `useAuth()` expecting user/auth data gets course selection instead.

Real auth is scattered across three places: `App.tsx` (state), `tokenStore.ts` (in-memory token), and `authService.ts` (API calls). This makes it non-obvious how to get the logged-in user anywhere.

**Fix:** Rename `AuthContext` to `CourseSelectionContext` / `useCoursSelection()`. Create a real `AuthContext` that exposes `user`, `isAuthenticated`, and `logout()`. Or consolidate into one context with clearly named fields.

---

### IMPORTANT — Role-redirect logic duplicated three times in App.tsx

[src/App.tsx:108-128](src/App.tsx), [src/App.tsx:149-160](src/App.tsx), [src/App.tsx:119-126](src/App.tsx)

The same role-to-path mapping appears in the `/login` route element, the `/` route element, and the `onLogin` callback — three separate IIFE blocks with identical `if/else if` chains. If a new role is ever added, all three must be updated in sync.

```tsx
// This pattern appears 3 times:
if (user?.role === 'sys_admin') return <Navigate to="/sys-admin" replace />;
if (user?.role === 'admin')     return <Navigate to="/admin" replace />;
if (user?.role === 'teacher')   return <Navigate to="/dashboard" replace />;
if (user?.role === 'student')   return <Navigate to="/student/home" replace />;
```

**Fix:**
```tsx
const ROLE_HOME: Record<string, string> = {
  sys_admin: '/sys-admin',
  admin:     '/admin',
  teacher:   '/dashboard',
  student:   '/student/home',
};
const getHomeForRole = (role?: string) => ROLE_HOME[role ?? ''] ?? '/dashboard';
```

---

### IMPORTANT — No route-level code splitting

[src/App.tsx](src/App.tsx) imports all ~40+ page components at the top level. Every byte of every portal — the sysadmin console, student dashboard, OCR tools — is bundled and sent to every user on first load, regardless of their role.

**Fix:** Wrap heavy pages in `React.lazy` + `<Suspense>`:
```tsx
const StudentDashboard = React.lazy(() => import('./components/student/StudentDashboard'));
const SysAdminShell    = React.lazy(() => import('./components/sysadmin/SysAdminShell'));
// ...
<Suspense fallback={<PageSpinner />}>
  <Routes>...</Routes>
</Suspense>
```

This alone will dramatically reduce initial bundle size and time-to-interactive.

---

### NICE-TO-HAVE — Dead code and prototype artifacts in `src/`

Several directories contain files that are not part of the built app:

- [src/components/services-delete/api.ts](src/components/services-delete/api.ts) — old auth implementation (see Security section)
- [src/components/dashboard/Dashboard.tsx.bak](src/components/dashboard/Dashboard.tsx.bak)
- [src/components/layout/Header.tsx.bak](src/components/layout/Header.tsx.bak)
- HTML prototype files inside `src/components/sys-admin-new/`, `school-admin/`, `class-drill-down/`, `kundai-mobile/`
- JSX prototypes in `sys-admin-new/`, `school-admin/` (app.jsx, data.jsx, charts.jsx…) that appear to be design-phase artifacts

These add noise, confuse new contributors, and inflate the repo. Delete them or move them to a `prototypes/` directory outside `src/`.

---

### NICE-TO-HAVE — `authSession.ts` is a one-liner re-export

[src/services/authSession.ts](src/services/authSession.ts) contains only:
```ts
export const getActiveAuthToken = (): string | null => tokenStore.get();
```

It's a thin alias that adds indirection without value. Callers (`StudentDashboard.tsx`) can import `tokenStore` directly, or this alias belongs in `tokenStore.ts` itself.

---

## 2. React Patterns

### CRITICAL — `toast.error()` called in `StudentDashboard` but `toast` is never imported

[src/components/student/StudentDashboard.tsx:249](src/components/student/StudentDashboard.tsx)

```tsx
const handleOpenMission = async (resourceLink: string) => {
  ...
  } catch (err) {
    toast.error("Could not load mission content.");  // ← ReferenceError at runtime
  }
```

`toast` is not imported anywhere in this file. This will throw `ReferenceError: toast is not defined` whenever mission content fails to load.

**Fix:** Add `import { toast } from 'sonner';` at the top of the file (sonner is already a dependency and used elsewhere in the app).

---

### IMPORTANT — Pointless `useMemo` on `displaySubjects`

[src/components/student/StudentDashboard.tsx:316](src/components/student/StudentDashboard.tsx)

```tsx
const displaySubjects = useMemo(() => subjects, [subjects]);
```

This memoizes the identity of `subjects` — it returns the exact same array reference that's already in state. The value of `displaySubjects` is always `subjects`. This provides zero performance benefit and adds noise.

**Fix:** Delete this line. Replace all `displaySubjects` references with `subjects` directly.

---

### IMPORTANT — `navItems` array recreated on every render

[src/components/student/StudentDashboard.tsx:700](src/components/student/StudentDashboard.tsx)

`navItems` is defined as an `Array<...>` literal inside the component body with no `useMemo`. Every render recreates this array and all child components that receive it will see a new reference.

**Fix:** Either declare it as a module-level constant (it has no dependency on props or state), or wrap it in `useMemo(() => [...], [])`.

---

### IMPORTANT — `RequireRole` JSON.parses localStorage on every render, no memoization

[src/App.tsx:57-62](src/App.tsx)

```tsx
function RequireRole({ role, children }: { role: string; children: React.ReactNode }) {
  const userStr = localStorage.getItem('user');
  const user = userStr ? JSON.parse(userStr) : null;  // runs on every render
  if (!user || user.role !== role) return <Navigate to="/login" replace />;
  return <>{children}</>;
}
```

`JSON.parse` runs on every render of every protected route. Additionally this trusts client-side data for access control decisions (role gating in the UI should be treated as UX-only, not security).

**Fix:** Move the user read into a `useMemo`, or better, put user state in a real AuthContext so every component can read from memory rather than the DOM.

---

### NICE-TO-HAVE — Render functions should be components

In `StudentDashboard`, `renderOverview()`, `renderViewSkeleton(view)`, and `renderContent()` are functions defined inside the component that return JSX. React can't apply reconciliation optimizations to these; they also can't receive React-style memoization. At `StudentDashboard`'s scale (1622 lines), this contributes to render cost.

**Fix:** Extract them into proper `<OverviewPanel />`, `<ViewSkeleton view={view} />`, and `<DashboardContent />` components.

---

### NICE-TO-HAVE — Debug `console.log` left in production code

[src/components/student/StudentDashboard.tsx:291](src/components/student/StudentDashboard.tsx)

```tsx
console.log("🚀 [Dashboard] Mapping Subject Plans:", subjectPlans);
```

This fires on every render involving `subjectPlans` change.

---

## 3. State Management

### CRITICAL — Teacher Dashboard fires O(2N) API calls for N students

[src/components/dashboard/Dashboard.tsx:89-129](src/components/dashboard/Dashboard.tsx)

```tsx
const devProfiles = await Promise.all(
  rawStudents.map(async (student: any) => {
    const [devData, plans] = await Promise.all([
      studentService.getStudentDevelopment(student._id),       // 1 call per student
      developmentService.getAllPlansForStudent(student.id)     // 1 call per student
    ]);
    // ...
  })
);
```

If a class has 30 students, this fires **60 simultaneous API requests** on every dashboard load (and on every course/class change). This will spike server load, hit any rate limiter, and make the dashboard sluggish or completely fail with a 429.

**Fix:** Add a backend endpoint that returns development data for a full course/class in one call: `GET /api/courses/:id/digital-twins`. The frontend should never fan out N parallel calls for list data.

---

### IMPORTANT — No server state caching

The app uses plain `useState` + `useEffect` for all data fetching. Every navigation or re-mount re-fetches from scratch. There is no TanStack Query, SWR, or any cache layer.

Practical consequences:
- Switching tabs in `StudentDashboard` triggers full refetches of subjects, plans, and report card data
- The 60-second polling interval in `StudentDashboard` duplicates what a proper cache with `staleTime` would handle automatically
- The teacher dashboard refetches 60+ API calls every time `selectedCourse` changes

Recommendation: Add TanStack Query (`@tanstack/react-query`). It's a `~12KB` gzip addition that eliminates all of these patterns.

---

### IMPORTANT — Artificial 500ms loading delay

[src/components/student/StudentDashboard.tsx:461](src/components/student/StudentDashboard.tsx)

```tsx
setTimeout(() => setLoading(false), 500);
```

`setLoading(false)` is called inside a `setTimeout` after data has already arrived. This adds a fake 500ms delay to every student dashboard load. This is likely a leftover from a flash-of-content debugging session.

**Fix:** Call `setLoading(false)` directly in the `finally` block without the timeout.

---

### IMPORTANT — Login fires navigation twice

[src/App.tsx:118-127](src/App.tsx) and [src/components/pages/Login.tsx:82-88](src/components/pages/Login.tsx)

When login succeeds:
1. `onLogin()` is called → `App.tsx` calls `navigate('/dashboard')` (or role-based path)
2. `Login.tsx` then also calls `navigate('/dashboard')`

The second navigate fires after the first has already changed the route. While React Router de-duplicates same-path navigates, if the role-derived paths ever diverge between the two call sites, the user will land in the wrong place.

**Fix:** Remove the navigate calls from `Login.tsx`. The `onLogin` callback in `App.tsx` is the single authoritative navigation handler. The comment in `Login.tsx` already acknowledges this ("Note: App.tsx also has navigation logic…") but the redundant calls remain.

---

## 4. TypeScript / Type Safety

### IMPORTANT — `any` throughout the service layer

Across the services:

| File | Issue |
|---|---|
| [src/services/apiClient.ts:14](src/services/apiClient.ts) | `parseErrorMessage(error: any)` |
| [src/services/aiService.ts:102](src/services/aiService.ts) | `regenerateQuestions(params: any)` |
| [src/services/submissionService.ts:32](src/services/submissionService.ts) | `submitAssignment(submissionData: any)` |
| [src/services/adminService.ts:54](src/services/adminService.ts) | `createUser(userData: any): Promise<any>` |
| [src/services/studentService.ts:11-12](src/services/studentService.ts) | `developmentPlans: any[]`, `studentAttributes: any[]` |
| [src/services/chatService.ts:37](src/services/chatService.ts) | `messages: any[]` |

`parseErrorMessage` is fine as `any` (error catch clauses must be `unknown`/`any`). The rest should be typed — these are all API boundary points where wrong shapes will cause silent bugs.

---

### IMPORTANT — `Assessment.questions` is a union of `Question[] | string`

[src/types/index.ts:385](src/types/index.ts)

```ts
questions: Question[] | string; // Can be array of questions or JSON string
```

Every caller that accesses `questions` must check `typeof questions === 'string'` or risk `.map is not a function`. This is a weak type that spreads defensive checks everywhere. The JSON string should be parsed at the API boundary (in `assessmentService.ts`) and only `Question[]` should flow to the UI layer.

---

### IMPORTANT — `DevelopmentPlan` interface is incomplete

[src/types/index.ts:236-247](src/types/index.ts) and [src/components/student/StudentDashboard.tsx:905](src/components/student/StudentDashboard.tsx)

`DevelopmentPlan` doesn't define `progress`, `missions`, `title`, `updatedAt` as first-class fields (they're accessed via `plan.progress`, `plan.missions`, etc.), so components cast the type with `as any` or use `(p: any)` in memos. The real backend shape needs to be captured in the type.

---

### NICE-TO-HAVE — `UserRole` type is narrower than the runtime values

[src/types/index.ts:86](src/types/index.ts)

```ts
export type UserRole = 'student' | 'teacher' | 'admin';
```

But the codebase also uses `'sys_admin'` everywhere (`RequireRole`, route guards, redirect logic). This means `user.role === 'sys_admin'` type-checks only because `user.role` becomes `string` in some paths, not because the type is accurate. Add `'sys_admin'` to `UserRole`.

---

## 5. Performance

### CRITICAL — Source maps shipped to production

[vite.config.ts:23](vite.config.ts)

```ts
build: {
  sourcemap: true,
},
```

`sourcemap: true` writes `.js.map` files adjacent to the production bundle and the browser loads them. This exposes your full TypeScript source code to anyone who opens DevTools → Sources. Remove this for production, or use `sourcemap: 'hidden'` if you need maps for a server-side error tracking tool (Sentry, etc.).

---

### IMPORTANT — `@aws-sdk/client-s3` and `@aws-sdk/s3-request-presigner` in `dependencies`

[package.json:16-17](package.json)

These packages are in `dependencies` but are never imported in any `.ts`/`.tsx` source file (all S3 operations go through the backend API using pre-signed URLs). Including the AWS SDK in the frontend bundle would add hundreds of kilobytes and pull in Node.js polyfills.

Even if Vite tree-shakes them, having Node.js SDK packages in the frontend `dependencies` is a mistake that will confuse tooling and cause issues if they're ever accidentally imported. Move them to the backend's `package.json` or remove them from the frontend entirely.

---

### IMPORTANT — No lazy loading for any heavyweight library

The following large libraries are imported at module level without dynamic imports:

- `pdfjs-dist` (~1MB gzip) — used only in OCR/upload flows
- `@fullcalendar/*` — used only on the calendar page
- `mammoth` — used only in BulkStudentUpload
- `recharts` — used only in analytics/reporting pages
- `@techstark/opencv-js` — used only in mobile OCR edge detection

Combined with no route-level splitting (see §1), the initial bundle is unnecessarily large for every user.

**Fix:** Dynamic import at the call site:
```ts
// In BulkStudentUpload (already done correctly here — replicate the pattern elsewhere):
const XLSX = await import('xlsx');
```
For `pdfjs-dist` and `@fullcalendar`, wrap in `React.lazy()` at the route level.

---

### NICE-TO-HAVE — `optimizeDeps.exclude: ['lucide-react']` is counterproductive

[vite.config.ts:19-21](vite.config.ts)

Excluding `lucide-react` from Vite's pre-bundling means it's processed on-demand during dev server requests, slowing down initial dev page loads. `lucide-react` supports tree-shaking and works fine with pre-bundling. Remove the exclusion.

---

## 6. Accessibility (a11y)

### IMPORTANT — 693 `<button>` elements, only 72 `aria-*` attributes across the whole codebase

Most buttons are purely icon-based (a Lucide icon with no text), have no `aria-label`, and are not keyboard-navigable with meaningful context. A screen reader user navigating the teacher dashboard or student dashboard cannot tell what most buttons do.

**Minimum fix:** Every icon-only button needs an `aria-label`:
```tsx
// Before
<button onClick={handleLogout}><LogOut className="w-4 h-4" /></button>

// After
<button onClick={handleLogout} aria-label="Log out"><LogOut className="w-4 h-4" aria-hidden="true" /></button>
```

---

### IMPORTANT — Form labels not associated with inputs in Login.tsx

[src/components/pages/Login.tsx:211-219](src/components/pages/Login.tsx)

```tsx
<label className="block text-sm font-semibold text-slate-700 mb-2">Email</label>
<div className="flex items-center gap-3 ...">
  <Mail className="h-5 w-5 text-slate-400" />
  <input {...register('email')} type="email" ... />
</div>
```

The `<label>` has no `for`/`htmlFor` attribute and is not wrapping the input. Screen readers cannot associate the label with the field. The login form is the entry point for every user in the system.

**Fix:**
```tsx
<label htmlFor="email" className="...">Email</label>
<input id="email" {...register('email')} type="email" ... />
```

---

### IMPORTANT — Modals lack focus trapping and `aria-modal`

Across the codebase (OCR modals, event modals, confirm dialogs), custom modal implementations render a `<div>` overlay without:
- `role="dialog"` or `aria-modal="true"`
- `aria-labelledby` pointing to the modal's heading
- Focus trap (Tab should cycle within the modal)
- Return focus to the trigger element on close

The Radix UI dialog component (`@radix-ui/react-dialog`, already a dependency) handles all of this. Use it for modal implementations instead of custom `div` overlays.

---

### NICE-TO-HAVE — Error message in Login uses `animate-pulse`

[src/components/pages/Login.tsx:239](src/components/pages/Login.tsx)

```tsx
<div className="... animate-pulse">{error}</div>
```

Pulsing animation on an error message suggests "loading" rather than "error". It's visually confusing and can be distracting for users with vestibular disorders. Remove the animation from error state. Consider `role="alert"` so screen readers announce it.

---

## 7. UX & Interaction Design

### IMPORTANT — Auth guard silently returns `null` during startup

[src/App.tsx:94](src/App.tsx)

```tsx
if (!authChecked) return null;
```

While the app checks the refresh token (which takes a network round-trip), the entire UI is blank. Users on slow connections see a white screen with no feedback.

**Fix:** Return a skeleton or spinner:
```tsx
if (!authChecked) return <AppLoadingScreen />;
```

---

### IMPORTANT — Student portal polling fires immediately on `selectedSubjectId` change

[src/components/student/StudentDashboard.tsx:512-552](src/components/student/StudentDashboard.tsx)

The `useEffect` that starts the 60-second polling interval depends on `[student?.id, selectedSubjectId, notificationRecipientId]`. Every time the user changes the subject dropdown, the effect re-runs: the old interval is cleared, all 6 live-data requests fire immediately, then a new interval starts. Changing subjects 5 times in quick succession fires 30+ API requests.

**Fix:** Debounce the `selectedSubjectId` value before using it as an effect dependency, or separate the subject-specific fetch from the base polling interval.

---

### NICE-TO-HAVE — No empty state for teacher dashboard without a selected course

[src/components/dashboard/Dashboard.tsx:44-48](src/components/dashboard/Dashboard.tsx)

```tsx
if (!selectedCourse) return;  // silently bails from the fetch
```

When no course is selected, the dashboard renders its full grid layout but all panels are empty with no explanation. A new teacher's first experience is a blank dashboard. Add an empty state prompt: "Select a subject from the header to get started."

---

## 8. Code Quality

### IMPORTANT — `services-delete/api.ts` is dead code with an old auth pattern

[src/components/services-delete/api.ts:58](src/components/services-delete/api.ts)

This file contains a complete duplicate auth implementation from an older version. It stores tokens in `localStorage`:
```ts
localStorage.removeItem('token');
```
The modern codebase correctly uses in-memory token storage. This file is not imported anywhere active, but its presence in `src/` is a maintenance hazard — a confused contributor might import from it and reintroduce the old insecure pattern.

**Fix:** Delete this directory entirely.

---

### IMPORTANT — `StudentDashboard.tsx` is 1622 lines

[src/components/student/StudentDashboard.tsx](src/components/student/StudentDashboard.tsx)

Also: `StudentSubjectsView.tsx` is 2672 lines, `StudentAssignments.tsx` is 1494 lines, `Inbox.tsx` is 1331 lines.

These files mix layout, data fetching, business logic, sub-view rendering, and local state into single components. They're difficult to review, impossible to test in isolation, and changes to any one part require understanding the entire file.

The `StudentDashboard` alone handles: header rendering, mobile nav, notification panel, account menu, scroll detection, view routing, 12+ useEffects, and 5 rendered sub-views. Extract each view into its own component file.

---

### NICE-TO-HAVE — `getGradeFromPercent` defined inline in the dashboard

[src/components/student/StudentDashboard.tsx:341-346](src/components/student/StudentDashboard.tsx)

This is a pure utility function defined inside the component body. It gets re-created on every render and is likely needed elsewhere (report card, report page). Move it to `src/utils/grades.ts`.

---

### NICE-TO-HAVE — Inconsistent toast implementations

Some files use `sonner`'s `toast`, others use the Radix-based `useToast()` hook from `src/components/ui/use-toast.ts`. There are two parallel notification systems with different appearances. Standardize on one (`sonner` is simpler and already in use across most of the app).

---

## 9. Security

### CRITICAL — Source maps exposed in production (see §5)

[vite.config.ts:23](vite.config.ts) — `sourcemap: true` serves `.js.map` files alongside the production bundle, exposing your full TypeScript source to anyone with browser DevTools.

---

### IMPORTANT — `dangerouslySetInnerHTML` with KaTeX output on OCR text

[src/components/ocr/RenderedText.tsx:37,45](src/components/ocr/RenderedText.tsx)  
[src/components/ui/DiagramRenderer.tsx:42](src/components/ui/DiagramRenderer.tsx)

KaTeX's `renderToString()` output is injected directly via `dangerouslySetInnerHTML`. KaTeX itself sanitizes math expressions, so this is low-risk for LaTeX payloads. However, the input to these components flows from OCR-transcribed text and AI-generated content — both untrusted sources. If a math expression ever contains unexpected HTML that slips through KaTeX's parser, it would be injected as raw HTML.

`DiagramRenderer.tsx` does `escapeHtml()` on text segments outside math delimiters, which is good. `RenderedText.tsx` does not escape the formula argument before passing it to `renderKatex()`.

**Fix:** Ensure `throwOnError: false` is set (it is), and add a DOMPurify pass on the KaTeX output before injection:
```ts
import DOMPurify from 'dompurify';
dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(renderKatex(match[1].trim(), true)) }}
```

---

### IMPORTANT — Client-side role gating in `RequireRole` trusts localStorage

[src/App.tsx:57-62](src/App.tsx)

`RequireRole` reads the user's role from `localStorage.getItem('user')` and uses it to gate route access. A user could manually edit localStorage to set `role: 'sys_admin'` and reach the sys-admin route in the UI. This is an **incomplete** guard — the backend must verify roles on every API call (which it presumably does), but the frontend should not be the sole line of defence even for UX gating.

This is a medium-severity issue because backend auth should prevent actual data access, but it's worth noting. The risk is that a non-admin user can navigate to admin UI and see partially-rendered pages before API calls fail.

---

### NICE-TO-HAVE — `@aws-sdk/client-s3` in frontend dependencies

[package.json](package.json) — Even if unused today, an accidentally-imported AWS SDK module could bundle credentials if `VITE_AWS_*` env vars are defined. Remove from frontend `package.json` (see §5).

---

## 10. Testing & Maintainability

### IMPORTANT — Near-zero test coverage of critical flows

The test files that exist cover:
- `Login.test.tsx` — Login component
- `AuthContext.test.tsx` — context structure

Not covered:
- `authService.ts` — token refresh, logout, error handling
- `apiClient.ts` — 401 retry, suspension redirect, token injection
- `useOcrSession.ts` — WebSocket lifecycle, session cleanup
- `RequireRole` — role gating logic
- `Dashboard.tsx` — data loading, fan-out fetch pattern
- Any of the 35+ service files

The OCR pipeline and the auth token refresh/retry logic are the most complex and failure-prone parts of the codebase, and they have zero tests. A token refresh failure can cause an infinite redirect loop — the kind of bug that's obvious in a test and invisible until a production incident.

---

### IMPORTANT — `vitest.config.ts` and `tsconfig.app.json` type mismatch risk

[package.json:79](package.json) — `@types/react-router-dom: ^5.3.3` is in devDependencies but the app uses `react-router-dom: ^7.6.1`. Version 5 types will conflict with v7 APIs (e.g., `useNavigate` didn't exist in v5). This may cause confusing type errors or silently pass wrong type signatures.

**Fix:** Remove `@types/react-router-dom` entirely — v7 ships its own types.

---

## What's Done Well

- **Token security**: in-memory access token + HttpOnly refresh cookie is the right pattern. It's implemented consistently through `tokenStore.ts` and `apiClient.ts` (including the 401 retry with deduplication via `_refreshPromise`).
- **Environment config**: `src/config/env.ts` fails fast on missing env vars at load time rather than silently hitting localhost. Good.
- **OCR session hook**: `useOcrSession.ts` correctly handles cancellation flags, socket cleanup on unmount, and the anonymous/named student edge case.
- **Login UX**: Suspension notice via sessionStorage survives the redirect and shows on the login page — thoughtful handling of a complex edge case.
- **KaTeX escaping in DiagramRenderer**: text outside math delimiters is escaped with `escapeHtml()` before insertion, which is correct.
- **Zod + react-hook-form**: Using schema validation on the login form is the right approach.
