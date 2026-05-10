// Mock data — Mathematics, Form 4, Goromonzi High School
// Teacher: Mr. T. Chigumba teaches Form 4 A, 4 B, 4 C (3 streams)

const SKILLS = [
  { id: 'alg-quad',   code: 'ALG-1', name: 'Quadratic equations',         topic: 'Algebra',    weight: 0.85, paperRef: 'P1 Q3,7' },
  { id: 'alg-sim',    code: 'ALG-2', name: 'Simultaneous equations',      topic: 'Algebra',    weight: 0.75, paperRef: 'P1 Q4' },
  { id: 'alg-poly',   code: 'ALG-3', name: 'Polynomials & factor theorem',topic: 'Algebra',    weight: 0.70, paperRef: 'P2 Q5' },
  { id: 'geo-circ',   code: 'GEO-1', name: 'Circle theorems',             topic: 'Geometry',   weight: 0.80, paperRef: 'P2 Q8' },
  { id: 'geo-trig',   code: 'GEO-2', name: 'Sine & cosine rules',         topic: 'Geometry',   weight: 0.90, paperRef: 'P2 Q6,9' },
  { id: 'geo-mens',   code: 'GEO-3', name: 'Mensuration (3D)',            topic: 'Geometry',   weight: 0.65, paperRef: 'P1 Q11' },
  { id: 'stat-prob',  code: 'STA-1', name: 'Probability',                 topic: 'Statistics', weight: 0.85, paperRef: 'P1 Q9' },
  { id: 'stat-cumf',  code: 'STA-2', name: 'Cumulative frequency',        topic: 'Statistics', weight: 0.70, paperRef: 'P2 Q4' },
  { id: 'cal-diff',   code: 'CAL-1', name: 'Differentiation (basics)',    topic: 'Calculus',   weight: 0.95, paperRef: 'P2 Q10' },
  { id: 'vec-ops',    code: 'VEC-1', name: 'Vectors & operations',        topic: 'Vectors',    weight: 0.60, paperRef: 'P1 Q12' },
];

const TOPICS = ['Algebra', 'Geometry', 'Statistics', 'Calculus', 'Vectors'];
const TOPIC_TONES = { Algebra: '#b45309', Geometry: '#0e7490', Statistics: '#7c2d12', Calculus: '#5b21b6', Vectors: '#166534' };

const FIRST_NAMES = ['Tinashe','Rumbidzai','Tatenda','Chiedza','Farai','Kudzai','Anesu','Munashe','Tendai','Rutendo','Tafadzwa','Vimbai','Simba','Nyasha','Tapiwa','Panashe','Ropafadzo','Tanaka','Ngonidzashe','Tariro','Takudzwa','Ruvarashe','Tinotenda','Mufaro','Nokutenda','Yeukai','Garikai','Memory','Privilege','Blessing','Hazvinei','Mukudzei'];
const LAST_NAMES = ['Moyo','Ncube','Sibanda','Dube','Nyathi','Mahlangu','Chigumba','Mutasa','Marufu','Madzimure','Chitofu','Gondo','Manyika','Hove','Mukamuri','Zhou','Chikukwa','Mawere','Kamba','Sithole','Mufandaedza','Banda','Murenga','Gwatidzo','Chirinda','Pamhirwa','Mhondiwa','Tafara','Chakanyuka','Magaisa','Goredema','Murape'];

// Seeded RNG so values are deterministic
let SEED = 42;
const rand = () => { SEED = (SEED * 9301 + 49297) % 233280; return SEED / 233280; };
const pick = (arr) => arr[Math.floor(rand() * arr.length)];
const randn = () => { let u = 0, v = 0; while (u === 0) u = rand(); while (v === 0) v = rand(); return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v); };
const clamp = (x, lo=0, hi=1) => Math.max(lo, Math.min(hi, x));

// Build students per class
const buildStudents = (classId, className, count, abilityCenter) => {
  const used = new Set();
  return Array.from({ length: count }, (_, i) => {
    let first, last, fullName;
    do { first = pick(FIRST_NAMES); last = pick(LAST_NAMES); fullName = `${first} ${last}`; } while (used.has(fullName));
    used.add(fullName);

    // Each student has an underlying "ability" 0-1 around class center
    const ability = clamp(abilityCenter + randn() * 0.18, 0.15, 0.98);

    // Mastery per skill = ability +/- skill-specific noise, weighted by skill difficulty
    const masteries = {};
    const trend = {}; // delta over last 4 weeks
    SKILLS.forEach(s => {
      // Topic affinity — students randomly stronger in specific topics
      const topicNoise = randn() * 0.12;
      const m = clamp(ability + topicNoise - (1 - s.weight) * 0.15 + randn() * 0.08, 0.05, 0.99);
      masteries[s.id] = +m.toFixed(2);
      trend[s.id] = +((randn() * 0.04) + (ability > 0.55 ? 0.015 : -0.005)).toFixed(3);
    });

    const overall = +(Object.values(masteries).reduce((a,b)=>a+b,0) / SKILLS.length).toFixed(2);
    const submissions = Math.floor(8 + rand() * 14);
    const onTime = Math.round((0.6 + rand() * 0.4) * submissions);
    const lastActiveDays = Math.floor(rand() * 14);
    const avgScore = clamp(ability * 100 + randn() * 8, 12, 98);

    // Flag: at-risk if overall < 0.45 OR negative trend on 3+ skills
    const decliningSkills = Object.values(trend).filter(t => t < -0.01).length;
    const atRisk = overall < 0.45 || decliningSkills >= 4 || lastActiveDays > 9;
    const excelling = overall > 0.78;

    return {
      id: `s-${classId}-${String(i+1).padStart(2,'0')}`,
      name: fullName, first, last,
      classId, className,
      avatar: (first[0] + last[0]).toUpperCase(),
      ability: +ability.toFixed(2),
      masteries, trend,
      overall,
      submissions, onTime,
      avgScore: Math.round(avgScore),
      lastActiveDays,
      atRisk, excelling,
      flagged: false,
    };
  });
};

const CLASSES = [
  { id: '4A', name: 'Form 4 A', size: 32, periods: 'Mon/Wed/Fri', stream: 'Sciences', avgAbility: 0.66 },
  { id: '4B', name: 'Form 4 B', size: 30, periods: 'Tue/Thu',     stream: 'Commercials', avgAbility: 0.54 },
  { id: '4C', name: 'Form 4 C', size: 28, periods: 'Mon/Wed/Fri', stream: 'Arts',     avgAbility: 0.48 },
];

const STUDENTS = CLASSES.flatMap(c => buildStudents(c.id, c.name, c.size, c.avgAbility));
// flag a few intentionally
[3, 17, 41, 58, 73].forEach(i => { if (STUDENTS[i]) STUDENTS[i].flagged = true; });

// Misconceptions — common wrong answer clusters
const MISCONCEPTIONS = [
  { skill: 'alg-quad', label: 'Sign error when factorising (b vs −b)',     freq: 18, severity: 'high', exampleQ: 'x² − 5x + 6 = 0', commonAns: 'x = −2, −3' },
  { skill: 'alg-quad', label: 'Forgets second root after square root',     freq: 11, severity: 'med',  exampleQ: 'x² = 49',         commonAns: 'x = 7 only' },
  { skill: 'geo-trig', label: 'Confuses sine rule with cosine rule',       freq: 14, severity: 'high', exampleQ: 'Find side a given two sides + included angle', commonAns: 'Uses sine rule' },
  { skill: 'geo-trig', label: 'Wrong angle in non-right triangles',        freq: 9,  severity: 'med',  exampleQ: 'Find ∠B',          commonAns: 'Uses opposite-over-adjacent' },
  { skill: 'geo-circ', label: 'Misapplies tangent-radius perpendicularity',freq: 12, severity: 'med',  exampleQ: 'Tangent at P, find ∠OPT',commonAns: 'States 60°, expected 90°' },
  { skill: 'cal-diff', label: 'Drops constant when differentiating',       freq: 16, severity: 'high', exampleQ: 'd/dx(3x² + 5)',     commonAns: '6x + 5' },
  { skill: 'cal-diff', label: 'Power rule arithmetic slip',                freq: 8,  severity: 'low',  exampleQ: 'd/dx(x⁴)',          commonAns: '3x³' },
  { skill: 'stat-prob',label: 'Adds dependent probabilities',              freq: 10, severity: 'med',  exampleQ: 'P(A and B) where dependent', commonAns: 'P(A)+P(B)' },
  { skill: 'vec-ops',  label: 'Treats vectors as scalars when adding',     freq: 13, severity: 'high', exampleQ: '|a| + |b| vs |a+b|', commonAns: 'Adds magnitudes' },
  { skill: 'stat-cumf',label: 'Reads median off frequency, not cumulative',freq: 7,  severity: 'low',  exampleQ: 'Median from CF curve', commonAns: 'Reads peak instead of n/2' },
];

// Recent assessments (across the term)
const ASSESSMENTS = [
  { id: 'a1', name: 'Diagnostic Test',         date: '2025-09-12', topics: ['Algebra'],            avgScore: 58, submissions: 89, type: 'Diagnostic' },
  { id: 'a2', name: 'Quadratics Homework',     date: '2025-09-26', topics: ['Algebra'],            avgScore: 64, submissions: 87, type: 'Homework' },
  { id: 'a3', name: 'Circle Theorems Quiz',    date: '2025-10-08', topics: ['Geometry'],           avgScore: 51, submissions: 88, type: 'Quiz' },
  { id: 'a4', name: 'Trigonometry Test',       date: '2025-10-22', topics: ['Geometry'],           avgScore: 47, submissions: 86, type: 'Test' },
  { id: 'a5', name: 'Mid-term: Algebra+Geom',  date: '2025-11-05', topics: ['Algebra','Geometry'], avgScore: 56, submissions: 90, type: 'Test' },
  { id: 'a6', name: 'Probability Worksheet',   date: '2025-11-18', topics: ['Statistics'],         avgScore: 62, submissions: 84, type: 'Homework' },
  { id: 'a7', name: 'Calculus Intro Quiz',     date: '2025-12-02', topics: ['Calculus'],           avgScore: 49, submissions: 82, type: 'Quiz' },
  { id: 'a8', name: 'Vectors Practice',        date: '2025-12-10', topics: ['Vectors'],            avgScore: 44, submissions: 78, type: 'Homework' },
];

// Term-over-term trend (avg class mastery, 3 terms)
const TERM_TREND = [
  { term: 'Term 1 ’25', mastery: 0.41, students: 88 },
  { term: 'Term 2 ’25', mastery: 0.49, students: 90 },
  { term: 'Term 3 ’25', mastery: 0.58, students: 90 },
];

// Weekly mastery progression (current term, 12 weeks)
const WEEKLY_PROGRESS = Array.from({ length: 12 }, (_, w) => {
  const week = w + 1;
  const classMastery = +(0.45 + w * 0.012 + Math.sin(w / 2) * 0.015).toFixed(3);
  const schoolMastery = +(0.52 + w * 0.008 + Math.cos(w / 3) * 0.01).toFixed(3);
  return { week: `W${week}`, classMastery, schoolMastery };
});

// School + national benchmarks
const BENCHMARKS = {
  classAvg:    +(STUDENTS.filter(s => s.classId === '4A').reduce((a,s)=>a+s.overall,0) / 32).toFixed(2),
  schoolAvg:   0.61,  // synthetic
  nationalAvg: 0.54,  // synthetic
};

// Submissions feed
const SUBMISSIONS = STUDENTS.flatMap(s =>
  ASSESSMENTS.slice(0, Math.floor(rand() * 3 + 5)).map(a => {
    const baseScore = s.ability * 100 + randn() * 12;
    return {
      id: `${s.id}-${a.id}`,
      studentId: s.id, assessmentId: a.id,
      score: Math.max(0, Math.min(100, Math.round(baseScore))),
      submittedAt: a.date,
      gradedBy: rand() > 0.4 ? 'AI' : 'Teacher',
      flagged: rand() > 0.92,
    };
  })
);

window.TEACHER_DATA = {
  TEACHER: { name: 'Tendai Chigumba', title: 'Mathematics · Form 4', avatar: 'TC', classes: CLASSES.map(c => c.id) },
  SUBJECT: 'Mathematics', FORM: 'Form 4',
  CLASSES, SKILLS, TOPICS, TOPIC_TONES, STUDENTS, MISCONCEPTIONS, ASSESSMENTS, TERM_TREND, WEEKLY_PROGRESS, BENCHMARKS, SUBMISSIONS,
};
