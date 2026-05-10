// Students roster view + Individual student deep-dive
const { useState: useStateSV } = React;
const DSV = window.TEACHER_DATA;

function StudentsView({ classId, goStudent, flagged, toggleFlag, showToast }) {
  const all = DSV.STUDENTS.filter(s => s.classId === classId);
  const [sort, setSort] = useStateSV({ key: 'overall', dir: 'desc' });
  const [filter, setFilter] = useStateSV('all');
  const [query, setQuery] = useStateSV('');

  const filtered = all.filter(s => {
    if (filter === 'risk' && !s.atRisk) return false;
    if (filter === 'excelling' && !s.excelling) return false;
    if (filter === 'flagged' && !flagged.has(s.id)) return false;
    if (query && !s.name.toLowerCase().includes(query.toLowerCase())) return false;
    return true;
  });

  const sorted = [...filtered].sort((a, b) => {
    const av = sort.key === 'name' ? a.name : sort.key === 'velocity' ? Object.values(a.trend).reduce((x,y)=>x+y,0)/DSV.SKILLS.length : a[sort.key];
    const bv = sort.key === 'name' ? b.name : sort.key === 'velocity' ? Object.values(b.trend).reduce((x,y)=>x+y,0)/DSV.SKILLS.length : b[sort.key];
    if (av < bv) return sort.dir === 'asc' ? -1 : 1;
    if (av > bv) return sort.dir === 'asc' ? 1 : -1;
    return 0;
  });

  const setSortKey = (k) => setSort(s => ({ key: k, dir: s.key === k && s.dir === 'desc' ? 'asc' : 'desc' }));
  const Sort = ({ k, label }) => (
    <button onClick={() => setSortKey(k)} style={{ background: 'transparent', border: 0, color: sort.key === k ? 'var(--ink-hi)' : 'var(--ink-lo)', fontWeight: sort.key === k ? 700 : 600, fontSize: 11, fontFamily: 'inherit', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 4, textTransform: 'uppercase', letterSpacing: '.06em', padding: '8px 4px' }}>
      {label}{sort.key === k && <span style={{ fontSize: 9 }}>{sort.dir === 'asc' ? '▲' : '▼'}</span>}
    </button>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: 'var(--ink-hi)', letterSpacing: '-.02em', fontFamily: 'var(--serif)' }}>All students · {DSV.CLASSES.find(c => c.id === classId).name}</h1>
          <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--ink-lo)' }}>{all.length} students · sortable roster · click any row to drill into individual analytics</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <Btn variant="ghost" size="sm" icon={I.Download} onClick={() => showToast('Roster exported (CSV)')}>Export CSV</Btn>
          <Btn variant="primary" size="sm" icon={I.Mail} onClick={() => showToast('Message sent to all flagged students\' parents')}>Message flagged ({flagged.size})</Btn>
        </div>
      </div>

      {/* Filters */}
      <Card padded={false}>
        <div style={{ padding: '12px 16px', display: 'flex', gap: 12, alignItems: 'center', borderBottom: '1px solid var(--rule)', flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', flex: '0 1 280px' }}>
            <I.Search size={12} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--ink-faint)' }} />
            <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search students…" style={{ width: '100%', padding: '6px 10px 6px 28px', background: 'var(--canvas)', border: '1px solid var(--rule)', borderRadius: 6, fontFamily: 'inherit', fontSize: 12, color: 'var(--ink-hi)', outline: 'none' }} />
          </div>
          <div style={{ display: 'flex', gap: 4, padding: 3, background: 'var(--canvas)', border: '1px solid var(--rule)', borderRadius: 6 }}>
            {[['all','All', all.length], ['risk','At risk', all.filter(s=>s.atRisk).length], ['excelling','Excelling', all.filter(s=>s.excelling).length], ['flagged','Flagged', flagged.size]].map(([k,l,n]) => (
              <button key={k} onClick={() => setFilter(k)} style={{ border: 0, padding: '5px 10px', borderRadius: 4, fontSize: 11, fontWeight: 600, cursor: 'pointer', background: filter === k ? 'var(--paper)' : 'transparent', color: filter === k ? 'var(--ink-hi)' : 'var(--ink-lo)', fontFamily: 'inherit', display: 'inline-flex', alignItems: 'center', gap: 4 }}>{l}<span className="tnum" style={{ fontSize: 9.5, color: 'var(--ink-faint)' }}>{n}</span></button>
            ))}
          </div>
          <span style={{ fontSize: 11, color: 'var(--ink-faint)' }}>{sorted.length} shown</span>
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--rule)', background: 'var(--canvas)' }}>
              <th style={{ padding: '6px 16px', textAlign: 'left' }}><Sort k="name" label="Student" /></th>
              <th style={{ padding: '6px 8px', textAlign: 'left' }}><Sort k="overall" label="Mastery" /></th>
              <th style={{ padding: '6px 8px', textAlign: 'left' }}><Sort k="velocity" label="Velocity" /></th>
              <th style={{ padding: '6px 8px', textAlign: 'left' }}><Sort k="avgScore" label="Avg score" /></th>
              <th style={{ padding: '6px 8px', textAlign: 'left' }}><Sort k="submissions" label="Submissions" /></th>
              <th style={{ padding: '6px 8px', textAlign: 'left' }}><Sort k="lastActiveDays" label="Last active" /></th>
              <th style={{ padding: '6px 8px', textAlign: 'left' }}>Status</th>
              <th style={{ padding: '6px 16px', textAlign: 'right' }}>&nbsp;</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((s, i) => {
              const velocity = Object.values(s.trend).reduce((a,b)=>a+b,0) / DSV.SKILLS.length;
              return (
                <tr key={s.id} onClick={() => goStudent(s.id)} style={{ borderBottom: i < sorted.length-1 ? '1px solid var(--rule-soft)' : 'none', cursor: 'pointer' }}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(176,90,40,.04)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                  <td style={{ padding: '10px 16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                      <div style={{ width: 28, height: 28, borderRadius: 999, background: 'rgba(176,90,40,.14)', color: 'var(--accent)', display: 'grid', placeItems: 'center', fontSize: 10.5, fontWeight: 700 }}>{s.avatar}</div>
                      <div>
                        <div style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--ink-hi)' }}>{s.name}</div>
                        <div className="mono" style={{ fontSize: 10, color: 'var(--ink-faint)' }}>{s.id}</div>
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: '10px 8px', minWidth: 140 }}>
                    <MasteryBar value={s.overall} target={0.6} h={5} />
                  </td>
                  <td style={{ padding: '10px 8px' }} className="tnum">
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, color: velocity >= 0 ? '#15784f' : '#a93333', fontWeight: 600, fontSize: 12 }}>
                      {velocity >= 0 ? '▲' : '▼'} {(Math.abs(velocity) * 100).toFixed(2)}/wk
                    </span>
                  </td>
                  <td className="tnum" style={{ padding: '10px 8px', color: 'var(--ink-mid)', fontWeight: 600, fontSize: 12 }}>{s.avgScore}</td>
                  <td className="tnum" style={{ padding: '10px 8px', color: 'var(--ink-mid)', fontSize: 12 }}>{s.onTime}/{s.submissions}</td>
                  <td style={{ padding: '10px 8px', color: 'var(--ink-faint)', fontSize: 11 }}>{s.lastActiveDays === 0 ? 'today' : `${s.lastActiveDays}d ago`}</td>
                  <td style={{ padding: '10px 8px' }}>
                    {s.atRisk && <Pill tone="risk" sm>at risk</Pill>}
                    {!s.atRisk && s.excelling && <Pill tone="success" sm>excelling</Pill>}
                    {!s.atRisk && !s.excelling && <Pill tone="neutral" sm>on track</Pill>}
                  </td>
                  <td style={{ padding: '10px 16px', textAlign: 'right' }}>
                    <div style={{ display: 'inline-flex', gap: 4 }} onClick={e => e.stopPropagation()}>
                      <button onClick={() => toggleFlag(s.id)} title="Flag for intervention" style={{ background: flagged.has(s.id) ? 'rgba(190,50,50,.12)' : 'transparent', border: '1px solid ' + (flagged.has(s.id) ? 'rgba(190,50,50,.3)' : 'var(--rule)'), borderRadius: 4, padding: '4px 6px', cursor: 'pointer', color: flagged.has(s.id) ? '#a93333' : 'var(--ink-lo)' }}>
                        <I.Flag size={11} />
                      </button>
                      <button onClick={() => showToast(`Message draft opened for ${s.name}'s guardian`)} title="Message parent" style={{ background: 'transparent', border: '1px solid var(--rule)', borderRadius: 4, padding: '4px 6px', cursor: 'pointer', color: 'var(--ink-lo)' }}>
                        <I.Mail size={11} />
                      </button>
                      <I.Right size={12} style={{ color: 'var(--ink-faint)', alignSelf: 'center', marginLeft: 4 }} />
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </Card>
    </div>
  );
}

// ============= INDIVIDUAL VIEW =============
function IndividualView({ studentId, goStudents, goStudent, flagged, toggleFlag, showToast }) {
  const s = DSV.STUDENTS.find(x => x.id === studentId);
  const cls = DSV.CLASSES.find(c => c.id === s.classId);
  const classmates = DSV.STUDENTS.filter(x => x.classId === s.classId);
  const classAvg = classmates.reduce((a,x)=>a+x.overall,0) / classmates.length;
  const skillsByMastery = [...DSV.SKILLS].map(sk => ({ ...sk, m: s.masteries[sk.id], t: s.trend[sk.id], classM: classmates.reduce((a,x)=>a+x.masteries[sk.id],0)/classmates.length })).sort((a,b) => a.m - b.m);
  const studentSubs = DSV.SUBMISSIONS.filter(sub => sub.studentId === s.id).slice(-8);
  const myMisconceptions = DSV.MISCONCEPTIONS.filter(m => s.masteries[m.skill] < 0.55).slice(0, 4);
  const velocity = Object.values(s.trend).reduce((a,b)=>a+b,0) / DSV.SKILLS.length;

  // Find next/prev student in same class for quick navigation
  const idx = classmates.findIndex(x => x.id === s.id);
  const prev = classmates[(idx - 1 + classmates.length) % classmates.length];
  const next = classmates[(idx + 1) % classmates.length];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Hero */}
      <Card>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 18, flexWrap: 'wrap' }}>
          <div style={{ width: 64, height: 64, borderRadius: 999, background: 'linear-gradient(135deg, #b85e2c, #7a3d1e)', color: '#fffaf2', display: 'grid', placeItems: 'center', fontSize: 22, fontWeight: 700, flexShrink: 0 }}>{s.avatar}</div>
          <div style={{ flex: 1, minWidth: 240 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
              <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: 'var(--ink-hi)', letterSpacing: '-.02em', fontFamily: 'var(--serif)' }}>{s.name}</h1>
              {s.atRisk && <Pill tone="risk">At risk</Pill>}
              {s.excelling && <Pill tone="success">Excelling</Pill>}
              {flagged.has(s.id) && <Pill tone="warn">Flagged</Pill>}
            </div>
            <p style={{ margin: '4px 0 0', fontSize: 12.5, color: 'var(--ink-lo)' }}>
              <span className="mono">{s.id}</span> · {cls.name} · {cls.stream} stream · {DSV.SUBJECT}
            </p>
            <div style={{ display: 'flex', gap: 22, marginTop: 14 }}>
              <Stat label="Overall mastery" value={Math.round(s.overall*100) + '%'} sub={`vs class ${Math.round(classAvg*100)}%`} delta={s.overall - classAvg} />
              <Stat label="Velocity" value={`${velocity >= 0 ? '+' : ''}${(velocity*100).toFixed(2)}/wk`} sub="last 4 weeks" />
              <Stat label="Avg score" value={s.avgScore} sub={`${s.onTime}/${s.submissions} on time`} />
              <Stat label="Last active" value={s.lastActiveDays === 0 ? 'Today' : `${s.lastActiveDays}d ago`} />
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, minWidth: 180 }}>
            <div style={{ display: 'flex', gap: 6 }}>
              <Btn variant="ghost" size="sm" onClick={() => goStudent(prev.id)} icon={I.Left}>Prev</Btn>
              <Btn variant="ghost" size="sm" onClick={() => goStudent(next.id)} style={{ flexDirection: 'row-reverse' }} icon={I.Right}>Next</Btn>
            </div>
            <Btn variant={flagged.has(s.id) ? 'soft' : 'ghost'} size="sm" icon={I.Flag} onClick={() => toggleFlag(s.id)}>{flagged.has(s.id) ? 'Flagged for intervention' : 'Flag for intervention'}</Btn>
            <Btn variant="ghost" size="sm" icon={I.Mail} onClick={() => showToast(`Message draft opened for ${s.name}'s guardian`)}>Message parent</Btn>
            <Btn variant="primary" size="sm" icon={I.Lightning} onClick={() => showToast(`Targeted practice on ${skillsByMastery[0].name} assigned`)}>Assign practice on weakest skill</Btn>
          </div>
        </div>
      </Card>

      {/* Per-skill BKT */}
      <Card>
        <SectionHeader title="Per-skill mastery (BKT)" sub={`${DSV.SKILLS.length} skills tracked · sorted weakest → strongest · vertical line shows class avg`} action={<span style={{ fontSize: 10.5, color: 'var(--ink-faint)' }}>weakest 3 skills are candidates for targeted practice</span>} />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
          {skillsByMastery.map((sk, i) => {
            const isWeak = i < 3;
            return (
              <div key={sk.id} style={{ display: 'grid', gridTemplateColumns: '180px 1fr 100px 80px', gap: 12, alignItems: 'center', padding: '6px 0', borderBottom: i < skillsByMastery.length-1 ? '1px dashed var(--rule)' : 'none' }}>
                <div>
                  <div style={{ fontSize: 9.5, fontWeight: 700, color: DSV.TOPIC_TONES[sk.topic], textTransform: 'uppercase', letterSpacing: '.08em' }}>{sk.code}</div>
                  <div style={{ fontSize: 12, color: 'var(--ink-hi)', fontWeight: 600 }}>{sk.name}</div>
                </div>
                <div style={{ position: 'relative' }}>
                  <MasteryBar value={sk.m} target={sk.classM} h={8} showLabel={false} />
                </div>
                <div style={{ fontSize: 11, color: 'var(--ink-lo)', display: 'flex', flexDirection: 'column' }}>
                  <span className="tnum">Class: {Math.round(sk.classM*100)}%</span>
                  <span style={{ color: sk.t >= 0 ? '#15784f' : '#a93333', fontWeight: 600 }}>{sk.t >= 0 ? '▲' : '▼'} {(Math.abs(sk.t)*100).toFixed(2)}/wk</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  {isWeak ? <Btn variant="soft" size="sm" icon={I.Lightning} onClick={() => showToast(`Practice on "${sk.name}" assigned to ${s.first}`)}>Practice</Btn>
                          : sk.m >= 0.85 ? <Pill tone="success" sm>Mastered</Pill> : null}
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Student vs class trend + Misconceptions */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: 16 }}>
        <Card>
          <SectionHeader title="Mastery progression" sub={`${s.first} vs ${cls.name} class avg vs school avg · current term`} />
          <LineChart data={DSV.WEEKLY_PROGRESS.map((w, i) => ({
            ...w,
            student: Math.max(0.1, Math.min(0.95, s.overall - 0.15 + i * 0.02 + Math.sin(i/2) * 0.03)),
          }))} keys={[
            { key: 'student',        color: 'var(--accent)' },
            { key: 'classMastery',   color: '#9a6418' },
            { key: 'schoolMastery',  color: '#9aa3b2' },
          ]} h={200} />
          <div style={{ display: 'flex', gap: 14, marginTop: 8, fontSize: 11, color: 'var(--ink-lo)', flexWrap: 'wrap' }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}><span style={{ width: 12, height: 2, background: 'var(--accent)' }} />{s.first}</span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}><span style={{ width: 12, height: 2, background: '#9a6418' }} />{cls.name}</span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}><span style={{ width: 12, height: 2, background: '#9aa3b2' }} />School avg</span>
          </div>
        </Card>

        <Card>
          <SectionHeader title="This student's misconceptions" sub={`${myMisconceptions.length} patterns detected`} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {myMisconceptions.length === 0 && <p style={{ fontSize: 12, color: 'var(--ink-faint)', fontStyle: 'italic' }}>No major misconceptions detected. {s.first} is performing well.</p>}
            {myMisconceptions.map((m, i) => {
              const sk = DSV.SKILLS.find(x => x.id === m.skill);
              return (
                <div key={i} style={{ padding: 10, borderRadius: 6, border: '1px solid var(--rule-soft)', background: 'var(--canvas)' }}>
                  <div style={{ fontSize: 9.5, fontWeight: 700, color: DSV.TOPIC_TONES[sk.topic], textTransform: 'uppercase', letterSpacing: '.08em' }}>{sk.code}</div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--ink-hi)', marginTop: 2 }}>{m.label}</div>
                  <div className="mono" style={{ fontSize: 10.5, color: 'var(--ink-faint)', marginTop: 4 }}>{m.exampleQ}</div>
                </div>
              );
            })}
          </div>
        </Card>
      </div>

      {/* Submission timeline */}
      <Card>
        <SectionHeader title="Recent submissions" sub={`${studentSubs.length} most recent attempts · click to drill into the submission`} />
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead><tr style={{ borderBottom: '1px solid var(--rule)' }}>
            {['Assessment','Topics','Submitted','Score','Graded by',''].map(h => <th key={h} style={{ padding: '6px 12px', textAlign: 'left', fontSize: 10, fontWeight: 700, color: 'var(--ink-lo)', textTransform: 'uppercase', letterSpacing: '.06em' }}>{h}</th>)}
          </tr></thead>
          <tbody>
            {studentSubs.map((sub, i) => {
              const a = DSV.ASSESSMENTS.find(x => x.id === sub.assessmentId);
              const tone = sub.score >= 70 ? '#15784f' : sub.score >= 50 ? '#9a6418' : '#a93333';
              return (
                <tr key={i} onClick={() => showToast(`Opening submission ${sub.id}…`)} style={{ borderBottom: i < studentSubs.length-1 ? '1px solid var(--rule-soft)' : 'none', cursor: 'pointer' }}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(176,90,40,.04)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                  <td style={{ padding: '8px 12px', fontSize: 12, fontWeight: 600, color: 'var(--ink-hi)' }}>{a.name}</td>
                  <td style={{ padding: '8px 12px' }}>{a.topics.map(t => <Pill key={t} tone="info" sm>{t}</Pill>)}</td>
                  <td style={{ padding: '8px 12px', fontSize: 11, color: 'var(--ink-faint)' }}>{new Date(a.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}</td>
                  <td className="tnum" style={{ padding: '8px 12px', fontSize: 13, fontWeight: 700, color: tone }}>{sub.score}</td>
                  <td style={{ padding: '8px 12px' }}>
                    <Pill tone={sub.gradedBy === 'AI' ? 'info' : 'neutral'} sm>{sub.gradedBy === 'AI' ? '✨ AI' : '✍ Teacher'}</Pill>
                    {sub.flagged && <Pill tone="warn" sm>flagged</Pill>}
                  </td>
                  <td style={{ padding: '8px 12px', textAlign: 'right' }}><I.Right size={12} style={{ color: 'var(--ink-faint)' }} /></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </Card>
    </div>
  );
}

function Stat({ label, value, sub, delta }) {
  return (
    <div style={{ minWidth: 110 }}>
      <div style={{ fontSize: 10, color: 'var(--ink-faint)', textTransform: 'uppercase', letterSpacing: '.06em', fontWeight: 700 }}>{label}</div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginTop: 3 }}>
        <span className="tnum" style={{ fontSize: 18, fontWeight: 700, color: 'var(--ink-hi)' }}>{value}</span>
        {delta != null && <span style={{ fontSize: 11, fontWeight: 600, color: delta >= 0 ? '#15784f' : '#a93333' }}>{delta >= 0 ? '+' : ''}{(delta*100).toFixed(0)}%</span>}
      </div>
      {sub && <div style={{ fontSize: 11, color: 'var(--ink-lo)', marginTop: 1 }}>{sub}</div>}
    </div>
  );
}

window.StudentsView = StudentsView;
window.IndividualView = IndividualView;
