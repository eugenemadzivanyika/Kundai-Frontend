// Mock data — report types catalog, recent reports, scheduled reports, sample preview data
const { RI } = window;

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
