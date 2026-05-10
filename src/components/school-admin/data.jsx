// School portal mock data — Goromonzi High School (Starter tier, on trial, 480 students)
// Form 1–6 Zimbabwean structure: Form 1–4 (O-level), Form 5–6 (A-level), with streams (A/B/C…)

const FIRST_NAMES_M = ['Tatenda','Tinashe','Tafadzwa','Tendai','Munashe','Tinotenda','Anesu','Farai','Kudakwashe','Takudzwa','Nyasha','Simbarashe','Tanaka','Tawanda','Panashe','Rutendo','Brighton','Kelvin','Blessing','Tapiwa','Garikai','Munyaradzi','Tongai','Wisdom','Memory','Last','Prosper','Trust','Honest'];
const FIRST_NAMES_F = ['Tariro','Rumbidzai','Rutendo','Chiedza','Vimbai','Nyasha','Tendai','Ruvimbo','Anesu','Tatenda','Munashe','Tafadzwa','Chipo','Fadzai','Rufaro','Tsitsi','Sekai','Memory','Patience','Faith','Gift','Precious','Sharon','Marvelous','Charity'];
const SURNAMES = ['Moyo','Ncube','Sibanda','Dube','Chiweshe','Mukamuri','Madondo','Chigumba','Nyathi','Mhondoro','Gumbo','Mukoma','Chivasa','Mawere','Chitepo','Mandaza','Mutasa','Murenga','Chigwedere','Mhlanga','Khumalo','Mpofu','Chinodya','Mafuta','Zvogbo','Chinamasa','Chimbetu','Marechera','Mungoshi','Vera','Hove','Charamba','Dangarembga','Mlambo','Tshuma','Phiri','Banda','Chirwa','Zulu'];

const seed = (s) => { let x = s; return () => { x = (x * 16807) % 2147483647; return x / 2147483647; }; };
const R = seed(42);
const pick = (arr) => arr[Math.floor(R() * arr.length)];
const rand = (min, max) => Math.floor(R() * (max - min + 1)) + min;
const makeName = () => `${pick(R() > 0.5 ? FIRST_NAMES_M : FIRST_NAMES_F)} ${pick(SURNAMES)}`;
const makeFemaleName = () => `${pick(FIRST_NAMES_F)} ${pick(SURNAMES)}`;
const makeMaleName   = () => `${pick(FIRST_NAMES_M)} ${pick(SURNAMES)}`;

// School identity
const SCHOOL = {
  name: 'Goromonzi High School',
  shortName: 'Goromonzi High',
  motto: 'Knowledge · Service · Integrity',
  established: 1946,
  type: 'Boarding · Co-educational',
  location: 'Goromonzi, Mashonaland East',
  address: 'P.O. Box 12, Goromonzi, Zimbabwe',
  phone: '+263 270 245 100',
  email: 'admin@goromonzihigh.ac.zw',
  motto_short: 'Ruzivo · Basa · Kutendeseka',
  package: 'Starter',
  packageStatus: 'trial', // trial, active, suspended
  trialEndsIn: 11, // days
  studentLimit: 500,
  termName: 'Term 2 · 2026',
  termWeek: 7,
  termTotalWeeks: 13,
};

// Students — 480 total, distributed across Form 1–6, with streams
const STREAMS = ['A','B','C','D'];
const FORMS = [1, 2, 3, 4, 5, 6];
// Student count per form (more in lower forms)
const FORM_COUNTS = { 1: 110, 2: 100, 3: 96, 4: 88, 5: 48, 6: 38 }; // total 480

const STUDENTS = [];
let sId = 10001;
FORMS.forEach(form => {
  const total = FORM_COUNTS[form];
  const streamsForForm = form <= 4 ? STREAMS : ['A','B']; // A-level smaller
  const perStream = Math.ceil(total / streamsForForm.length);
  streamsForForm.forEach(stream => {
    const count = Math.min(perStream, total - (STUDENTS.filter(s => s.form === form).length));
    for (let i = 0; i < count && STUDENTS.filter(s => s.form === form).length < total; i++) {
      const isF = R() > 0.48;
      const name = isF ? makeFemaleName() : makeMaleName();
      STUDENTS.push({
        id: 'S' + sId++,
        name,
        gender: isF ? 'F' : 'M',
        form, stream,
        className: `Form ${form}${stream}`,
        age: form + 12 + (R() > 0.7 ? 1 : 0),
        active: R() > 0.04,                 // 4% inactive
        lastActive: rand(1, 60),            // days
        guardian: pick(SURNAMES) + ' family',
        guardianPhone: `+263 77${rand(1,9)} ${rand(100,999)} ${rand(100,999)}`,
        avatarTone: pick(['terracotta','forest','sky','gold','plum','clay']),
        // engagement
        assessmentsTaken: rand(form*3, form*8),
        avgScore: 50 + Math.floor(R() * 45),
        tutorSessions: rand(0, form*5),
      });
    }
  });
});

// Teachers — 28 staff across subjects
const SUBJECTS = ['Mathematics','English Language','Shona','Combined Science','Biology','Chemistry','Physics','History','Geography','Religious Studies','Computer Science','Accounts','Business Studies','Agriculture','Sports'];
const TEACHERS = [
  { id:'T01', name:'Mr. Tendai Mukamuri', salutation:'Mr.', subjects:['Mathematics','Combined Science'], classes:['Form 1A','Form 1B','Form 4A'], head:true, role:'Head of Mathematics', email:'tmukamuri@goromonzi.ac.zw', avatarTone:'forest', joined:'2014-02-01', signedIn:'2h ago' },
  { id:'T02', name:'Mrs. Chiedza Sibanda', salutation:'Mrs.', subjects:['English Language'], classes:['Form 2A','Form 2B','Form 5A','Form 6A'], head:true, role:'Head of Languages', email:'csibanda@goromonzi.ac.zw', avatarTone:'plum', joined:'2011-09-15', signedIn:'just now' },
  { id:'T03', name:'Mr. Farai Ncube', salutation:'Mr.', subjects:['Physics','Mathematics'], classes:['Form 5A','Form 6A','Form 4A'], head:false, role:'Senior Teacher', email:'fncube@goromonzi.ac.zw', avatarTone:'sky', joined:'2018-01-20', signedIn:'1h ago' },
  { id:'T04', name:'Ms. Rumbidzai Dube', salutation:'Ms.', subjects:['Biology','Chemistry'], classes:['Form 3A','Form 3B','Form 5A'], head:true, role:'Head of Sciences', email:'rdube@goromonzi.ac.zw', avatarTone:'forest', joined:'2016-05-04', signedIn:'30m ago' },
  { id:'T05', name:'Mr. Brighton Moyo', salutation:'Mr.', subjects:['History'], classes:['Form 1C','Form 2C','Form 4B'], head:false, role:'Teacher', email:'bmoyo@goromonzi.ac.zw', avatarTone:'terracotta', joined:'2019-09-01', signedIn:'4h ago' },
  { id:'T06', name:'Mrs. Tariro Mhondoro', salutation:'Mrs.', subjects:['Shona'], classes:['Form 1A','Form 1B','Form 1C','Form 1D','Form 2D'], head:true, role:'Head of Shona', email:'tmhondoro@goromonzi.ac.zw', avatarTone:'gold', joined:'2008-02-14', signedIn:'yesterday' },
  { id:'T07', name:'Mr. Tatenda Chiweshe', salutation:'Mr.', subjects:['Geography'], classes:['Form 3C','Form 4C','Form 5B'], head:false, role:'Teacher', email:'tchiweshe@goromonzi.ac.zw', avatarTone:'clay', joined:'2020-01-08', signedIn:'just now' },
  { id:'T08', name:'Ms. Nyasha Madondo', salutation:'Ms.', subjects:['Computer Science','Mathematics'], classes:['Form 4A','Form 5A','Form 6A'], head:true, role:'IT Coordinator', email:'nmadondo@goromonzi.ac.zw', avatarTone:'sky', joined:'2021-04-12', signedIn:'10m ago' },
  { id:'T09', name:'Mr. Kudakwashe Nyathi', salutation:'Mr.', subjects:['Accounts','Business Studies'], classes:['Form 3A','Form 3B','Form 6B'], head:false, role:'Teacher', email:'knyathi@goromonzi.ac.zw', avatarTone:'plum', joined:'2015-08-22', signedIn:'3h ago' },
  { id:'T10', name:'Mrs. Vimbai Mukoma', salutation:'Mrs.', subjects:['Religious Studies','English Language'], classes:['Form 1A','Form 1D','Form 2A'], head:false, role:'Teacher', email:'vmukoma@goromonzi.ac.zw', avatarTone:'gold', joined:'2017-02-11', signedIn:'1d ago' },
  { id:'T11', name:'Mr. Simba Chigumba', salutation:'Mr.', subjects:['Agriculture','Combined Science'], classes:['Form 2A','Form 2B','Form 3A'], head:true, role:'Head of Agriculture', email:'schigumba@goromonzi.ac.zw', avatarTone:'forest', joined:'2010-03-15', signedIn:'2h ago' },
  { id:'T12', name:'Ms. Rufaro Mawere', salutation:'Ms.', subjects:['English Language','Shona'], classes:['Form 3D','Form 4D'], head:false, role:'Teacher', email:'rmawere@goromonzi.ac.zw', avatarTone:'terracotta', joined:'2022-09-01', signedIn:'45m ago' },
  { id:'T13', name:'Mr. Tinashe Gumbo', salutation:'Mr.', subjects:['Mathematics'], classes:['Form 2A','Form 2C','Form 3D'], head:false, role:'Teacher', email:'tgumbo@goromonzi.ac.zw', avatarTone:'clay', joined:'2018-09-04', signedIn:'5h ago' },
  { id:'T14', name:'Mrs. Memory Phiri', salutation:'Mrs.', subjects:['Chemistry'], classes:['Form 4A','Form 4B','Form 6A'], head:false, role:'Senior Teacher', email:'mphiri@goromonzi.ac.zw', avatarTone:'sky', joined:'2016-08-12', signedIn:'just now' },
  { id:'T15', name:'Mr. Tafadzwa Mlambo', salutation:'Mr.', subjects:['Sports','Geography'], classes:['Form 1A','Form 1B','Form 1C','Form 1D'], head:false, role:'Sports Master', email:'tmlambo@goromonzi.ac.zw', avatarTone:'gold', joined:'2019-01-20', signedIn:'3d ago' },
  { id:'T16', name:'Ms. Faith Tshuma', salutation:'Ms.', subjects:['Biology'], classes:['Form 2D','Form 3C','Form 3D'], head:false, role:'Teacher', email:'ftshuma@goromonzi.ac.zw', avatarTone:'plum', joined:'2021-09-06', signedIn:'2h ago' },
];

// Classes — derived from teachers' assignments
const CLASSES = [];
FORMS.forEach(form => {
  const streamsForForm = form <= 4 ? STREAMS : ['A','B'];
  streamsForForm.forEach(stream => {
    const className = `Form ${form}${stream}`;
    const studentsInClass = STUDENTS.filter(s => s.form === form && s.stream === stream);
    const teachersInClass = TEACHERS.filter(t => t.classes.includes(className));
    const formTeacher = teachersInClass[0] || TEACHERS[Math.floor(R() * TEACHERS.length)];
    CLASSES.push({
      id: className.replace(/ /g, '-'),
      name: className,
      form, stream,
      level: form <= 4 ? 'O-Level' : 'A-Level',
      students: studentsInClass.length,
      maleCount: studentsInClass.filter(s => s.gender === 'M').length,
      femaleCount: studentsInClass.filter(s => s.gender === 'F').length,
      formTeacher: formTeacher.name,
      formTeacherId: formTeacher.id,
      formTeacherTone: formTeacher.avatarTone,
      teacherCount: teachersInClass.length || rand(5, 9),
      avgAttendance: 88 + Math.floor(R() * 11),
      avgScore: 58 + Math.floor(R() * 30),
      assessmentsThisTerm: rand(8, 22),
      room: pick(['Block A','Block B','Block C','Block D','Science Lab','Computer Lab']) + ' Rm ' + rand(1, 12),
    });
  });
});

// Recent assessments
const ASSESSMENTS = [
  { id:'A1', title:'Algebra II — Quadratic Equations', subject:'Mathematics', class:'Form 4A', teacher:'Mr. Tendai Mukamuri', date:'today', dueIn:'today', graded:32, ungraded:6, avgScore:67, status:'in-progress', mode:'AI-assisted', total:38 },
  { id:'A2', title:'English Comprehension — Things Fall Apart', subject:'English Language', class:'Form 5A', teacher:'Mrs. Chiedza Sibanda', date:'yesterday', dueIn:'graded', graded:24, ungraded:0, avgScore:71, status:'complete', mode:'AI + human review', total:24 },
  { id:'A3', title:'Mole Concept — Lab Report', subject:'Chemistry', class:'Form 4A', teacher:'Mrs. Memory Phiri', date:'2d ago', dueIn:'graded', graded:38, ungraded:0, avgScore:64, status:'complete', mode:'Human-only', total:38 },
  { id:'A4', title:'Photosynthesis — Term Test', subject:'Biology', class:'Form 3A', teacher:'Ms. Rumbidzai Dube', date:'3d ago', dueIn:'graded', graded:26, ungraded:2, avgScore:73, status:'complete', mode:'AI-assisted', total:28 },
  { id:'A5', title:'Shona — Comprehension', subject:'Shona', class:'Form 1A', teacher:'Mrs. Tariro Mhondoro', date:'today', dueIn:'2 days', graded:0, ungraded:30, avgScore:0, status:'pending', mode:'AI-assisted', total:30 },
  { id:'A6', title:'Newton\'s Laws — Problem Set', subject:'Physics', class:'Form 5A', teacher:'Mr. Farai Ncube', date:'4d ago', dueIn:'graded', graded:22, ungraded:0, avgScore:58, status:'complete', mode:'AI-assisted', total:22 },
  { id:'A7', title:'World War II — Essay', subject:'History', class:'Form 4B', teacher:'Mr. Brighton Moyo', date:'5d ago', dueIn:'graded', graded:23, ungraded:1, avgScore:69, status:'complete', mode:'Human-only', total:24 },
  { id:'A8', title:'Programming Logic — Practical', subject:'Computer Science', class:'Form 5A', teacher:'Ms. Nyasha Madondo', date:'1w ago', dueIn:'graded', graded:18, ungraded:0, avgScore:74, status:'complete', mode:'AI + human review', total:18 },
];

// Term activity series (week-by-week for current term)
const TERM_WEEKS = Array.from({ length: 13 }, (_, i) => {
  const w = i + 1;
  const past = w <= SCHOOL.termWeek;
  return {
    week: 'W' + w,
    weekNum: w,
    assessments: past ? rand(8, 24) + (w === 4 || w === 8 ? 12 : 0) : 0,
    aiSessions: past ? rand(80, 180) + (w === 5 ? 80 : 0) : 0,
    activeStudents: past ? rand(380, 470) : 0,
  };
});

// Subject performance breakdown
const SUBJECT_PERFORMANCE = [
  { subject:'Mathematics',     avgScore:62, trend:+2.3, students:480, color:'forest' },
  { subject:'English Language',avgScore:68, trend:+1.1, students:480, color:'plum' },
  { subject:'Shona',           avgScore:74, trend:+0.4, students:480, color:'gold' },
  { subject:'Combined Science',avgScore:65, trend:+3.1, students:206, color:'sky' },
  { subject:'Biology',         avgScore:71, trend:-0.8, students:184, color:'forest' },
  { subject:'Chemistry',       avgScore:58, trend:+1.7, students:142, color:'terracotta' },
  { subject:'Physics',         avgScore:54, trend:-2.4, students:108, color:'sky' },
  { subject:'History',         avgScore:69, trend:+0.9, students:172, color:'clay' },
  { subject:'Geography',       avgScore:72, trend:+2.1, students:198, color:'forest' },
  { subject:'Computer Science',avgScore:76, trend:+4.2, students:88,  color:'sky' },
];

// Announcements — sent by school to parents
const ANNOUNCEMENTS = [
  { id:'AN1', title:'Mid-term break — 8–12 June 2026', body:'Boarders to depart by 13:00 on Friday 7 June. Day scholars resume Monday 15 June.', audience:'All parents · Forms 1–6', author:'Mrs. R. Chigumba (Headmistress)', sent:'2 days ago', sentDate:'2 Jun 2026', recipients:478, opens:312, status:'sent' },
  { id:'AN2', title:'Form 4 Mock Exam Schedule released', body:'Mock exams begin Monday 22 June. Detailed timetable attached. Please ensure your child has all required stationery.', audience:'Form 4 parents', author:'Mr. T. Mukamuri (HoD Mathematics)', sent:'5 days ago', sentDate:'30 May 2026', recipients:88, opens:84, status:'sent' },
  { id:'AN3', title:'School fees — Term 2 reminder', body:'Term 2 fees are due by Friday 12 June. Bursar available Mon–Fri 08:00–16:00.', audience:'All parents · Forms 1–6', author:'Mrs. T. Mhondoro (Bursar)', sent:'1 week ago', sentDate:'28 May 2026', recipients:478, opens:401, status:'sent' },
  { id:'AN4', title:'Sports Day — 21 June', body:'Annual inter-house athletics. Parents welcome. Tea served from 14:00.', audience:'All parents', author:'Mr. T. Mlambo (Sports Master)', sent:'1 week ago', sentDate:'27 May 2026', recipients:478, opens:289, status:'sent' },
  { id:'AN5', title:'Visiting Day — Sunday 9 June', body:'Boarders may receive visitors from 10:00 to 16:00. Please sign in at the gate.', audience:'Boarders\' parents', author:'Mrs. R. Chigumba (Headmistress)', sent:'2 weeks ago', sentDate:'20 May 2026', recipients:312, opens:298, status:'sent' },
];

// Billing — school's view of their subscription
const BILLING = {
  package: 'Starter',
  status: 'trial',
  trialEndsIn: 11,
  nextInvoiceAmount: 384, // 480 students × $0.80
  nextInvoiceDate: '16 June 2026',
  studentLimit: 500,
  studentsUsed: 480,
  termPaid: 0,
  termDue: 384,
  // Recommended upgrade (Classroom)
  recommendedUpgrade: { name: 'Classroom', monthly: 312, perStudent: 0.65, savings: 72, features: ['Unlimited classes', 'AI tutor for all students', 'OCR for handwritten submissions', 'Parent portal access'] },
  invoices: [
    { id:'INV-2026-0247', term:'Term 2 · 2026', amount:384, due:'16 Jun 2026', status:'pending', issued:'2 Jun 2026' },
    { id:'INV-2026-0098', term:'Term 1 · 2026',  amount:0,   due:'15 Jan 2026', status:'trial-credit', issued:'10 Jan 2026' },
  ],
};

window.SCHOOL_DATA = {
  SCHOOL, STUDENTS, TEACHERS, CLASSES, ASSESSMENTS,
  TERM_WEEKS, SUBJECT_PERFORMANCE, ANNOUNCEMENTS, BILLING,
};
