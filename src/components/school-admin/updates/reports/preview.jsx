// Step 3 — Live preview of the report. Renders a print-ready document on cream/paper background
// inside an A4-proportioned container so admins can see what they'll get.

const { RI: PRI, REPORTS_DATA: PD } = window;
const { ACCENT: PA, PREVIEW_SAMPLE, SCHOOL, CLASSES: PCLASSES, SUBJECTS: PSUBJECTS, TEACHERS: PTEACHERS } = PD;

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
  const rows = PTEACHERS.map((t, i) => ({
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
      <p className="text-xs text-slate-600 mb-4">Engagement and marking activity across {PTEACHERS.length} teaching staff.</p>

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
