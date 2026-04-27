import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { DevelopmentPlan, Student, SkillColor } from '../../types';
import { studentService, developmentService } from '../../services/api';
import { Activity, Plus, ChevronDown, Zap, Check, MoreVertical, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

interface DevelopmentViewProps {
  studentId?: string;
}

type StepDoc = {
  title: string;
  type?: string;
  exitCheckpoint?: { isPassed?: boolean };
};

type MissionDoc = {
  _id?: string;
  task: string;
  objective?: string;
  status: string;
  completedAt?: Date;
  steps?: StepDoc[];
};

type SubskillDoc = { name: string; score: number };

type SkillDoc = {
  id?: string;
  name: string;
  score: number;
  subskills?: SubskillDoc[];
  color?: SkillColor;
};

type TargetAttrDoc = { attributeId?: string; initialMastery?: number; name?: string };

type PlanDoc = {
  _id: string;
  status?: string;
  title?: string;
  name?: string;
  description?: string;
  performance?: string;
  skillCategory?: string;
  eta?: number;
  currentProgress?: number;
  progress?: number;
  missions?: MissionDoc[];
  steps?: MissionDoc[];
  skills?: SkillDoc[];
  targetAttributes?: TargetAttrDoc[];
  student?: string | { _id: string };
  plan?: {
    name?: string;
    title?: string;
    missions?: MissionDoc[];
    steps?: MissionDoc[];
    skills?: SkillDoc[];
    description?: string;
    performance?: string;
    skillCategory?: string;
    eta?: number;
  };
};

type StudentDoc = {
  _id: string;
  id?: string;
  firstName?: string;
  lastName?: string;
  overall?: number;
  performance?: string;
  user?: { firstName?: string; lastName?: string };
  courses?: string[];
  course?: string;
};

// ── Score helpers ─────────────────────────────────────────────────────────────
function scoreColor(score: number): string {
  if (score >= 70) return '#0d9488';
  if (score >= 45) return '#d97706';
  return '#ef4444';
}

// ── Status pill ───────────────────────────────────────────────────────────────
const STATUS_MAP: Record<string, { bg: string; color: string; border: string }> = {
  'Completed':   { bg: '#f0fdfa', color: '#0d9488', border: '#99f6e4' },
  'In Progress': { bg: '#ccfbf1', color: '#0f766e', border: '#5eead4' },
  'Pending':     { bg: '#f4f4f5', color: '#71717a', border: '#d4d4d8' },
  'Draft':       { bg: '#faf5ff', color: '#7c3aed', border: '#ddd6fe' },
  'Active':      { bg: '#ccfbf1', color: '#0f766e', border: '#5eead4' },
};

const StatusPill: React.FC<{ status: string }> = ({ status }) => {
  const s = STATUS_MAP[status] || STATUS_MAP['Pending'];
  return (
    <span style={{
      fontSize: 8, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.07em',
      background: s.bg, color: s.color, border: `1px solid ${s.border}`,
      padding: '2px 7px', borderRadius: 20, whiteSpace: 'nowrap',
    }}>
      {status}
    </span>
  );
};

// ── Score bar ──────────────────────────────────────────────────────────────────
const ScoreBar: React.FC<{ score: number; active?: boolean }> = ({ score, active }) => {
  const color = active ? '#0d9488' : scoreColor(score);
  const track = active ? '#99f6e4' : '#e4e4e7';
  return (
    <div style={{ height: 4, background: track, borderRadius: 99, overflow: 'hidden', marginTop: 4 }}>
      <div style={{ height: '100%', width: `${score}%`, background: color, borderRadius: 99, transition: 'width 0.5s ease' }} />
    </div>
  );
};

// ── Skill card ─────────────────────────────────────────────────────────────────
const SkillCard: React.FC<{ skill: SkillDoc; expanded: boolean; onToggle: () => void }> = ({ skill, expanded, onToggle }) => (
  <div
    onClick={onToggle}
    style={{
      borderRadius: 10,
      border: `1.5px solid ${expanded ? '#99f6e4' : '#e4e4e7'}`,
      background: expanded ? '#f0fdfa' : '#fafafa',
      cursor: 'pointer',
      transition: 'all 0.15s',
      overflow: 'hidden',
    }}
  >
    <div style={{ padding: '10px 12px' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 4 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 18, fontWeight: 900, color: expanded ? '#0d9488' : '#18181b', lineHeight: 1 }}>{skill.score}</div>
          <div style={{ fontSize: 9, fontWeight: 800, color: '#71717a', textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {skill.name}
          </div>
        </div>
        <ChevronDown
          size={12}
          style={{ color: expanded ? '#0d9488' : '#a1a1aa', transform: expanded ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s', marginTop: 2, flexShrink: 0 }}
        />
      </div>
      <ScoreBar score={skill.score} active={expanded} />
    </div>

    {/* Subskills */}
    <div style={{ maxHeight: expanded ? 300 : 0, overflow: 'hidden', transition: 'max-height 0.3s ease' }}>
      <div style={{ borderTop: '1px solid #ccfbf1', padding: '8px 12px', display: 'flex', flexDirection: 'column', gap: 5 }}>
        {skill.subskills?.map((sub: SubskillDoc, i: number) => (
          <div key={i}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 9, fontWeight: 700, color: '#3f3f46', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{sub.name}</span>
              <span style={{ fontSize: 10, fontWeight: 900, color: scoreColor(sub.score), flexShrink: 0, marginLeft: 4 }}>{sub.score}</span>
            </div>
            <ScoreBar score={sub.score} />
          </div>
        ))}
      </div>
    </div>
  </div>
);

// ── Mission row ────────────────────────────────────────────────────────────────
const MissionRow: React.FC<{ mission: MissionDoc; index: number }> = ({ mission, index }) => {
  const [open, setOpen] = useState(mission.status === 'In Progress');
  const isDone = mission.status === 'Completed';
  const isActive = mission.status === 'In Progress';

  return (
    <li style={{
      borderRadius: 10,
      border: `1.5px solid ${isActive ? '#5eead4' : isDone ? '#d4d4d8' : '#e4e4e7'}`,
      background: isActive ? '#f0fdfa' : isDone ? '#fafafa' : 'white',
      overflow: 'hidden',
      listStyle: 'none',
    }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left' }}
      >
        {/* Step number */}
        <span style={{
          width: 20, height: 20, borderRadius: '50%', flexShrink: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 8, fontWeight: 900,
          background: isDone ? '#0d9488' : isActive ? '#ccfbf1' : '#f4f4f5',
          color: isDone ? 'white' : isActive ? '#0f766e' : '#a1a1aa',
          border: isActive ? '1.5px solid #5eead4' : 'none',
        }}>
          {isDone ? <Check size={9} color="white" /> : index + 1}
        </span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontSize: 11, fontWeight: 800, color: isActive ? '#0f766e' : '#27272a', lineHeight: 1.3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {mission.task}
          </p>
          {mission.objective && (
            <p style={{ fontSize: 9, color: '#a1a1aa', marginTop: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {mission.objective}
            </p>
          )}
        </div>
        <StatusPill status={mission.status} />
        {(mission.steps?.length ?? 0) > 0 && (
          <ChevronDown
            size={11}
            style={{ color: '#a1a1aa', transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s', flexShrink: 0 }}
          />
        )}
      </button>

      {/* Steps */}
      {(mission.steps?.length ?? 0) > 0 && open && (
        <div style={{ borderTop: `1px solid ${isActive ? '#ccfbf1' : '#f4f4f5'}`, padding: '6px 12px 8px 42px', display: 'flex', flexDirection: 'column', gap: 4 }}>
          {(mission.steps ?? []).map((step: StepDoc, si: number) => {
            const passed = step.exitCheckpoint?.isPassed;
            return (
              <div key={si} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 9 }}>
                <div style={{ width: 6, height: 6, borderRadius: '50%', flexShrink: 0, background: passed ? '#0d9488' : '#d4d4d8' }} />
                <span style={{ color: passed ? '#0f766e' : '#71717a', fontWeight: passed ? 700 : 500 }}>{step.title}</span>
                {step.type && (
                  <span style={{ marginLeft: 'auto', color: '#a1a1aa', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', fontSize: 8 }}>
                    {step.type.replace('_', ' ')}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      )}
    </li>
  );
};

// ── Main component ─────────────────────────────────────────────────────────────
const DevelopmentView: React.FC<DevelopmentViewProps> = ({ studentId: propStudentId }) => {
  const { studentId: paramStudentId } = useParams<{ studentId: string }>();
  const initialStudentId = propStudentId || paramStudentId || '';
  const navigate = useNavigate();

  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [allStudents, setAllStudents] = useState<Student[]>([]);
  const [allStudentDevelopmentPlans, setAllStudentDevelopmentPlans] = useState<DevelopmentPlan[]>([]);
  const [currentDisplayPlan, setCurrentDisplayPlan] = useState<DevelopmentPlan | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedSkill, setExpandedSkill] = useState<number | null>(null);
  const [isActivating, setIsActivating] = useState(false);
  const [openKebabId, setOpenKebabId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);
  const [deleting, setDeleting] = useState(false);

  // ── Helpers ───────────────────────────────────────────────────────────────────
  const asDoc = (dp: DevelopmentPlan | null): PlanDoc | null =>
    dp as unknown as PlanDoc | null;

  const asStudent = (s: Student): StudentDoc =>
    s as unknown as StudentDoc;

  const getStudentName = (s: Student): string => {
    const d = asStudent(s);
    if (d.user?.firstName) return `${d.user.firstName} ${d.user.lastName ?? ''}`;
    if (d.firstName) return `${d.firstName} ${d.lastName ?? ''}`;
    return 'Unknown';
  };

  const getPlanData = (dp: DevelopmentPlan | null): PlanDoc | null => {
    const doc = asDoc(dp);
    if (!doc) return null;
    if (doc.plan?.name) return doc.plan as PlanDoc;
    return doc;
  };

  const getPlanProgress = (dp: DevelopmentPlan | null): number => {
    const doc = asDoc(dp);
    if (!doc) return 0;
    return doc.currentProgress ?? doc.progress ?? 0;
  };

  const getPlanName = (dp: DevelopmentPlan | null): string => {
    if (!dp) return 'Unnamed Plan';
    const d = getPlanData(dp);
    return d?.title ?? d?.name ?? 'Unnamed Plan';
  };

  const getPlanMissions = (dp: DevelopmentPlan | null): MissionDoc[] => {
    if (!dp) return [];
    const d = getPlanData(dp);
    return d?.missions ?? d?.steps ?? [];
  };

  const getPlanSkills = (dp: DevelopmentPlan | null): SkillDoc[] => {
    if (!dp) return [];
    const d = getPlanData(dp);
    const skills = d?.skills ?? [];
    if (skills.length > 0) return skills;
    return (d?.targetAttributes ?? []).map(ta => ({
      id: ta.attributeId,
      name: ta.name ?? ta.attributeId ?? 'Attribute',
      score: Math.round((ta.initialMastery ?? 0) * 100),
      subskills: [],
    }));
  };

  // ── Data Fetching ─────────────────────────────────────────────────────────────
  useEffect(() => {
    studentService.getStudents().then(setAllStudents).catch(console.error);
  }, []);

  useEffect(() => {
    if (!initialStudentId) return;
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const studentData = await studentService.getStudent(initialStudentId);
        setSelectedStudent(studentData);
        const plansData = await developmentService.getAllPlansForStudent(initialStudentId);
        setAllStudentDevelopmentPlans(plansData);
        const activePlan = plansData.find(p => asDoc(p)?.status === 'Active');
        setCurrentDisplayPlan(activePlan || plansData[0] || null);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Failed to load student development data.');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [initialStudentId]);

  const handleStudentSelect = async (newStudentId: string) => {
    setLoading(true);
    setError(null);
    try {
      const studentData = await studentService.getStudent(newStudentId);
      setSelectedStudent(studentData);
      const plansData = await developmentService.getAllPlansForStudent(newStudentId);
      setAllStudentDevelopmentPlans(plansData);
      const activePlan = plansData.find(p => asDoc(p)?.status === 'Active');
      setCurrentDisplayPlan(activePlan || plansData[0] || null);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load data for selected student.');
    } finally {
      setLoading(false);
    }
  };

  const handlePlanSelect = (plan: DevelopmentPlan) => {
    setCurrentDisplayPlan(plan);
    setExpandedSkill(null);
  };

  const handleCreatePlan = () => {
    if (!selectedStudent) return;
    const s = asStudent(selectedStudent);
    const courseId = s.courses?.[0] ?? s.course ?? '';
    navigate(`/development/create/${s._id}/${courseId}`);
  };

  const handleActivatePlan = async () => {
    if (!currentDisplayPlan) return;
    setIsActivating(true);
    try {
      const updated = await developmentService.activatePlan(asDoc(currentDisplayPlan)!._id);
      setCurrentDisplayPlan(updated);
      setAllStudentDevelopmentPlans(prev =>
        prev.map(p => asDoc(p)?._id === asDoc(updated)?._id ? updated : p)
      );
    } catch (err) {
      console.error('Failed to activate plan:', err);
    } finally {
      setIsActivating(false);
    }
  };

  const handleDeletePlan = (planId: string, planName: string) => {
    setOpenKebabId(null);
    setDeleteTarget({ id: planId, name: planName });
  };

  const confirmDeletePlan = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await developmentService.deletePlan(deleteTarget.id);
      setAllStudentDevelopmentPlans(prev => prev.filter(p => (p as unknown as { _id: string })._id !== deleteTarget.id));
      if ((currentDisplayPlan as unknown as { _id: string })?._id === deleteTarget.id) {
        setCurrentDisplayPlan(null);
      }
      toast.success(`"${deleteTarget.name}" has been deleted.`);
      setDeleteTarget(null);
    } catch {
      toast.error('Failed to delete plan. Please try again.');
    } finally {
      setDeleting(false);
    }
  };

  const getCurrentSkills = (): SkillDoc[] =>
    getPlanSkills(currentDisplayPlan).map((skill: SkillDoc) => ({
      ...skill,
      score: skill.score || 0,
      subskills: (skill.subskills || []).map((sub: SubskillDoc) => ({
        ...sub,
        score: sub.score || 0,
        color: (sub.score || 0) > 70 ? ('teal' as SkillColor) : ('amber' as SkillColor),
      })),
    }));

  // ── Guards ────────────────────────────────────────────────────────────────────
  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#a1a1aa', fontSize: 12, fontStyle: 'italic', gap: 8 }}>
      <Activity size={14} style={{ animation: 'spin 0.8s linear infinite' }} />
      Loading development data...
    </div>
  );

  if (error) return (
    <div style={{ padding: 16, fontSize: 12, color: '#ef4444', fontWeight: 700, background: '#fef2f2', borderRadius: 12, border: '1px solid #fecaca' }}>
      Error: {error}
    </div>
  );

  if (!selectedStudent) return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', fontSize: 12, color: '#a1a1aa', fontStyle: 'italic' }}>
      No student found.
    </div>
  );

  // ── Derived values ────────────────────────────────────────────────────────────
  const fullName        = getStudentName(selectedStudent);
  const mainSkills      = getCurrentSkills();
  const planData        = getPlanData(currentDisplayPlan);
  const planName        = getPlanName(currentDisplayPlan);
  const planDescription = planData?.description ?? '';
  const planPerformance = planData?.performance ?? planData?.skillCategory ?? null;
  const planEta         = planData?.eta ?? null;
  const planMissions    = getPlanMissions(currentDisplayPlan);
  const currentProgress = getPlanProgress(currentDisplayPlan);

  const SECTION_STYLE: React.CSSProperties = {
    fontSize: 9, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.07em',
    color: '#a1a1aa', display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8,
  };
  const DIVIDER_STYLE: React.CSSProperties = { flex: 1, height: 1, background: '#f4f4f5' };

  return (
    <>
    <div style={{
      height: 'calc(100vh - 160px)',
      display: 'grid',
      gridTemplateColumns: '200px 1fr 200px',
      gap: 10,
      minHeight: 0,
    }}>

      {/* ── LEFT: Identity + plan list ── */}
      <div style={{ background: 'white', borderRadius: 12, border: '1.5px solid #e4e4e7', display: 'flex', flexDirection: 'column', overflow: 'hidden', minHeight: 0 }}>

        {/* Student identity */}
        <div style={{ padding: '14px 14px 10px', borderBottom: '1px solid #f4f4f5', flexShrink: 0 }}>
          <div style={{
            width: 40, height: 40, borderRadius: 10, background: '#f0fdfa',
            border: '1.5px solid #99f6e4', display: 'flex', alignItems: 'center',
            justifyContent: 'center', margin: '0 auto 8px', fontSize: 12, fontWeight: 900, color: '#0f766e',
          }}>
            {(selectedStudent.firstName?.[0] || '?')}{(selectedStudent.lastName?.[0] || '')}
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 11, fontWeight: 900, color: '#18181b', textTransform: 'uppercase', letterSpacing: '0.04em', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {fullName}
            </div>
            <div style={{ fontSize: 9, color: '#a1a1aa', fontWeight: 700, letterSpacing: '0.08em', marginTop: 1, fontFamily: 'monospace' }}>
              {asStudent(selectedStudent).id || ''}
            </div>
            <div style={{ marginTop: 8, display: 'flex', alignItems: 'baseline', justifyContent: 'center', gap: 2 }}>
              <span style={{ fontSize: 26, fontWeight: 900, color: '#0d9488', lineHeight: 1 }}>{selectedStudent.overall}</span>
              <span style={{ fontSize: 9, fontWeight: 800, color: '#a1a1aa', textTransform: 'uppercase' }}>OVR</span>
            </div>
          </div>
        </div>

        {/* Plan list */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '10px', display: 'flex', flexDirection: 'column', gap: 4 }}>
          <div style={SECTION_STYLE}>Growth Areas<div style={DIVIDER_STYLE} /></div>
          {allStudentDevelopmentPlans.length === 0 && (
            <p style={{ fontSize: 9, color: '#a1a1aa', fontStyle: 'italic', padding: '4px 2px' }}>No plans yet.</p>
          )}
          {allStudentDevelopmentPlans.map((planItem) => {
            const planId = (planItem as unknown as { _id: string })._id;
            const isSelected = planId === (currentDisplayPlan as unknown as { _id: string })?._id;
            const progress = getPlanProgress(planItem);
            const kebabOpen = openKebabId === planId;
            return (
              <div key={planId} style={{ position: 'relative' }}>
                <button
                  onClick={() => handlePlanSelect(planItem)}
                  style={{
                    width: '100%', padding: '9px 10px', borderRadius: 9,
                    border: `1.5px solid ${isSelected ? '#5eead4' : '#e4e4e7'}`,
                    background: isSelected ? '#f0fdfa' : '#fafafa',
                    cursor: 'pointer', textAlign: 'left',
                    display: 'flex', flexDirection: 'column', gap: 5,
                    transition: 'all 0.12s',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 4 }}>
                    <span style={{ fontSize: 10, fontWeight: 800, color: isSelected ? '#0f766e' : '#3f3f46', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
                      {getPlanName(planItem)}
                    </span>
                    <StatusPill status={planItem.status || 'Draft'} />
                    <button
                      onClick={e => { e.stopPropagation(); setOpenKebabId(kebabOpen ? null : planId); }}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0 2px', color: '#a1a1aa', display: 'flex', alignItems: 'center', flexShrink: 0 }}
                    >
                      <MoreVertical size={12} />
                    </button>
                  </div>
                  {progress > 0 && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <div style={{ flex: 1, height: 3, background: isSelected ? '#99f6e4' : '#e4e4e7', borderRadius: 99, overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${progress}%`, background: isSelected ? '#0d9488' : '#a1a1aa', borderRadius: 99 }} />
                      </div>
                      <span style={{ fontSize: 8, fontWeight: 800, color: isSelected ? '#0d9488' : '#a1a1aa' }}>{progress}%</span>
                    </div>
                  )}
                  {progress === 0 && (planItem.status as string) === 'Draft' && (
                    <span style={{ fontSize: 8, color: '#a1a1aa', fontStyle: 'italic' }}>Not yet activated</span>
                  )}
                </button>
                {kebabOpen && (
                  <div style={{
                    position: 'absolute', right: 0, top: '100%', zIndex: 50,
                    background: 'white', border: '1.5px solid #e4e4e7', borderRadius: 8,
                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)', minWidth: 120, overflow: 'hidden',
                  }}>
                    <button
                      onClick={e => { e.stopPropagation(); handleDeletePlan(planId, getPlanName(planItem)); }}
                      style={{
                        width: '100%', display: 'flex', alignItems: 'center', gap: 7,
                        padding: '8px 12px', background: 'none', border: 'none',
                        cursor: 'pointer', fontSize: 11, fontWeight: 700, color: '#ef4444',
                        textAlign: 'left',
                      }}
                      onMouseEnter={e => (e.currentTarget.style.background = '#fef2f2')}
                      onMouseLeave={e => (e.currentTarget.style.background = 'none')}
                    >
                      <Trash2 size={12} /> Delete
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* CTA */}
        <div style={{ padding: 10, borderTop: '1px solid #f4f4f5', flexShrink: 0 }}>
          <button
            onClick={handleCreatePlan}
            style={{
              width: '100%', background: '#0d9488', color: 'white', border: 'none',
              borderRadius: 9, padding: '8px 12px', fontSize: 10, fontWeight: 900,
              textTransform: 'uppercase', letterSpacing: '0.06em', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
              transition: 'background 0.15s',
            }}
            onMouseEnter={e => (e.currentTarget.style.background = '#0f766e')}
            onMouseLeave={e => (e.currentTarget.style.background = '#0d9488')}
          >
            <Plus size={12} /> New Plan
          </button>
        </div>
      </div>

      {/* ── CENTRE: Plan detail ── */}
      <div style={{ background: 'white', borderRadius: 12, border: '1.5px solid #e4e4e7', display: 'flex', flexDirection: 'column', overflow: 'hidden', minHeight: 0 }}>
        {currentDisplayPlan ? (
          <>
            {/* Plan header */}
            <div style={{ padding: '14px 18px 12px', borderBottom: '1px solid #f4f4f5', background: '#fafafa', flexShrink: 0 }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <h1 style={{ fontSize: 13, fontWeight: 900, color: '#18181b', textTransform: 'uppercase', letterSpacing: '0.04em', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {planName}
                  </h1>
                  {planDescription && (
                    <p style={{ fontSize: 10, color: '#71717a', marginTop: 3, lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                      {planDescription}
                    </p>
                  )}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                  {planEta && (
                    <div style={{ background: '#f0fdfa', border: '1px solid #99f6e4', borderRadius: 8, padding: '5px 10px', textAlign: 'center' }}>
                      <div style={{ fontSize: 7, fontWeight: 900, color: '#0d9488', textTransform: 'uppercase', letterSpacing: '0.08em' }}>ETA</div>
                      <div style={{ fontSize: 13, fontWeight: 900, color: '#0f766e', lineHeight: 1 }}>{planEta}d</div>
                    </div>
                  )}
                  {planPerformance && (
                    <div style={{ background: '#f4f4f5', border: '1px solid #e4e4e7', borderRadius: 8, padding: '5px 10px', textAlign: 'center' }}>
                      <div style={{ fontSize: 7, fontWeight: 900, color: '#a1a1aa', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Type</div>
                      <div style={{ fontSize: 10, fontWeight: 900, color: '#3f3f46', lineHeight: 1.2, maxWidth: 64, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {planPerformance}
                      </div>
                    </div>
                  )}
                  {currentDisplayPlan.status !== 'Active' ? (
                    <button
                      onClick={handleActivatePlan}
                      disabled={isActivating}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 5,
                        background: isActivating ? '#71717a' : '#0d9488',
                        color: 'white', border: 'none', borderRadius: 8,
                        padding: '7px 14px', fontSize: 10, fontWeight: 900,
                        textTransform: 'uppercase', letterSpacing: '0.06em',
                        cursor: isActivating ? 'not-allowed' : 'pointer', transition: 'background 0.15s',
                      }}
                    >
                      <Zap size={12} />
                      {isActivating ? 'Activating…' : 'Activate'}
                    </button>
                  ) : (
                    <span style={{
                      display: 'flex', alignItems: 'center', gap: 5,
                      background: '#ccfbf1', color: '#0f766e', border: '1.5px solid #5eead4',
                      borderRadius: 8, padding: '7px 14px', fontSize: 10, fontWeight: 900,
                      textTransform: 'uppercase', letterSpacing: '0.06em',
                    }}>
                      <Zap size={12} /> Active
                    </span>
                  )}
                </div>
              </div>

              {/* Progress bar */}
              <div style={{ marginTop: 10, display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ flex: 1, height: 5, background: '#e4e4e7', borderRadius: 99, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${currentProgress}%`, background: '#0d9488', borderRadius: 99, transition: 'width 0.6s ease' }} />
                </div>
                <span style={{ fontSize: 10, fontWeight: 900, color: '#3f3f46', minWidth: 28 }}>{currentProgress}%</span>
              </div>
            </div>

            {/* Body: scrollable */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '14px 18px', display: 'flex', flexDirection: 'column', gap: 16 }}>

              {/* Skills */}
              {mainSkills.length > 0 && (
                <div>
                  <div style={SECTION_STYLE}>Skill Breakdown<div style={DIVIDER_STYLE} /></div>
                  <div style={{ display: 'grid', gridTemplateColumns: `repeat(${Math.min(mainSkills.length, 4)}, 1fr)`, gap: 8 }}>
                    {mainSkills.map((skill, si) => (
                      <SkillCard
                        key={si}
                        skill={skill}
                        expanded={expandedSkill === si}
                        onToggle={() => setExpandedSkill(prev => prev === si ? null : si)}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Missions */}
              {planMissions.length > 0 && (
                <div>
                  <div style={SECTION_STYLE}>Missions<div style={DIVIDER_STYLE} /></div>
                  <ol style={{ display: 'flex', flexDirection: 'column', gap: 6, listStyle: 'none', padding: 0, margin: 0 }}>
                    {planMissions.map((mission: MissionDoc, i: number) => (
                      <MissionRow key={mission._id ?? i} mission={mission} index={i} />
                    ))}
                  </ol>
                </div>
              )}

              {mainSkills.length === 0 && planMissions.length === 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: 120, color: '#a1a1aa', gap: 6 }}>
                  <Activity size={24} />
                  <span style={{ fontSize: 12, fontStyle: 'italic' }}>No content generated yet.</span>
                </div>
              )}
            </div>
          </>
        ) : (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#a1a1aa', gap: 8 }}>
            <Activity size={28} />
            <p style={{ fontSize: 12, fontStyle: 'italic', color: '#a1a1aa' }}>No development plan found.</p>
            <button
              onClick={handleCreatePlan}
              style={{
                marginTop: 4, background: '#0d9488', color: 'white', border: 'none',
                borderRadius: 9, padding: '8px 16px', fontSize: 10, fontWeight: 900,
                textTransform: 'uppercase', letterSpacing: '0.06em', cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: 6,
              }}
            >
              <Plus size={12} /> Create First Plan
            </button>
          </div>
        )}
      </div>

      {/* ── RIGHT: Students list ── */}
      <div style={{ background: 'white', borderRadius: 12, border: '1.5px solid #e4e4e7', display: 'flex', flexDirection: 'column', overflow: 'hidden', minHeight: 0 }}>
        <div style={{ padding: '12px 12px 8px', borderBottom: '1px solid #f4f4f5', flexShrink: 0 }}>
          <div style={SECTION_STYLE}>Students<div style={DIVIDER_STYLE} /></div>
        </div>
        <div style={{ flex: 1, overflowY: 'auto', padding: 8, display: 'flex', flexDirection: 'column', gap: 5 }}>
          {allStudents.map((s) => {
            const sName = getStudentName(s);
            const sid = asStudent(s)._id;
            const isActive = sid === asStudent(selectedStudent)._id;
            const studentPlan = allStudentDevelopmentPlans.find(p => {
              const pd = asDoc(p);
              return pd?.student === sid || (pd?.student as { _id: string } | undefined)?._id === sid;
            });
            const sPlanProgress = getPlanProgress(studentPlan ?? null);

            return (
              <div
                key={sid}
                onClick={() => handleStudentSelect(sid)}
                style={{
                  borderRadius: 10,
                  border: `1.5px solid ${isActive ? '#5eead4' : '#e4e4e7'}`,
                  background: isActive ? '#f0fdfa' : 'white',
                  cursor: 'pointer',
                  padding: '8px 10px',
                  transition: 'all 0.12s',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{
                    width: 28, height: 28, borderRadius: 8, flexShrink: 0,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 10, fontWeight: 900,
                    background: isActive ? '#ccfbf1' : '#f4f4f5',
                    color: isActive ? '#0f766e' : '#71717a',
                    border: `1px solid ${isActive ? '#99f6e4' : '#e4e4e7'}`,
                  }}>
                    {s.firstName?.[0]}{s.lastName?.[0]}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 10, fontWeight: 800, color: isActive ? '#0f766e' : '#27272a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {sName}
                    </div>
                    <div style={{ fontSize: 9, color: '#a1a1aa', fontWeight: 600 }}>
                      OVR: <span style={{ color: isActive ? '#0d9488' : scoreColor(s.overall || 0), fontWeight: 800 }}>{s.overall || 'N/A'}</span>
                    </div>
                  </div>
                  {(s.performance === 'Excellent' || (s.overall ?? 0) >= 90) && (
                    <span style={{ fontSize: 11, color: '#f59e0b', flexShrink: 0 }}>★</span>
                  )}
                </div>

                {studentPlan && (
                  <div style={{ marginTop: 6 }}>
                    <div style={{ height: 3, borderRadius: 99, background: isActive ? '#99f6e4' : '#e4e4e7', overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${sPlanProgress}%`, background: isActive ? '#0d9488' : '#d4d4d8', borderRadius: 99, transition: 'width 0.5s ease' }} />
                    </div>
                    <div style={{ fontSize: 8, fontWeight: 700, marginTop: 2, color: isActive ? '#0d9488' : '#a1a1aa' }}>
                      {sPlanProgress}% complete
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

    </div>

      {/* ── Delete confirmation modal ── */}
      {deleteTarget && (
        <div
          style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(15,23,42,0.45)', backdropFilter: 'blur(2px)' }}
          onClick={() => { if (!deleting) setDeleteTarget(null); }}
        >
          <div
            style={{ background: 'white', borderRadius: 14, padding: '28px 28px 22px', maxWidth: 420, width: '90%', boxShadow: '0 20px 60px rgba(0,0,0,0.18)', display: 'flex', flexDirection: 'column', gap: 16 }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
              <div style={{ flexShrink: 0, width: 38, height: 38, borderRadius: '50%', background: '#fef2f2', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Trash2 size={18} color="#ef4444" />
              </div>
              <div>
                <div style={{ fontSize: 15, fontWeight: 700, color: '#0f172a', marginBottom: 4 }}>Delete plan</div>
                <div style={{ fontSize: 13, color: '#64748b', lineHeight: 1.5 }}>
                  Are you sure you want to delete <strong style={{ color: '#0f172a' }}>"{deleteTarget.name}"</strong>? This will permanently remove the plan. This action cannot be undone.
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 4 }}>
              <button
                disabled={deleting}
                onClick={() => setDeleteTarget(null)}
                style={{ padding: '7px 16px', borderRadius: 8, border: '1.5px solid #e2e8f0', background: 'white', fontSize: 13, fontWeight: 600, color: '#475569', cursor: 'pointer', fontFamily: 'inherit', opacity: deleting ? 0.5 : 1 }}
              >
                Cancel
              </button>
              <button
                disabled={deleting}
                onClick={confirmDeletePlan}
                style={{ padding: '7px 16px', borderRadius: 8, border: 'none', background: deleting ? '#fca5a5' : '#ef4444', fontSize: 13, fontWeight: 600, color: 'white', cursor: deleting ? 'not-allowed' : 'pointer', fontFamily: 'inherit', minWidth: 80 }}
              >
                {deleting ? 'Deleting…' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default DevelopmentView;