import React, { useState, useEffect, useCallback } from 'react';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell,
} from 'recharts';
import {
  AlertTriangle, Star, Brain, Target, ChevronRight, TrendingUp,
  TrendingDown, Minus, Download, Zap, Mail, Flag, ArrowLeft,
  ArrowRight, BarChart2,
} from 'lucide-react';
import type {
  ClassOverview, StudentRosterItem, StudentMasteryDetail,
  HeatmapData, Misconception, StudentSubmission, SiblingClass,
} from '../../types/teacherAnalytics';
import {
  getClassOverview, getClassStudents, getStudentMasteryDetail,
  getStudentSubmissions, getClassHeatmap, getClassMisconceptions,
} from '../../services/teacherAnalyticsService';

// ─── theme ───────────────────────────────────────────────────────────────────
const T = {
  canvas:   '#f6f1e7',
  paper:    '#fffaf2',
  rule:     '#e7dcc8',
  ruleSoft: '#f0e7d3',
  inkHi:    '#2b1d10',
  inkMid:   '#4d3a26',
  inkLo:    '#846c52',
  inkFaint: '#ad9a80',
  accent:   '#b85e2c',
};

type DrillLevel = 'class' | 'students' | 'individual';

// ─── helpers ─────────────────────────────────────────────────────────────────
const pct = (v: number) => `${Math.round(v * 100)}%`;

const masteryColor = (v: number) =>
  v >= 0.8 ? '#15784f' : v >= 0.6 ? '#9a6418' : v >= 0.4 ? '#b85e2c' : '#a93333';

const heatColor = (v: number | undefined) => {
  if (v == null) return T.ruleSoft;
  if (v >= 0.85) return '#15784f';
  if (v >= 0.65) return '#5a9d6e';
  if (v >= 0.45) return '#d8a14f';
  if (v >= 0.25) return '#c87238';
  return '#a93333';
};

const topicColor = (topic: string) => {
  const p: Record<string, string> = {
    Algebra: '#b45309', Geometry: '#0e7490', Statistics: '#7c2d12',
    Calculus: '#5b21b6', Vectors: '#166534', General: '#6b7280',
  };
  const keys = Object.keys(p);
  return p[topic] ?? p[keys[Math.abs([...topic].reduce((a, c) => a + c.charCodeAt(0), 0)) % (keys.length - 1)]];
};

const severityTone = (s: string) =>
  s === 'high' ? { bg: 'rgba(190,50,50,.1)', fg: '#a93333' }
  : s === 'med' ? { bg: 'rgba(190,140,40,.12)', fg: '#9a6418' }
  : { bg: 'rgba(40,90,140,.1)', fg: '#2d5d8c' };

// ─── primitives ──────────────────────────────────────────────────────────────
function Card({ children, style = {} }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{ background: T.paper, border: `1px solid ${T.rule}`, borderRadius: 6, padding: 18, boxShadow: '0 1px 2px rgba(60,40,20,.05)', ...style }}>
      {children}
    </div>
  );
}

function SecHead({ title, sub, action }: { title: string; sub?: string; action?: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 14, gap: 12, flexWrap: 'wrap' }}>
      <div>
        <div style={{ fontSize: 13, fontWeight: 700, color: T.inkHi }}>{title}</div>
        {sub && <div style={{ fontSize: 11.5, color: T.inkLo, marginTop: 3 }}>{sub}</div>}
      </div>
      {action}
    </div>
  );
}

function MasteryBar({ value, target = 0.6, h = 6, showLabel = true }: { value: number; target?: number; h?: number; showLabel?: boolean }) {
  const color = masteryColor(value);
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <div style={{ flex: 1, height: h, background: T.ruleSoft, borderRadius: 999, overflow: 'visible', position: 'relative' }}>
        <div style={{ height: '100%', width: pct(value), background: color, borderRadius: 999, transition: 'width .3s' }} />
        <div style={{ position: 'absolute', top: -2, bottom: -2, left: `${target * 100}%`, width: 1, background: T.inkFaint, opacity: 0.5 }} />
      </div>
      {showLabel && <span style={{ fontSize: 11, fontWeight: 600, color: T.inkMid, minWidth: 32, textAlign: 'right' }}>{pct(value)}</span>}
    </div>
  );
}

function Pill({ tone, sm, children }: { tone: 'risk' | 'success' | 'warn' | 'info' | 'accent' | 'neutral'; sm?: boolean; children: React.ReactNode }) {
  const tones = {
    neutral: { bg: 'rgba(120,90,60,.08)', fg: T.inkMid },
    success: { bg: 'rgba(20,120,80,.10)',  fg: '#15784f' },
    risk:    { bg: 'rgba(190,50,50,.10)',  fg: '#a93333' },
    warn:    { bg: 'rgba(190,140,40,.12)', fg: '#9a6418' },
    info:    { bg: 'rgba(40,90,140,.10)',  fg: '#2d5d8c' },
    accent:  { bg: 'rgba(176,90,40,.10)',  fg: T.accent },
  };
  const t = tones[tone];
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: sm ? '1px 6px' : '2px 9px', borderRadius: 999, background: t.bg, color: t.fg, fontSize: sm ? 10 : 11.5, fontWeight: 600 }}>
      {children}
    </span>
  );
}

function Btn({ variant = 'ghost', sm, icon: Icon, onClick, children }: {
  variant?: 'primary' | 'ghost' | 'soft'; sm?: boolean; icon?: React.ElementType;
  onClick?: () => void; children?: React.ReactNode;
}) {
  const v = variant === 'primary' ? { bg: T.accent, fg: '#fffaf2', border: T.accent }
    : variant === 'soft' ? { bg: 'rgba(176,90,40,.08)', fg: T.accent, border: 'rgba(176,90,40,.18)' }
    : { bg: 'transparent', fg: T.inkMid, border: T.rule };
  return (
    <button onClick={onClick} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: sm ? '5px 10px' : '7px 14px', borderRadius: 6, fontSize: sm ? 11.5 : 12.5, fontWeight: 600, background: v.bg, color: v.fg, border: `1px solid ${v.border}`, cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap' }}>
      {Icon && <Icon size={sm ? 12 : 14} />}{children}
    </button>
  );
}

function KPICard({ label, value, sub, accent, Icon, delta }: { label: string; value: string | number; sub?: string; accent: string; Icon: React.ElementType; delta?: number }) {
  return (
    <Card>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
        <span style={{ fontSize: 10.5, fontWeight: 700, color: T.inkLo, textTransform: 'uppercase', letterSpacing: '.08em' }}>{label}</span>
        <div style={{ width: 26, height: 26, borderRadius: 6, background: `${accent}1a`, display: 'grid', placeItems: 'center', color: accent }}><Icon size={13} /></div>
      </div>
      <div style={{ fontSize: 28, fontWeight: 700, color: T.inkHi, marginTop: 8, letterSpacing: '-.02em', lineHeight: 1 }}>{value}</div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 6, fontSize: 11.5, color: T.inkLo }}>
        {delta != null && <span style={{ color: delta >= 0 ? '#15784f' : '#a93333', fontWeight: 600 }}>{delta >= 0 ? '▲' : '▼'} {Math.abs(delta).toFixed(1)}%</span>}
        {sub && <span>{sub}</span>}
      </div>
    </Card>
  );
}

// ─── Heatmap ─────────────────────────────────────────────────────────────────
function MasteryHeatmap({ data, onStudentClick }: { data: HeatmapData; onStudentClick: (id: string) => void }) {
  return (
    <div style={{ overflowX: 'auto', overflowY: 'auto', maxHeight: 420 }}>
      <table style={{ borderCollapse: 'collapse', fontSize: 10.5, width: '100%' }}>
        <thead>
          <tr>
            <th style={{ position: 'sticky', left: 0, top: 0, background: T.paper, zIndex: 2, padding: '6px 8px', textAlign: 'left', fontWeight: 600, color: T.inkLo, minWidth: 130, borderBottom: `1px solid ${T.rule}` }}>Student</th>
            {data.skills.map(sk => (
              <th key={sk.id} style={{ position: 'sticky', top: 0, background: T.paper, padding: '4px', fontWeight: 600, color: T.inkLo, borderBottom: `1px solid ${T.rule}`, writingMode: 'vertical-rl', transform: 'rotate(180deg)', fontSize: 9.5, height: 80 }}
                title={sk.name}>{sk.name}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.students.map(student => (
            <tr key={student.id}>
              <td style={{ position: 'sticky', left: 0, background: T.paper, padding: '4px 8px', borderRight: `1px solid ${T.ruleSoft}`, fontWeight: 500, color: T.inkMid, whiteSpace: 'nowrap', cursor: 'pointer' }}
                onClick={() => onStudentClick(student.id)}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ width: 22, height: 22, borderRadius: 999, background: 'rgba(176,90,40,.14)', color: T.accent, display: 'grid', placeItems: 'center', fontSize: 9, fontWeight: 700 }}>{student.avatar}</span>
                  {student.name}
                  {student.atRisk && <AlertTriangle size={10} style={{ color: '#a93333' }} />}
                </span>
              </td>
              {data.skills.map(sk => {
                const v = data.matrix[student.id]?.[sk.id];
                return (
                  <td key={sk.id} style={{ padding: 1 }}>
                    <div title={`${student.name} · ${sk.name}: ${v != null ? pct(v) : '—'}`} onClick={() => onStudentClick(student.id)}
                      style={{ width: 22, height: 22, background: heatColor(v), borderRadius: 2, cursor: 'pointer', display: 'grid', placeItems: 'center', color: '#fff', fontSize: 8.5, fontWeight: 700 }}>
                      {v != null ? Math.round(v * 100) : '—'}
                    </div>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ─── Class overview panel ─────────────────────────────────────────────────────
function ClassOverviewPanel({
  overview, heatmap, misconceptions,
  onGoStudents, onGoStudent,
}: {
  overview: ClassOverview;
  heatmap: HeatmapData | null;
  misconceptions: Misconception[];
  onGoStudents: () => void;
  onGoStudent: (id: string) => void;
}) {
  const { kpis, weeklyProgress, topicDifficulty, scoreDistribution, benchmarks, siblingClasses, termTrend } = overview;

  const topicBarData = topicDifficulty.map(t => ({ name: t.topic, value: Math.round(t.avgMastery * 100), color: topicColor(t.topic), sub: `${t.skillCount} skills` }));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12 }}>
        <KPICard label="Class mastery" value={pct(kpis.classMastery)} sub={kpis.classMastery >= 0.6 ? 'on track' : 'below target'} accent={T.accent} Icon={Brain} delta={kpis.classMasteryDelta !== 0 ? kpis.classMasteryDelta * 100 : undefined} />
        <KPICard label="At risk" value={kpis.atRiskCount} sub={`${Math.round(kpis.atRiskCount / Math.max(1, heatmap?.students.length || 1) * 100)}% of class`} accent="#a93333" Icon={AlertTriangle} />
        <KPICard label="Excelling" value={kpis.excellingCount} sub="Mastery > 80%" accent="#15784f" Icon={Star} />
        <KPICard label="Mastered skills" value={`${kpis.masteredSkillsCount}/${kpis.totalSkills}`} sub=">60% of class above 0.85" accent="#9a6418" Icon={Target} />
      </div>

      {/* Weekly progress + Sibling comparison */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr', gap: 16 }}>
        <Card>
          <SecHead title="Mastery progression · current term" sub="Class average vs school average" />
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={weeklyProgress} margin={{ top: 4, right: 8, bottom: 4, left: -20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.ruleSoft} />
              <XAxis dataKey="week" tick={{ fontSize: 9.5, fill: T.inkFaint }} />
              <YAxis tickFormatter={v => `${Math.round(v * 100)}%`} tick={{ fontSize: 9.5, fill: T.inkFaint }} domain={[0, 1]} />
              <Tooltip formatter={(v: number) => pct(v)} />
              <Line type="monotone" dataKey="classMastery" stroke={T.accent} strokeWidth={2} dot={{ r: 2.5, fill: T.paper, stroke: T.accent }} name="Class" />
              <Line type="monotone" dataKey="schoolMastery" stroke="#9aa3b2" strokeWidth={2} dot={{ r: 2.5 }} name="School avg" strokeDasharray="4 2" />
            </LineChart>
          </ResponsiveContainer>
          <div style={{ display: 'flex', gap: 16, marginTop: 6, fontSize: 11, color: T.inkLo }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}><span style={{ display: 'inline-block', width: 12, height: 2, background: T.accent }} /> Class</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}><span style={{ display: 'inline-block', width: 12, height: 2, background: '#9aa3b2' }} /> School avg</span>
          </div>
        </Card>

        <Card>
          <SecHead title="Class vs class · same subject" sub={siblingClasses.length > 0 ? `You teach ${siblingClasses.length + 1} classes` : 'No sibling classes'} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 4 }}>
            {/* Current class */}
            <div style={{ padding: 10, borderRadius: 6, background: 'rgba(176,90,40,.06)', border: '1px solid rgba(176,90,40,.2)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 4 }}>
                <span style={{ fontSize: 12.5, fontWeight: 600, color: T.inkHi }}>This class <Pill tone="accent" sm>viewing</Pill></span>
                <span style={{ fontSize: 13, fontWeight: 700, color: T.inkHi }}>{pct(benchmarks.classAvg)}</span>
              </div>
              <MasteryBar value={benchmarks.classAvg} h={5} showLabel={false} />
            </div>
            {siblingClasses.map((cls: SiblingClass) => (
              <div key={cls.id} style={{ padding: 10, borderRadius: 6, background: 'transparent', border: `1px solid ${T.ruleSoft}` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 4 }}>
                  <span style={{ fontSize: 12.5, fontWeight: 600, color: T.inkHi }}>{cls.name}</span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: T.inkHi }}>{pct(cls.avgMastery)}</span>
                </div>
                <MasteryBar value={cls.avgMastery} h={5} showLabel={false} />
                <div style={{ fontSize: 10.5, color: T.inkFaint, marginTop: 4 }}>{cls.size} students</div>
              </div>
            ))}
            <div style={{ paddingTop: 8, borderTop: `1px dashed ${T.rule}`, fontSize: 11, color: T.inkLo, display: 'flex', justifyContent: 'space-between' }}>
              <span>School avg</span>
              <span style={{ fontWeight: 600 }}>{pct(benchmarks.schoolAvg)}</span>
            </div>
          </div>
        </Card>
      </div>

      {/* Topic difficulty + Score distribution */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 16 }}>
        <Card>
          <SecHead title="Topic difficulty · class avg mastery" sub="Lower = harder for this class" />
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={topicBarData} margin={{ top: 4, right: 8, bottom: 20, left: -20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.ruleSoft} vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 9.5, fill: T.inkFaint }} />
              <YAxis tickFormatter={v => `${v}%`} tick={{ fontSize: 9.5, fill: T.inkFaint }} domain={[0, 100]} />
              <Tooltip formatter={(v: number) => `${v}%`} />
              <Bar dataKey="value" radius={[3, 3, 0, 0]}>
                {topicBarData.map((d, i) => <Cell key={i} fill={d.color} fillOpacity={0.85} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card>
          <SecHead title="Score distribution · last assessment" sub="Most recent submission per student" />
          <ResponsiveContainer width="100%" height={140}>
            <BarChart data={scoreDistribution.buckets} margin={{ top: 4, right: 8, bottom: 4, left: -28 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.ruleSoft} vertical={false} />
              <XAxis dataKey="range" tick={{ fontSize: 9.5, fill: T.inkFaint }} />
              <YAxis tick={{ fontSize: 9.5, fill: T.inkFaint }} allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="count" radius={[3, 3, 0, 0]}>
                {scoreDistribution.buckets.map((b, i) => (
                  <Cell key={i} fill={parseInt(b.range) < 50 ? '#a93333' : T.accent} fillOpacity={0.8} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          <div style={{ marginTop: 10, paddingTop: 10, borderTop: `1px dashed ${T.rule}`, display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10 }}>
            {[['Pass rate', `${scoreDistribution.passRate}%`], ['Median', scoreDistribution.median], ['Std dev', `±${scoreDistribution.stdDev}`]].map(([l, v]) => (
              <div key={l as string}>
                <div style={{ fontSize: 10, color: T.inkFaint, textTransform: 'uppercase', letterSpacing: '.06em' }}>{l}</div>
                <div style={{ fontSize: 16, fontWeight: 700, color: T.inkHi }}>{v}</div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Mastery heatmap */}
      {heatmap && heatmap.students.length > 0 && (
        <Card>
          <SecHead
            title="Mastery heatmap · students × skills"
            sub="Click any cell or name to drill into that student · darker = stronger mastery"
            action={
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 10, color: T.inkFaint }}>
                <span>Low</span>
                {['#a93333', '#c87238', '#d8a14f', '#5a9d6e', '#15784f'].map((c, i) => <span key={i} style={{ width: 14, height: 14, background: c, borderRadius: 2, display: 'inline-block' }} />)}
                <span>High</span>
              </div>
            }
          />
          <MasteryHeatmap data={heatmap} onStudentClick={onGoStudent} />
          {heatmap.students.length >= 24 && (
            <div style={{ marginTop: 10, paddingTop: 10, borderTop: `1px dashed ${T.rule}`, fontSize: 11, color: T.inkLo }}>
              Showing 24 students. <button onClick={onGoStudents} style={{ background: 'transparent', border: 0, color: T.accent, cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600, fontSize: 11 }}>View all in roster →</button>
            </div>
          )}
        </Card>
      )}

      {/* Misconceptions */}
      {misconceptions.length > 0 && (
        <Card>
          <SecHead title="Common difficulty areas" sub="Skills where most students answer incorrectly" action={<Btn sm icon={Zap}>Generate remediation pack</Btn>} />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 10 }}>
            {misconceptions.slice(0, 6).map((m, i) => {
              const tone = severityTone(m.severity);
              return (
                <div key={i} style={{ padding: 12, borderRadius: 6, border: `1px solid ${T.ruleSoft}`, background: T.canvas }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8, marginBottom: 6 }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 9.5, fontWeight: 700, color: topicColor(m.topic), textTransform: 'uppercase', letterSpacing: '.08em' }}>{m.topic} · {m.skillName}</div>
                      <div style={{ fontSize: 12.5, fontWeight: 600, color: T.inkHi, marginTop: 2, lineHeight: 1.3 }}>{m.label}</div>
                    </div>
                    <span style={{ display: 'inline-flex', flexShrink: 0, padding: '2px 7px', borderRadius: 999, background: tone.bg, color: tone.fg, fontSize: 10, fontWeight: 700 }}>{m.severity}</span>
                  </div>
                  <div style={{ fontSize: 11, color: T.inkLo, display: 'flex', justifyContent: 'space-between', marginTop: 6, paddingTop: 6, borderTop: `1px dashed ${T.rule}` }}>
                    <span>{m.frequency} students affected</span>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* Term trend */}
      {termTrend.length > 0 && (
        <Card>
          <SecHead title="Term-over-term trend" sub="Class avg mastery across recent periods" />
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 24, padding: '12px 0' }}>
            {termTrend.map((t, i) => {
              const h = t.avgMastery * 140;
              const isLast = i === termTrend.length - 1;
              return (
                <div key={t.termId} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: T.inkHi }}>{pct(t.avgMastery)}</div>
                  <div style={{ width: '60%', height: Math.max(h, 6), background: isLast ? T.accent : 'rgba(176,90,40,.3)', borderRadius: '4px 4px 0 0' }} />
                  <div style={{ fontSize: 11, color: T.inkLo, fontWeight: 600 }}>{t.label}</div>
                  <div style={{ fontSize: 10, color: T.inkFaint }}>{t.studentCount} students</div>
                </div>
              );
            })}
          </div>
        </Card>
      )}
    </div>
  );
}

// ─── Students roster panel ────────────────────────────────────────────────────
type SortKey = 'name' | 'avgMastery' | 'velocity' | 'avgScore' | 'submissions' | 'lastActiveDays';

function StudentsRosterPanel({
  students, onGoStudent,
}: {
  students: StudentRosterItem[];
  onGoStudent: (id: string) => void;
}) {
  const [sort, setSort] = useState<{ key: SortKey; dir: 'asc' | 'desc' }>({ key: 'avgMastery', dir: 'asc' });
  const [filter, setFilter] = useState<'all' | 'risk' | 'excelling'>('all');
  const [query, setQuery] = useState('');

  const toggleSort = (k: SortKey) => setSort(s => ({ key: k, dir: s.key === k && s.dir === 'desc' ? 'asc' : 'desc' }));

  const filtered = students
    .filter(s => {
      if (filter === 'risk' && !s.atRisk) return false;
      if (filter === 'excelling' && !s.excelling) return false;
      if (query && !s.name.toLowerCase().includes(query.toLowerCase())) return false;
      return true;
    })
    .sort((a, b) => {
      const av = a[sort.key] as string | number;
      const bv = b[sort.key] as string | number;
      return sort.dir === 'asc' ? (av < bv ? -1 : av > bv ? 1 : 0) : (av > bv ? -1 : av < bv ? 1 : 0);
    });

  const SortTH = ({ k, label }: { k: SortKey; label: string }) => (
    <button onClick={() => toggleSort(k)} style={{ background: 'transparent', border: 0, color: sort.key === k ? T.inkHi : T.inkLo, fontWeight: sort.key === k ? 700 : 600, fontSize: 11, fontFamily: 'inherit', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 4, textTransform: 'uppercase', letterSpacing: '.06em', padding: '8px 4px' }}>
      {label}{sort.key === k && <span style={{ fontSize: 9 }}>{sort.dir === 'asc' ? '▲' : '▼'}</span>}
    </button>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: T.inkHi, letterSpacing: '-.02em' }}>All students</h2>
          <p style={{ margin: '4px 0 0', fontSize: 13, color: T.inkLo }}>{students.length} students · click any row to drill into individual analytics</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <Btn sm icon={Download}>Export CSV</Btn>
        </div>
      </div>

      <Card style={{ padding: 0 }}>
        {/* Toolbar */}
        <div style={{ padding: '12px 16px', display: 'flex', gap: 10, alignItems: 'center', borderBottom: `1px solid ${T.rule}`, flexWrap: 'wrap' }}>
          <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search students…"
            style={{ flex: '0 1 280px', padding: '6px 10px', background: T.canvas, border: `1px solid ${T.rule}`, borderRadius: 6, fontFamily: 'inherit', fontSize: 12, color: T.inkHi, outline: 'none' }} />
          <div style={{ display: 'flex', gap: 4, padding: 3, background: T.canvas, border: `1px solid ${T.rule}`, borderRadius: 6 }}>
            {(['all', 'risk', 'excelling'] as const).map(f => (
              <button key={f} onClick={() => setFilter(f)} style={{ border: 0, padding: '5px 10px', borderRadius: 4, fontSize: 11, fontWeight: 600, cursor: 'pointer', background: filter === f ? T.paper : 'transparent', color: filter === f ? T.inkHi : T.inkLo, fontFamily: 'inherit', display: 'inline-flex', alignItems: 'center', gap: 4, boxShadow: filter === f ? '0 1px 2px rgba(60,40,20,.08)' : 'none' }}>
                {f === 'all' ? `All ${students.length}` : f === 'risk' ? `At risk ${students.filter(s => s.atRisk).length}` : `Excelling ${students.filter(s => s.excelling).length}`}
              </button>
            ))}
          </div>
          <span style={{ fontSize: 11, color: T.inkFaint }}>{filtered.length} shown</span>
        </div>

        {/* Table */}
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: `1px solid ${T.rule}`, background: T.canvas }}>
              <th style={{ padding: '0 16px', textAlign: 'left' }}><SortTH k="name" label="Student" /></th>
              <th style={{ padding: '0 8px', textAlign: 'left', minWidth: 140 }}><SortTH k="avgMastery" label="Mastery" /></th>
              <th style={{ padding: '0 8px', textAlign: 'left' }}><SortTH k="velocity" label="Velocity" /></th>
              <th style={{ padding: '0 8px', textAlign: 'left' }}><SortTH k="avgScore" label="Avg score" /></th>
              <th style={{ padding: '0 8px', textAlign: 'left' }}><SortTH k="submissions" label="Submissions" /></th>
              <th style={{ padding: '0 8px', textAlign: 'left' }}><SortTH k="lastActiveDays" label="Last active" /></th>
              <th style={{ padding: '0 8px', textAlign: 'left' }}>Status</th>
              <th style={{ padding: '0 16px' }} />
            </tr>
          </thead>
          <tbody>
            {filtered.map(s => (
              <tr key={s.studentId} onClick={() => onGoStudent(s.studentId)} style={{ borderBottom: `1px solid ${T.ruleSoft}`, cursor: 'pointer' }}
                onMouseEnter={e => (e.currentTarget.style.background = 'rgba(176,90,40,.04)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                <td style={{ padding: '10px 16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                    <div style={{ width: 28, height: 28, borderRadius: 999, background: 'rgba(176,90,40,.14)', color: T.accent, display: 'grid', placeItems: 'center', fontSize: 10.5, fontWeight: 700 }}>
                      {s.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <div style={{ fontSize: 12.5, fontWeight: 600, color: T.inkHi }}>{s.name}</div>
                    </div>
                  </div>
                </td>
                <td style={{ padding: '10px 8px', minWidth: 140 }}><MasteryBar value={s.avgMastery} h={5} /></td>
                <td style={{ padding: '10px 8px', fontSize: 12, fontWeight: 600, color: s.velocity >= 0 ? '#15784f' : '#a93333' }}>
                  {s.velocity >= 0 ? '▲' : '▼'} {(Math.abs(s.velocity) * 100).toFixed(2)}/wk
                </td>
                <td style={{ padding: '10px 8px', color: T.inkMid, fontWeight: 600, fontSize: 12 }}>{s.avgScore}</td>
                <td style={{ padding: '10px 8px', color: T.inkMid, fontSize: 12 }}>{s.submissions}</td>
                <td style={{ padding: '10px 8px', color: T.inkFaint, fontSize: 11 }}>
                  {s.lastActiveDays === 0 ? 'today' : s.lastActiveDays >= 999 ? '—' : `${s.lastActiveDays}d ago`}
                </td>
                <td style={{ padding: '10px 8px' }}>
                  {s.atRisk ? <Pill tone="risk" sm>at risk</Pill>
                    : s.excelling ? <Pill tone="success" sm>excelling</Pill>
                    : <Pill tone="neutral" sm>on track</Pill>}
                </td>
                <td style={{ padding: '10px 16px', textAlign: 'right' }}>
                  <ChevronRight size={12} style={{ color: T.inkFaint }} />
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr><td colSpan={8} style={{ textAlign: 'center', padding: '24px', color: T.inkFaint, fontSize: 12 }}>No students match the current filter.</td></tr>
            )}
          </tbody>
        </table>
      </Card>
    </div>
  );
}

// ─── Individual student panel ─────────────────────────────────────────────────
function IndividualStudentPanel({
  student, detail, submissions, students,
  onGoStudent,
}: {
  student: StudentRosterItem;
  detail: StudentMasteryDetail | null;
  submissions: StudentSubmission[];
  students: StudentRosterItem[];
  onGoStudent: (id: string) => void;
}) {
  const idx = students.findIndex(s => s.studentId === student.studentId);
  const prev = students[(idx - 1 + students.length) % students.length];
  const next = students[(idx + 1) % students.length];

  const skillsByMastery = detail ? [...detail.skills].sort((a, b) => a.masteryProb - b.masteryProb) : [];
  const byTopic: Record<string, typeof skillsByMastery> = {};
  skillsByMastery.forEach(sk => { if (!byTopic[sk.topic]) byTopic[sk.topic] = []; byTopic[sk.topic].push(sk); });

  const myMisconceptions = skillsByMastery.filter(sk => sk.masteryProb < 0.55).slice(0, 4);

  const TrendIcon = ({ trend }: { trend: string }) =>
    trend === 'up' ? <TrendingUp size={12} style={{ color: '#15784f' }} />
    : trend === 'down' ? <TrendingDown size={12} style={{ color: '#a93333' }} />
    : <Minus size={12} style={{ color: T.inkFaint }} />;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Hero */}
      <Card>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 18, flexWrap: 'wrap' }}>
          <div style={{ width: 64, height: 64, borderRadius: 999, background: 'linear-gradient(135deg,#b85e2c,#7a3d1e)', color: '#fffaf2', display: 'grid', placeItems: 'center', fontSize: 22, fontWeight: 700, flexShrink: 0 }}>
            {student.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
          </div>
          <div style={{ flex: 1, minWidth: 240 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
              <h2 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: T.inkHi, letterSpacing: '-.02em' }}>{student.name}</h2>
              {student.atRisk && <Pill tone="risk">At risk</Pill>}
              {student.excelling && <Pill tone="success">Excelling</Pill>}
            </div>
            <div style={{ display: 'flex', gap: 22, marginTop: 14, flexWrap: 'wrap' }}>
              {[
                { label: 'Overall mastery', val: pct(student.avgMastery) },
                { label: 'Avg score', val: student.avgScore },
                { label: 'Submissions', val: student.submissions },
                { label: 'Last active', val: student.lastActiveDays === 0 ? 'Today' : student.lastActiveDays >= 999 ? '—' : `${student.lastActiveDays}d ago` },
              ].map(({ label, val }) => (
                <div key={label} style={{ minWidth: 100 }}>
                  <div style={{ fontSize: 10, color: T.inkFaint, textTransform: 'uppercase', letterSpacing: '.06em', fontWeight: 700 }}>{label}</div>
                  <div style={{ fontSize: 18, fontWeight: 700, color: T.inkHi, marginTop: 3 }}>{val}</div>
                </div>
              ))}
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, minWidth: 180 }}>
            <div style={{ display: 'flex', gap: 6 }}>
              <Btn sm icon={ArrowLeft} onClick={() => onGoStudent(prev.studentId)}>Prev</Btn>
              <Btn sm icon={ArrowRight} onClick={() => onGoStudent(next.studentId)}>Next</Btn>
            </div>
            <Btn sm icon={Flag}>Flag for intervention</Btn>
            <Btn sm icon={Mail}>Message parent</Btn>
            <Btn variant="primary" sm icon={Zap}>Assign weak-skill practice</Btn>
          </div>
        </div>
      </Card>

      {/* Per-skill BKT */}
      {skillsByMastery.length > 0 && (
        <Card>
          <SecHead title="Per-skill mastery (BKT)" sub={`${skillsByMastery.length} skills tracked · sorted weakest → strongest · line = class avg`} action={<span style={{ fontSize: 10.5, color: T.inkFaint }}>weakest 3 are candidates for targeted practice</span>} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
            {skillsByMastery.map((sk, i) => (
              <div key={sk.skillId} style={{ display: 'grid', gridTemplateColumns: '180px 1fr 110px 80px', gap: 12, alignItems: 'center', padding: '6px 0', borderBottom: i < skillsByMastery.length - 1 ? `1px dashed ${T.rule}` : 'none' }}>
                <div>
                  <div style={{ fontSize: 9.5, fontWeight: 700, color: topicColor(sk.topic), textTransform: 'uppercase', letterSpacing: '.08em' }}>{sk.topic}</div>
                  <div style={{ fontSize: 12, color: T.inkHi, fontWeight: 600 }}>{sk.skillName}</div>
                </div>
                <MasteryBar value={sk.masteryProb} target={sk.classAvg} h={8} showLabel={false} />
                <div style={{ fontSize: 11, color: T.inkLo, display: 'flex', flexDirection: 'column', gap: 1 }}>
                  <span>Class: {pct(sk.classAvg)}</span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                    <TrendIcon trend={sk.trend} />
                    <span style={{ color: sk.trend === 'up' ? '#15784f' : sk.trend === 'down' ? '#a93333' : T.inkFaint, fontWeight: 600, fontSize: 10.5 }}>{sk.trend}</span>
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  {i < 3 ? <Btn variant="soft" sm icon={Zap}>Practice</Btn>
                    : sk.masteryProb >= 0.85 ? <Pill tone="success" sm>Mastered</Pill> : null}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Progression chart + misconceptions */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: 16 }}>
        <Card>
          <SecHead title="Mastery progression" sub={`${student.name.split(' ')[0]} vs class avg vs school avg`} />
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={detail?.weeklyProgress ?? []} margin={{ top: 4, right: 8, bottom: 4, left: -20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.ruleSoft} />
              <XAxis dataKey="week" tick={{ fontSize: 9.5, fill: T.inkFaint }} />
              <YAxis tickFormatter={v => `${Math.round(v * 100)}%`} tick={{ fontSize: 9.5, fill: T.inkFaint }} domain={[0, 1]} />
              <Tooltip formatter={(v: number) => pct(v)} />
              <Line type="monotone" dataKey="student" stroke={T.accent} strokeWidth={2} dot={{ r: 2.5 }} name={student.name.split(' ')[0]} connectNulls />
              <Line type="monotone" dataKey="classMastery" stroke="#9a6418" strokeWidth={2} dot={{ r: 2 }} name="Class avg" strokeDasharray="4 2" connectNulls />
              <Line type="monotone" dataKey="schoolMastery" stroke="#9aa3b2" strokeWidth={2} dot={{ r: 2 }} name="School avg" strokeDasharray="2 4" />
            </LineChart>
          </ResponsiveContainer>
          <div style={{ display: 'flex', gap: 14, marginTop: 6, fontSize: 11, color: T.inkLo, flexWrap: 'wrap' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}><span style={{ display: 'inline-block', width: 12, height: 2, background: T.accent }} />{student.name.split(' ')[0]}</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}><span style={{ display: 'inline-block', width: 12, height: 2, background: '#9a6418' }} />Class avg</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}><span style={{ display: 'inline-block', width: 12, height: 2, background: '#9aa3b2' }} />School avg</span>
          </div>
        </Card>

        <Card>
          <SecHead title="This student's weak skills" sub={`${myMisconceptions.length} skills below 55%`} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {myMisconceptions.length === 0 && (
              <p style={{ fontSize: 12, color: T.inkFaint, fontStyle: 'italic' }}>No weak skills detected. {student.name.split(' ')[0]} is performing well.</p>
            )}
            {myMisconceptions.map(sk => (
              <div key={sk.skillId} style={{ padding: 10, borderRadius: 6, border: `1px solid ${T.ruleSoft}`, background: T.canvas }}>
                <div style={{ fontSize: 9.5, fontWeight: 700, color: topicColor(sk.topic), textTransform: 'uppercase', letterSpacing: '.08em' }}>{sk.topic}</div>
                <div style={{ fontSize: 12, fontWeight: 600, color: T.inkHi, marginTop: 2 }}>{sk.skillName}</div>
                <div style={{ marginTop: 6 }}><MasteryBar value={sk.masteryProb} target={sk.classAvg} h={5} /></div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Recent submissions */}
      {submissions.length > 0 && (
        <Card>
          <SecHead title="Recent submissions" sub={`${submissions.length} most recent attempts`} />
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: `1px solid ${T.rule}` }}>
                {['Assessment', 'Submitted', 'Score', 'Graded by', ''].map(h => (
                  <th key={h} style={{ padding: '6px 12px', textAlign: 'left', fontSize: 10, fontWeight: 700, color: T.inkLo, textTransform: 'uppercase', letterSpacing: '.06em' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {submissions.map((sub, i) => {
                const scoreColor = sub.score >= 70 ? '#15784f' : sub.score >= 50 ? '#9a6418' : '#a93333';
                return (
                  <tr key={sub.id} style={{ borderBottom: i < submissions.length - 1 ? `1px solid ${T.ruleSoft}` : 'none', cursor: 'pointer' }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'rgba(176,90,40,.04)')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                    <td style={{ padding: '8px 12px', fontSize: 12, fontWeight: 600, color: T.inkHi }}>{sub.assessmentName}</td>
                    <td style={{ padding: '8px 12px', fontSize: 11, color: T.inkFaint }}>{new Date(sub.submittedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}</td>
                    <td style={{ padding: '8px 12px', fontSize: 13, fontWeight: 700, color: scoreColor }}>{sub.score}</td>
                    <td style={{ padding: '8px 12px' }}>
                      <Pill tone={sub.gradedBy === 'AI' ? 'info' : 'neutral'} sm>{sub.gradedBy === 'AI' ? '✨ AI' : '✍ Teacher'}</Pill>
                    </td>
                    <td style={{ padding: '8px 12px', textAlign: 'right' }}><ChevronRight size={12} style={{ color: T.inkFaint }} /></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
}

// ─── Main dashboard ───────────────────────────────────────────────────────────
const ClassDrillDownDashboard: React.FC<{ classId: string }> = ({ classId: initialClassId }) => {
  const [classId, setClassId] = useState(initialClassId);
  const [drill, setDrill] = useState<DrillLevel>('class');
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);

  const [overview, setOverview] = useState<ClassOverview | null>(null);
  const [students, setStudents] = useState<StudentRosterItem[]>([]);
  const [heatmap, setHeatmap] = useState<HeatmapData | null>(null);
  const [misconceptions, setMisconceptions] = useState<Misconception[]>([]);

  const [studentDetail, setStudentDetail] = useState<StudentMasteryDetail | null>(null);
  const [studentSubmissions, setStudentSubmissions] = useState<StudentSubmission[]>([]);

  const [loadingClass, setLoadingClass] = useState(true);
  const [loadingStudent, setLoadingStudent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load class-level data when classId changes
  useEffect(() => {
    setLoadingClass(true);
    setDrill('class');
    setSelectedStudentId(null);
    setOverview(null);
    setStudents([]);
    setHeatmap(null);
    setMisconceptions([]);
    setError(null);

    Promise.all([
      getClassOverview(classId),
      getClassStudents(classId),
      getClassHeatmap(classId).catch(() => null),
      getClassMisconceptions(classId).catch(() => []),
    ])
      .then(([ov, roster, hm, mc]) => {
        setOverview(ov);
        setStudents(roster);
        setHeatmap(hm);
        setMisconceptions(mc);
      })
      .catch(err => setError(err.message || 'Failed to load analytics'))
      .finally(() => setLoadingClass(false));
  }, [classId]);

  // Load student-level data when student selected
  const selectStudent = useCallback((studentId: string) => {
    setSelectedStudentId(studentId);
    setDrill('individual');
    setLoadingStudent(true);
    setStudentDetail(null);
    setStudentSubmissions([]);

    Promise.all([
      getStudentMasteryDetail(classId, studentId),
      getStudentSubmissions(classId, studentId).catch(() => []),
    ])
      .then(([detail, subs]) => { setStudentDetail(detail); setStudentSubmissions(subs); })
      .catch(() => setStudentDetail(null))
      .finally(() => setLoadingStudent(false));
  }, [classId]);

  const selectedStudent = students.find(s => s.studentId === selectedStudentId);

  // Breadcrumb/subnav
  const siblingClasses = overview?.siblingClasses ?? [];
  const allClassTabs = overview ? [{ id: classId, name: 'This class', isCurrent: true }, ...siblingClasses.map(c => ({ id: c.id, name: c.name, isCurrent: false }))] : [];

  if (error) return (
    <div style={{ height: 'calc(100vh - 160px)', display: 'flex', alignItems: 'center', justifyContent: 'center', background: T.canvas }}>
      <div style={{ textAlign: 'center' }}>
        <AlertTriangle size={32} style={{ color: '#a93333', margin: '0 auto 8px' }} />
        <p style={{ color: T.inkLo, fontSize: 13 }}>{error}</p>
      </div>
    </div>
  );

  return (
    <div style={{ height: 'calc(100vh - 160px)', display: 'flex', flexDirection: 'column', overflow: 'hidden', background: T.canvas }}>
      {/* Subnav */}
      <div style={{ borderBottom: `1px solid ${T.rule}`, background: T.paper, padding: '10px 24px', display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap', flexShrink: 0 }}>
        {/* Class tabs */}
        {allClassTabs.length > 1 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 3, padding: 3, background: T.canvas, border: `1px solid ${T.rule}`, borderRadius: 7 }}>
            {allClassTabs.map(cls => (
              <button key={cls.id} onClick={() => { if (!cls.isCurrent) setClassId(cls.id); }}
                style={{ border: 0, padding: '5px 11px', borderRadius: 5, fontSize: 11.5, fontWeight: 600, cursor: cls.isCurrent ? 'default' : 'pointer', background: cls.isCurrent ? T.paper : 'transparent', color: cls.isCurrent ? T.inkHi : T.inkLo, fontFamily: 'inherit', boxShadow: cls.isCurrent ? '0 1px 2px rgba(60,40,20,.08)' : 'none' }}>
                {cls.name}
              </button>
            ))}
          </div>
        )}

        {/* Breadcrumb */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: T.inkLo }}>
          <button onClick={() => setDrill('class')} style={{ background: 'transparent', border: 0, color: drill === 'class' ? T.inkHi : T.inkLo, fontWeight: drill === 'class' ? 700 : 500, cursor: 'pointer', fontFamily: 'inherit', fontSize: 12, padding: 4 }}>Class overview</button>
          <ChevronRight size={11} style={{ color: T.inkFaint }} />
          <button onClick={() => setDrill('students')} style={{ background: 'transparent', border: 0, color: drill === 'students' ? T.inkHi : T.inkLo, fontWeight: drill === 'students' ? 700 : 500, cursor: 'pointer', fontFamily: 'inherit', fontSize: 12, padding: 4 }}>
            All students ({students.length})
          </button>
          {drill === 'individual' && selectedStudent && (
            <>
              <ChevronRight size={11} style={{ color: T.inkFaint }} />
              <span style={{ color: T.inkHi, fontWeight: 700 }}>{selectedStudent.name}</span>
            </>
          )}
        </div>

        <div style={{ flex: 1 }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: T.inkFaint }}>
          <BarChart2 size={13} />
          <span>Analytics</span>
        </div>
      </div>

      {/* Scrollable content */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px 40px' }}>
        {loadingClass ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12 }}>
            {[0, 1, 2, 3].map(i => <div key={i} style={{ height: 90, background: T.paper, borderRadius: 6, opacity: 0.6, animation: 'pulse 1.5s infinite' }} />)}
          </div>
        ) : (
          <>
            {drill === 'class' && overview && (
              <ClassOverviewPanel
                overview={overview}
                heatmap={heatmap}
                misconceptions={misconceptions}
                onGoStudents={() => setDrill('students')}
                onGoStudent={selectStudent}
              />
            )}

            {drill === 'students' && (
              <StudentsRosterPanel
                students={students}
                onGoStudent={selectStudent}
              />
            )}

            {drill === 'individual' && selectedStudent && (
              loadingStudent ? (
                <div style={{ textAlign: 'center', padding: '60px 0', color: T.inkFaint, fontSize: 13 }}>Loading student data…</div>
              ) : (
                <IndividualStudentPanel
                  student={selectedStudent}
                  detail={studentDetail}
                  submissions={studentSubmissions}
                  students={students}
                  onGoStudent={selectStudent}
                />
              )
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default ClassDrillDownDashboard;
