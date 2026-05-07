# KundAI — AI-Powered Lecturer-Student Development System

A full-stack educational management platform built for Zimbabwe's primary and secondary school context. KundAI connects teachers, students, and parents through real-time performance tracking, AI-powered assessment, personalized development plans, and a shared communication hub.

---

## Architecture

KundAI is composed of three independent services:

```
[Browser / React Client]
        ↕ HTTP / WebSocket
[kundai-server]  ←→  [kundai-ai-services-backend]
  Node.js / Express         Python / FastAPI
  Port: 5000                Port: 8000
        ↕
     MongoDB
```

| Service | Stack | Purpose |
|---|---|---|
| `kundai-frontend` | React 18, TypeScript, Vite, Tailwind CSS | UI for all user roles |
| `kundai-server` | Node.js, Express 5, MongoDB, Socket.IO | Core REST API, auth, real-time chat |
| `kundai-ai-services-backend` | Python, FastAPI, Gemini, Tesseract | AI/ML endpoints (OCR, grading, BKT, development plans) |

---

## Portals

### Teacher Portal (`/dashboard`, `/classroom`, `/resources`, etc.)
- Dashboard with class overview and student performance metrics
- Classroom view — per-student tracking with subject attributes
- Development plan creation per student per course
- AI resource viewer — Gemini-generated explanations of uploaded materials
- Assessment management: create, edit, review, grade, and analyse
- AI assessment generator (multi-step wizard with Gemini)
- Assignment marking dashboard with AI grading + manual override
- Staffroom inbox for teacher-to-teacher messaging
- Academic calendar with event management
- Resources dashboard — upload, organise, and preview course materials

### Student Portal (`/student/*`)
- Home dashboard with personal stats and active development plans
- Subjects view with per-subject performance breakdown
- Assignments — view and submit work
- AI Coach (tutor) — conversational support
- Peer study rooms
- Report card view
- Mastery gaps view (BKT-powered knowledge state)
- Profile settings

### Admin Portal (`/admin/*`)
- Dashboard with system-wide metrics
- User management (create/edit/delete teachers and students)
- Subjects management
- Classes management
- Curriculum management (ZIMSEC-aligned syllabus seeded)
- Term forecasts

---

## Tech Stack

### Frontend
- React 18 + TypeScript (Vite)
- Tailwind CSS + Radix UI + shadcn/ui components
- React Router v7
- Socket.IO client (real-time presence + chat)
- FullCalendar (academic calendar)
- Recharts (performance visualisations)
- KaTeX (maths rendering in assessments)
- pdf.js + mammoth (document preview)
- React Hook Form + Zod (form validation)
- Framer Motion (animations)

### Backend (Node.js)
- Express 5 + ES Modules
- MongoDB via Mongoose 9
- Socket.IO (real-time messaging, online presence)
- JWT authentication + bcrypt
- Multer (file uploads)
- node-cron (background jobs)
- pdf-parse + mammoth (document processing)
- @google/generative-ai (Gemini SDK)

### AI Services (Python)
- FastAPI + Uvicorn
- google-genai (Gemini)
- Tesseract / pytesseract (OCR on handwritten/scanned submissions)
- pdfminer + pdfplumber (PDF text extraction)
- Pillow + pypdfium2 (image processing)
- Pydantic v2 (request/response schemas)

---

## API Routes (kundai-server)

| Route | Description |
|---|---|
| `POST /api/auth/login` | Login, returns JWT |
| `GET/POST /api/students` | Student CRUD |
| `GET/POST /api/assessments` | Assessment management |
| `GET/POST /api/submissions` | Student submissions |
| `GET/POST /api/development` | Development plans |
| `GET/POST /api/resources` | Course resources |
| `GET/POST /api/courses` | Course management |
| `GET/POST /api/ai` | AI content generation |
| `GET/POST /api/ai-tutor` | AI tutor sessions |
| `GET/POST /api/chat` | Real-time chat |
| `GET/POST /api/chats` | Chat history |
| `GET/POST /api/notifications` | Notifications |
| `GET/POST /api/calendar` | Calendar events |
| `GET/POST /api/staff-messages` | Staff-to-staff messaging |
| `GET/POST /api/staff` | Teacher profiles |
| `GET/POST /api/class-groups` | Class group management |
| `GET/POST /api/admin` | Admin operations |
| `GET/POST /api/whatsapp` | WhatsApp bot integration |

## API Routes (kundai-ai-services-backend)

| Route | Description |
|---|---|
| `GET /health` | Service health check |
| `POST /ocr/extract` | OCR on uploaded images/PDFs (Gemini Vision + Tesseract) |
| `POST /asag/grade` | Automated Short Answer Grading |
| `POST /bkt/update` | Bayesian Knowledge Tracing — update student knowledge state |
| `POST /development-plan/generate` | Generate personalised student development plan |
| `POST /devplan-content/generate` | Generate content for development plan steps |
| `POST /assessment/generate` | Generate assessments from syllabus topics |
| `POST /ai-tutor/chat` | AI tutor conversational endpoint |
| `POST /agents/route` | Multi-agent routing |
| `POST /content/generate` | Lesson notes and content generation |
| `GET /resources` | Resource management |

---

## Data Models (kundai-server)

| Model | Key Fields |
|---|---|
| `User` | firstName, lastName, email, password, role, avatar |
| `Student` | userId, overall, engagement, strength, performance, courses, activePlan |
| `TeacherProfile` | userId, subjects, classes |
| `Course` | name, code, teacher, students, attributes |
| `CourseAttribute` | course, name, weight (ZIMSEC syllabus-aligned) |
| `Assessment` | title, course, questions, dueDate, type, aiGenerated |
| `Submission` | student, assessment, answers, aiScore, teacherScore, feedback |
| `StudentPlan` | student, course, recommendations, strengthAreas, improvementAreas |
| `StudentAttribute` | student, course, attribute, score |
| `Result` | student, assessment, finalScore |
| `Resource` | course, title, fileType, s3Key / localPath |
| `AIGeneratedResource` | resource, generatedContent, model |
| `CalendarEvent` | title, start, end, type, course |
| `Message` | sender, receiver, chatId, content, readStatus |
| `StaffMessage` | sender, receivers, subject, body |
| `Notification` | user, type, message, read |
| `PeerStudy` | participants, topic, course, status |
| `TutorSession` | student, messages, course, topic |
| `QuestionBank` | course, topic, questions (ZIMSEC-seeded) |
| `TermForecast` | class, term, projectedScores |
| `ClassGroup` | name, teacher, students, courses |
| `WhatsappSession` | phoneNumber, userId, state |

---

## Background Jobs

| Job | Schedule | Description |
|---|---|---|
| `syncResourcesJob` | Every minute (dev) / daily 3am (production) | Syncs resource metadata |
| `retryAIGradingJob` | Every 5 minutes | Retries AI grading for submissions that failed while AI service was unavailable |

---

## Installation & Setup

### Prerequisites
- Node.js 18+
- Python 3.10+
- MongoDB (local or remote)
- Tesseract OCR installed on the system (`sudo apt install tesseract-ocr`)
- Google Gemini API key

### 1. Clone and install frontend
```bash
cd kundai-frontend
npm install
```

### 2. Install server dependencies
```bash
cd kundai-server
npm install
```

### 3. Set up Python AI services
```bash
cd kundai-ai-services-backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

### 4. Environment variables

**kundai-server/.env**
```env
MONGO_URI=mongodb://localhost:27017/kundai
PORT=5000
CLIENT_URL=http://localhost:5173
JWT_SECRET=your-jwt-secret
GEMINI_API_KEY=your-gemini-key
AWS_ACCESS_KEY_ID=optional
AWS_SECRET_ACCESS_KEY=optional
AWS_REGION=optional
S3_BUCKET=optional
```

**kundai-ai-services-backend/.env**
```env
GEMINI_API_KEY=your-gemini-key
AI_SERVICE_PORT=8000
ALLOWED_ORIGINS=http://localhost:5173,http://127.0.0.1:5173
```

**kundai-frontend/.env**
```env
VITE_API_URL=http://localhost:5000
VITE_AI_API_URL=http://localhost:8000
```

### 5. Run all services

```bash
# Terminal 1 — Frontend
cd kundai-frontend && npm run dev

# Terminal 2 — Node.js backend
cd kundai-server && npm run dev

# Terminal 3 — Python AI services
cd kundai-ai-services-backend
source venv/bin/activate
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

---

## Seeded Data

The server includes ZIMSEC-aligned syllabus data for the question bank and course attributes:

```
kundai-server/scripts/
  zimsec_kundai_dataset_batch1.json
  zimsec_batch2.json
  zimsec_batch3_remaining.json
  syllabus_attributes.json
```

Seed with:
```bash
cd kundai-server
node scripts/seedSyllabus.js
node scripts/seedQuestions.js
```

---

## AI Services Documentation (FastAPI)

Auto-generated docs available when the AI service is running:
- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`

---

## Developer Notes

- `kundai-frontend/src/components/student v1.2/` contains the newer student portal components actively in use
- `.bak` files in the server controllers are old backups — safe to delete
- The cron job for `syncResourcesJob` is set to run every minute in the current config — change to `0 3 * * *` for production
- WhatsApp bot (`/api/whatsapp`) gives students access to the AI tutor and their development plans via WhatsApp-only data bundles — currently experimental. SMS access (for feature phone users with no data) is planned as the third tier of a web → WhatsApp → SMS connectivity model

---

## Project

BSc Honours in Cloud Computing and Internet of Things
Faculty of Computer Engineering, Informatics and Communications
University of Zimbabwe

Developer: Eugene Madzivanyika (R204525V)
Supervisor: Mr T Rupere
