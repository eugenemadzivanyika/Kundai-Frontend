import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminService, AdminSummary } from '../../../services/api';

// ── Shared mini-components ────────────────────────────────────────────────────

interface KPICardProps {
  label: string;
  value: string | number;
  sub?: string;
  accent: string;
  icon: React.ReactNode;
  delta?: string;
}
function KPICard({ label, value, sub, accent, icon, delta }: KPICardProps) {
  return (
    <div style={{ background: 'var(--paper)', border: '1px solid var(--rule)', borderRadius: 7, padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: 11.5, color: 'var(--ink-3)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</span>
        <span style={{ width: 28, height: 28, borderRadius: 5, background: `var(--${accent}-soft)`, color: `var(--${accent})`, display: 'grid', placeItems: 'center', flexShrink: 0 }}>{icon}</span>
      </div>
      <div>
        <div style={{ fontFamily: "'Source Serif 4', serif", fontSize: 28, fontWeight: 700, color: 'var(--ink-1)', lineHeight: 1, letterSpacing: '-0.02em', fontFeatureSettings: "'tnum' 1" }}>{value}</div>
        {sub && <div style={{ fontSize: 11.5, color: 'var(--ink-3)', marginTop: 4 }}>{sub}</div>}
        {delta && <div style={{ fontSize: 11.5, color: `var(--forest)`, fontWeight: 600, marginTop: 4 }}>↑ {delta}</div>}
      </div>
    </div>
  );
}

interface UserRow {
  id: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  roles?: string[];
  active?: boolean;
  createdAt?: string;
}

function recentLabel(dateStr?: string): string {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  const now = Date.now();
  const diff = Math.floor((now - d.getTime()) / 1000);
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 86400 * 7) return `${Math.floor(diff / 86400)}d ago`;
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
}

const TONE_CYCLE = ['forest', 'plum', 'sky', 'gold', 'terracotta'];
function toneFor(name: string) {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0;
  return TONE_CYCLE[h % TONE_CYCLE.length];
}

function Avatar({ name, size = 28 }: { name: string; size?: number }) {
  const tone = toneFor(name);
  const initials = name.split(' ').filter(Boolean).slice(0, 2).map(w => w[0]).join('').toUpperCase();
  return (
    <div style={{ width: size, height: size, borderRadius: '50%', background: `var(--${tone}-soft)`, color: `var(--${tone})`, display: 'grid', placeItems: 'center', fontSize: size * 0.36, fontWeight: 700, flexShrink: 0 }}>
      {initials}
    </div>
  );
}

// ── Icons ─────────────────────────────────────────────────────────────────────
function Icon({ d, size = 14 }: { d: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d={d} />
    </svg>
  );
}
const ICONS = {
  teachers:  'M6 7.5a2.5 2.5 0 100-5 2.5 2.5 0 000 0M1 14c0-3 2-4.5 5-4.5s5 1.5 5 4.5M12 7l2 2-2 2M14 9h-3',
  students:  'M8 5.5a2.5 2.5 0 100-5 2.5 2.5 0 000 0M2 14c0-3 2.5-4.5 6-4.5s6 1.5 6 4.5',
  classes:   'M2 3h12a1 1 0 011 1v8a1 1 0 01-1 1H2a1 1 0 01-1-1V4a1 1 0 011-1zM5 3V2M11 3V2M4 8h8M4 10.5h5',
  subjects:  'M4 1h8a1 1 0 011 1v12a1 1 0 01-1 1H4a1 1 0 01-1-1V2a1 1 0 011-1zM6 5h4M6 8h4M6 11h2',
  trend:     'M1 12l4-4 3 2 4-5 3 3',
  plus:      'M8 3v10M3 8h10',
  users:     'M8 5.5a2.5 2.5 0 100-5 2.5 2.5 0 000 0M2 14c0-3 2.5-4.5 6-4.5s6 1.5 6 4.5',
};

// ── Page ──────────────────────────────────────────────────────────────────────
const SchoolDashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const [summary, setSummary] = useState<AdminSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminService.getSummary()
      .then(setSummary)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 200, color: 'var(--ink-3)', fontSize: 13 }}>
        Loading…
      </div>
    );
  }

  const recentUsers: UserRow[] = summary?.recentUsers ?? [];
  const teacherCount = summary?.totalTeachers ?? 0;
  const studentCount = summary?.totalStudents ?? 0;
  const classCount   = summary?.totalClasses  ?? 0;
  const subjectCount = summary?.activeSubjects ?? 0;

  const ATTENTION_ITEMS = [
    teacherCount === 0 && { icon: ICONS.teachers, tone: 'plum', title: 'No teachers added yet', sub: 'Add your teaching staff to get started', cta: 'Add teacher', go: '/admin/teachers' },
    studentCount === 0 && { icon: ICONS.students, tone: 'sky',  title: 'No students enrolled', sub: 'Import students via CSV or add individually', cta: 'Add students', go: '/admin/students' },
    subjectCount === 0 && { icon: ICONS.subjects, tone: 'gold', title: 'No subjects configured', sub: 'Create subjects and upload their syllabi', cta: 'Create subjects', go: '/admin/subjects' },
    classCount === 0   && { icon: ICONS.classes,  tone: 'terracotta', title: 'No classes created', sub: 'Set up class groups for your school', cta: 'Create classes', go: '/admin/classes' },
  ].filter(Boolean) as { icon: string; tone: string; title: string; sub: string; cta: string; go: string }[];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <div style={{ fontSize: 11.5, color: 'var(--ink-3)', letterSpacing: '0.06em', textTransform: 'uppercase', fontWeight: 700, marginBottom: 4 }}>
            School Admin
          </div>
          <h1 style={{ margin: 0, fontFamily: "'Source Serif 4', serif", fontSize: 26, fontWeight: 700, color: 'var(--ink-1)', letterSpacing: '-0.02em' }}>
            Dashboard
          </h1>
          <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--ink-3)' }}>
            A snapshot of your school's people, classes, and subjects.
          </p>
        </div>
        <button
          onClick={() => navigate('/admin/students')}
          style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', background: 'var(--forest)', color: '#fbf8f1', border: 0, borderRadius: 5, cursor: 'pointer', fontSize: 12.5, fontWeight: 600, fontFamily: 'inherit' }}>
          <Icon d={ICONS.plus} size={13} /> Add student
        </button>
      </div>

      {/* KPI grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}>
        <KPICard label="Teachers"  value={teacherCount} sub={`${recentUsers.filter(u => u.roles?.includes('teacher')).length > 0 ? 'Active staff' : 'Add teaching staff'}`} accent="plum"      icon={<Icon d={ICONS.teachers} size={14} />} />
        <KPICard label="Students"  value={studentCount} sub="enrolled accounts"   accent="sky"       icon={<Icon d={ICONS.students} size={14} />} />
        <KPICard label="Classes"   value={classCount}   sub="class groups"        accent="forest"    icon={<Icon d={ICONS.classes}  size={14} />} />
        <KPICard label="Subjects"  value={subjectCount} sub="active subjects"     accent="gold"      icon={<Icon d={ICONS.subjects} size={14} />} />
      </div>

      {/* Main grid: activity + attention */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: 14 }}>

        {/* Recent users */}
        <div style={{ background: 'var(--paper)', border: '1px solid var(--rule)', borderRadius: 7, overflow: 'hidden' }}>
          <div style={{ padding: '16px 20px 14px', borderBottom: '1px solid var(--rule-soft)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h3 style={{ margin: 0, fontFamily: "'Source Serif 4', serif", fontSize: 14.5, fontWeight: 700, color: 'var(--ink-1)' }}>Recent accounts</h3>
              <p style={{ margin: '3px 0 0', fontSize: 11.5, color: 'var(--ink-3)' }}>Last 10 users added to the system</p>
            </div>
          </div>
          {recentUsers.length === 0 ? (
            <div style={{ padding: '28px 20px', textAlign: 'center', color: 'var(--ink-3)', fontSize: 13 }}>
              No users yet. Start by adding teachers and students.
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  {['Name', 'Role', 'Status', 'Added'].map(h => (
                    <th key={h} style={{ padding: '8px 16px', textAlign: 'left', fontSize: 11, color: 'var(--ink-3)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', borderBottom: '1px solid var(--rule-soft)' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {recentUsers.map((u, i) => {
                  const name = `${u.firstName ?? ''} ${u.lastName ?? ''}`.trim() || u.email || 'Unknown';
                  const role = u.roles?.[0] ?? 'user';
                  const roleTone = role === 'teacher' ? 'plum' : role === 'student' ? 'sky' : role === 'admin' ? 'forest' : 'neutral';
                  return (
                    <tr key={u.id || i}
                      style={{ cursor: 'default' }}
                      onMouseEnter={e => (e.currentTarget.style.background = 'var(--paper-shade)')}
                      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                      <td style={{ padding: '9px 16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <Avatar name={name} size={28} />
                          <div>
                            <div style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--ink-1)' }}>{name}</div>
                            <div style={{ fontSize: 11, color: 'var(--ink-3)' }}>{u.email}</div>
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: '9px 16px' }}>
                        <span style={{ padding: '3px 8px', borderRadius: 4, fontSize: 11, fontWeight: 600, background: `var(--${roleTone === 'neutral' ? 'paper-shade' : roleTone + '-soft'})`, color: `var(--${roleTone === 'neutral' ? 'ink-2' : roleTone})` }}>
                          {role}
                        </span>
                      </td>
                      <td style={{ padding: '9px 16px' }}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 11.5, color: u.active !== false ? 'var(--forest)' : 'var(--terracotta)' }}>
                          <span style={{ width: 6, height: 6, borderRadius: 999, background: 'currentColor', display: 'inline-block' }} />
                          {u.active !== false ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td style={{ padding: '9px 16px', fontSize: 11.5, color: 'var(--ink-3)' }}>{recentLabel(u.createdAt)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Attention / quick links */}
        <div style={{ background: 'var(--paper)', border: '1px solid var(--rule)', borderRadius: 7, overflow: 'hidden' }}>
          <div style={{ padding: '16px 20px 14px', borderBottom: '1px solid var(--rule-soft)' }}>
            <h3 style={{ margin: 0, fontFamily: "'Source Serif 4', serif", fontSize: 14.5, fontWeight: 700, color: 'var(--ink-1)' }}>
              {ATTENTION_ITEMS.length > 0 ? 'Setup checklist' : 'Quick actions'}
            </h3>
            <p style={{ margin: '3px 0 0', fontSize: 11.5, color: 'var(--ink-3)' }}>
              {ATTENTION_ITEMS.length > 0 ? `${ATTENTION_ITEMS.length} item${ATTENTION_ITEMS.length > 1 ? 's' : ''} to complete` : 'Navigate to key areas'}
            </p>
          </div>
          <div>
            {(ATTENTION_ITEMS.length > 0 ? ATTENTION_ITEMS : [
              { icon: ICONS.teachers, tone: 'plum',  title: 'Manage teachers',  sub: `${teacherCount} active`,           cta: 'View →', go: '/admin/teachers' },
              { icon: ICONS.students, tone: 'sky',   title: 'Manage students',  sub: `${studentCount} enrolled`,         cta: 'View →', go: '/admin/students' },
              { icon: ICONS.subjects, tone: 'gold',  title: 'Manage subjects',  sub: `${subjectCount} active`,           cta: 'View →', go: '/admin/subjects' },
              { icon: ICONS.classes,  tone: 'forest',title: 'Manage classes',   sub: `${classCount} class groups`,       cta: 'View →', go: '/admin/classes' },
            ]).map((item, i, arr) => (
              <div
                key={i}
                onClick={() => navigate(item.go)}
                style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '12px 20px', borderBottom: i < arr.length - 1 ? '1px solid var(--rule-soft)' : 'none', cursor: 'pointer' }}
                onMouseEnter={e => (e.currentTarget.style.background = 'var(--paper-shade)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
              >
                <div style={{ width: 28, height: 28, borderRadius: 5, background: `var(--${item.tone}-soft)`, color: `var(--${item.tone})`, display: 'grid', placeItems: 'center', flexShrink: 0, marginTop: 1 }}>
                  <svg width={14} height={14} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d={item.icon} />
                  </svg>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--ink-1)' }}>{item.title}</div>
                  <div style={{ fontSize: 11, color: 'var(--ink-3)', marginTop: 2 }}>{item.sub}</div>
                </div>
                <span style={{ fontSize: 11.5, color: `var(--${item.tone})`, fontWeight: 700, whiteSpace: 'nowrap', marginTop: 4 }}>{item.cta}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Summary row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
        {[
          { label: 'Total users', value: summary?.totalUsers ?? 0, sub: `${summary?.activeUsers ?? 0} active · ${summary?.inactiveUsers ?? 0} inactive`, accent: 'sky' },
          { label: 'Total subjects', value: summary?.totalSubjects ?? 0, sub: `${summary?.activeSubjects ?? 0} active`, accent: 'gold' },
          { label: 'Classes', value: summary?.totalClasses ?? 0, sub: 'registered class groups', accent: 'forest' },
        ].map(card => (
          <div key={card.label} style={{ background: 'var(--paper)', border: '1px solid var(--rule)', borderRadius: 7, padding: '16px 18px' }}>
            <div style={{ fontSize: 11, color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700 }}>{card.label}</div>
            <div style={{ fontFamily: "'Source Serif 4', serif", fontSize: 24, fontWeight: 700, color: 'var(--ink-1)', margin: '6px 0 4px', fontFeatureSettings: "'tnum' 1" }}>{card.value}</div>
            <div style={{ fontSize: 11.5, color: 'var(--ink-3)' }}>{card.sub}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SchoolDashboardPage;
