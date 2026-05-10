// Realistic Zimbabwean schools dataset for the SysAdmin prototype.
// Currency: USD (standard for regional EdTech pricing in ZW).

const PACKAGES = [
  {
    id: 'pkg_starter', name: 'Starter', tagline: 'Small primary schools, single-stream',
    type: 'prepaid', studentLimit: 250, pricePerStudent: 0.80, billingCycle: 'termly',
    features: ['AI tutor (limited)', 'Up to 250 students', 'Standard support', 'WhatsApp channel'],
    highlight: false, schoolsOn: 38,
  },
  {
    id: 'pkg_classroom', name: 'Classroom', tagline: 'Most popular for primary & lower secondary',
    type: 'prepaid', studentLimit: 750, pricePerStudent: 0.65, billingCycle: 'termly',
    features: ['Full AI tutor & coach', 'Automated marking (digital + handwritten)', 'Term forecasts', 'Priority support', 'WhatsApp + SMS'],
    highlight: true, schoolsOn: 62,
  },
  {
    id: 'pkg_campus', name: 'Campus', tagline: 'High-density secondary schools',
    type: 'prepaid', studentLimit: 2000, pricePerStudent: 0.55, billingCycle: 'termly',
    features: ['Everything in Classroom', 'Up to 2,000 students', 'Custom curriculum mapping', 'Dedicated success manager', 'Resource library'],
    highlight: false, schoolsOn: 24,
  },
  {
    id: 'pkg_district', name: 'District', tagline: 'Custom for groups & large institutions',
    type: 'custom', studentLimit: null, pricePerStudent: 0.45, billingCycle: 'termly',
    features: ['Volume pricing from $0.45/student', 'Multi-school dashboard', 'On-prem option', 'SLA & dedicated SM', 'Custom integrations'],
    highlight: false, schoolsOn: 4,
  },
];

// Helper to build subscription history
const sub = (pkg, status, start, end, seats, paid, due, ref) => ({
  package: pkg, status, startDate: start, endDate: end,
  studentLimit: seats, amountPaid: paid, amountDue: due, paymentRef: ref,
});

const SCHOOLS = [
  {
    id: 's_prince_edward', name: 'Prince Edward School',
    type: 'Boys Boarding · Secondary', location: 'Harare',
    email: 'admin@princeedward.ac.zw', phone: '+263 242 700 244',
    address: 'Josiah Tongogara Ave, Harare',
    registration: 'MOEZ-HRE-0042', logoTone: 'indigo',
    primaryContact: { name: 'Mr. T. Chigumira', role: 'Bursar', email: 't.chigumira@princeedward.ac.zw', phone: '+263 772 411 088' },
    onboarded: '2024-08-12', status: 'active', health: 'healthy',
    pkg: 'Campus', seatsUsed: 1742, seatsTotal: 2000, mrr: 1100,
    renewsIn: 38,
    users: { admins: 6, teachers: 84, students: 1742 },
    aiUsage: { gradedThisTerm: 12840, tutorSessions: 9420, ocrJobs: 4180 },
    subs: [
      sub('Campus', 'active',    '2026-01-09', '2026-04-30', 2000, 1100, 0,    'PYN-2026-PE-T1'),
      sub('Campus', 'expired',   '2025-09-05', '2025-12-15', 2000, 1100, 0,    'PYN-2025-PE-T3'),
      sub('Campus', 'expired',   '2025-05-04', '2025-08-22', 2000, 1100, 0,    'PYN-2025-PE-T2'),
      sub('Classroom','expired', '2024-09-09', '2024-12-13', 750,  487,  0,    'PYN-2024-PE-T3'),
    ],
  },
  {
    id: 's_arundel', name: 'Arundel School',
    type: 'Girls Day · Secondary', location: 'Mount Pleasant, Harare',
    email: 'office@arundelschool.ac.zw', phone: '+263 242 304 643',
    address: 'Quinnington Road, Mount Pleasant',
    registration: 'MOEZ-HRE-0011', logoTone: 'rose',
    primaryContact: { name: 'Mrs. P. Murombedzi', role: 'Headmistress PA', email: 'pa@arundelschool.ac.zw', phone: '+263 778 220 134' },
    onboarded: '2024-05-20', status: 'active', health: 'healthy',
    pkg: 'Classroom', seatsUsed: 612, seatsTotal: 750, mrr: 487,
    renewsIn: 51,
    users: { admins: 4, teachers: 41, students: 612 },
    aiUsage: { gradedThisTerm: 6280, tutorSessions: 5410, ocrJobs: 1890 },
    subs: [
      sub('Classroom', 'active',  '2026-01-13', '2026-05-04', 750, 487, 0, 'ECO-2026-AR-T1'),
      sub('Classroom', 'expired', '2025-09-08', '2025-12-12', 750, 487, 0, 'ECO-2025-AR-T3'),
      sub('Classroom', 'expired', '2025-05-05', '2025-08-15', 750, 487, 0, 'ECO-2025-AR-T2'),
      sub('Starter',   'expired', '2024-05-20', '2024-08-30', 250, 200, 0, 'ECO-2024-AR-T2'),
    ],
  },
  {
    id: 's_stgeorges', name: "St George's College",
    type: 'Boys Day · Secondary', location: 'Avondale, Harare',
    email: 'reception@stgeorges.co.zw', phone: '+263 242 333 233',
    address: '99 Josiah Tongogara Ave, Avondale',
    registration: 'MOEZ-HRE-0008', logoTone: 'sky',
    primaryContact: { name: 'Mr. F. Madanha', role: 'IT Coordinator', email: 'it@stgeorges.co.zw', phone: '+263 712 644 099' },
    onboarded: '2024-04-15', status: 'active', health: 'attention',
    pkg: 'Campus', seatsUsed: 1860, seatsTotal: 2000, mrr: 1100,
    renewsIn: 4,
    users: { admins: 5, teachers: 76, students: 1860 },
    aiUsage: { gradedThisTerm: 11200, tutorSessions: 8640, ocrJobs: 3510 },
    subs: [
      sub('Campus', 'active',  '2026-01-09', '2026-04-29', 2000, 1100, 0,    'STG-2026-T1'),
      sub('Campus', 'expired', '2025-09-04', '2025-12-12', 2000, 1100, 0,    'STG-2025-T3'),
      sub('Campus', 'expired', '2025-05-05', '2025-08-21', 2000, 1100, 0,    'STG-2025-T2'),
      sub('Campus', 'expired', '2025-01-13', '2025-04-25', 2000, 1100, 0,    'STG-2025-T1'),
    ],
  },
  {
    id: 's_cbc', name: "Christian Brothers College",
    type: 'Boys Day · Secondary', location: 'Bulawayo',
    email: 'info@cbcbulawayo.ac.zw', phone: '+263 292 280 411',
    address: 'Cecil Avenue, Hillside, Bulawayo',
    registration: 'MOEZ-BYO-0019', logoTone: 'amber',
    primaryContact: { name: 'Br. M. Ncube', role: 'Headmaster', email: 'head@cbcbulawayo.ac.zw', phone: '+263 772 333 567' },
    onboarded: '2024-09-02', status: 'active', health: 'attention',
    pkg: 'Classroom', seatsUsed: 738, seatsTotal: 750, mrr: 487,
    renewsIn: 12,
    users: { admins: 3, teachers: 38, students: 738 },
    aiUsage: { gradedThisTerm: 5420, tutorSessions: 4180, ocrJobs: 1240 },
    subs: [
      sub('Classroom', 'active',  '2026-01-12', '2026-05-04', 750, 487, 0, 'NMB-2026-CBC-T1'),
      sub('Classroom', 'expired', '2025-09-09', '2025-12-13', 750, 487, 0, 'NMB-2025-CBC-T3'),
    ],
  },
  {
    id: 's_chisipite', name: 'Chisipite Senior School',
    type: 'Girls Day · Secondary', location: 'Chisipite, Harare',
    email: 'admin@chisipite.ac.zw', phone: '+263 242 495 071',
    address: '6 Hindhead Avenue, Chisipite',
    registration: 'MOEZ-HRE-0014', logoTone: 'violet',
    primaryContact: { name: 'Ms. R. Kanengoni', role: 'Deputy Head', email: 'dep@chisipite.ac.zw', phone: '+263 772 901 220' },
    onboarded: '2025-01-13', status: 'active', health: 'healthy',
    pkg: 'Classroom', seatsUsed: 540, seatsTotal: 750, mrr: 487,
    renewsIn: 60,
    users: { admins: 4, teachers: 36, students: 540 },
    aiUsage: { gradedThisTerm: 5180, tutorSessions: 4810, ocrJobs: 1420 },
    subs: [
      sub('Classroom', 'active',  '2026-01-13', '2026-05-08', 750, 487, 0, 'STD-2026-CHS-T1'),
      sub('Classroom', 'expired', '2025-09-08', '2025-12-13', 750, 487, 0, 'STD-2025-CHS-T3'),
      sub('Classroom', 'expired', '2025-05-05', '2025-08-15', 750, 487, 0, 'STD-2025-CHS-T2'),
      sub('Starter',   'expired', '2025-01-13', '2025-04-30', 250, 200, 0, 'STD-2025-CHS-T1'),
    ],
  },
  {
    id: 's_petra', name: 'Petra College',
    type: 'Co-ed Day · Secondary', location: 'Bulawayo',
    email: 'admin@petracollege.ac.zw', phone: '+263 292 246 533',
    address: 'Cecil Avenue, Bulawayo',
    registration: 'MOEZ-BYO-0033', logoTone: 'emerald',
    primaryContact: { name: 'Mr. K. Ndlovu', role: 'Bursar', email: 'bursar@petracollege.ac.zw', phone: '+263 772 488 110' },
    onboarded: '2024-08-22', status: 'trial', health: 'healthy',
    pkg: 'Classroom', seatsUsed: 480, seatsTotal: 750, mrr: 0,
    renewsIn: 7,
    users: { admins: 3, teachers: 32, students: 480 },
    aiUsage: { gradedThisTerm: 3210, tutorSessions: 2680, ocrJobs: 940 },
    subs: [
      sub('Classroom', 'trial', '2026-04-08', '2026-05-08', 750, 0, 487, '— pending —'),
    ],
  },
  {
    id: 's_lomagundi', name: 'Lomagundi College',
    type: 'Co-ed Boarding · Secondary', location: 'Chinhoyi',
    email: 'office@lomagundicollege.com', phone: '+263 67 212 2351',
    address: 'Lomagundi Estate, Chinhoyi',
    registration: 'MOEZ-MAW-0007', logoTone: 'sky',
    primaryContact: { name: 'Mr. D. Hove', role: 'Vice Principal', email: 'vp@lomagundicollege.com', phone: '+263 772 660 044' },
    onboarded: '2024-02-14', status: 'active', health: 'healthy',
    pkg: 'Campus', seatsUsed: 1310, seatsTotal: 2000, mrr: 1100,
    renewsIn: 22,
    users: { admins: 5, teachers: 62, students: 1310 },
    aiUsage: { gradedThisTerm: 9410, tutorSessions: 7340, ocrJobs: 2880 },
    subs: [
      sub('Campus', 'active', '2026-01-19', '2026-05-15', 2000, 1100, 0, 'CBZ-2026-LOM-T1'),
      sub('Campus', 'expired','2025-09-15','2025-12-13', 2000, 1100, 0, 'CBZ-2025-LOM-T3'),
      sub('Campus', 'expired','2025-05-05','2025-08-22', 2000, 1100, 0, 'CBZ-2025-LOM-T2'),
    ],
  },
  {
    id: 's_falconcollege', name: 'Falcon College',
    type: 'Boys Boarding · Secondary', location: 'Esigodini',
    email: 'reception@falconcollege.com', phone: '+263 284 8443',
    address: 'Esigodini, Matabeleland South',
    registration: 'MOEZ-MTS-0003', logoTone: 'rose',
    primaryContact: { name: 'Mrs. L. Sibanda', role: 'Registrar', email: 'reg@falconcollege.com', phone: '+263 772 778 211' },
    onboarded: '2024-03-04', status: 'suspended', health: 'critical',
    pkg: 'Classroom', seatsUsed: 0, seatsTotal: 750, mrr: 0,
    renewsIn: -18,
    users: { admins: 2, teachers: 0, students: 0 },
    aiUsage: { gradedThisTerm: 0, tutorSessions: 0, ocrJobs: 0 },
    subs: [
      sub('Classroom','suspended','2025-09-06','2025-12-15',750,0,487,'— overdue —'),
      sub('Classroom','expired',  '2025-05-05','2025-08-22',750,487,0,'CBZ-2025-FAL-T2'),
    ],
  },
  {
    id: 's_dominican', name: 'Dominican Convent High',
    type: 'Girls Day · Secondary', location: 'Harare',
    email: 'office@dchharare.ac.zw', phone: '+263 242 707 851',
    address: 'Fourth Street, Harare',
    registration: 'MOEZ-HRE-0029', logoTone: 'violet',
    primaryContact: { name: 'Sr. M. Mhuri', role: 'Headmistress', email: 'head@dchharare.ac.zw', phone: '+263 712 119 044' },
    onboarded: '2025-09-04', status: 'active', health: 'healthy',
    pkg: 'Classroom', seatsUsed: 411, seatsTotal: 750, mrr: 487,
    renewsIn: 33,
    users: { admins: 3, teachers: 28, students: 411 },
    aiUsage: { gradedThisTerm: 3870, tutorSessions: 3120, ocrJobs: 980 },
    subs: [
      sub('Classroom', 'active', '2026-01-13','2026-04-30', 750, 487, 0, 'ECO-2026-DCH-T1'),
      sub('Classroom', 'expired','2025-09-04','2025-12-12', 750, 487, 0, 'ECO-2025-DCH-T3'),
    ],
  },
  {
    id: 's_marist', name: "Marist Brothers Secondary",
    type: 'Co-ed Day · Secondary', location: 'Mutare',
    email: 'admin@maristmutare.ac.zw', phone: '+263 20 64 211',
    address: 'Aerodrome Road, Mutare',
    registration: 'MOEZ-MAN-0011', logoTone: 'amber',
    primaryContact: { name: 'Br. P. Chiyangwa', role: 'Principal', email: 'principal@maristmutare.ac.zw', phone: '+263 772 088 433' },
    onboarded: '2025-04-29', status: 'active', health: 'healthy',
    pkg: 'Starter', seatsUsed: 198, seatsTotal: 250, mrr: 200,
    renewsIn: 14,
    users: { admins: 2, teachers: 18, students: 198 },
    aiUsage: { gradedThisTerm: 1610, tutorSessions: 1320, ocrJobs: 410 },
    subs: [
      sub('Starter', 'active', '2026-01-19','2026-04-30', 250, 200, 0, 'CBZ-2026-MAR-T1'),
      sub('Starter', 'expired','2025-09-08','2025-12-13', 250, 200, 0, 'CBZ-2025-MAR-T3'),
      sub('Starter', 'expired','2025-04-29','2025-08-15', 250, 200, 0, 'CBZ-2025-MAR-T2'),
    ],
  },
  {
    id: 's_hellenic', name: 'Hellenic Academy',
    type: 'Co-ed Day · Secondary', location: 'Borrowdale, Harare',
    email: 'enquiries@hellenic.ac.zw', phone: '+263 242 870 011',
    address: 'Borrowdale Road, Harare',
    registration: 'MOEZ-HRE-0061', logoTone: 'sky',
    primaryContact: { name: 'Mr. A. Papadopoulos', role: 'Bursar', email: 'bursar@hellenic.ac.zw', phone: '+263 772 880 192' },
    onboarded: '2025-08-18', status: 'active', health: 'attention',
    pkg: 'Classroom', seatsUsed: 720, seatsTotal: 750, mrr: 487,
    renewsIn: 9,
    users: { admins: 3, teachers: 39, students: 720 },
    aiUsage: { gradedThisTerm: 6610, tutorSessions: 5210, ocrJobs: 1820 },
    subs: [
      sub('Classroom','active', '2026-01-13','2026-04-30', 750, 487, 0, 'STD-2026-HEL-T1'),
      sub('Classroom','expired','2025-08-18','2025-12-12', 750, 487, 0, 'STD-2025-HEL-T3'),
    ],
  },
  {
    id: 's_eaglesvale', name: "Eaglesvale High School",
    type: 'Co-ed Day · Secondary', location: 'Hatfield, Harare',
    email: 'admin@eaglesvale.ac.zw', phone: '+263 242 570 111',
    address: 'Hatfield, Harare',
    registration: 'MOEZ-HRE-0090', logoTone: 'emerald',
    primaryContact: { name: 'Mrs. T. Mapfumo', role: 'Headmistress', email: 'head@eaglesvale.ac.zw', phone: '+263 772 311 442' },
    onboarded: '2026-04-22', status: 'trial', health: 'healthy',
    pkg: 'Classroom', seatsUsed: 86, seatsTotal: 750, mrr: 0,
    renewsIn: 23,
    users: { admins: 2, teachers: 12, students: 86 },
    aiUsage: { gradedThisTerm: 280, tutorSessions: 410, ocrJobs: 88 },
    subs: [ sub('Classroom','trial','2026-04-22','2026-05-22',750,0,487,'— pending —') ],
  },
];

// MRR last 12 months (USD)
const MRR_SERIES = [
  { m: 'May ’25', mrr: 4280 },
  { m: 'Jun ’25', mrr: 4280 },
  { m: 'Jul ’25', mrr: 4767 },
  { m: 'Aug ’25', mrr: 5254 },
  { m: 'Sep ’25', mrr: 6541 },
  { m: 'Oct ’25', mrr: 6541 },
  { m: 'Nov ’25', mrr: 7028 },
  { m: 'Dec ’25', mrr: 7028 },
  { m: 'Jan ’26', mrr: 8128 },
  { m: 'Feb ’26', mrr: 8615 },
  { m: 'Mar ’26', mrr: 9102 },
  { m: 'Apr ’26', mrr: 9589 },
];

// Status mix counts (active, trial, suspended, expired)
const STATUS_MIX = { active: 96, trial: 11, suspended: 4, expired: 17 };

// System health
const SYSTEM_HEALTH = [
  { name: 'API Server',          status: 'operational', uptime: 99.97, p95: '142 ms' },
  { name: 'AI Tutor (Gemini)',   status: 'operational', uptime: 99.84, p95: '1.8 s' },
  { name: 'OCR Service',         status: 'degraded',    uptime: 98.20, p95: '3.4 s', note: '3 jobs queued > 5min' },
  { name: 'BKT / Knowledge',     status: 'operational', uptime: 99.92, p95: '210 ms' },
  { name: 'WhatsApp Channel',    status: 'operational', uptime: 99.71, p95: '480 ms' },
  { name: 'SMS Channel',         status: 'maintenance', uptime: 96.40, p95: '—',     note: 'Scheduled maintenance' },
];

// Onboarding pipeline
const PIPELINE = [
  { stage: 'Lead',     count: 14, color: 'slate' },
  { stage: 'Demoed',   count:  9, color: 'sky' },
  { stage: 'Trialing', count: 11, color: 'amber' },
  { stage: 'Won',      count:  6, color: 'emerald' },
];

// Recent payments / subscriptions for Subscriptions page
const RECENT_PAYMENTS = [
  { id: 'PYM-3081', school: 'Prince Edward School', amount: 1100, method: 'Paynow Direct', status: 'received', date: '2026-04-29', ref: 'PYN-2026-PE-T1' },
  { id: 'PYM-3080', school: 'Lomagundi College',    amount: 1100, method: 'CBZ Wire',      status: 'received', date: '2026-04-28', ref: 'CBZ-2026-LOM-T1' },
  { id: 'PYM-3079', school: 'Hellenic Academy',     amount:  487, method: 'Stanbic Wire',  status: 'received', date: '2026-04-27', ref: 'STD-2026-HEL-T1' },
  { id: 'PYM-3078', school: "St George's College",  amount: 1100, method: 'Stanbic Wire',  status: 'pending',  date: '2026-04-26', ref: 'STG-2026-T1' },
  { id: 'PYM-3077', school: 'Christian Brothers College', amount: 487, method: 'NMB Wire', status: 'received', date: '2026-04-21', ref: 'NMB-2026-CBC-T1' },
  { id: 'PYM-3076', school: 'Falcon College',       amount:  487, method: 'CBZ Wire',      status: 'overdue',  date: '2026-04-15', ref: '— overdue —' },
  { id: 'PYM-3075', school: 'Marist Brothers Secondary', amount: 200, method: 'EcoCash',   status: 'received', date: '2026-04-14', ref: 'CBZ-2026-MAR-T1' },
  { id: 'PYM-3074', school: 'Arundel School',       amount:  487, method: 'EcoCash',       status: 'received', date: '2026-04-12', ref: 'ECO-2026-AR-T1' },
];

window.KUNDAI_DATA = { PACKAGES, SCHOOLS, MRR_SERIES, STATUS_MIX, SYSTEM_HEALTH, PIPELINE, RECENT_PAYMENTS };
