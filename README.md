# KundAI Frontend

React 18 + TypeScript single-page application for the KundAI educational platform. Targets Zimbabwe's primary and secondary school context with five distinct user portals, a real-time mobile OCR scanning PWA, and deep AI integration for assessment, grading, and student development.

---

## System Context

KundAI is a three-service system. This repo is the browser client only.

```
Browser (this repo — Vite / React 18)
        ↕ REST + WebSocket
kundai-server  (Node.js / Express 5 / MongoDB / Socket.IO — port 5000)
        ↕
kundai-ai-services-backend  (Python / FastAPI / Gemini / Tesseract — port 8000)
```

The frontend talks to `kundai-server` for all data and auth. Direct calls to the AI service (`kundai-ai-services-backend`) happen only for real-time streaming interactions (AI tutor, content generation).

---

## Quick Start

```bash
npm install
cp .env.example .env          # set VITE_API_URL and VITE_AI_SERVICE_URL
npm run dev                   # http://localhost:5173
```

### Environment variables

| Variable | Default | Purpose |
|---|---|---|
| `VITE_API_URL` | `http://localhost:5000/api` | Node.js backend base URL |
| `VITE_AI_SERVICE_URL` | `http://localhost:8000` | Python AI service base URL |
| `VITE_PUBLIC_URL` | *(empty)* | Set to ngrok/public URL for remote dev (enables proxy + HMR over wss) |
| `VITE_REMOTE_DEV` | *(empty)* | Set to `1` to bind server to `0.0.0.0` and configure HMR for `kundai.app` |

The dev server proxies `/api` and `/socket.io` to `localhost:5000` automatically when `VITE_PUBLIC_URL` or `VITE_REMOTE_DEV` is set.

---

## Tech Stack

| Category | Library / Version |
|---|---|
| Framework | React 18.3, TypeScript 5.5, Vite 5.4 |
| Routing | React Router v7 |
| Styling | Tailwind CSS 3 + Radix UI primitives + shadcn/ui |
| Forms | React Hook Form 7 + Zod 3 |
| HTTP | Native `fetch` (custom wrapper in `apiClient.ts`) |
| Real-time | Socket.IO client 4.7 |
| Charts | Recharts 2 |
| Calendar | FullCalendar 6 (daygrid, timegrid, list, interaction) |
| Math rendering | KaTeX 0.16 + remark-math + rehype-katex |
| Documents | pdf.js 5, mammoth 1.9 (Word doc preview) |
| Animations | Framer Motion 12 |
| Drag & drop | @dnd-kit/sortable |
| Notifications | Sonner (toast) |
| Computer vision | @techstark/opencv-js (document edge detection) |
| QR codes | qrcode |
| Spreadsheets | xlsx (bulk student upload) |

---

## Project Structure

```
src/
├── App.tsx                  # Root router + auth gate + role-based redirect
├── main.tsx                 # ReactDOM.createRoot + BrowserRouter
├── routes.tsx               # (empty — all routes live in App.tsx)
├── index.css                # Global Tailwind base
│
├── context/
│   └── AuthContext.tsx      # Course/class-group selection context (used by teacher portal)
│
├── services/                # All API communication (see Services section)
├── types/                   # Shared TypeScript interfaces (see Types section)
├── hooks/                   # Shared custom hooks
├── utils/                   # Utility helpers
├── lib/                     # shadcn/ui cn() helper
├── data/
│   └── mockData.ts          # Legacy mock data (partially still wired in UI stubs)
│
├── pages/
│   ├── LandingPage.tsx      # Public marketing page with StoryDemo animation
│   ├── RegisterPage.tsx     # School self-registration form
│   └── StoryDemo/           # Interactive animated demo embedded in the landing page
│
└── components/
    ├── layout/              # Shared shell layouts
    ├── pages/               # Login, NotFound
    ├── ui/                  # shadcn/ui component overrides + custom primitives
    │
    ├── dashboard/           # Teacher dashboard
    ├── classroom/           # Classroom & development views
    ├── assessments/         # Assessment CRUD + AI wizard
    ├── resources/           # Course resource management
    ├── calendar/            # Academic calendar
    ├── staffroom/           # Teacher ↔ teacher messaging
    ├── teacher/             # Grading, handwriting marking, notifications, profile
    ├── class-drill-down/    # Per-class analytics drill-down
    │
    ├── student/             # Full student portal (all screens)
    │
    ├── admin/               # Legacy school admin portal (kept, not primary)
    ├── school-admin/        # Active school admin portal + design prototypes
    ├── sysadmin/            # Platform sysadmin portal (TypeScript pages)
    ├── sys-admin-new/       # JSX sysadmin prototype — superseded, not routed
    │
    ├── ocr/                 # Desktop OCR session panel (teacher side)
    └── kundai-mobile/       # Mobile OCR PWA (student phone side)
```

---

## Routing & Portals

All routes are declared in `App.tsx`. Authentication is guarded by a silent cookie-based token refresh on startup — the access token lives in memory only (never `localStorage`). Role-based redirects fire immediately after login.

### Public routes

| Path | Component | Notes |
|---|---|---|
| `/` | `LandingPage` | Marketing page; authenticated users are redirected to their portal |
| `/login` | `Login` | Redirects post-login by role |
| `/register` | `RegisterPage` | School self-registration |
| `/m/ocr` | `MobileOcrApp` | Mobile OCR PWA — no auth shell; authenticates via pair token |
| `/m/ocr/pair/:pairToken` | `MobileOcrApp` | Deep-link into a specific scanning session |

### Teacher portal (`/dashboard`, `/classroom`, etc.)

Wrapped in `MainLayout` (sidebar + header with course selector).

| Path | Component | Status |
|---|---|---|
| `/dashboard` | `Dashboard` | Complete — class overview, digital twin card, performance panel, staff room preview |
| `/classroom` | `ClassroomView` | Complete — per-student attribute tracking, development panel, chat, results |
| `/development/:studentId` | `DevelopmentPage` | Complete — displays active/past plans per student |
| `/development/create/:studentId/:courseId` | `DevelopmentPlanCreation` | Complete — AI-driven plan creation wizard |
| `/resources` | `ResourcesDashboard` | Complete — upload, preview (PDF/Word), AI content generation |
| `/staffroom` | `Inbox` | Complete — teacher ↔ teacher messaging |
| `/calendar` | `CalendarView` | Complete — FullCalendar with event CRUD |
| `/teacher/assessments` | `AssessmentsDashboardPage` | Complete — lists all assessments with status/type filters |
| `/teacher/assessments/:id` | `AssessmentDetailPage` | Complete — view questions, submissions, link to marking |
| `/teacher/assessments/:id/edit` | `EditAssessmentPage` | Complete — inline question editor |
| `/teacher/assessments/analysis` | `AssessmentAnalysisPage` | Complete — class-wide score distribution and per-question stats |
| `/teacher/assessments/marking-dashboard` | `GradingDashboard` | Complete — AI-suggested grades + teacher override + handwriting OCR marking |
| `/ai-content/:resourceId` | `AIResourceViewer` | Complete — Gemini-generated explanation of a course resource |
| `/teacher/profile` | `TeacherProfilePage` | Complete — personal details, subject assignments, emergency contacts |
| `/teacher/analytics/:classId` | `ClassDrillDownDashboard` | Complete — class → student → individual drill-down with heatmaps and misconceptions |

### Student portal (`/student/*`)

All student routes render `StudentDashboard`, which acts as a single-page shell that swaps views based on the URL path. Navigation updates the URL for deep-linking.

| Path | View rendered | Status |
|---|---|---|
| `/student/home` | Home dashboard — stats, active plan progress, upcoming events, teachers panel | Complete |
| `/student/my-plans` | `StudentPlanView` — step-by-step development plan with chat | Complete |
| `/student/my-subjects` | `StudentSubjectsView` — per-subject mastery breakdown | Complete |
| `/student/assessments` | `StudentAssignments` — list + submit assignments | Complete |
| `/student/my-report` | `StudentReportCard` — term report card | Complete |
| `/student/ai-coach` | `StudentTutor` — conversational AI tutor (Gemini) | Complete |
| `/student/peer-study` | `StudentPeerStudy` — create/join peer study rooms | Complete |
| `/student/mastery` | `StudentMasteryGaps` — BKT knowledge state visualisation | Complete |
| `/student/stats` | `StudentStats` — performance trends and charts | Complete |
| `/student/profile` | `StudentProfilePage` / `StudentProfileSettings` | Complete |

### School admin portal (`/admin/*`)

Wrapped in `SchoolAdminLayout` (warm paper palette sidebar). Role: `admin`.

| Path | Component | Status |
|---|---|---|
| `/admin` | `SchoolDashboardPage` | Complete — school-wide metrics |
| `/admin/teachers` | `SchoolTeachersPage` | Complete — teacher list, detail view, form drawer (CRUD) |
| `/admin/students` | `SchoolStudentsPage` | Complete — student list with bulk CSV upload |
| `/admin/classes` | `SchoolClassesPage` | Complete — class group management |
| `/admin/subjects` | `SchoolSubjectsPage` | Complete — subject CRUD |
| `/admin/reports` | `SchoolReportsPage` | Complete — generate/schedule/download reports |
| `/admin/billing` | `SchoolBillingPage` | Complete — subscription status, payment reference |
| `/admin/settings` | `SchoolSettingsPage` | Complete — school profile, term settings, student ID config |

### Platform sysadmin portal (`/sys-admin/*`)

Wrapped in `SysAdminShell`. Role: `sys_admin`. Manages all schools on the platform.

| Path | Component | Status |
|---|---|---|
| `/sys-admin` | `SysAdminDashboardPage` | Complete — MRR estimate, seats sold, active subscriptions |
| `/sys-admin/schools` | `SysAdminSchoolsPage` | Complete — school list, activate/suspend |
| `/sys-admin/schools/:schoolId` | `SchoolDetailPage` | Complete — drill into a school's subscription and usage |
| `/sys-admin/subscriptions` | `SysAdminSubscriptionsPage` | Complete — manage all subscriptions |
| `/sys-admin/packages` | `SysAdminPackagesPage` | Complete — pricing package CRUD |
| `/sys-admin/settings` | `SysAdminSettingsPage` | Complete |

### Legacy admin portal (`/legacy-admin/*`)

The original school admin. Kept temporarily alongside `/admin` for reference. Role-gated routes still work but are not linked from any navigation. Will be removed once the school admin portal is fully validated.

---

## Mobile OCR PWA

The most technically complex subsystem. A teacher opens the assessment marking page on their desktop — it creates an OCR session and displays a QR code. The teacher scans it with their phone. The phone browser opens `/m/ocr/pair/:pairToken` — no login required; auth is the pair token itself, which issues a short-lived `phoneJwt`.

### Phone-side state machine (`MobileOcrApp`)

```
pair → connected → student-picker → camera → preview → student-done → gallery → done
```

| Screen | Component | Purpose |
|---|---|---|
| `pair` | `PairScreen` | Enter 6-digit code or use QR deep link to pair |
| `connected` | `ConnectedScreen` | Confirm assessment name and session; shows live socket status |
| `student-picker` | `StudentPickerScreen` | Choose which student's paper to scan next |
| `camera` | `CameraScreen` | Live camera feed with real-time document edge detection |
| `preview` | `PreviewScreen` | Review capture, retake or keep |
| `student-done` | `StudentDoneScreen` | Per-student completion summary, progress toward full class |
| `gallery` | `GalleryScreen` | Review all captured pages across all students |
| `done` | `DoneScreen` | Session complete; start new batch or disconnect |

### Offline resilience

Pages captured while offline are queued in an **IndexedDB outbox** (`lib/outbox.ts`). When connectivity returns, the online event listener and the Service Worker's Background Sync (`sw.js` — tag: `ocr-outbox-sync`) drain the queue independently. The UI shows an unsynced indicator on queued pages and marks them synced once the upload resolves.

### Desktop-side OCR panel (`components/ocr/`)

| File | Purpose |
|---|---|
| `useOcrSession.ts` | Creates the OCR session, opens a Socket.IO connection to receive phone events, maintains `studentsWithPages` state |
| `PhonePairingPanel.tsx` | QR code display, pair code, phone live indicator, student page list, confirm button |
| `OcrReviewComponent.tsx` | Full review UI — page thumbnails, page reordering, text editor |
| `PageThumb.tsx` | Individual page thumbnail with sync status |
| `PageTextEditor.tsx` | Editable extracted text per page |
| `CompileModal.tsx` | Final compilation dialog before submitting to grading |
| `OrderConfirmModal.tsx` | Drag-and-drop page reordering confirmation |
| `RenderedText.tsx` | Displays OCR-extracted text with KaTeX math rendering |
| `ocr.api.ts` | Session creation, page upload, submission save |
| `ocr.types.ts` | Shared types for OCR session state |
| `serverImagesToFiles.ts` | Converts server image URLs to `File` objects for re-upload |

---

## Authentication & Session Management

| File | Role |
|---|---|
| `services/tokenStore.ts` | In-memory singleton for the short-lived access JWT. Never written to `localStorage`. Emits to subscribers on change so React state stays in sync. |
| `services/authService.ts` | `login`, `register`, `logout`, `tryRefresh`, `getCurrentUser`. `tryRefresh` hits `POST /api/auth/refresh` with `credentials: include` to silently restore the session from the HttpOnly refresh cookie on page reload. |
| `services/apiClient.ts` | All fetch calls go through `fetchData()`. On a `401` it attempts one silent refresh; if that fails it clears state and redirects to `/login`. Handles `403 SCHOOL_SUSPENDED` by storing suspension details and redirecting. `fetchAiData()` is the equivalent for the Python AI service (no cookie, just Bearer token). |
| `context/AuthContext.tsx` | Provides the currently selected `Course` and `ClassGroup` to the teacher portal. Not an auth context despite the name — actual auth state lives in `App.tsx` local state + `tokenStore`. |
| `services/authSession.ts` | Thin helper to expose the current token for consumers that can't use the hook. |

---

## Services Layer (`src/services/`)

Every service file exports a plain object or named functions. They all import from `apiClient.ts` (`fetchData` / `fetchAiData`) and never touch `localStorage` except `authService`.

| Service file | Covers |
|---|---|
| `authService.ts` | Login, register, logout, token refresh |
| `studentService.ts` | Student CRUD, profile, subjects, mastery signals |
| `courseService.ts` | Course listing, attributes |
| `assessmentService.ts` | Assessment CRUD, AI generation, publishing |
| `submissionService.ts` | Submission create/fetch, AI grading results |
| `markingService.ts` | Teacher marking workflow — batch fetch, score override |
| `handwritingService.ts` | Upload handwritten submissions to AI OCR pipeline |
| `developmentService.ts` | Development plans, BKT mastery signals |
| `resourceService.ts` | Resource upload, download URL, AI content generation |
| `aiService.ts` | Gemini content generation, AI assessment creation |
| `aiTutorService.ts` | AI tutor chat sessions |
| `planChatService.ts` | Per-plan AI conversation sessions |
| `chatService.ts` | Student ↔ teacher real-time chat (Socket.IO) |
| `staffMessageService.ts` | Teacher ↔ teacher staff messages |
| `notificationService.ts` | In-app notification fetch/mark-read |
| `calendarService.ts` | Calendar event CRUD |
| `classService.ts` | Class group CRUD |
| `subjectService.ts` | Subject (Course) admin operations |
| `curriculumService.ts` | ZIMSEC curriculum / syllabus data |
| `adminService.ts` | School admin operations (school profile, teacher management) |
| `schoolService.ts` | Multi-school data for sysadmin |
| `sysAdminService.ts` | Sysadmin dashboard, schools, subscriptions, packages, notifications |
| `reportService.ts` | Student report card generation |
| `reportAdminService.ts` | School-level report scheduling and export |
| `termForecastService.ts` | Term score projections |
| `teacherAnalyticsService.ts` | Class drill-down analytics (heatmap, misconceptions, student mastery) |
| `reteachService.ts` | AI-generated reteach cards and exit tickets |
| `peerStudyService.ts` | Peer study room management |
| `profileService.ts` | Teacher and student profile upsert |
| `userService.ts` | Admin user management |
| `publicService.ts` | Public pricing packages (landing page, unauthenticated) |
| `geminiService.ts` | Direct Gemini SDK calls (used sparingly client-side) |
| `tokenStore.ts` | In-memory access token store |
| `authSession.ts` | Token read helper |
| `apiClient.ts` | Core fetch wrapper with auth, retry, error normalisation |
| `api.ts` | Re-exports all services for convenience |

---

## Types (`src/types/`)

| File | Key types |
|---|---|
| `types/index.ts` | `User`, `Student`, `Course`, `Assessment`, `Question`, `Submission`, `Resource`, `DevelopmentPlan`, `Plan`, `CourseAttribute`, `StudentAttribute`, `ClassGroup`, `TeacherProfile`, `ChatMessage`, `Notification`, `DiagramManifest`, and all enums (`UserRole`, `AssessmentType`, `PlanStatus`, etc.) |
| `types/calendar.ts` | `CalendarEvent` |
| `types/resources.ts` | Extended resource types |
| `types/profile.ts` | Profile form payloads |
| `types/reteach.ts` | `ReteachCard`, `ExitTicketQuestion` |
| `types/subjectNotes.ts` | Subject notes shape |
| `types/teacherAnalytics.ts` | `ClassOverview`, `StudentRosterItem`, `StudentMasteryDetail`, `HeatmapData`, `Misconception`, `SiblingClass` |

The `DiagramManifest` type in `index.ts` deserves mention: assessments can carry SVG diagram metadata (circle geometry, velocity–time graphs, coordinate planes, bar charts, number lines, etc.) rendered by `DiagramRenderer.tsx`. This allows the AI assessment generator to embed structured diagrams without images.

---

## Shared Hooks (`src/hooks/`)

| Hook | Purpose |
|---|---|
| `useNotifications.ts` | Polls for unread notifications, marks as read, returns count + list |
| `useClientPagination.ts` | Generic client-side pagination for any array |
| `use-toast.ts` | shadcn/ui toast state (also mirrored in `components/ui/use-toast.ts`) |

### Component-local hooks

| Hook | Location | Purpose |
|---|---|---|
| `useOcrSession` | `components/ocr/` | Manages teacher-side OCR session lifecycle and Socket.IO events |
| `usePhoneSocket` | `components/kundai-mobile/hooks/` | Phone-side Socket.IO connection; emits student-selected and submission-saved events |
| `useCamera` | `components/kundai-mobile/hooks/` | `getUserMedia` wrapper with torch control |
| `useEdgeDetection` | `components/kundai-mobile/hooks/` | Lazy-loads OpenCV.js, runs document quad detection at 300 ms intervals on the live video frame, exports `applyPerspectiveCrop` for one-shot warpPerspective on capture |
| `useSequencer` | `pages/StoryDemo/hooks/` | Frame-by-frame scene sequencer for the landing page demo animation |

---

## AI Assessment Wizard

Multi-step modal (`components/assessments/AIAssessmentModal.tsx`) for generating assessments from the ZIMSEC curriculum.

| Step | Component | What happens |
|---|---|---|
| 1. Course selection | (inline) | Pick the subject/form |
| 2. Basic info | `BasicInfoStep` | Title, type, due date, weight |
| 3. Config | `ConfigStep` | Question count, difficulty mix, `QuestionTypeDistribution` |
| 4. Objectives | `LearningObjectivesStep` | Select ZIMSEC syllabus attributes to target |
| 5. Generate | `GenerateStep` | Calls `POST /api/ai/generate-assessment` via `aiService`; streams result |
| 6. Review | `ReviewStep` | Edit generated questions before saving; each question supports parts, options, diagram manifests, KaTeX |

The wizard also handles editing existing AI-generated assessments by pre-populating all steps.

---

## Grading Dashboard

`components/teacher/GradingDashboard.tsx` — the teacher's marking queue.

- Lists all submissions across all assessments for the selected course/class
- Each row shows AI-suggested grade, confidence score, and grade type badge (`AI Suggested`, `AI + MCQ Graded`, `MCQ Graded`, `Teacher Reviewed`, `Manual`)
- Opens `SubmissionReviewModal` for digital/text submissions — teacher can accept AI score or set a manual override
- Opens `HandwritingMarkModal` for handwritten submissions — the submission image is displayed alongside the AI OCR transcript and suggested score; teacher marks directly on the modal

---

## Class Drill-Down Analytics

`components/class-drill-down/ClassDrillDownDashboard.tsx` — reached via `/teacher/analytics/:classId`.

Three drill levels:
1. **Class overview** — average mastery, performance distribution, at-risk count, topic heatmap across all students
2. **Student roster** — sortable list with per-student mastery and trend arrows; click to drill in
3. **Individual student** — full mastery breakdown by ZIMSEC attribute, submission history, identified misconceptions

Data comes from `teacherAnalyticsService.ts` which calls dedicated analytics endpoints on `kundai-server`.

---

## Reteach Cards

`components/assessments/ReteachCardsDashboard.tsx` — embedded inside the class analytics view.

After an assessment is graded the teacher can generate AI reteach cards for topics where the class underperformed. Each card includes:
- Topic summary
- Recommended re-teaching approach
- Exit ticket questions to check understanding
- Student mastery context

Cards can be dismissed once addressed.

---

## Landing Page & StoryDemo

`pages/LandingPage.tsx` embeds `pages/StoryDemo/StoryDemo.tsx` — an animated product demo that simulates a teacher workflow using a sequenced scene system.

| Sub-folder | Purpose |
|---|---|
| `StoryDemo/dashboard/` | Mini-replica of the teacher dashboard used inside the demo |
| `StoryDemo/dashboard/overlays/` | Animated cursor, performance row highlight, and view overlays |
| `StoryDemo/dashboard/scenes/` | `SceneNotification`, `SceneOutcome`, `ScenePerfPanel`, `SceneTwinPanel` — individual story beats |
| `StoryDemo/laptop/` | Laptop shell SVG + screen content |
| `StoryDemo/phone/` | Phone mockup with iOS keyboard |
| `StoryDemo/stage/` | `FlashBurst` and `FloatingToast` visual effects |
| `StoryDemo/hooks/` | `useSequencer` — drives the timed scene transitions |

The landing page also fetches live subscription package pricing from the public API via `publicService.ts`.

---

## UI Component Library

Radix-based shadcn/ui components live in `components/ui/`. Custom additions:

| Component | Purpose |
|---|---|
| `DiagramRenderer.tsx` | Renders SVG diagrams from `DiagramManifest` — supports circle geometry, triangles, velocity–time graphs, construction/loci, bar charts, number lines, coordinate planes |
| `TablePagination.tsx` | Generic paginator component used across admin tables |
| `file-upload.tsx` | Drag-and-drop file upload zone (react-dropzone wrapper) |

---

## Layout Shells

| Component | Role | Used by |
|---|---|---|
| `MainLayout` | Teacher portal shell — collapsible sidebar, header with course/class-group selector, notification bell | All teacher routes |
| `AdminLayout` | Legacy admin shell | `/legacy-admin/*` |
| `SchoolAdminLayout` | School admin shell — warm paper design palette, SVG icon nav | `/admin/*` |
| `SysAdminShell` | Sysadmin shell — dark nav sidebar, polling notification bell | `/sys-admin/*` |
| `Header` | Top bar used within `MainLayout` | Teacher portal |
| `CourseSelector` | Dropdown to switch active course/class context | `MainLayout` header |

---

## Design Prototypes & Stubs

Some directories contain JSX prototype files that predate the TypeScript refactor. They are **not routed** and are kept for design reference only.

| Directory / File | Status |
|---|---|
| `components/school-admin/app.jsx`, `charts.jsx`, `data.jsx`, `icons.jsx`, `pages.jsx`, `page-dashboard.jsx`, `primitives.jsx`, `tweaks-panel.jsx` | JSX prototype for the school admin; superseded by `school-admin/pages/*.tsx` |
| `components/school-admin/updates/reports/` | Report wizard prototype; superseded by `SchoolReportsPage.tsx` |
| `components/sys-admin-new/` | JSX sysadmin prototype; superseded by `sysadmin/*.tsx` |
| `components/class-drill-down/app.jsx`, `data.jsx`, `ui.jsx`, `views.jsx` | Prototype alongside the active `ClassDrillDownDashboard.tsx` |
| `components/kundai-mobile/android-frame.jsx`, `ios-frame.jsx`, `design-canvas.jsx`, `landing.jsx`, `mobile-ocr.jsx`, `register.jsx`, `icons.jsx` | Phone UI mock-ups; the active mobile app is `MobileOcrApp.tsx` |
| `components/services-delete/api.ts` | Stale service file, queued for deletion |
| `components/dashboard/Dashboard.tsx.bak`, `layout/Header.tsx.bak` | Backup files |
| `data/mockData.ts` | Legacy mock data; still imported in a few UI stubs that haven't been fully wired to the API |
| `components/student/dashboard/mockPlans.ts` | Mock plan data; may be used during loading states |
| `pages/handoff.jsx`, `pages/index.html`, `pages/StoryDemo.refactor-plan.md` | Design handoff artifacts |
| `src/pages/StoryDemo.tsx` | Re-export shim for the `StoryDemo/` folder — this one is in active use |

---

## Build & Deployment

```bash
npm run build     # TypeScript compile + Vite bundle → dist/
npm run preview   # Serve the production build locally
npm run lint      # ESLint
```

The `Dockerfile` at the repo root builds the Vite output and serves it with a static server. GitHub Actions CI deploys on push.

Build flags in `vite.config.ts`:
- Source maps enabled in production (`build.sourcemap: true`)
- `@` alias resolves to `src/`
- `lucide-react` excluded from pre-bundling (tree-shaken per import)

### Remote dev (ngrok / tunnels)

Set `VITE_PUBLIC_URL=https://your-tunnel.ngrok.io` in `.env`. Vite will:
- Bind to `0.0.0.0`
- Allow the tunnel hostname
- Configure HMR over WSS on port 443

---

## Service Worker (`public/sw.js`)

The service worker enables PWA installability for the mobile OCR app. Current responsibilities:

- **Install/activate**: immediately claims all clients (`skipWaiting` + `clients.claim`)
- **Fetch**: passes through all same-origin requests (no cache strategy yet — all caching happens at the IndexedDB level)
- **Background Sync** (`ocr-outbox-sync`): when the browser fires the sync event after connectivity returns, the SW messages all open window clients to drain their IndexedDB outbox. This allows uploads to complete even if the phone tab was backgrounded

---

## Project Context

**BSc Honours in Cloud Computing and Internet of Things**  
Faculty of Computer Engineering, Informatics and Communications  
University of Zimbabwe

Developer: Eugene Madzivanyika (R204525V)  
Supervisor: Mr T Rupere
