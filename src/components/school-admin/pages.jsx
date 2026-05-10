// All other school pages — Students, Teachers, Classes, Assessments, Billing, Announcements, Settings
const { useState: useStateP, useMemo: useMemoP } = React;

// ─────────────────────────────────────────────────────────────────
// STUDENTS
// ─────────────────────────────────────────────────────────────────
function PageStudents({ goto }) {
  const { STUDENTS, BILLING, CLASSES } = window.SCHOOL_DATA;
  const [form, setForm] = useStateP('all');
  const [q, setQ] = useStateP('');

  const filtered = STUDENTS.filter(s =>
    (form === 'all' || s.form === parseInt(form)) &&
    (!q || s.name.toLowerCase().includes(q.toLowerCase()) || s.id.toLowerCase().includes(q.toLowerCase()))
  );
  const seatPct = STUDENTS.filter(s=>s.active).length / BILLING.studentLimit * 100;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: 12, flexWrap: 'wrap' }}>
        <div>
          <h1 className="serif" style={{ margin: 0, fontSize: 24, fontWeight: 700, color: 'var(--ink-1)', letterSpacing: '-.02em' }}>Students</h1>
          <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--ink-3)' }}>{STUDENTS.length} on roll · {STUDENTS.filter(s=>s.active).length} active accounts · across {CLASSES.length} classes</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <Btn variant="ghost" size="sm" icon={SI.Upload}>Bulk import (CSV)</Btn>
          <Btn variant="ghost" size="sm" icon={SI.Download}>Export</Btn>
          <Btn variant="primary" size="sm" icon={SI.Plus}>Add student</Btn>
        </div>
      </div>

      {/* Seat license card — prominent for trial */}
      <Card style={{ borderTop: '3px solid var(--' + (seatPct > 95 ? 'terracotta' : seatPct > 80 ? 'gold' : 'forest') + ')' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 28, alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: 11, color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: '.08em', fontWeight: 700, marginBottom: 6 }}>Seat license · Starter package</div>
            <CapacityBar used={STUDENTS.filter(s=>s.active).length} total={BILLING.studentLimit} accent="forest" height={12} />
            <p style={{ margin: '10px 0 0', fontSize: 12, color: 'var(--ink-3)' }}>You have <b style={{color:'var(--ink-1)'}}>{BILLING.studentLimit - STUDENTS.filter(s=>s.active).length} seats</b> remaining on your current package. Upgrade to <b>Classroom</b> for unlimited seats and AI tutor access for all students.</p>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8 }}>
            <Btn variant="accent" size="md" icon={SI.Sparkles} onClick={() => goto('billing')}>Upgrade package</Btn>
            <span style={{ fontSize: 11, color: 'var(--ink-3)' }}>From $0.65 / student / term</span>
          </div>
        </div>
      </Card>

      {/* Filters */}
      <Card padded={false}>
        <div style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 10, borderBottom: '1px solid var(--rule-soft)', flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: 200 }}>
            <Input icon={SI.Search} placeholder="Search by name or ID…" value={q} onChange={e => setQ(e.target.value)} />
          </div>
          <div style={{ display: 'inline-flex', background: 'var(--paper-shade)', border: '1px solid var(--rule)', borderRadius: 5, padding: 2 }}>
            {[['all','All'],['1','F1'],['2','F2'],['3','F3'],['4','F4'],['5','F5'],['6','F6']].map(([k,l]) => (
              <button key={k} onClick={() => setForm(k)} style={{
                border: 0, padding: '5px 10px', borderRadius: 4, fontSize: 11.5, fontWeight: 600, cursor: 'pointer',
                background: form === k ? 'var(--paper)' : 'transparent',
                color: form === k ? 'var(--ink-1)' : 'var(--ink-3)',
                fontFamily: 'inherit', boxShadow: form === k ? '0 1px 0 var(--rule)' : 'none',
              }}>{l}</button>
            ))}
          </div>
          <Btn variant="ghost" size="sm" icon={SI.Filter}>More filters</Btn>
          <span style={{ fontSize: 11.5, color: 'var(--ink-3)', marginLeft: 'auto' }}>{filtered.length} students</span>
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead><tr><Th>Student</Th><Th>ID</Th><Th>Class</Th><Th>Engagement</Th><Th>Avg</Th><Th>Status</Th><Th>Last active</Th><Th></Th></tr></thead>
          <tbody>
            {filtered.slice(0, 14).map(s => (
              <tr key={s.id} style={{ cursor: 'pointer' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--paper-shade)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                <Td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <Avatar name={s.name} tone={s.avatarTone} size={30} />
                    <div>
                      <div style={{ fontWeight: 600, color: 'var(--ink-1)' }}>{s.name}</div>
                      <div style={{ fontSize: 11, color: 'var(--ink-3)' }}>{s.gender} · age {s.age}</div>
                    </div>
                  </div>
                </Td>
                <Td mono>{s.id}</Td>
                <Td>{s.className}</Td>
                <Td><span className="tnum" style={{ fontSize: 12 }}>{s.assessmentsTaken} assessments · {s.tutorSessions} tutor</span></Td>
                <Td mono style={{ fontWeight: 700, color: s.avgScore < 50 ? 'var(--terracotta)' : 'var(--ink-1)' }}>{s.avgScore}%</Td>
                <Td>{s.active ? <StatusPill status="active" sm /> : <StatusPill status="inactive" sm />}</Td>
                <Td dim style={{ fontSize: 11.5 }}>{s.lastActive < 2 ? 'today' : `${s.lastActive}d ago`}</Td>
                <Td><Btn variant="quiet" size="sm" icon={SI.More} /></Td>
              </tr>
            ))}
          </tbody>
        </table>
        <div style={{ padding: '10px 16px', fontSize: 11.5, color: 'var(--ink-3)', borderTop: '1px solid var(--rule-soft)', textAlign: 'center' }}>
          Showing 14 of {filtered.length} students · <a href="#" style={{ color: 'var(--forest)', fontWeight: 600 }}>Load more</a>
        </div>
      </Card>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// TEACHERS
// ─────────────────────────────────────────────────────────────────
function PageTeachers() {
  const { TEACHERS } = window.SCHOOL_DATA;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: 12 }}>
        <div>
          <h1 className="serif" style={{ margin: 0, fontSize: 24, fontWeight: 700, color: 'var(--ink-1)' }}>Teachers</h1>
          <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--ink-3)' }}>{TEACHERS.length} active staff · {TEACHERS.filter(t=>t.head).length} heads of department · 3 invitations pending</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <Btn variant="ghost" size="sm" icon={SI.Mail}>Resend pending</Btn>
          <Btn variant="primary" size="sm" icon={SI.Plus}>Invite teacher</Btn>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}>
        <KPI label="Active staff" value={TEACHERS.length} accent="forest" icon={SI.Teachers} />
        <KPI label="Heads of department" value={TEACHERS.filter(t=>t.head).length} accent="plum" icon={SI.Star} />
        <KPI label="Active this week" value="14" sub={`of ${TEACHERS.length} signed in`} accent="sky" icon={SI.Pulse} />
        <KPI label="Pending invitations" value="3" sub="sent 5 days ago" accent="gold" icon={SI.Mail} />
      </div>

      <Card padded={false}>
        <div style={{ padding: '12px 18px', borderBottom: '1px solid var(--rule-soft)' }}>
          <h3 className="serif" style={{ margin: 0, fontSize: 14, fontWeight: 700 }}>Teaching staff</h3>
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead><tr><Th>Teacher</Th><Th>Role</Th><Th>Subjects</Th><Th>Classes</Th><Th>Joined</Th><Th>Last sign-in</Th></tr></thead>
          <tbody>
            {TEACHERS.map(t => (
              <tr key={t.id} style={{ cursor: 'pointer' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--paper-shade)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                <Td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <Avatar name={t.name} tone={t.avatarTone} size={32} />
                    <div>
                      <div style={{ fontWeight: 600, color: 'var(--ink-1)', display:'flex', alignItems:'center', gap:6 }}>
                        {t.name}
                        {t.head && <Pill tone="gold" sm><SI.Star size={9} /> HoD</Pill>}
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--ink-3)' }}>{t.email}</div>
                    </div>
                  </div>
                </Td>
                <Td>{t.role}</Td>
                <Td>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                    {t.subjects.map(s => <Pill key={s} tone="neutral" sm>{s}</Pill>)}
                  </div>
                </Td>
                <Td mono><span style={{ color: 'var(--ink-2)', fontWeight: 600 }}>{t.classes.length}</span> <span style={{ color: 'var(--ink-3)', fontSize: 11 }}>· {t.classes.slice(0,2).join(', ')}{t.classes.length > 2 ? '…' : ''}</span></Td>
                <Td dim>{new Date(t.joined).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' })}</Td>
                <Td dim>{t.signedIn}</Td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// CLASSES
// ─────────────────────────────────────────────────────────────────
function PageClasses() {
  const { CLASSES } = window.SCHOOL_DATA;
  const oLevel = CLASSES.filter(c => c.level === 'O-Level');
  const aLevel = CLASSES.filter(c => c.level === 'A-Level');

  const ClassCard = ({ c }) => (
    <div style={{ background: 'var(--paper)', border: '1px solid var(--rule)', borderRadius: 6, padding: 16, position: 'relative', overflow: 'hidden' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
        <div>
          <div className="serif" style={{ fontSize: 18, fontWeight: 700, color: 'var(--ink-1)', letterSpacing: '-.015em' }}>{c.name}</div>
          <div style={{ fontSize: 11, color: 'var(--ink-3)' }}>{c.room}</div>
        </div>
        <Pill tone={c.level === 'O-Level' ? 'forest' : 'plum'} sm>{c.level}</Pill>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: 10, background: 'var(--paper-shade)', borderRadius: 5, marginBottom: 12 }}>
        <Avatar name={c.formTeacher} tone={c.formTeacherTone} size={28} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 10.5, color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: '.06em', fontWeight: 600 }}>Form teacher</div>
          <div style={{ fontSize: 12, color: 'var(--ink-1)', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.formTeacher.replace(/^(Mr\.|Mrs\.|Ms\.|Dr\.) /, '')}</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, paddingTop: 10, borderTop: '1px solid var(--rule-soft)' }}>
        <div>
          <div style={{ fontSize: 10, color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: '.06em' }}>Students</div>
          <div className="serif tnum" style={{ fontSize: 18, fontWeight: 700, color: 'var(--ink-1)', marginTop: 2 }}>{c.students}</div>
          <div style={{ fontSize: 10, color: 'var(--ink-3)' }}>{c.maleCount}M · {c.femaleCount}F</div>
        </div>
        <div>
          <div style={{ fontSize: 10, color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: '.06em' }}>Avg score</div>
          <div className="serif tnum" style={{ fontSize: 18, fontWeight: 700, color: c.avgScore < 60 ? 'var(--terracotta)' : 'var(--ink-1)', marginTop: 2 }}>{c.avgScore}%</div>
          <div style={{ fontSize: 10, color: 'var(--ink-3)' }}>this term</div>
        </div>
        <div>
          <div style={{ fontSize: 10, color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: '.06em' }}>Attendance</div>
          <div className="serif tnum" style={{ fontSize: 18, fontWeight: 700, color: 'var(--ink-1)', marginTop: 2 }}>{c.avgAttendance}%</div>
          <div style={{ fontSize: 10, color: 'var(--ink-3)' }}>30-day</div>
        </div>
      </div>
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <h1 className="serif" style={{ margin: 0, fontSize: 24, fontWeight: 700, color: 'var(--ink-1)' }}>Classes</h1>
          <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--ink-3)' }}>Form 1–6 · {CLASSES.length} classes across O-Level and A-Level streams</p>
        </div>
        <Btn variant="primary" size="sm" icon={SI.Plus}>New class</Btn>
      </div>

      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
          <h2 className="serif" style={{ margin: 0, fontSize: 17, fontWeight: 700, color: 'var(--ink-1)' }}>O-Level</h2>
          <span style={{ fontSize: 11.5, color: 'var(--ink-3)' }}>Form 1–4 · {oLevel.length} classes · {oLevel.reduce((a,c)=>a+c.students, 0)} students</span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
          {oLevel.map(c => <ClassCard key={c.id} c={c} />)}
        </div>
      </div>

      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
          <h2 className="serif" style={{ margin: 0, fontSize: 17, fontWeight: 700, color: 'var(--ink-1)' }}>A-Level</h2>
          <span style={{ fontSize: 11.5, color: 'var(--ink-3)' }}>Form 5–6 · {aLevel.length} classes · {aLevel.reduce((a,c)=>a+c.students, 0)} students</span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
          {aLevel.map(c => <ClassCard key={c.id} c={c} />)}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// ASSESSMENTS
// ─────────────────────────────────────────────────────────────────
function PageAssessments() {
  const { ASSESSMENTS, TERM_WEEKS, SUBJECT_PERFORMANCE, SCHOOL } = window.SCHOOL_DATA;
  const totalGraded = ASSESSMENTS.reduce((a,x)=>a+x.graded, 0);
  const totalUngraded = ASSESSMENTS.reduce((a,x)=>a+x.ungraded, 0);
  const aiAssisted = ASSESSMENTS.filter(a => a.mode.includes('AI')).reduce((a,x)=>a+x.graded, 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <h1 className="serif" style={{ margin: 0, fontSize: 24, fontWeight: 700, color: 'var(--ink-1)' }}>Assessments</h1>
          <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--ink-3)' }}>{totalGraded} graded · {totalUngraded} pending review · {SCHOOL.termName}</p>
        </div>
        <Btn variant="primary" size="sm" icon={SI.Plus}>New assessment</Btn>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}>
        <KPI label="Graded this term" value={totalGraded.toLocaleString()} sub={`across ${ASSESSMENTS.length} assessments`} accent="forest" icon={SI.Check} />
        <KPI label="Awaiting review" value={totalUngraded} sub="needs teacher attention" accent={totalUngraded > 5 ? 'gold' : 'forest'} icon={SI.Clock} />
        <KPI label="AI-assisted" value={`${Math.round(aiAssisted/totalGraded*100)}%`} sub={`${aiAssisted} of ${totalGraded} marked`} accent="plum" icon={SI.Sparkles} />
        <KPI label="Tutor sessions" value={TERM_WEEKS.reduce((a,w)=>a+w.aiSessions,0).toLocaleString()} sub="term-to-date" accent="sky" icon={SI.Pulse} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: 14 }}>
        <Card>
          <SectionHeader title="Term assessment activity" sub="Weekly graded counts vs AI tutor sessions" />
          <SChart.AreaLine data={TERM_WEEKS.filter(w => w.weekNum <= SCHOOL.termWeek)} valueKey="aiSessions" h={200} accent="var(--plum)" formatY={v => Math.round(v)} />
        </Card>
        <Card>
          <SectionHeader title="Subject averages" sub="Cross-form performance" />
          <SChart.HBars
            max={100}
            items={SUBJECT_PERFORMANCE.slice(0, 6).map(s => ({ label: s.subject, value: s.avgScore, suffix: '%', color: `var(--${s.color})` }))}
            h={12}
          />
        </Card>
      </div>

      <Card padded={false}>
        <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--rule-soft)' }}>
          <h3 className="serif" style={{ margin: 0, fontSize: 15, fontWeight: 700 }}>All assessments</h3>
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead><tr><Th>Title</Th><Th>Subject</Th><Th>Class</Th><Th>Teacher</Th><Th>Progress</Th><Th>Avg</Th><Th>Mode</Th><Th>Status</Th></tr></thead>
          <tbody>
            {ASSESSMENTS.map(a => (
              <tr key={a.id} style={{ cursor: 'pointer' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--paper-shade)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                <Td>
                  <div style={{ fontWeight: 600, color: 'var(--ink-1)' }}>{a.title}</div>
                  <div style={{ fontSize: 11, color: 'var(--ink-3)', marginTop: 2 }}>{a.date}{a.dueIn !== 'graded' && a.dueIn !== a.date ? ` · due ${a.dueIn}` : ''}</div>
                </Td>
                <Td dim>{a.subject}</Td>
                <Td>{a.class}</Td>
                <Td dim>{a.teacher.replace(/^(Mr\.|Mrs\.|Ms\.|Dr\.) /, '')}</Td>
                <Td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 80 }}><CapacityBar used={a.graded} total={a.total} accent={a.status === 'complete' ? 'forest' : a.status === 'in-progress' ? 'sky' : 'gold'} label={false} height={5} /></div>
                    <span className="tnum" style={{ fontSize: 11, color: 'var(--ink-3)' }}>{a.graded}/{a.total}</span>
                  </div>
                </Td>
                <Td mono style={{ fontWeight: 700, color: a.avgScore === 0 ? 'var(--ink-3)' : 'var(--ink-1)' }}>{a.avgScore || '—'}{a.avgScore ? '%' : ''}</Td>
                <Td>{a.mode.includes('AI') ? <Pill tone="plum" sm><SI.Sparkles size={9} /> AI</Pill> : <span style={{ fontSize: 11, color: 'var(--ink-3)' }}>{a.mode}</span>}</Td>
                <Td><StatusPill status={a.status} sm /></Td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// BILLING
// ─────────────────────────────────────────────────────────────────
function PageBilling() {
  const { BILLING, STUDENTS } = window.SCHOOL_DATA;
  const usedSeats = STUDENTS.filter(s=>s.active).length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      <div>
        <h1 className="serif" style={{ margin: 0, fontSize: 24, fontWeight: 700, color: 'var(--ink-1)' }}>Billing & subscription</h1>
        <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--ink-3)' }}>Manage your Kundai subscription, invoices, and seat license</p>
      </div>

      {/* Trial banner / current plan */}
      <Card style={{ borderTop: '3px solid var(--gold)', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: 18, right: 18 }}>
          <PaperStamp tone="gold" rotate={6}>Trial</PaperStamp>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 24 }}>
          <div>
            <div style={{ fontSize: 11, color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: '.08em', fontWeight: 700 }}>Current package</div>
            <div className="serif" style={{ fontSize: 26, fontWeight: 700, color: 'var(--ink-1)', marginTop: 6, letterSpacing: '-.02em' }}>{BILLING.package}</div>
            <p style={{ margin: '4px 0 0', fontSize: 12, color: 'var(--ink-3)' }}>Up to 500 students · core grading · termly billing</p>
            <div style={{ marginTop: 14, display: 'flex', alignItems: 'center', gap: 6 }}>
              <SI.Clock size={13} style={{ color: 'var(--gold-deep)' }} />
              <span style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--gold-deep)' }}>Trial ends in {BILLING.trialEndsIn} days</span>
            </div>
          </div>
          <div>
            <div style={{ fontSize: 11, color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: '.08em', fontWeight: 700 }}>Seat usage</div>
            <div className="serif tnum" style={{ fontSize: 26, fontWeight: 700, color: 'var(--ink-1)', marginTop: 6 }}>{usedSeats}<span style={{ color: 'var(--ink-3)', fontSize: 18 }}> / {BILLING.studentLimit}</span></div>
            <div style={{ marginTop: 8 }}>
              <CapacityBar used={usedSeats} total={BILLING.studentLimit} accent="forest" label={false} height={6} />
            </div>
            <p style={{ margin: '6px 0 0', fontSize: 11.5, color: 'var(--ink-3)' }}>{BILLING.studentLimit - usedSeats} seats remaining</p>
          </div>
          <div>
            <div style={{ fontSize: 11, color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: '.08em', fontWeight: 700 }}>Next invoice</div>
            <div className="serif tnum" style={{ fontSize: 26, fontWeight: 700, color: 'var(--ink-1)', marginTop: 6 }}>${BILLING.nextInvoiceAmount}</div>
            <p style={{ margin: '4px 0 0', fontSize: 12, color: 'var(--ink-3)' }}>Due {BILLING.nextInvoiceDate}</p>
            <div style={{ marginTop: 14, display: 'flex', gap: 8 }}>
              <Btn variant="accent" size="sm" icon={SI.Billing}>Pay invoice</Btn>
            </div>
          </div>
        </div>
      </Card>

      {/* Upgrade recommendation */}
      <Card style={{ background: 'linear-gradient(135deg, var(--plum-soft) 0%, var(--paper) 60%)', borderTop: '3px solid var(--plum)' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 24, alignItems: 'center' }}>
          <div>
            <Pill tone="plum" sm><SI.Sparkles size={9} /> Recommended for your school</Pill>
            <h3 className="serif" style={{ margin: '10px 0 4px', fontSize: 22, fontWeight: 700, color: 'var(--ink-1)', letterSpacing: '-.02em' }}>Upgrade to Classroom — unlimited seats, full AI tutor</h3>
            <p style={{ margin: 0, fontSize: 13, color: 'var(--ink-2)' }}>You're at {Math.round(usedSeats/BILLING.studentLimit*100)}% of your Starter seat limit. Classroom unlocks unlimited seats, AI tutor for all students, OCR, and parent portal access — typically <b>${BILLING.recommendedUpgrade.savings}/term less</b> than buying additional seats.</p>
            <ul style={{ margin: '12px 0 0', padding: 0, listStyle: 'none', display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 6 }}>
              {BILLING.recommendedUpgrade.features.map((f,i) => (
                <li key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--ink-2)' }}>
                  <SI.Check size={11} style={{ color: 'var(--plum)' }} /> {f}
                </li>
              ))}
            </ul>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div className="serif tnum" style={{ fontSize: 32, fontWeight: 800, color: 'var(--ink-1)', letterSpacing: '-.025em' }}>${BILLING.recommendedUpgrade.monthly}<span style={{ fontSize: 14, color: 'var(--ink-3)', fontWeight: 500 }}>/term</span></div>
            <p style={{ margin: '0 0 12px', fontSize: 11, color: 'var(--ink-3)' }}>${BILLING.recommendedUpgrade.perStudent}/student · billed termly</p>
            <Btn variant="accent" size="md" icon={SI.Sparkles}>Upgrade now</Btn>
          </div>
        </div>
      </Card>

      {/* Invoices */}
      <Card padded={false}>
        <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--rule-soft)' }}>
          <h3 className="serif" style={{ margin: 0, fontSize: 15, fontWeight: 700 }}>Invoices</h3>
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead><tr><Th>Reference</Th><Th>Term</Th><Th>Amount</Th><Th>Issued</Th><Th>Due</Th><Th>Status</Th><Th></Th></tr></thead>
          <tbody>
            {BILLING.invoices.map(inv => (
              <tr key={inv.id}>
                <Td mono>{inv.id}</Td>
                <Td>{inv.term}</Td>
                <Td mono style={{ fontWeight: 700, color: 'var(--ink-1)' }}>${inv.amount}</Td>
                <Td dim>{inv.issued}</Td>
                <Td dim>{inv.due}</Td>
                <Td><StatusPill status={inv.status} sm /></Td>
                <Td><Btn variant="quiet" size="sm" icon={SI.Download}>PDF</Btn></Td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// ANNOUNCEMENTS
// ─────────────────────────────────────────────────────────────────
function PageAnnouncements() {
  const { ANNOUNCEMENTS } = window.SCHOOL_DATA;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <h1 className="serif" style={{ margin: 0, fontSize: 24, fontWeight: 700, color: 'var(--ink-1)' }}>Announcements</h1>
          <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--ink-3)' }}>Communications sent to parents and guardians</p>
        </div>
        <Btn variant="primary" size="sm" icon={SI.Plus}>Compose announcement</Btn>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}>
        <KPI label="Sent this term" value={ANNOUNCEMENTS.length} accent="forest" icon={SI.Announce} />
        <KPI label="Total recipients" value={ANNOUNCEMENTS.reduce((a,x)=>a+x.recipients, 0).toLocaleString()} sub="across all messages" accent="sky" icon={SI.Mail} />
        <KPI label="Average open rate" value={`${Math.round(ANNOUNCEMENTS.reduce((a,x)=>a+(x.opens/x.recipients*100), 0) / ANNOUNCEMENTS.length)}%`} sub="opens / sent" accent="plum" icon={SI.Eye} />
        <KPI label="Pending drafts" value="2" sub="not yet sent" accent="gold" icon={SI.Edit} />
      </div>

      <Card padded={false}>
        <div>
          {ANNOUNCEMENTS.map((a, i, arr) => (
            <div key={a.id} style={{ padding: '18px 22px', borderBottom: i < arr.length-1 ? '1px solid var(--rule-soft)' : 'none', display: 'grid', gridTemplateColumns: '1fr auto', gap: 18, cursor: 'pointer' }}
                 onMouseEnter={e => e.currentTarget.style.background = 'var(--paper-shade)'}
                 onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                  <h3 className="serif" style={{ margin: 0, fontSize: 16, fontWeight: 700, color: 'var(--ink-1)' }}>{a.title}</h3>
                  <Pill tone="forest" sm dotted>Sent</Pill>
                </div>
                <p style={{ margin: '0 0 10px', fontSize: 12.5, color: 'var(--ink-2)', lineHeight: 1.5 }}>{a.body}</p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 14, fontSize: 11, color: 'var(--ink-3)' }}>
                  <span>📨 <b style={{ color: 'var(--ink-2)' }}>{a.audience}</b></span>
                  <span>By <b style={{ color: 'var(--ink-2)' }}>{a.author}</b></span>
                  <span>{a.sentDate} · {a.sent}</span>
                </div>
              </div>
              <div style={{ textAlign: 'right', minWidth: 140 }}>
                <div className="serif tnum" style={{ fontSize: 22, fontWeight: 700, color: 'var(--ink-1)' }}>{a.opens.toLocaleString()}<span style={{ fontSize: 13, color: 'var(--ink-3)', fontWeight: 500 }}> / {a.recipients}</span></div>
                <div style={{ fontSize: 10.5, color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: '.06em', fontWeight: 700, marginBottom: 8 }}>opened</div>
                <div style={{ width: 120, marginLeft: 'auto' }}>
                  <CapacityBar used={a.opens} total={a.recipients} accent="forest" label={false} height={5} />
                </div>
                <span className="tnum" style={{ fontSize: 11, color: 'var(--forest)', fontWeight: 700, marginTop: 4, display: 'inline-block' }}>{Math.round(a.opens/a.recipients*100)}% open rate</span>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// SETTINGS
// ─────────────────────────────────────────────────────────────────
function PageSettings() {
  const { SCHOOL } = window.SCHOOL_DATA;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      <div>
        <h1 className="serif" style={{ margin: 0, fontSize: 24, fontWeight: 700, color: 'var(--ink-1)' }}>Settings</h1>
        <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--ink-3)' }}>School profile, integrations, and platform preferences</p>
      </div>

      <Card>
        <SectionHeader eyebrow="School profile" title={SCHOOL.name} sub={SCHOOL.motto} />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 18 }}>
          {[
            ['School name', SCHOOL.name],
            ['Type', SCHOOL.type],
            ['Established', SCHOOL.established],
            ['Address', SCHOOL.address],
            ['Phone', SCHOOL.phone],
            ['Email', SCHOOL.email],
          ].map(([l, v]) => (
            <div key={l}>
              <div style={{ fontSize: 10.5, color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: '.08em', fontWeight: 700, marginBottom: 4 }}>{l}</div>
              <div style={{ fontSize: 13, color: 'var(--ink-1)' }}>{v}</div>
            </div>
          ))}
        </div>
      </Card>

      <Card>
        <SectionHeader title="Term & academic year" />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 18 }}>
          <div>
            <div style={{ fontSize: 10.5, color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: '.08em', fontWeight: 700, marginBottom: 4 }}>Current term</div>
            <div style={{ fontSize: 13, color: 'var(--ink-1)' }}>{SCHOOL.termName}</div>
          </div>
          <div>
            <div style={{ fontSize: 10.5, color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: '.08em', fontWeight: 700, marginBottom: 4 }}>Term progress</div>
            <div style={{ fontSize: 13, color: 'var(--ink-1)' }}>Week {SCHOOL.termWeek} of {SCHOOL.termTotalWeeks}</div>
          </div>
          <div>
            <div style={{ fontSize: 10.5, color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: '.08em', fontWeight: 700, marginBottom: 4 }}>Forms supported</div>
            <div style={{ fontSize: 13, color: 'var(--ink-1)' }}>Form 1 – Form 6 (O-Level + A-Level)</div>
          </div>
        </div>
      </Card>

      <Card>
        <SectionHeader title="Integrations" sub="Connected systems and data sources" />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {[
            { name: 'EcoCash + ZIPIT for fees', status: 'connected', sub: 'Bursar account · last sync 2h ago' },
            { name: 'Microsoft 365 — staff email', status: 'connected', sub: '@goromonzihigh.ac.zw · 16 mailboxes' },
            { name: 'WhatsApp Business — parent broadcasts', status: 'connected', sub: '478 verified parent numbers' },
            { name: 'Government MoPSE reporting', status: 'pending', sub: 'Term 2 report due 30 June' },
          ].map((it, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '12px 14px', background: 'var(--paper-shade)', border: '1px solid var(--rule-soft)', borderRadius: 5 }}>
              <div style={{ width: 32, height: 32, borderRadius: 5, background: 'var(--paper)', border: '1px solid var(--rule)', display: 'grid', placeItems: 'center' }}>
                <SI.ListTree size={14} style={{ color: 'var(--ink-2)' }} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink-1)' }}>{it.name}</div>
                <div style={{ fontSize: 11, color: 'var(--ink-3)' }}>{it.sub}</div>
              </div>
              <Pill tone={it.status === 'connected' ? 'forest' : 'gold'} sm dotted>{it.status === 'connected' ? 'Connected' : 'Action needed'}</Pill>
              <Btn variant="quiet" size="sm">Manage</Btn>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

window.PageStudents = PageStudents;
window.PageTeachers = PageTeachers;
window.PageClasses = PageClasses;
window.PageAssessments = PageAssessments;
window.PageBilling = PageBilling;
window.PageAnnouncements = PageAnnouncements;
window.PageSettings = PageSettings;
