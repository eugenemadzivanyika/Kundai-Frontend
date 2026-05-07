# KundAI — Project Status

Last updated: May 2026

---

## Services

| Service | Status | Port |
|---|---|---|
| `kundai-frontend` | Running | 5173 |
| `kundai-server` | Running | 5000 |
| `kundai-ai-services-backend` | Running | 8000 |

---

## Implemented Features

### Authentication & Users
- [x] JWT login / logout with role-based redirect
- [x] Role-based access control (admin, teacher, student)
- [x] Token management via localStorage
- [x] Online presence tracking via Socket.IO

### Teacher Portal
- [x] Dashboard — class overview, student stat cards
- [x] Classroom view — per-student performance with subject attributes
- [x] Development page — view student development plan and stats per course
- [x] Development plan creation — AI-generated recommendations per student/course
- [x] Resources dashboard — upload, organise, preview course materials
- [x] AI resource viewer — Gemini-generated explanations of uploaded documents
- [x] Assessment dashboard — list, filter, view all assessments
- [x] Assessment detail page — question viewer and submission stats
- [x] Assessment analysis page — class-wide performance analytics
- [x] Edit assessment page
- [x] AI assessment generator — multi-step wizard (basic info → config → context → generate → review)
- [x] Marking dashboard — AI grading with teacher override and submission review
- [x] Staffroom inbox — teacher-to-teacher messaging
- [x] Academic calendar — FullCalendar view with event creation and management
- [x] Notifications centre

### Student Portal
- [x] Student home dashboard with active plan display
- [x] My subjects view with per-subject performance breakdown
- [x] Assignments view and submission
- [x] AI coach (tutor) — conversational AI support
- [x] Peer study rooms
- [x] Report card view
- [x] Mastery gaps view (BKT-powered knowledge state)
- [x] Plan view — view personalised development plan
- [x] Stats view
- [x] Profile settings

### Admin Portal
- [x] Dashboard — system-wide metrics
- [x] User management — create, edit, delete teachers and students
- [x] Subjects management
- [x] Classes management
- [x] Curriculum management (ZIMSEC-aligned)
- [x] Term forecasts

### AI Services (Python FastAPI)
- [x] Health check endpoint
- [x] OCR — extract text from scanned/handwritten submissions (Gemini Vision + Tesseract)
- [x] ASAG — Automated Short Answer Grading
- [x] BKT — Bayesian Knowledge Tracing for student knowledge state modelling
- [x] Development plan generation — AI-generated personalised student plans
- [x] Dev plan content generation — AI-generated content for plan steps
- [x] Assessment generation — syllabus-aligned question generation via Gemini
- [x] AI tutor — conversational tutoring endpoint
- [x] Agents routing — multi-agent orchestration
- [x] Content generation — lesson notes and study material
- [x] Resource processing

### Backend (Node.js)
- [x] All 18 API route groups mounted and serving
- [x] Socket.IO real-time messaging with room-based chat and online presence
- [x] Background job: `syncResourcesJob` (resource metadata sync)
- [x] Background job: `retryAIGradingJob` (retry failed AI grading every 5 min)
- [x] Request logging middleware
- [x] Error handling middleware
- [x] ZIMSEC syllabus seeded (batches 1–3 + attributes)
- [x] WhatsApp channel — students access AI tutor and development plans via WhatsApp-only data bundles (experimental)
- [ ] SMS channel — AI tutor and development plan access for feature phone users with no data (planned)

---

## Known Issues / Open Items

- `syncResourcesJob` cron is set to `* * * * *` (every minute) — needs to be changed to `0 3 * * *` for production
- `kundai-frontend/src/components/student v1.2/` is the active student portal — the older `student/` folder components are superseded
- `.bak` files in `kundai-server/controllers/` are stale backups
- `kundai-frontend/src/components/dashboard/Dashboard.tsx.bak` and `Header.tsx.bak` are stale
- `kundai-ai-services-backend` README still references old project name ("zivAI") — updated separately

---

## Next Steps

1. Change `syncResourcesJob` schedule to production cron (`0 3 * * *`)
2. Delete `.bak` files and superseded `student/` components
3. Add mobile-responsive improvements to student portal
4. Productionise WhatsApp channel for full student AI tutor and development plan access
5. Build SMS channel for feature phone users — completes the three-tier connectivity model (web → WhatsApp → SMS)
5. Add teacher profile completion flow
6. Wire `peerStudyRoutes` fully to student portal peer study UI
7. Add unit and integration tests (Jest + Supertest for server, Vitest for frontend)
