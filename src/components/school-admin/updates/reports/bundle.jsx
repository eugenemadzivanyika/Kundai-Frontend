
// ===== reports/icons.jsx =====
// Lucide-style icons (inline SVG, stroke 1.75) matching the project's icon library
const R_Icon = ({ size = 16, stroke = 1.75, className = '', children }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
       strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round" className={className}>{children}</svg>
);

const RI = {
  // Report kinds
  FileText:   (p) => <R_Icon {...p}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/><path d="M16 13H8"/><path d="M16 17H8"/><path d="M10 9H8"/></R_Icon>,
  TrendUp:    (p) => <R_Icon {...p}><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/></R_Icon>,
  Book:       (p) => <R_Icon {...p}><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20V2H6.5A2.5 2.5 0 0 0 4 4.5z"/><path d="M4 19.5V22h16"/></R_Icon>,
  Users:      (p) => <R_Icon {...p}><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></R_Icon>,
  GradCap:    (p) => <R_Icon {...p}><path d="M22 10 12 5 2 10l10 5 10-5z"/><path d="M6 12v5c0 1.7 2.7 3 6 3s6-1.3 6-3v-5"/></R_Icon>,
  Activity:   (p) => <R_Icon {...p}><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></R_Icon>,
  // Workflow
  ChevronRight:(p)=> <R_Icon {...p}><polyline points="9 18 15 12 9 6"/></R_Icon>,
  ChevronLeft: (p) => <R_Icon {...p}><polyline points="15 18 9 12 15 6"/></R_Icon>,
  ChevronDown: (p) => <R_Icon {...p}><polyline points="6 9 12 15 18 9"/></R_Icon>,
  Check:       (p) => <R_Icon {...p}><polyline points="20 6 9 17 4 12"/></R_Icon>,
  Plus:        (p) => <R_Icon {...p}><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></R_Icon>,
  X:           (p) => <R_Icon {...p}><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></R_Icon>,
  Search:      (p) => <R_Icon {...p}><circle cx="11" cy="11" r="7"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></R_Icon>,
  Filter:      (p) => <R_Icon {...p}><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></R_Icon>,
  Calendar:    (p) => <R_Icon {...p}><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></R_Icon>,
  Clock:       (p) => <R_Icon {...p}><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></R_Icon>,
  // Export
  Download:    (p) => <R_Icon {...p}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></R_Icon>,
  Mail:        (p) => <R_Icon {...p}><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></R_Icon>,
  Link:        (p) => <R_Icon {...p}><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></R_Icon>,
  Print:       (p) => <R_Icon {...p}><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></R_Icon>,
  // Misc
  Sparkles:    (p) => <R_Icon {...p}><path d="M12 3 13.5 9 19 10.5 13.5 12 12 18 10.5 12 5 10.5 10.5 9z"/></R_Icon>,
  Trash:       (p) => <R_Icon {...p}><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></R_Icon>,
  Edit:        (p) => <R_Icon {...p}><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.12 2.12 0 0 1 3 3L12 15l-4 1 1-4z"/></R_Icon>,
  Eye:         (p) => <R_Icon {...p}><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></R_Icon>,
  Settings:    (p) => <R_Icon {...p}><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82A1.65 1.65 0 0 0 3 14H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></R_Icon>,
  RefreshCw:   (p) => <R_Icon {...p}><polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></R_Icon>,
  Alert:       (p) => <R_Icon {...p}><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></R_Icon>,
  School:      (p) => <R_Icon {...p}><path d="M14 22v-4a2 2 0 0 0-4 0v4"/><path d="m18 10 4 2v8a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2v-8l4-2"/><path d="M18 5v17"/><path d="m4 6 8-4 8 4"/><path d="M6 5v17"/><circle cx="12" cy="9" r="2"/></R_Icon>,
  ShieldCheck: (p) => <R_Icon {...p}><path d="M20 13c0 5-3.5 7.5-8 9-4.5-1.5-8-4-8-9V5l8-3 8 3z"/><path d="m9 12 2 2 4-4"/></R_Icon>,
};

window.RI = RI;


// ===== reports/data.jsx =====
// Mock data — report types catalog, recent reports, scheduled reports, sample preview data

const REPORT_TYPES = [
  {
    id: 'term-report',
    name: 'Term Report',
    tagline: 'ZIMSEC-aligned report cards for every student in a class',
    icon: 'FileText',
    accent: 'blue',
    avgTime: '2-4 min',
    pages: '1 per student',
    description: 'Generates printable end-of-term report cards including grades, teacher comments, attendance, and class position. Aligned with ZIMSEC O-Level / A-Level format.',
    params: [
      { id: 'term',    label: 'Term',           kind: 'select', required: true, options: ['Term 1 2026', 'Term 2 2026', 'Term 3 2026'] },
      { id: 'classes', label: 'Classes',        kind: 'multi-class', required: true },
      { id: 'comments',label: 'Include teacher comments', kind: 'toggle', default: true },
      { id: 'mastery', label: 'Include BKT mastery breakdown', kind: 'toggle', default: false },
      { id: 'signature', label: 'Headmaster signature', kind: 'select', options: ['Mrs. R. Chigumba (Headmistress)', 'Mr. T. Mukamuri (Acting)', 'None — leave blank'] },
    ],
  },
  {
    id: 'class-performance',
    name: 'Class Performance Report',
    tagline: 'Deep dive into one class — all students, all subjects',
    icon: 'GradCap',
    accent: 'emerald',
    avgTime: '~30 sec',
    pages: '8-12 pages',
    description: 'Comprehensive analysis of one class: score distributions, top/bottom performers, subject-by-subject breakdown, BKT mastery heatmap, and attendance correlation.',
    params: [
      { id: 'class', label: 'Class',  kind: 'class-picker', required: true },
      { id: 'term',  label: 'Term',   kind: 'select', required: true, options: ['Term 1 2026', 'Term 2 2026', 'Term 3 2026'] },
      { id: 'subjects', label: 'Subjects to include', kind: 'multi-subject' },
      { id: 'compareWith', label: 'Compare with', kind: 'select', options: ['None', 'School average', 'Same form (other streams)', 'Previous term'] },
    ],
  },
  {
    id: 'school-summary',
    name: 'School-wide Performance Summary',
    tagline: 'One-page board / ministry summary',
    icon: 'School',
    accent: 'indigo',
    avgTime: '~45 sec',
    pages: '1-2 pages',
    description: 'A single-page executive summary of school performance for the term: enrollment, pass rates by form, top subjects, areas of concern. Designed for school board and MoPSE submission.',
    params: [
      { id: 'term',     label: 'Term',  kind: 'select', required: true, options: ['Term 1 2026', 'Term 2 2026', 'Term 3 2026'] },
      { id: 'audience', label: 'Audience', kind: 'select', required: true, options: ['School board', 'MoPSE district inspector', 'Parents / general'] },
      { id: 'logo',     label: 'Include school crest & header', kind: 'toggle', default: true },
    ],
  },
  {
    id: 'subject-performance',
    name: 'Subject Performance Report',
    tagline: 'Mastery & pass rates by subject, across forms',
    icon: 'Book',
    accent: 'violet',
    avgTime: '~25 sec',
    pages: '4-6 pages',
    description: 'How is each subject performing across the school? Compares avg BKT mastery and pass rates per form per subject. Identifies subjects needing intervention.',
    params: [
      { id: 'term',     label: 'Term',     kind: 'select', required: true, options: ['Term 1 2026', 'Term 2 2026', 'Term 3 2026'] },
      { id: 'subjects', label: 'Subjects', kind: 'multi-subject', required: true },
      { id: 'forms',    label: 'Forms',    kind: 'multi-form', default: ['Form 1','Form 2','Form 3','Form 4','Form 5','Form 6'] },
    ],
  },
  {
    id: 'teacher-activity',
    name: 'Teacher Activity Report',
    tagline: 'Assessments set, marking turnaround, engagement',
    icon: 'Users',
    accent: 'amber',
    avgTime: '~20 sec',
    pages: '3-5 pages',
    description: 'For HR and academic oversight: number of assessments set, average marking turnaround time, AI-assisted vs manual marking mix, last sign-in, classes covered.',
    params: [
      { id: 'period',   label: 'Period',   kind: 'select', required: true, options: ['Last 30 days', 'This term', 'Last term', 'This academic year'] },
      { id: 'teachers', label: 'Teachers', kind: 'multi-teacher', default: 'all' },
      { id: 'metrics',  label: 'Metrics to include', kind: 'multi-select', options: ['Assessments set','Marking turnaround','AI vs manual %','Sign-in activity','Class coverage'], default: ['Assessments set','Marking turnaround','Sign-in activity'] },
    ],
  },
];

const ACCENT = {
  blue:    { ring: 'ring-blue-500',    bg: 'bg-blue-50',    border: 'border-blue-200',    text: 'text-blue-700',    dot: 'bg-blue-500',    soft: 'bg-blue-100',   from: 'from-blue-50',    iconBg: 'bg-blue-600' },
  emerald: { ring: 'ring-emerald-500', bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-700', dot: 'bg-emerald-500', soft: 'bg-emerald-100',from: 'from-emerald-50', iconBg: 'bg-emerald-600' },
  indigo:  { ring: 'ring-indigo-500',  bg: 'bg-indigo-50',  border: 'border-indigo-200',  text: 'text-indigo-700',  dot: 'bg-indigo-500',  soft: 'bg-indigo-100', from: 'from-indigo-50',  iconBg: 'bg-indigo-600' },
  violet:  { ring: 'ring-violet-500',  bg: 'bg-violet-50',  border: 'border-violet-200',  text: 'text-violet-700',  dot: 'bg-violet-500',  soft: 'bg-violet-100', from: 'from-violet-50',  iconBg: 'bg-violet-600' },
  amber:   { ring: 'ring-amber-500',   bg: 'bg-amber-50',   border: 'border-amber-200',   text: 'text-amber-700',   dot: 'bg-amber-500',   soft: 'bg-amber-100',  from: 'from-amber-50',   iconBg: 'bg-amber-600' },
};

// Mock catalog data for parameter pickers
const CLASSES = [
  { id: '1A', form: 'Form 1', stream: 'A', students: 32 },
  { id: '1B', form: 'Form 1', stream: 'B', students: 30 },
  { id: '1C', form: 'Form 1', stream: 'C', students: 28 },
  { id: '2A', form: 'Form 2', stream: 'A', students: 31 },
  { id: '2B', form: 'Form 2', stream: 'B', students: 29 },
  { id: '3A', form: 'Form 3', stream: 'A', students: 28 },
  { id: '3B', form: 'Form 3', stream: 'B', students: 27 },
  { id: '4A', form: 'Form 4', stream: 'A', students: 32 },
  { id: '4B', form: 'Form 4', stream: 'B', students: 30 },
  { id: '4C', form: 'Form 4', stream: 'C', students: 28 },
  { id: '5A', form: 'Form 5', stream: 'Sciences', students: 22 },
  { id: '5B', form: 'Form 5', stream: 'Commercials', students: 18 },
  { id: '6A', form: 'Form 6', stream: 'Sciences', students: 19 },
  { id: '6B', form: 'Form 6', stream: 'Commercials', students: 16 },
];

const SUBJECTS = [
  { id: 'math',  name: 'Mathematics' },
  { id: 'eng',   name: 'English Language' },
  { id: 'shona', name: 'Shona' },
  { id: 'sci',   name: 'Combined Science' },
  { id: 'bio',   name: 'Biology' },
  { id: 'chem',  name: 'Chemistry' },
  { id: 'phys',  name: 'Physics' },
  { id: 'hist',  name: 'History' },
  { id: 'geo',   name: 'Geography' },
  { id: 'rel',   name: 'Religious Studies' },
  { id: 'cs',    name: 'Computer Science' },
  { id: 'acc',   name: 'Accounts' },
  { id: 'bus',   name: 'Business Studies' },
  { id: 'agri',  name: 'Agriculture' },
];

const TEACHERS = [
  { id: 't01', name: 'Mr. T. Mukamuri',  dept: 'Mathematics', avatar: 'TM' },
  { id: 't02', name: 'Mrs. C. Sibanda',  dept: 'English',     avatar: 'CS' },
  { id: 't03', name: 'Mr. F. Ncube',     dept: 'Sciences',    avatar: 'FN' },
  { id: 't04', name: 'Ms. R. Dube',      dept: 'Sciences',    avatar: 'RD' },
  { id: 't05', name: 'Mr. B. Moyo',      dept: 'Humanities',  avatar: 'BM' },
  { id: 't06', name: 'Mrs. T. Mhondoro', dept: 'Shona',       avatar: 'TM' },
];

// Recent generated reports
const RECENT_REPORTS = [
  { id: 'r-2026-0089', type: 'term-report',        name: 'Term Report — Form 4A',     generatedAt: '2026-05-13T08:42:00Z', size: '2.4 MB', pages: 32, status: 'ready',      generatedBy: 'Mrs. R. Chigumba', format: 'pdf' },
  { id: 'r-2026-0088', type: 'class-performance',  name: 'Class Performance — Form 4A',generatedAt: '2026-05-13T08:14:00Z', size: '780 KB', pages: 11, status: 'ready',      generatedBy: 'Mr. T. Mukamuri',  format: 'pdf' },
  { id: 'r-2026-0087', type: 'school-summary',     name: 'School Summary — Term 1',    generatedAt: '2026-05-12T16:30:00Z', size: '420 KB', pages: 2,  status: 'ready',      generatedBy: 'Mrs. R. Chigumba', format: 'pdf' },
  { id: 'r-2026-0086', type: 'teacher-activity',   name: 'Teacher Activity — Term 1',  generatedAt: '2026-05-12T11:08:00Z', size: '180 KB', pages: 5,  status: 'ready',      generatedBy: 'Mrs. R. Chigumba', format: 'pdf' },
  { id: 'r-2026-0085', type: 'subject-performance',name: 'Subject Performance — Math', generatedAt: '2026-05-11T15:45:00Z', size: '610 KB', pages: 6,  status: 'ready',      generatedBy: 'Mr. T. Mukamuri',  format: 'pdf' },
  { id: 'r-2026-0084', type: 'term-report',        name: 'Term Report — Form 4B',     generatedAt: '2026-05-11T09:22:00Z', size: '—',      pages: '—',status: 'generating', generatedBy: 'Mrs. R. Chigumba', format: 'pdf' },
];

// Scheduled reports
const SCHEDULED_REPORTS = [
  { id: 'sch-001', type: 'term-report',     name: 'End-of-term reports (all classes)', cadence: 'On last Friday of each term', nextRun: '2026-06-12', recipients: 'Form teachers, parents (via email)', enabled: true, lastRun: '2026-04-08' },
  { id: 'sch-002', type: 'school-summary',  name: 'Weekly performance digest',          cadence: 'Every Monday at 07:00',       nextRun: '2026-05-19', recipients: 'Headmistress, Deputy',               enabled: true, lastRun: '2026-05-12' },
  { id: 'sch-003', type: 'teacher-activity',name: 'Monthly teacher activity',           cadence: 'First of every month',         nextRun: '2026-06-01', recipients: 'Headmistress',                       enabled: true, lastRun: '2026-05-01' },
  { id: 'sch-004', type: 'class-performance',name:'Bi-weekly class snapshot',            cadence: 'Every other Friday',           nextRun: '2026-05-23', recipients: 'All form teachers',                  enabled: false,lastRun: '2026-05-09' },
];

// School info for preview headers
const SCHOOL = {
  name: 'Goromonzi High School',
  motto: 'Knowledge · Service · Integrity',
  established: 1946,
  address: 'P.O. Box 12, Goromonzi, Zimbabwe',
  phone: '+263 270 245 100',
  email: 'admin@goromonzihigh.ac.zw',
  crestColor: 'emerald',
};

// Sample data for the preview tab
const PREVIEW_SAMPLE = {
  'school-summary': {
    term: 'Term 1 2026',
    enrollment: { total: 480, by_form: { 'Form 1': 90, 'Form 2': 88, 'Form 3': 85, 'Form 4': 90, 'Form 5': 70, 'Form 6': 57 } },
    passRates: [
      { form: 'Form 1', rate: 82, change: 4 },
      { form: 'Form 2', rate: 76, change: 1 },
      { form: 'Form 3', rate: 71, change: -3 },
      { form: 'Form 4', rate: 68, change: 2 },
      { form: 'Form 5', rate: 64, change: 5 },
      { form: 'Form 6', rate: 73, change: 8 },
    ],
    avgClassMastery: 0.62,
    topSubjects:   [{ name: 'Shona', avgScore: 78 }, { name: 'Computer Science', avgScore: 76 }, { name: 'Geography', avgScore: 73 }],
    weakSubjects:  [{ name: 'Physics', avgScore: 52 }, { name: 'Chemistry', avgScore: 58 }, { name: 'Mathematics', avgScore: 61 }],
    attendance: 91.4,
    aiUsage: { gradedAssessments: 1284, tutorSessions: 9420, manualGrading: 318 },
  },
  // Class performance sample (Form 4A)
  'class-performance': {
    className: 'Form 4 A', term: 'Term 1 2026', students: 32,
    avgScore: 64, passRate: 71, classMastery: 0.58, attendance: 93,
    topPerformers: [
      { name: 'Tinashe Moyo',    score: 89, mastery: 0.84 },
      { name: 'Rumbidzai Ncube', score: 87, mastery: 0.81 },
      { name: 'Tatenda Sibanda', score: 84, mastery: 0.79 },
    ],
    needsAttention: [
      { name: 'Chiedza Dube',    score: 41, mastery: 0.38, reason: 'Mastery declining 4 weeks' },
      { name: 'Farai Nyathi',    score: 39, mastery: 0.35, reason: 'Missed last 3 assessments' },
      { name: 'Kudzai Mahlangu', score: 44, mastery: 0.41, reason: 'Below class avg in 6/8 subjects' },
    ],
    subjects: [
      { name: 'Mathematics',    avg: 62, pass: 68, mastery: 0.58 },
      { name: 'English',        avg: 68, pass: 75, mastery: 0.66 },
      { name: 'Combined Science', avg: 64, pass: 70, mastery: 0.62 },
      { name: 'Shona',          avg: 74, pass: 88, mastery: 0.71 },
      { name: 'History',        avg: 69, pass: 78, mastery: 0.65 },
      { name: 'Geography',      avg: 72, pass: 82, mastery: 0.69 },
    ],
  },
};

window.REPORTS_DATA = {
  REPORT_TYPES, ACCENT, CLASSES, SUBJECTS, TEACHERS, RECENT_REPORTS, SCHEDULED_REPORTS, SCHOOL, PREVIEW_SAMPLE,
};


// ===== reports/wizard.jsx =====
// Wizard step components — pick type, configure params, schedule
const { useState: useWState } = React;


// ───────────────────────────────────────────────────────────────
// STEP 1 — Pick report type
// ───────────────────────────────────────────────────────────────
function StepPick({ selectedTypeId, onSelect }) {
  return (
    <div>
      <div className="mb-5">
        <h2 className="text-xl font-semibold text-slate-900">What kind of report?</h2>
        <p className="text-sm text-slate-500 mt-1">Pick a template — you'll configure it on the next step.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {REPORT_TYPES.map((rt) => {
          const a = ACCENT[rt.accent];
          const Icon = RI[rt.icon];
          const selected = selectedTypeId === rt.id;
          return (
            <button
              key={rt.id}
              onClick={() => onSelect(rt.id)}
              className={`text-left bg-white border-2 rounded-lg p-4 transition-all hover:shadow-md ${
                selected ? `${a.border} ring-2 ${a.ring} ring-offset-1` : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              <div className="flex items-start gap-3">
                <div className={`w-10 h-10 rounded-md ${a.iconBg} text-white grid place-items-center shrink-0`}>
                  <Icon size={18} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-slate-900">{rt.name}</h3>
                    {selected && <span className={`inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider ${a.text} ${a.bg} px-1.5 py-0.5 rounded`}>Selected</span>}
                  </div>
                  <p className="text-sm text-slate-600 mt-1">{rt.tagline}</p>
                  <p className="text-xs text-slate-500 mt-2 leading-relaxed">{rt.description}</p>
                  <div className="flex items-center gap-3 mt-3 text-[11px] text-slate-500">
                    <span className="inline-flex items-center gap-1"><RI.Clock size={10} /> {rt.avgTime}</span>
                    <span>·</span>
                    <span>{rt.pages}</span>
                  </div>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ───────────────────────────────────────────────────────────────
// Parameter controls
// ───────────────────────────────────────────────────────────────
function ParamSelect({ label, options, value, onChange, required }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-slate-700 mb-1.5">{label}{required && <span className="text-rose-600">*</span>}</label>
      <select value={value || ''} onChange={(e) => onChange(e.target.value)}
        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-md text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
        <option value="">Choose…</option>
        {options.map((o) => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  );
}

function ParamToggle({ label, value, onChange }) {
  return (
    <label className="flex items-center justify-between gap-3 py-2 cursor-pointer">
      <span className="text-sm text-slate-700">{label}</span>
      <button onClick={() => onChange(!value)} className={`relative w-9 h-5 rounded-full transition ${value ? 'bg-blue-600' : 'bg-slate-300'}`}>
        <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition ${value ? 'left-[18px]' : 'left-0.5'}`}></span>
      </button>
    </label>
  );
}

function ParamMultiClass({ value = [], onChange, required }) {
  const byForm = CLASSES.reduce((acc, c) => { (acc[c.form] = acc[c.form] || []).push(c); return acc; }, {});
  const toggle = (id) => onChange(value.includes(id) ? value.filter(v => v !== id) : [...value, id]);
  const allInForm = (form) => byForm[form].every(c => value.includes(c.id));
  const toggleForm = (form) => {
    if (allInForm(form)) onChange(value.filter(v => !byForm[form].some(c => c.id === v)));
    else onChange([...new Set([...value, ...byForm[form].map(c => c.id)])]);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <label className="block text-xs font-semibold text-slate-700">Classes{required && <span className="text-rose-600">*</span>}</label>
        <span className="text-xs text-slate-500">{value.length} of {CLASSES.length} selected</span>
      </div>
      <div className="bg-slate-50 border border-slate-200 rounded-md p-3 space-y-2 max-h-64 overflow-y-auto">
        {Object.entries(byForm).map(([form, classes]) => (
          <div key={form}>
            <button onClick={() => toggleForm(form)} className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500 hover:text-slate-700 mb-1">
              <span className={`w-3.5 h-3.5 rounded border ${allInForm(form) ? 'bg-blue-600 border-blue-600' : 'bg-white border-slate-300'} grid place-items-center`}>
                {allInForm(form) && <RI.Check size={9} className="text-white" />}
              </span>
              {form}
            </button>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 ml-5">
              {classes.map(c => {
                const checked = value.includes(c.id);
                return (
                  <button key={c.id} onClick={() => toggle(c.id)}
                    className={`flex items-center gap-2 px-2 py-1.5 rounded border text-xs transition ${
                      checked ? 'bg-blue-50 border-blue-300 text-blue-900' : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
                    }`}>
                    <span className={`w-3 h-3 rounded-sm border ${checked ? 'bg-blue-600 border-blue-600' : 'border-slate-300'} grid place-items-center shrink-0`}>
                      {checked && <RI.Check size={8} className="text-white" />}
                    </span>
                    <span>{c.form.replace('Form ','')}{c.stream} <span className="text-slate-400">·{c.students}</span></span>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ParamClassPicker({ value, onChange, required }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-slate-700 mb-1.5">Class{required && <span className="text-rose-600">*</span>}</label>
      <select value={value || ''} onChange={(e) => onChange(e.target.value)}
        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-md text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500">
        <option value="">Choose a class…</option>
        {CLASSES.map(c => <option key={c.id} value={c.id}>{c.form} {c.stream} · {c.students} students</option>)}
      </select>
    </div>
  );
}

function ParamMultiSubject({ value = [], onChange, required }) {
  const toggle = (id) => onChange(value.includes(id) ? value.filter(v => v !== id) : [...value, id]);
  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <label className="block text-xs font-semibold text-slate-700">Subjects{required && <span className="text-rose-600">*</span>}</label>
        <div className="flex gap-2">
          <button onClick={() => onChange(SUBJECTS.map(s => s.id))} className="text-xs text-blue-600 hover:text-blue-700 font-medium">All</button>
          <button onClick={() => onChange([])} className="text-xs text-slate-500 hover:text-slate-700">None</button>
        </div>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
        {SUBJECTS.map(s => {
          const checked = value.includes(s.id);
          return (
            <button key={s.id} onClick={() => toggle(s.id)}
              className={`flex items-center gap-2 px-2.5 py-1.5 rounded-md border text-xs ${
                checked ? 'bg-blue-50 border-blue-300 text-blue-900' : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
              }`}>
              <span className={`w-3 h-3 rounded-sm border ${checked ? 'bg-blue-600 border-blue-600' : 'border-slate-300'} grid place-items-center shrink-0`}>
                {checked && <RI.Check size={8} className="text-white" />}
              </span>
              {s.name}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function ParamMultiForm({ value = [], onChange }) {
  const forms = ['Form 1','Form 2','Form 3','Form 4','Form 5','Form 6'];
  const toggle = (f) => onChange(value.includes(f) ? value.filter(v => v !== f) : [...value, f]);
  return (
    <div>
      <label className="block text-xs font-semibold text-slate-700 mb-1.5">Forms</label>
      <div className="flex flex-wrap gap-1.5">
        {forms.map(f => {
          const checked = value.includes(f);
          return (
            <button key={f} onClick={() => toggle(f)}
              className={`px-3 py-1.5 rounded-md border text-xs font-medium ${
                checked ? 'bg-blue-600 border-blue-600 text-white' : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
              }`}>{f}</button>
          );
        })}
      </div>
    </div>
  );
}

function ParamMultiTeacher({ value, onChange }) {
  const [showAll, setShowAll] = useWState(false);
  const isAll = value === 'all' || value === undefined;
  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <label className="block text-xs font-semibold text-slate-700">Teachers</label>
        <div className="flex gap-2">
          <button onClick={() => onChange('all')} className={`text-xs font-medium ${isAll ? 'text-blue-700' : 'text-slate-500 hover:text-slate-700'}`}>All teachers ({TEACHERS.length})</button>
          <button onClick={() => onChange([])} className="text-xs text-slate-500 hover:text-slate-700">Select specific</button>
        </div>
      </div>
      {!isAll && (
        <div className="grid grid-cols-2 gap-1.5">
          {TEACHERS.map(t => {
            const sel = Array.isArray(value) && value.includes(t.id);
            return (
              <button key={t.id} onClick={() => onChange(sel ? value.filter(v => v !== t.id) : [...(Array.isArray(value) ? value : []), t.id])}
                className={`flex items-center gap-2 px-2.5 py-1.5 rounded-md border text-xs ${
                  sel ? 'bg-blue-50 border-blue-300' : 'bg-white border-slate-200 hover:border-slate-300'
                }`}>
                <span className="w-5 h-5 rounded-full bg-slate-200 grid place-items-center text-[9px] font-bold text-slate-600">{t.avatar}</span>
                <span className="truncate">{t.name}</span>
              </button>
            );
          })}
        </div>
      )}
      {isAll && (
        <div className="bg-slate-50 border border-slate-200 rounded-md px-3 py-2 text-xs text-slate-600">All {TEACHERS.length} teachers will be included in the report.</div>
      )}
    </div>
  );
}

function ParamMultiSelect({ label, options, value = [], onChange }) {
  const toggle = (o) => onChange(value.includes(o) ? value.filter(v => v !== o) : [...value, o]);
  return (
    <div>
      <label className="block text-xs font-semibold text-slate-700 mb-1.5">{label}</label>
      <div className="flex flex-wrap gap-1.5">
        {options.map(o => {
          const sel = value.includes(o);
          return (
            <button key={o} onClick={() => toggle(o)}
              className={`px-3 py-1.5 rounded-md border text-xs font-medium ${
                sel ? 'bg-blue-50 border-blue-300 text-blue-900' : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
              }`}>{o}</button>
          );
        })}
      </div>
    </div>
  );
}

// ───────────────────────────────────────────────────────────────
// STEP 2 — Configure parameters
// ───────────────────────────────────────────────────────────────
function StepConfigure({ reportType, params, setParams }) {
  const setParam = (id, v) => setParams({ ...params, [id]: v });
  const renderParam = (p) => {
    switch (p.kind) {
      case 'select':       return <ParamSelect label={p.label} options={p.options} value={params[p.id]} onChange={(v) => setParam(p.id, v)} required={p.required} />;
      case 'toggle':       return <ParamToggle label={p.label} value={params[p.id] ?? p.default} onChange={(v) => setParam(p.id, v)} />;
      case 'multi-class':  return <ParamMultiClass value={params[p.id]} onChange={(v) => setParam(p.id, v)} required={p.required} />;
      case 'class-picker': return <ParamClassPicker value={params[p.id]} onChange={(v) => setParam(p.id, v)} required={p.required} />;
      case 'multi-subject':return <ParamMultiSubject value={params[p.id]} onChange={(v) => setParam(p.id, v)} required={p.required} />;
      case 'multi-form':   return <ParamMultiForm value={params[p.id] ?? p.default} onChange={(v) => setParam(p.id, v)} />;
      case 'multi-teacher':return <ParamMultiTeacher value={params[p.id] ?? p.default} onChange={(v) => setParam(p.id, v)} />;
      case 'multi-select': return <ParamMultiSelect label={p.label} options={p.options} value={params[p.id] ?? p.default} onChange={(v) => setParam(p.id, v)} />;
      default: return null;
    }
  };

  const a = ACCENT[reportType.accent];
  const Icon = RI[reportType.icon];

  return (
    <div>
      {/* Selected type banner */}
      <div className={`flex items-center gap-3 ${a.bg} border ${a.border} rounded-lg px-4 py-3 mb-5`}>
        <div className={`w-9 h-9 rounded-md ${a.iconBg} text-white grid place-items-center shrink-0`}><Icon size={16} /></div>
        <div className="flex-1">
          <div className="font-semibold text-slate-900">{reportType.name}</div>
          <div className="text-xs text-slate-600">{reportType.tagline}</div>
        </div>
      </div>

      <h2 className="text-xl font-semibold text-slate-900 mb-1">Configure</h2>
      <p className="text-sm text-slate-500 mb-5">Choose what to include in this report.</p>

      <div className="space-y-5">
        {reportType.params.map((p) => <div key={p.id}>{renderParam(p)}</div>)}
      </div>
    </div>
  );
}

// ───────────────────────────────────────────────────────────────
// STEP 4 — Export
// ───────────────────────────────────────────────────────────────
function StepExport({ reportType, params, onSchedule, onGenerate, scheduling, setScheduling }) {
  const [format, setFormat] = useWState('pdf');
  const [recipients, setRecipients] = useWState('');
  const [delivery, setDelivery] = useWState('download');

  const formats = [
    { id: 'pdf',   label: 'PDF',   icon: 'FileText', note: 'A4, print-ready' },
    { id: 'excel', label: 'Excel / CSV', icon: 'FileText', note: 'For pivoting / analysis' },
    { id: 'print', label: 'Print',  icon: 'Print',    note: 'Send to printer now' },
  ];

  const deliveries = [
    { id: 'download', label: 'Download to my computer', icon: 'Download' },
    { id: 'email',    label: 'Email to recipients',     icon: 'Mail' },
    { id: 'link',     label: 'Generate shareable link', icon: 'Link', note: 'Requires authentication to open' },
  ];

  return (
    <div>
      <h2 className="text-xl font-semibold text-slate-900 mb-1">Export &amp; deliver</h2>
      <p className="text-sm text-slate-500 mb-5">Choose how this report should be packaged and shared.</p>

      <div className="space-y-5">
        {/* Format */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-2">Format</label>
          <div className="grid grid-cols-3 gap-2">
            {formats.map(f => {
              const Icon = RI[f.icon];
              const sel = format === f.id;
              return (
                <button key={f.id} onClick={() => setFormat(f.id)}
                  className={`flex items-start gap-2 p-3 rounded-md border text-left ${sel ? 'bg-blue-50 border-blue-300' : 'bg-white border-slate-200 hover:border-slate-300'}`}>
                  <Icon size={16} className={sel ? 'text-blue-700' : 'text-slate-500'} />
                  <div className="min-w-0">
                    <div className={`text-sm font-semibold ${sel ? 'text-blue-900' : 'text-slate-900'}`}>{f.label}</div>
                    <div className="text-[11px] text-slate-500 mt-0.5">{f.note}</div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Delivery */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-2">Delivery</label>
          <div className="space-y-2">
            {deliveries.map(d => {
              const Icon = RI[d.icon];
              const sel = delivery === d.id;
              return (
                <label key={d.id} className={`flex items-start gap-3 p-3 rounded-md border cursor-pointer ${sel ? 'bg-blue-50 border-blue-300' : 'bg-white border-slate-200 hover:border-slate-300'}`}>
                  <input type="radio" name="delivery" checked={sel} onChange={() => setDelivery(d.id)} className="mt-0.5 accent-blue-600" />
                  <Icon size={16} className={`mt-0.5 ${sel ? 'text-blue-700' : 'text-slate-500'}`} />
                  <div className="flex-1">
                    <div className={`text-sm font-semibold ${sel ? 'text-blue-900' : 'text-slate-900'}`}>{d.label}</div>
                    {d.note && <div className="text-[11px] text-slate-500 mt-0.5">{d.note}</div>}
                  </div>
                </label>
              );
            })}
          </div>
          {delivery === 'email' && (
            <div className="mt-2">
              <input
                value={recipients} onChange={(e) => setRecipients(e.target.value)}
                placeholder="recipients@email.com, another@email.com"
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-[11px] text-slate-500 mt-1.5">Or pick by role: <a className="text-blue-600 hover:underline cursor-pointer">All form teachers</a> · <a className="text-blue-600 hover:underline cursor-pointer">All parents in selected classes</a> · <a className="text-blue-600 hover:underline cursor-pointer">School board</a></p>
            </div>
          )}
        </div>

        {/* Schedule */}
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <RI.RefreshCw size={16} className="text-amber-700 mt-0.5" />
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <div className="font-semibold text-slate-900 text-sm">Run this on a schedule?</div>
                <ParamToggle label="" value={scheduling.enabled} onChange={(v) => setScheduling({ ...scheduling, enabled: v })} />
              </div>
              <p className="text-xs text-slate-600 mt-1">Auto-generate this report on a recurring basis. We'll deliver each run to the recipients above.</p>
              {scheduling.enabled && (
                <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <ParamSelect label="Cadence" options={['Daily','Weekly (Monday)','Bi-weekly','Monthly (1st)','Termly (last Friday)']} value={scheduling.cadence} onChange={(v) => setScheduling({ ...scheduling, cadence: v })} />
                  <ParamSelect label="Time of day" options={['07:00 (school open)','12:00 (midday)','17:00 (end of day)','23:00 (overnight)']} value={scheduling.time} onChange={(v) => setScheduling({ ...scheduling, time: v })} />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

window.WizardSteps = { StepPick, StepConfigure, StepExport };


// ===== reports/preview.jsx =====
// Step 3 — Live preview of the report. Renders a print-ready document on cream/paper background
// inside an A4-proportioned container so admins can see what they'll get.



function PreviewHeader({ subtitle }) {
  return (
    <div className="border-b-2 border-slate-300 pb-4 mb-5">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-md bg-emerald-700 text-white grid place-items-center font-bold text-xl font-serif" style={{ fontFamily: 'Source Serif 4, Georgia, serif' }}>G</div>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight" style={{ fontFamily: 'Source Serif 4, Georgia, serif' }}>{SCHOOL.name}</h1>
          <p className="text-xs text-slate-600">{SCHOOL.address} · {SCHOOL.phone}</p>
          <p className="text-[11px] italic text-slate-500 mt-0.5">{SCHOOL.motto} · Established {SCHOOL.established}</p>
        </div>
        <div className="text-right">
          <div className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold">Generated</div>
          <div className="text-xs text-slate-700 mt-0.5">{new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</div>
        </div>
      </div>
      {subtitle && <div className="mt-3 text-sm font-semibold text-slate-800 uppercase tracking-wide">{subtitle}</div>}
    </div>
  );
}

// School-wide summary preview
function PreviewSchoolSummary({ params }) {
  const d = PREVIEW_SAMPLE['school-summary'];
  return (
    <div className="p-8 bg-white text-slate-700" style={{ fontSize: 12, lineHeight: 1.5 }}>
      <PreviewHeader subtitle={`Performance Summary — ${params.term || 'Term 1 2026'}`} />

      <div className="grid grid-cols-4 gap-3 mb-5">
        {[
          { l: 'Total enrollment',   v: d.enrollment.total, sub: 'across Forms 1–6' },
          { l: 'Avg class mastery',  v: `${Math.round(d.avgClassMastery*100)}%`, sub: 'BKT, all students' },
          { l: 'Term attendance',    v: `${d.attendance}%`, sub: 'average daily' },
          { l: 'AI graded',          v: d.aiUsage.gradedAssessments.toLocaleString(), sub: `${d.aiUsage.tutorSessions.toLocaleString()} tutor sessions` },
        ].map((k, i) => (
          <div key={i} className="border border-slate-200 rounded p-3">
            <div className="text-[9px] uppercase tracking-wider text-slate-500 font-semibold">{k.l}</div>
            <div className="text-2xl font-bold text-slate-900 mt-1 tnum" style={{ fontFamily: 'Source Serif 4, Georgia, serif' }}>{k.v}</div>
            <div className="text-[10px] text-slate-500 mt-1">{k.sub}</div>
          </div>
        ))}
      </div>

      <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-2 border-b border-slate-300 pb-1">Pass rate by form</h3>
      <table className="w-full mb-5 text-xs">
        <thead>
          <tr className="border-b border-slate-300">
            <th className="text-left py-1.5 font-semibold text-slate-600">Form</th>
            <th className="text-left py-1.5 font-semibold text-slate-600">Enrollment</th>
            <th className="text-left py-1.5 font-semibold text-slate-600">Pass rate</th>
            <th className="text-left py-1.5 font-semibold text-slate-600">vs last term</th>
            <th className="text-left py-1.5 font-semibold text-slate-600">Trend</th>
          </tr>
        </thead>
        <tbody>
          {d.passRates.map((r, i) => (
            <tr key={i} className="border-b border-slate-200">
              <td className="py-1.5 font-medium text-slate-900">{r.form}</td>
              <td className="py-1.5 tnum">{d.enrollment.by_form[r.form]}</td>
              <td className="py-1.5 tnum font-semibold">{r.rate}%</td>
              <td className={`py-1.5 tnum font-semibold ${r.change > 0 ? 'text-emerald-700' : 'text-rose-700'}`}>{r.change > 0 ? '+' : ''}{r.change} pts</td>
              <td className="py-1.5">
                <div className="w-32 h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div className={`h-full ${r.rate >= 75 ? 'bg-emerald-500' : r.rate >= 65 ? 'bg-amber-500' : 'bg-rose-500'}`} style={{ width: r.rate + '%' }} />
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="grid grid-cols-2 gap-5">
        <div>
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-2 border-b border-slate-300 pb-1">Strongest subjects</h3>
          {d.topSubjects.map((s, i) => (
            <div key={i} className="flex items-center justify-between py-1.5 border-b border-slate-100">
              <span className="text-slate-700">{s.name}</span>
              <span className="font-semibold text-emerald-700 tnum">{s.avgScore}%</span>
            </div>
          ))}
        </div>
        <div>
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-2 border-b border-slate-300 pb-1">Areas of concern</h3>
          {d.weakSubjects.map((s, i) => (
            <div key={i} className="flex items-center justify-between py-1.5 border-b border-slate-100">
              <span className="text-slate-700">{s.name}</span>
              <span className="font-semibold text-rose-700 tnum">{s.avgScore}%</span>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-6 pt-4 border-t border-slate-300 text-[10px] text-slate-500 flex justify-between">
        <span>Goromonzi High School · Confidential — for internal use</span>
        <span>Page 1 of 2</span>
      </div>
    </div>
  );
}

// Class performance preview
function PreviewClassPerformance({ params }) {
  const d = PREVIEW_SAMPLE['class-performance'];
  return (
    <div className="p-8 bg-white text-slate-700" style={{ fontSize: 12, lineHeight: 1.5 }}>
      <PreviewHeader subtitle={`Class Performance — ${d.className} · ${d.term}`} />

      <div className="grid grid-cols-4 gap-3 mb-5">
        {[
          { l: 'Students', v: d.students, sub: '32 on roll' },
          { l: 'Average score', v: `${d.avgScore}%`, sub: 'all assessments' },
          { l: 'Pass rate', v: `${d.passRate}%`, sub: '50% threshold' },
          { l: 'BKT mastery', v: `${Math.round(d.classMastery*100)}%`, sub: 'avg skill mastery' },
        ].map((k, i) => (
          <div key={i} className="border border-slate-200 rounded p-3">
            <div className="text-[9px] uppercase tracking-wider text-slate-500 font-semibold">{k.l}</div>
            <div className="text-2xl font-bold text-slate-900 mt-1 tnum" style={{ fontFamily: 'Source Serif 4, Georgia, serif' }}>{k.v}</div>
            <div className="text-[10px] text-slate-500 mt-1">{k.sub}</div>
          </div>
        ))}
      </div>

      <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-2 border-b border-slate-300 pb-1">By subject</h3>
      <table className="w-full mb-5 text-xs">
        <thead>
          <tr className="border-b border-slate-300">
            <th className="text-left py-1.5 font-semibold text-slate-600">Subject</th>
            <th className="text-right py-1.5 font-semibold text-slate-600">Avg score</th>
            <th className="text-right py-1.5 font-semibold text-slate-600">Pass rate</th>
            <th className="text-right py-1.5 font-semibold text-slate-600">Mastery</th>
          </tr>
        </thead>
        <tbody>
          {d.subjects.map((s, i) => (
            <tr key={i} className="border-b border-slate-200">
              <td className="py-1.5 font-medium text-slate-900">{s.name}</td>
              <td className="py-1.5 text-right tnum">{s.avg}%</td>
              <td className="py-1.5 text-right tnum">{s.pass}%</td>
              <td className="py-1.5 text-right tnum">{Math.round(s.mastery*100)}%</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="grid grid-cols-2 gap-5">
        <div>
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-2 border-b border-emerald-300 pb-1">Top performers</h3>
          {d.topPerformers.map((p, i) => (
            <div key={i} className="flex items-center justify-between py-1.5 border-b border-slate-100">
              <span className="text-slate-800">{i+1}. {p.name}</span>
              <div className="flex gap-3 text-xs">
                <span className="tnum text-slate-600">{p.score}%</span>
                <span className="tnum text-emerald-700 font-semibold">M {Math.round(p.mastery*100)}%</span>
              </div>
            </div>
          ))}
        </div>
        <div>
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-2 border-b border-rose-300 pb-1">Needs attention</h3>
          {d.needsAttention.map((p, i) => (
            <div key={i} className="py-1.5 border-b border-slate-100">
              <div className="flex items-center justify-between">
                <span className="text-slate-800">{p.name}</span>
                <span className="tnum text-rose-700 font-semibold">{p.score}%</span>
              </div>
              <div className="text-[10px] text-slate-500 italic">{p.reason}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-6 pt-4 border-t border-slate-300 text-[10px] text-slate-500 flex justify-between">
        <span>{d.className} · Form Teacher: Mr. T. Mukamuri · Confidential</span>
        <span>Page 1 of 11</span>
      </div>
    </div>
  );
}

// Term report card preview
function PreviewTermReport({ params }) {
  const grades = [
    { subj: 'Mathematics',    score: 68, grade: 'B', teacher: 'Mr. Mukamuri', comment: 'Steady progress. Watch quadratic factorisation — sign errors common.' },
    { subj: 'English Language', score: 72, grade: 'B', teacher: 'Mrs. Sibanda',  comment: 'Strong written work. Push for more analytical depth.' },
    { subj: 'Shona',          score: 78, grade: 'A', teacher: 'Mrs. Mhondoro', comment: 'Excellent. Continues to lead the class.' },
    { subj: 'Combined Science', score: 65, grade: 'C', teacher: 'Ms. Dube',      comment: 'Effort improving. Practice past papers over the break.' },
    { subj: 'History',        score: 70, grade: 'B', teacher: 'Mr. Moyo',     comment: 'Good essay structure. Develop source analysis.' },
    { subj: 'Geography',      score: 74, grade: 'B', teacher: 'Mr. Chiweshe', comment: 'Confident with maps. Work on case-study recall.' },
  ];
  const overall = Math.round(grades.reduce((a,g) => a+g.score, 0) / grades.length);

  return (
    <div className="p-8 bg-white text-slate-700" style={{ fontSize: 11, lineHeight: 1.45 }}>
      <PreviewHeader subtitle={`Term Report — ${params.term || 'Term 1 2026'}`} />

      <div className="grid grid-cols-[1fr_auto] gap-6 mb-4 items-start">
        <div className="grid grid-cols-2 gap-x-6 gap-y-1.5 text-xs">
          <div><span className="text-slate-500">Pupil:</span> <span className="font-semibold text-slate-900">Tinashe Moyo</span></div>
          <div><span className="text-slate-500">Form / Class:</span> <span className="font-semibold text-slate-900">Form 4 A</span></div>
          <div><span className="text-slate-500">Pupil ID:</span> <span className="font-mono text-slate-700">GHS-4A-014</span></div>
          <div><span className="text-slate-500">Term:</span> <span className="font-semibold text-slate-900">{params.term || 'Term 1 2026'}</span></div>
          <div><span className="text-slate-500">Form teacher:</span> <span className="text-slate-900">Mr. T. Mukamuri</span></div>
          <div><span className="text-slate-500">Position in class:</span> <span className="font-semibold text-slate-900">7 / 32</span></div>
          <div><span className="text-slate-500">Attendance:</span> <span className="text-slate-900">94 of 100 days</span></div>
          <div><span className="text-slate-500">Conduct:</span> <span className="text-emerald-700 font-semibold">Excellent</span></div>
        </div>
        <div className="text-center border-2 border-slate-300 rounded-md p-3 min-w-[140px]">
          <div className="text-[9px] uppercase tracking-wider text-slate-500 font-semibold">Overall</div>
          <div className="text-4xl font-bold text-slate-900 tnum" style={{ fontFamily: 'Source Serif 4, Georgia, serif' }}>{overall}<span className="text-lg text-slate-500">%</span></div>
          <div className="text-xs text-emerald-700 font-semibold mt-1">Grade B · Above average</div>
        </div>
      </div>

      <table className="w-full text-xs mb-5 border-t border-b border-slate-300">
        <thead>
          <tr className="bg-slate-50 border-b border-slate-200">
            <th className="text-left py-2 px-2 font-semibold text-slate-600">Subject</th>
            <th className="text-right py-2 px-2 font-semibold text-slate-600">Mark</th>
            <th className="text-center py-2 px-2 font-semibold text-slate-600">Grade</th>
            <th className="text-left py-2 px-2 font-semibold text-slate-600">Teacher comment</th>
            <th className="text-left py-2 px-2 font-semibold text-slate-600">Signed</th>
          </tr>
        </thead>
        <tbody>
          {grades.map((g, i) => (
            <tr key={i} className="border-b border-slate-100">
              <td className="py-2 px-2 font-semibold text-slate-900">{g.subj}</td>
              <td className="py-2 px-2 text-right tnum">{g.score}</td>
              <td className="py-2 px-2 text-center font-bold tnum text-slate-900">{g.grade}</td>
              <td className="py-2 px-2 text-slate-700 italic">"{g.comment}"</td>
              <td className="py-2 px-2 text-[10px] text-slate-500">{g.teacher}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {params.mastery && (
        <div className="mb-5">
          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2">BKT Mastery breakdown — Mathematics</h3>
          <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs">
            {[
              ['Quadratic equations', 0.72], ['Simultaneous equations', 0.68],
              ['Circle theorems',     0.58], ['Sine & cosine rules',    0.61],
              ['Probability',         0.78], ['Differentiation',        0.42],
            ].map(([s, m], i) => (
              <div key={i} className="flex items-center gap-2">
                <span className="text-slate-700 w-40">{s}</span>
                <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <div className={`h-full ${m >= 0.75 ? 'bg-emerald-500' : m >= 0.5 ? 'bg-amber-500' : 'bg-rose-500'}`} style={{ width: m*100 + '%' }} />
                </div>
                <span className="tnum text-slate-700 w-9 text-right text-[10px] font-semibold">{Math.round(m*100)}%</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="border-t border-slate-300 pt-3 grid grid-cols-2 gap-6 text-xs">
        <div>
          <div className="text-[10px] uppercase text-slate-500 font-semibold mb-1">Form teacher comment</div>
          <p className="italic text-slate-700">A diligent and well-mannered pupil. Tinashe consistently meets expectations and is showing real promise in mathematics and Shona. Maintain this trajectory next term.</p>
          <div className="mt-3 border-t border-dashed border-slate-300 pt-1 text-[10px] text-slate-500">Mr. T. Mukamuri · Form teacher</div>
        </div>
        <div>
          <div className="text-[10px] uppercase text-slate-500 font-semibold mb-1">Headmistress comment</div>
          <p className="italic text-slate-700">Pleased with steady progress this term. Recommend continued focus on calculus foundations heading into Form 5.</p>
          <div className="mt-3 border-t border-dashed border-slate-300 pt-1 text-[10px] text-slate-500">Mrs. R. Chigumba · {params.signature || 'Headmistress'}</div>
        </div>
      </div>

      <div className="mt-5 pt-3 border-t border-slate-300 text-[10px] text-slate-500 flex justify-between">
        <span>Goromonzi High School · Confidential report</span>
        <span>School re-opens 10 June 2026</span>
      </div>
    </div>
  );
}

// Subject performance preview
function PreviewSubjectPerformance({ params }) {
  return (
    <div className="p-8 bg-white text-slate-700" style={{ fontSize: 12 }}>
      <PreviewHeader subtitle={`Subject Performance — ${params.term || 'Term 1 2026'}`} />
      <p className="text-xs text-slate-600 mb-4">Average score and BKT mastery by subject and form, across {(params.subjects || []).length || 'all'} subjects and {(params.forms || []).length || 6} forms.</p>

      <table className="w-full text-xs mb-5">
        <thead>
          <tr className="border-b-2 border-slate-300 bg-slate-50">
            <th className="text-left py-2 px-2 font-semibold text-slate-600">Subject</th>
            <th className="text-right py-2 px-2 font-semibold text-slate-600">F1</th>
            <th className="text-right py-2 px-2 font-semibold text-slate-600">F2</th>
            <th className="text-right py-2 px-2 font-semibold text-slate-600">F3</th>
            <th className="text-right py-2 px-2 font-semibold text-slate-600">F4</th>
            <th className="text-right py-2 px-2 font-semibold text-slate-600">F5</th>
            <th className="text-right py-2 px-2 font-semibold text-slate-600">F6</th>
            <th className="text-right py-2 px-2 font-semibold text-slate-700">School avg</th>
          </tr>
        </thead>
        <tbody>
          {['Mathematics','English Language','Shona','Combined Science','Biology','Chemistry','Physics','History','Geography'].map((subj, i) => {
            const scores = [62, 58, 71, 64, 60, 66, 68];
            const variance = i * 1.7;
            const row = scores.map((s, idx) => Math.round(s + Math.sin(i + idx) * 8 - variance + idx * 0.5));
            const avg = Math.round(row.reduce((a,b) => a+b, 0) / row.length);
            return (
              <tr key={subj} className="border-b border-slate-100">
                <td className="py-2 px-2 font-semibold text-slate-900">{subj}</td>
                {row.slice(0,6).map((r, j) => (
                  <td key={j} className={`py-2 px-2 text-right tnum ${r < 50 ? 'text-rose-700 font-semibold' : r >= 75 ? 'text-emerald-700 font-semibold' : ''}`}>{r}</td>
                ))}
                <td className="py-2 px-2 text-right tnum font-bold text-slate-900 bg-slate-50">{avg}</td>
              </tr>
            );
          })}
        </tbody>
      </table>

      <div className="text-[10px] text-slate-500 flex gap-4">
        <span><span className="inline-block w-2 h-2 bg-rose-500 rounded-full mr-1"></span>Below 50% (concern)</span>
        <span><span className="inline-block w-2 h-2 bg-emerald-500 rounded-full mr-1"></span>75%+ (strong)</span>
      </div>
    </div>
  );
}

// Teacher activity preview
function PreviewTeacherActivity({ params }) {
  const rows = TEACHERS.map((t, i) => ({
    ...t,
    setCount: 18 - i * 2,
    turnaround: (1.2 + i * 0.4).toFixed(1),
    aiPct: 78 - i * 6,
    classCoverage: 3 + (i % 3),
    lastSignIn: ['2h ago','today','today','yesterday','today','2 days ago'][i],
  }));
  return (
    <div className="p-8 bg-white text-slate-700" style={{ fontSize: 12 }}>
      <PreviewHeader subtitle={`Teacher Activity — ${params.period || 'This term'}`} />
      <p className="text-xs text-slate-600 mb-4">Engagement and marking activity across {TEACHERS.length} teaching staff.</p>

      <table className="w-full text-xs">
        <thead>
          <tr className="border-b-2 border-slate-300 bg-slate-50">
            <th className="text-left py-2 px-2 font-semibold text-slate-600">Teacher</th>
            <th className="text-left py-2 px-2 font-semibold text-slate-600">Dept</th>
            <th className="text-right py-2 px-2 font-semibold text-slate-600">Assessments set</th>
            <th className="text-right py-2 px-2 font-semibold text-slate-600">Marking turnaround</th>
            <th className="text-right py-2 px-2 font-semibold text-slate-600">AI-assisted %</th>
            <th className="text-right py-2 px-2 font-semibold text-slate-600">Classes</th>
            <th className="text-right py-2 px-2 font-semibold text-slate-600">Last sign-in</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} className="border-b border-slate-100">
              <td className="py-2 px-2 font-semibold text-slate-900">{r.name}</td>
              <td className="py-2 px-2 text-slate-600">{r.dept}</td>
              <td className="py-2 px-2 text-right tnum">{r.setCount}</td>
              <td className="py-2 px-2 text-right tnum">{r.turnaround} days</td>
              <td className="py-2 px-2 text-right tnum">{r.aiPct}%</td>
              <td className="py-2 px-2 text-right tnum">{r.classCoverage}</td>
              <td className="py-2 px-2 text-right text-slate-500">{r.lastSignIn}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function StepPreview({ reportType, params }) {
  let preview;
  switch (reportType.id) {
    case 'school-summary':     preview = <PreviewSchoolSummary params={params} />; break;
    case 'class-performance':  preview = <PreviewClassPerformance params={params} />; break;
    case 'term-report':        preview = <PreviewTermReport params={params} />; break;
    case 'subject-performance':preview = <PreviewSubjectPerformance params={params} />; break;
    case 'teacher-activity':   preview = <PreviewTeacherActivity params={params} />; break;
    default: preview = <div className="p-10 text-center text-slate-500">No preview available.</div>;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">Preview</h2>
          <p className="text-sm text-slate-500 mt-1">A sample of what the generated report will look like. Page 1 only.</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs px-2 py-1 bg-slate-100 text-slate-600 rounded font-medium">Sample data</span>
          <span className="text-xs px-2 py-1 bg-blue-50 text-blue-700 rounded font-medium">A4 · Portrait</span>
        </div>
      </div>

      <div className="bg-slate-200 rounded-lg p-6 max-h-[600px] overflow-y-auto">
        <div className="bg-white shadow-lg max-w-[820px] mx-auto rounded">
          {preview}
        </div>
      </div>
    </div>
  );
}

window.StepPreview = StepPreview;


// ===== reports/app.jsx =====
// App shell — sidebar (visual context), main reports page with three tabs:
// "Generate" (wizard) · "Recent reports" · "Scheduled"
const { useState: useAppState } = React;

function App() {
  const [view, setView] = useAppState('generate'); // 'generate' | 'recent' | 'scheduled'
  const [step, setStep] = useAppState(1);
  const [selectedTypeId, setSelectedTypeId] = useAppState(null);
  const [params, setParams] = useAppState({});
  const [scheduling, setScheduling] = useAppState({ enabled: false, cadence: 'Termly (last Friday)', time: '17:00 (end of day)' });
  const [toast, setToast] = useAppState(null);

  const reportType = window.REPORTS_DATA.REPORT_TYPES.find(rt => rt.id === selectedTypeId);

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(null), 3500); };

  const next = () => setStep(s => Math.min(4, s + 1));
  const back = () => setStep(s => Math.max(1, s - 1));
  const startOver = () => { setStep(1); setSelectedTypeId(null); setParams({}); };

  const canProceedToStep2 = !!reportType;
  const canProceedToStep3 = canProceedToStep2 && (reportType.params || []).filter(p => p.required).every(p => params[p.id] && (Array.isArray(params[p.id]) ? params[p.id].length > 0 : true));

  return (
    <div className="min-h-screen bg-slate-100 flex">
      <SchoolAdminSidebar />

      <div className="flex-1 min-w-0">
        <TopBar />
        <main className="p-6 max-w-7xl mx-auto">
          <PageHeader view={view} setView={setView} startOver={startOver} />

          {view === 'generate'  && (
            <GenerateView
              step={step} setStep={setStep}
              reportType={reportType}
              selectedTypeId={selectedTypeId} setSelectedTypeId={setSelectedTypeId}
              params={params} setParams={setParams}
              scheduling={scheduling} setScheduling={setScheduling}
              canProceedToStep2={canProceedToStep2} canProceedToStep3={canProceedToStep3}
              next={next} back={back} startOver={startOver} showToast={showToast}
            />
          )}
          {view === 'recent'    && <RecentReports showToast={showToast} />}
          {view === 'scheduled' && <ScheduledReports showToast={showToast} />}
        </main>
      </div>

      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-sm font-medium px-5 py-2.5 rounded-full shadow-lg z-50 flex items-center gap-2">
          <RI.Check size={14} /> {toast}
        </div>
      )}
    </div>
  );
}

// ───────────────────────────────────────────────────────────────
// Sidebar — matches the project's school-admin sidebar style
// ───────────────────────────────────────────────────────────────
function SchoolAdminSidebar() {
  const nav = [
    { label: 'Dashboard',     icon: 'TrendUp' },
    { label: 'Teachers',      icon: 'Users' },
    { label: 'Students',      icon: 'GradCap' },
    { label: 'Classes',       icon: 'Book' },
    { label: 'Subjects',      icon: 'Book' },
    { label: 'Reports',       icon: 'FileText', active: true },
    { label: 'Settings',      icon: 'Settings' },
  ];
  return (
    <aside className="w-56 bg-white border-r border-slate-200 flex flex-col sticky top-0 h-screen shrink-0">
      <div className="px-4 py-4 border-b border-slate-200">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-md bg-emerald-700 text-white grid place-items-center font-bold text-sm">G</div>
          <div className="min-w-0">
            <div className="font-semibold text-slate-900 text-sm truncate">Goromonzi High</div>
            <div className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">School Admin</div>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-2 space-y-0.5">
        {nav.map((n, i) => {
          const Icon = RI[n.icon];
          return (
            <button key={i} className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-md text-sm font-medium ${
              n.active ? 'bg-blue-50 text-blue-700' : 'text-slate-700 hover:bg-slate-100'
            }`}>
              <Icon size={15} className={n.active ? 'text-blue-700' : 'text-slate-500'} />
              {n.label}
            </button>
          );
        })}
      </nav>

      <div className="p-3 border-t border-slate-200">
        <div className="flex items-center gap-2 px-1">
          <div className="w-7 h-7 rounded-full bg-blue-600 text-white grid place-items-center text-xs font-bold">RC</div>
          <div className="min-w-0 flex-1">
            <div className="text-xs font-semibold text-slate-900 truncate">Mrs. R. Chigumba</div>
            <div className="text-[10px] text-slate-500">Headmistress</div>
          </div>
        </div>
      </div>
    </aside>
  );
}

function TopBar() {
  return (
    <header className="h-14 bg-white border-b border-slate-200 px-6 flex items-center gap-4 sticky top-0 z-10">
      <div className="flex-1 max-w-md relative">
        <RI.Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input placeholder="Search reports, classes, students…" className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
      </div>
      <div className="flex-1" />
      <span className="text-xs text-slate-500">Term 2 · Week 7 of 13</span>
      <button className="w-8 h-8 rounded-md hover:bg-slate-100 grid place-items-center relative">
        <RI.RefreshCw size={15} className="text-slate-600" />
      </button>
    </header>
  );
}

function PageHeader({ view, setView, startOver }) {
  const tabs = [
    { id: 'generate',  label: 'Generate a report' },
    { id: 'recent',    label: 'Recent reports', badge: 6 },
    { id: 'scheduled', label: 'Scheduled', badge: 4 },
  ];
  return (
    <div className="mb-5">
      <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Reports</h1>
          <p className="text-sm text-slate-500 mt-1">Generate, schedule, and share reports across the school.</p>
        </div>
        {view === 'generate' && (
          <button onClick={startOver} className="text-sm text-slate-600 hover:text-slate-900 font-medium flex items-center gap-1.5">
            <RI.RefreshCw size={13} /> Start over
          </button>
        )}
      </div>

      <div className="flex items-center gap-1 border-b border-slate-200">
        {tabs.map(t => (
          <button key={t.id} onClick={() => setView(t.id)}
            className={`px-4 py-2.5 text-sm font-semibold border-b-2 -mb-px transition flex items-center gap-2 ${
              view === t.id ? 'border-blue-600 text-blue-700' : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}>
            {t.label}
            {t.badge && <span className={`tnum text-[10px] px-1.5 py-0.5 rounded ${view === t.id ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-600'}`}>{t.badge}</span>}
          </button>
        ))}
      </div>
    </div>
  );
}

// ───────────────────────────────────────────────────────────────
// Generate view — the wizard
// ───────────────────────────────────────────────────────────────
function GenerateView({ step, setStep, reportType, selectedTypeId, setSelectedTypeId, params, setParams, scheduling, setScheduling, canProceedToStep2, canProceedToStep3, next, back, startOver, showToast }) {
  const { StepPick, StepConfigure, StepExport } = window.WizardSteps;
  const { StepPreview } = window;

  const steps = [
    { n: 1, label: 'Pick',      sub: 'Report type' },
    { n: 2, label: 'Configure', sub: 'Parameters' },
    { n: 3, label: 'Preview',   sub: 'Sample render' },
    { n: 4, label: 'Export',    sub: 'Deliver / schedule' },
  ];

  const handleGenerate = () => {
    showToast(scheduling.enabled
      ? `Report scheduled · runs ${scheduling.cadence}`
      : 'Report generation queued · you\'ll be notified when ready');
    startOver();
  };

  return (
    <div className="grid grid-cols-12 gap-5">
      <div className="col-span-12 lg:col-span-3">
        {/* Stepper */}
        <div className="bg-white border border-slate-200 rounded-lg p-4 sticky top-20">
          <div className="text-[10px] uppercase tracking-wider text-slate-500 font-bold mb-3">Steps</div>
          <ol className="space-y-1">
            {steps.map((s, i) => {
              const active = step === s.n;
              const done = step > s.n;
              const reachable = s.n === 1 || (s.n === 2 && canProceedToStep2) || (s.n >= 3 && canProceedToStep3);
              return (
                <li key={s.n}>
                  <button onClick={() => reachable && setStep(s.n)} disabled={!reachable}
                    className={`w-full flex items-center gap-3 px-2.5 py-2 rounded-md text-left transition ${
                      active ? 'bg-blue-50' : done ? 'hover:bg-slate-50' : reachable ? 'hover:bg-slate-50' : 'opacity-50 cursor-not-allowed'
                    }`}>
                    <span className={`w-6 h-6 rounded-full grid place-items-center text-xs font-bold shrink-0 ${
                      done ? 'bg-emerald-600 text-white' : active ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-600'
                    }`}>
                      {done ? <RI.Check size={11} /> : s.n}
                    </span>
                    <div className="min-w-0">
                      <div className={`text-sm font-semibold ${active ? 'text-blue-900' : done ? 'text-slate-900' : 'text-slate-700'}`}>{s.label}</div>
                      <div className="text-[11px] text-slate-500">{s.sub}</div>
                    </div>
                  </button>
                </li>
              );
            })}
          </ol>

          {reportType && step > 1 && (
            <div className="mt-4 pt-3 border-t border-slate-200">
              <div className="text-[10px] uppercase tracking-wider text-slate-500 font-bold mb-2">Selected</div>
              <div className="text-sm font-semibold text-slate-900">{reportType.name}</div>
              <div className="text-[11px] text-slate-500 mt-0.5">{reportType.tagline}</div>
            </div>
          )}
        </div>
      </div>

      <div className="col-span-12 lg:col-span-9">
        <div className="bg-white border border-slate-200 rounded-lg p-6">
          {step === 1 && <StepPick selectedTypeId={selectedTypeId} onSelect={setSelectedTypeId} />}
          {step === 2 && reportType && <StepConfigure reportType={reportType} params={params} setParams={setParams} />}
          {step === 3 && reportType && <StepPreview reportType={reportType} params={params} />}
          {step === 4 && reportType && <StepExport reportType={reportType} params={params} scheduling={scheduling} setScheduling={setScheduling} />}

          {/* Footer nav */}
          <div className="flex items-center justify-between mt-6 pt-5 border-t border-slate-200">
            <button onClick={back} disabled={step === 1}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-md text-sm font-semibold ${
                step === 1 ? 'text-slate-400 cursor-not-allowed' : 'text-slate-700 hover:bg-slate-100'
              }`}>
              <RI.ChevronLeft size={14} /> Back
            </button>

            <div className="text-xs text-slate-500">Step {step} of 4</div>

            {step < 4 && (
              <button onClick={next} disabled={(step === 1 && !canProceedToStep2) || (step === 2 && !canProceedToStep3)}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-md text-sm font-semibold ${
                  (step === 1 && !canProceedToStep2) || (step === 2 && !canProceedToStep3)
                    ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                    : 'bg-blue-600 hover:bg-blue-700 text-white'
                }`}>
                Continue <RI.ChevronRight size={14} />
              </button>
            )}
            {step === 4 && (
              <button onClick={handleGenerate}
                className="flex items-center gap-1.5 px-5 py-2 rounded-md text-sm font-bold bg-blue-600 hover:bg-blue-700 text-white">
                <RI.Sparkles size={13} /> {scheduling.enabled ? 'Schedule report' : 'Generate now'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ───────────────────────────────────────────────────────────────
// Recent reports
// ───────────────────────────────────────────────────────────────
function RecentReports({ showToast }) {
  const { RECENT_REPORTS, REPORT_TYPES } = window.REPORTS_DATA;
  const typeById = Object.fromEntries(REPORT_TYPES.map(rt => [rt.id, rt]));
  return (
    <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
      <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-slate-900">Recently generated</h3>
          <p className="text-xs text-slate-500 mt-0.5">Reports stored for 90 days · then archived to school filesystem</p>
        </div>
        <button className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1.5">
          <RI.Filter size={13} /> Filter
        </button>
      </div>

      <table className="w-full text-sm">
        <thead className="bg-slate-50 border-b border-slate-200">
          <tr>
            <th className="text-left py-2.5 px-5 text-xs font-bold uppercase tracking-wider text-slate-500">Report</th>
            <th className="text-left py-2.5 px-3 text-xs font-bold uppercase tracking-wider text-slate-500">Type</th>
            <th className="text-left py-2.5 px-3 text-xs font-bold uppercase tracking-wider text-slate-500">Generated</th>
            <th className="text-left py-2.5 px-3 text-xs font-bold uppercase tracking-wider text-slate-500">By</th>
            <th className="text-right py-2.5 px-3 text-xs font-bold uppercase tracking-wider text-slate-500">Pages</th>
            <th className="text-right py-2.5 px-3 text-xs font-bold uppercase tracking-wider text-slate-500">Size</th>
            <th className="text-left py-2.5 px-3 text-xs font-bold uppercase tracking-wider text-slate-500">Status</th>
            <th className="text-right py-2.5 px-5"></th>
          </tr>
        </thead>
        <tbody>
          {RECENT_REPORTS.map((r, i) => {
            const t = typeById[r.type];
            const a = window.REPORTS_DATA.ACCENT[t.accent];
            const Icon = RI[t.icon];
            return (
              <tr key={r.id} className="border-b border-slate-100 hover:bg-slate-50 last:border-b-0">
                <td className="py-3 px-5">
                  <div className="flex items-center gap-2.5">
                    <div className={`w-7 h-7 rounded ${a.iconBg} text-white grid place-items-center shrink-0`}><Icon size={13} /></div>
                    <div className="min-w-0">
                      <div className="font-semibold text-slate-900 text-sm">{r.name}</div>
                      <div className="text-[10px] text-slate-500 font-mono">{r.id}</div>
                    </div>
                  </div>
                </td>
                <td className="py-3 px-3 text-xs text-slate-600">{t.name}</td>
                <td className="py-3 px-3 text-xs text-slate-600">
                  <div>{new Date(r.generatedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}</div>
                  <div className="text-[10px] text-slate-400">{new Date(r.generatedAt).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}</div>
                </td>
                <td className="py-3 px-3 text-xs text-slate-600">{r.generatedBy}</td>
                <td className="py-3 px-3 text-xs text-right tnum text-slate-600">{r.pages}</td>
                <td className="py-3 px-3 text-xs text-right tnum text-slate-600">{r.size}</td>
                <td className="py-3 px-3">
                  {r.status === 'ready' && <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />Ready</span>}
                  {r.status === 'generating' && <span className="inline-flex items-center gap-1.5 text-xs font-medium text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200"><span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />Generating…</span>}
                </td>
                <td className="py-3 px-5 text-right">
                  <div className="flex items-center justify-end gap-1">
                    <button onClick={() => showToast(`Opening ${r.name}`)} className="p-1.5 hover:bg-slate-100 rounded text-slate-600" title="View">
                      <RI.Eye size={14} />
                    </button>
                    <button onClick={() => showToast('Download started')} className="p-1.5 hover:bg-slate-100 rounded text-slate-600" title="Download">
                      <RI.Download size={14} />
                    </button>
                    <button onClick={() => showToast('Share link copied')} className="p-1.5 hover:bg-slate-100 rounded text-slate-600" title="Share">
                      <RI.Link size={14} />
                    </button>
                    <button onClick={() => showToast('Email sent')} className="p-1.5 hover:bg-slate-100 rounded text-slate-600" title="Email">
                      <RI.Mail size={14} />
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// ───────────────────────────────────────────────────────────────
// Scheduled reports
// ───────────────────────────────────────────────────────────────
function ScheduledReports({ showToast }) {
  const { SCHEDULED_REPORTS, REPORT_TYPES, ACCENT } = window.REPORTS_DATA;
  const typeById = Object.fromEntries(REPORT_TYPES.map(rt => [rt.id, rt]));

  return (
    <div className="space-y-4">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start gap-3">
        <RI.RefreshCw size={18} className="text-blue-700 mt-0.5 shrink-0" />
        <div className="flex-1">
          <div className="font-semibold text-slate-900 text-sm">Automated reports keep stakeholders informed</div>
          <div className="text-xs text-slate-600 mt-0.5">Scheduled reports generate and deliver automatically. Pause any schedule to stop future runs — past runs stay in "Recent reports".</div>
        </div>
        <button className="text-sm font-semibold text-blue-700 hover:text-blue-800 flex items-center gap-1.5 shrink-0">
          <RI.Plus size={13} /> New schedule
        </button>
      </div>

      <div className="space-y-2.5">
        {SCHEDULED_REPORTS.map((s) => {
          const t = typeById[s.type];
          const a = ACCENT[t.accent];
          const Icon = RI[t.icon];
          return (
            <div key={s.id} className={`bg-white border rounded-lg p-4 ${s.enabled ? 'border-slate-200' : 'border-slate-200 opacity-70'}`}>
              <div className="flex items-start gap-3">
                <div className={`w-10 h-10 rounded-md ${a.iconBg} text-white grid place-items-center shrink-0`}><Icon size={16} /></div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className="font-semibold text-slate-900">{s.name}</h4>
                    {s.enabled
                      ? <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">Active</span>
                      : <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">Paused</span>}
                    <span className="text-xs text-slate-500">·</span>
                    <span className="text-xs text-slate-500">{t.name}</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-3 text-xs">
                    <div>
                      <div className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold">Cadence</div>
                      <div className="text-slate-800 mt-0.5 flex items-center gap-1.5"><RI.Calendar size={11} className="text-slate-400" />{s.cadence}</div>
                    </div>
                    <div>
                      <div className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold">Next run</div>
                      <div className="text-slate-800 mt-0.5 flex items-center gap-1.5"><RI.Clock size={11} className="text-slate-400" />{new Date(s.nextRun).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</div>
                    </div>
                    <div>
                      <div className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold">Recipients</div>
                      <div className="text-slate-800 mt-0.5">{s.recipients}</div>
                    </div>
                  </div>
                  <div className="text-[11px] text-slate-500 mt-2.5">Last ran on {new Date(s.lastRun).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button onClick={() => showToast(s.enabled ? 'Schedule paused' : 'Schedule resumed')} className="p-1.5 hover:bg-slate-100 rounded text-slate-600" title={s.enabled ? 'Pause' : 'Resume'}>
                    {s.enabled
                      ? <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>
                      : <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75"><polygon points="5 3 19 12 5 21 5 3"/></svg>}
                  </button>
                  <button onClick={() => showToast('Running now…')} className="p-1.5 hover:bg-slate-100 rounded text-slate-600" title="Run now">
                    <RI.RefreshCw size={14} />
                  </button>
                  <button className="p-1.5 hover:bg-slate-100 rounded text-slate-600" title="Edit">
                    <RI.Edit size={14} />
                  </button>
                  <button onClick={() => showToast('Schedule deleted')} className="p-1.5 hover:bg-rose-50 hover:text-rose-700 rounded text-slate-500" title="Delete">
                    <RI.Trash size={14} />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);

