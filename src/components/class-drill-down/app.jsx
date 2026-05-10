// Teacher analytics drill-down — Class → Students → Individual
const { useState, useMemo } = React;
const D = window.TEACHER_DATA;

function App() {
  const [view, setView] = useState({ mode: 'class', classId: '4A', studentId: null });
  const [flagged, setFlagged] = useState(new Set());
  const [toast, setToast] = useState(null);

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(null), 2400); };

  const goClass    = (classId) => setView({ mode: 'class', classId, studentId: null });
  const goStudents = (classId) => setView({ mode: 'students', classId, studentId: null });
  const goStudent  = (studentId) => {
    const s = D.STUDENTS.find(x => x.id === studentId);
    setView({ mode: 'individual', classId: s.classId, studentId });
  };

  const toggleFlag = (sid) => {
    const next = new Set(flagged);
    next.has(sid) ? next.delete(sid) : next.add(sid);
    setFlagged(next);
    showToast(next.has(sid) ? 'Student flagged for intervention' : 'Flag removed');
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--canvas)' }}>
      <Topbar />
      <Subnav view={view} setView={setView} goClass={goClass} goStudents={goStudents} />
      <main style={{ maxWidth: 1280, margin: '0 auto', padding: '20px 28px 80px' }}>
        {view.mode === 'class' &&      <ClassView classId={view.classId} goStudents={goStudents} goStudent={goStudent} flagged={flagged} toggleFlag={toggleFlag} showToast={showToast} />}
        {view.mode === 'students' &&   <StudentsView classId={view.classId} goStudent={goStudent} flagged={flagged} toggleFlag={toggleFlag} showToast={showToast} />}
        {view.mode === 'individual' && <IndividualView studentId={view.studentId} goClass={goClass} goStudents={goStudents} goStudent={goStudent} flagged={flagged} toggleFlag={toggleFlag} showToast={showToast} />}
      </main>
      {toast && <div style={{ position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)', background: 'var(--ink-hi)', color: 'var(--paper)', padding: '10px 18px', borderRadius: 999, fontSize: 12.5, fontWeight: 600, boxShadow: '0 10px 30px rgba(60,40,20,.25)', zIndex: 50, display: 'flex', alignItems: 'center', gap: 8 }}><I.Check size={14} /> {toast}</div>}
    </div>
  );
}

// ============= Topbar =============
function Topbar() {
  return (
    <header style={{ height: 52, padding: '0 28px', display: 'flex', alignItems: 'center', gap: 14, borderBottom: '1px solid var(--rule)', background: 'var(--paper)', position: 'sticky', top: 0, zIndex: 20 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{ width: 28, height: 28, borderRadius: 6, background: 'var(--accent)', display: 'grid', placeItems: 'center', fontSize: 13, fontWeight: 700, color: '#fffaf2' }}>K</div>
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--ink-hi)' }}>Kundai · Teacher analytics</div>
          <div style={{ fontSize: 10, color: 'var(--ink-faint)', textTransform: 'uppercase', letterSpacing: '.06em', fontWeight: 600 }}>Goromonzi High School</div>
        </div>
      </div>
      <div style={{ flex: 1 }} />
      <div style={{ fontSize: 11.5, color: 'var(--ink-lo)', display: 'flex', alignItems: 'center', gap: 14 }}>
        <span>Term 3 · Week 9 of 12</span>
        <span style={{ width: 1, height: 14, background: 'var(--rule)' }} />
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          <div style={{ width: 26, height: 26, borderRadius: 999, background: 'linear-gradient(135deg,#b85e2c,#7a3d1e)', display: 'grid', placeItems: 'center', fontSize: 10, fontWeight: 700, color: '#fffaf2' }}>{D.TEACHER.avatar}</div>
          <span style={{ color: 'var(--ink-mid)', fontWeight: 600 }}>{D.TEACHER.name}</span>
        </span>
      </div>
    </header>
  );
}

// ============= Subnav (breadcrumb + class switcher) =============
function Subnav({ view, setView, goClass, goStudents }) {
  const cls = D.CLASSES.find(c => c.id === view.classId);
  const student = view.studentId ? D.STUDENTS.find(s => s.id === view.studentId) : null;

  return (
    <div style={{ borderBottom: '1px solid var(--rule)', background: 'var(--paper)', padding: '12px 28px', display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
      {/* Class switcher */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 4, padding: 3, background: 'var(--canvas)', border: '1px solid var(--rule)', borderRadius: 7 }}>
        {D.CLASSES.map(c => (
          <button key={c.id} onClick={() => goClass(c.id)} style={{
            border: 0, padding: '6px 12px', borderRadius: 5, fontSize: 11.5, fontWeight: 600, cursor: 'pointer',
            background: view.classId === c.id ? 'var(--paper)' : 'transparent',
            color: view.classId === c.id ? 'var(--ink-hi)' : 'var(--ink-lo)',
            fontFamily: 'inherit', display: 'inline-flex', alignItems: 'center', gap: 6,
            boxShadow: view.classId === c.id ? '0 1px 2px rgba(60,40,20,.08)' : 'none',
          }}>{c.name}<span className="tnum" style={{ fontSize: 10, color: 'var(--ink-faint)' }}>{c.size}</span></button>
        ))}
      </div>

      {/* Breadcrumb */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: 'var(--ink-lo)' }}>
        <button onClick={() => goClass(view.classId)} style={{ background: 'transparent', border: 0, color: view.mode === 'class' ? 'var(--ink-hi)' : 'var(--ink-lo)', fontWeight: view.mode === 'class' ? 700 : 500, cursor: 'pointer', fontFamily: 'inherit', fontSize: 12, padding: 4 }}>Class overview</button>
        <I.Right size={11} style={{ color: 'var(--ink-faint)' }} />
        <button onClick={() => goStudents(view.classId)} style={{ background: 'transparent', border: 0, color: view.mode === 'students' ? 'var(--ink-hi)' : 'var(--ink-lo)', fontWeight: view.mode === 'students' ? 700 : 500, cursor: 'pointer', fontFamily: 'inherit', fontSize: 12, padding: 4 }}>All students ({D.STUDENTS.filter(s => s.classId === view.classId).length})</button>
        {student && <>
          <I.Right size={11} style={{ color: 'var(--ink-faint)' }} />
          <span style={{ color: 'var(--ink-hi)', fontWeight: 700 }}>{student.name}</span>
        </>}
      </div>

      <div style={{ flex: 1 }} />
      <div style={{ fontSize: 11, color: 'var(--ink-faint)' }}>
        <I.Book size={11} style={{ verticalAlign: '-1px', marginRight: 4 }} />
        {D.SUBJECT} · {D.FORM} · {cls?.stream}
      </div>
    </div>
  );
}

// ============= CLASS VIEW =============
function ClassView({ classId, goStudents, goStudent, flagged, toggleFlag, showToast }) {
  const students = D.STUDENTS.filter(s => s.classId === classId);
  const cls = D.CLASSES.find(c => c.id === classId);
  const classMastery = students.reduce((a,s) => a + s.overall, 0) / students.length;
  const atRisk = students.filter(s => s.atRisk);
  const excelling = students.filter(s => s.excelling);
  const masteredSkills = D.SKILLS.filter(sk => students.filter(s => s.masteries[sk.id] >= 0.85).length / students.length > 0.6);

  // Topic difficulty (avg mastery per topic, lower = harder)
  const topicData = D.TOPICS.map(t => {
    const skillIds = D.SKILLS.filter(s => s.topic === t).map(s => s.id);
    const avg = students.reduce((a, s) => a + skillIds.reduce((b, k) => b + s.masteries[k], 0) / skillIds.length, 0) / students.length;
    return { label: t, value: Math.round(avg * 100), unit: '%', color: D.TOPIC_TONES[t], sub: `${skillIds.length} skills` };
  }).sort((a,b) => a.value - b.value);

  // Score histogram from latest assessment
  const buckets = [
    { range: '0-29',  count: students.filter(s => s.avgScore < 30).length },
    { range: '30-49', count: students.filter(s => s.avgScore >= 30 && s.avgScore < 50).length },
    { range: '50-59', count: students.filter(s => s.avgScore >= 50 && s.avgScore < 60).length },
    { range: '60-69', count: students.filter(s => s.avgScore >= 60 && s.avgScore < 70).length },
    { range: '70-79', count: students.filter(s => s.avgScore >= 70 && s.avgScore < 80).length },
    { range: '80+',   count: students.filter(s => s.avgScore >= 80).length },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: 'var(--ink-hi)', letterSpacing: '-.02em', fontFamily: 'var(--serif)' }}>{cls.name} · {D.SUBJECT}</h1>
          <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--ink-lo)' }}>{students.length} students · {cls.periods} · {cls.stream} stream</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <Btn variant="ghost" size="sm" icon={I.Download} onClick={() => showToast('Class report exported (PDF, 12 pages)')}>Export class report</Btn>
          <Btn variant="primary" size="sm" icon={I.Lightning} onClick={() => showToast('Practice assigned to 3 weakest skills')}>Assign weak-skill practice</Btn>
        </div>
      </div>

      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12 }}>
        <KPI label="Class mastery" value={Math.round(classMastery*100) + '%'} sub={`Target 60% · ${classMastery >= 0.6 ? 'on track' : 'below target'}`} accent="var(--accent)" icon={I.Brain} delta={5.2} />
        <KPI label="At risk" value={atRisk.length} sub={`${Math.round(atRisk.length/students.length*100)}% of class`} accent="#a93333" icon={I.Alert} />
        <KPI label="Excelling" value={excelling.length} sub="Mastery > 78%" accent="#15784f" icon={I.Star} delta={2.1} />
        <KPI label="Mastered skills" value={`${masteredSkills.length}/${D.SKILLS.length}`} sub={`>60% of class above 0.85`} accent="#9a6418" icon={I.Target} />
      </div>

      {/* Mastery progression + Comparison */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr', gap: 16 }}>
        <Card>
          <SectionHeader title="Mastery progression · current term" sub="Class average vs school average · Term 3, Weeks 1–9" />
          <LineChart data={D.WEEKLY_PROGRESS} keys={[
            { key: 'classMastery',  color: 'var(--accent)' },
            { key: 'schoolMastery', color: '#9aa3b2' },
          ]} h={200} />
          <div style={{ display: 'flex', gap: 18, marginTop: 8, fontSize: 11, color: 'var(--ink-lo)' }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}><span style={{ width: 12, height: 2, background: 'var(--accent)' }} /> {cls.name} mastery</span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}><span style={{ width: 12, height: 2, background: '#9aa3b2' }} /> School avg (all Form 4)</span>
          </div>
        </Card>

        <Card>
          <SectionHeader title="Class vs class · same teacher" sub="You teach 3 streams" />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 4 }}>
            {D.CLASSES.map(c => {
              const cs = D.STUDENTS.filter(s => s.classId === c.id);
              const m = cs.reduce((a,s)=>a+s.overall,0) / cs.length;
              const isCurrent = c.id === classId;
              return (
                <div key={c.id} onClick={() => !isCurrent && goStudent && setTimeout(() => window.dispatchEvent(new CustomEvent('go-class', { detail: c.id })), 0)} style={{ padding: 10, borderRadius: 6, background: isCurrent ? 'rgba(176,90,40,.06)' : 'transparent', border: `1px solid ${isCurrent ? 'rgba(176,90,40,.2)' : 'var(--rule-soft)'}` }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 4 }}>
                    <span style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--ink-hi)' }}>{c.name} {isCurrent && <Pill tone="accent" sm>viewing</Pill>}</span>
                    <span className="tnum" style={{ fontSize: 13, fontWeight: 700, color: 'var(--ink-hi)' }}>{Math.round(m*100)}%</span>
                  </div>
                  <MasteryBar value={m} target={0.6} h={5} showLabel={false} />
                  <div style={{ fontSize: 10.5, color: 'var(--ink-faint)', marginTop: 4 }}>{c.stream} · {cs.length} students</div>
                </div>
              );
            })}
            <div style={{ paddingTop: 10, marginTop: 4, borderTop: '1px dashed var(--rule)', fontSize: 11, color: 'var(--ink-lo)', display: 'flex', justifyContent: 'space-between' }}>
              <span>School avg (Form 4)</span>
              <span className="tnum" style={{ fontWeight: 600 }}>{Math.round(D.BENCHMARKS.schoolAvg*100)}%</span>
            </div>
            <div style={{ fontSize: 11, color: 'var(--ink-lo)', display: 'flex', justifyContent: 'space-between' }}>
              <span>National avg</span>
              <span className="tnum" style={{ fontWeight: 600 }}>{Math.round(D.BENCHMARKS.nationalAvg*100)}%</span>
            </div>
          </div>
        </Card>
      </div>

      {/* Topic difficulty + score distribution */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 16 }}>
        <Card>
          <SectionHeader title="Topic difficulty · class avg mastery" sub="Lower = harder for this class · click a bar to assign practice" />
          <BarChart data={topicData} h={180} />
        </Card>
        <Card>
          <SectionHeader title="Score distribution · last assessment" sub={D.ASSESSMENTS[D.ASSESSMENTS.length-1].name} />
          <Histogram buckets={buckets} h={140} />
          <div style={{ marginTop: 12, paddingTop: 10, borderTop: '1px dashed var(--rule)', display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12 }}>
            <div><div style={{ fontSize: 10, color: 'var(--ink-faint)', textTransform: 'uppercase', letterSpacing: '.06em' }}>Pass rate</div><div className="tnum" style={{ fontSize: 16, fontWeight: 700, color: 'var(--ink-hi)' }}>{Math.round(students.filter(s=>s.avgScore>=50).length / students.length * 100)}%</div></div>
            <div><div style={{ fontSize: 10, color: 'var(--ink-faint)', textTransform: 'uppercase', letterSpacing: '.06em' }}>Class median</div><div className="tnum" style={{ fontSize: 16, fontWeight: 700, color: 'var(--ink-hi)' }}>{[...students].sort((a,b)=>a.avgScore-b.avgScore)[Math.floor(students.length/2)].avgScore}</div></div>
            <div><div style={{ fontSize: 10, color: 'var(--ink-faint)', textTransform: 'uppercase', letterSpacing: '.06em' }}>Std deviation</div><div className="tnum" style={{ fontSize: 16, fontWeight: 700, color: 'var(--ink-hi)' }}>±{Math.round(Math.sqrt(students.reduce((a,s)=>a+Math.pow(s.avgScore - students.reduce((c,t)=>c+t.avgScore,0)/students.length, 2),0)/students.length))}</div></div>
          </div>
        </Card>
      </div>

      {/* Heatmap */}
      <Card>
        <SectionHeader title="Mastery heatmap · students × skills" sub="Click any cell to drill into that student's skill page · darker = stronger mastery" action={
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 10, color: 'var(--ink-faint)' }}>
            <span>Below 25%</span>
            {['#a93333','#c87238','#d8a14f','#5a9d6e','#15784f'].map((c,i) => <span key={i} style={{ width: 14, height: 14, background: c, borderRadius: 2 }} />)}
            <span>Above 85%</span>
          </div>
        } />
        <Heatmap rows={students.slice(0, 24)} cols={D.SKILLS}
          getValue={(r, c) => r.masteries[c.id]}
          rowLabel={(r) => <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ width: 22, height: 22, borderRadius: 999, background: 'rgba(176,90,40,.14)', color: 'var(--accent)', display: 'grid', placeItems: 'center', fontSize: 9, fontWeight: 700 }}>{r.avatar}</span>
            {r.name}
            {r.atRisk && <I.Alert size={10} style={{ color: '#a93333' }} />}
          </span>}
          colLabel={(c) => `${c.code} · ${c.name}`}
          onCell={(r) => goStudent(r.id)}
          h={420} />
        {students.length > 24 && <div style={{ marginTop: 10, paddingTop: 10, borderTop: '1px dashed var(--rule)', fontSize: 11, color: 'var(--ink-lo)' }}>Showing 24 of {students.length} students. <button onClick={() => goStudents(classId)} style={{ background: 'transparent', border: 0, color: 'var(--accent)', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600, fontSize: 11 }}>View all in roster →</button></div>}
      </Card>

      {/* Misconceptions */}
      <Card>
        <SectionHeader title="Common misconceptions · this class" sub="Wrong-answer clusters detected by the grading engine" action={<Btn variant="ghost" size="sm" icon={I.Lightning}>Generate remediation pack</Btn>} />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 10 }}>
          {D.MISCONCEPTIONS.slice(0, 6).map((m, i) => {
            const skill = D.SKILLS.find(s => s.id === m.skill);
            const sevTone = m.severity === 'high' ? 'risk' : m.severity === 'med' ? 'warn' : 'info';
            return (
              <div key={i} style={{ padding: 12, borderRadius: 6, border: '1px solid var(--rule-soft)', background: 'var(--canvas)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8, marginBottom: 6 }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                    <span style={{ fontSize: 9.5, fontWeight: 700, color: D.TOPIC_TONES[skill.topic], textTransform: 'uppercase', letterSpacing: '.08em' }}>{skill.code} · {skill.name}</span>
                    <span style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--ink-hi)' }}>{m.label}</span>
                  </div>
                  <Pill tone={sevTone} sm>{m.severity}</Pill>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginTop: 8, paddingTop: 8, borderTop: '1px dashed var(--rule)' }}>
                  <div className="mono" style={{ fontSize: 11, color: 'var(--ink-mid)' }}>e.g. <span style={{ color: 'var(--ink-hi)' }}>{m.exampleQ}</span> → <span style={{ color: '#a93333' }}>{m.commonAns}</span></div>
                  <span className="tnum" style={{ fontSize: 12, fontWeight: 700, color: 'var(--ink-hi)' }}>{m.freq} students</span>
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Term trend */}
      <Card>
        <SectionHeader title="Term-over-term trend" sub="Class avg mastery across the last 3 terms" />
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 24, padding: '12px 0' }}>
          {D.TERM_TREND.map((t, i) => {
            const h = t.mastery * 140;
            const isLast = i === D.TERM_TREND.length - 1;
            return (
              <div key={t.term} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                <div className="tnum" style={{ fontSize: 13, fontWeight: 700, color: 'var(--ink-hi)' }}>{Math.round(t.mastery*100)}%</div>
                <div style={{ width: '60%', height: h, background: isLast ? 'var(--accent)' : 'rgba(176,90,40,.3)', borderRadius: '4px 4px 0 0' }} />
                <div style={{ fontSize: 11, color: 'var(--ink-lo)', fontWeight: 600 }}>{t.term}</div>
                <div style={{ fontSize: 10, color: 'var(--ink-faint)' }}>{t.students} students</div>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}

window.App = App;
window.ClassView = ClassView;
