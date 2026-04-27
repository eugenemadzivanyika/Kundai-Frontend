import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { studentService, developmentService } from '../../services/api';
import { useToast } from "@/components/ui/use-toast";
import { ChevronDown, ChevronRight, Check, Zap, X } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

// ── Backend response shapes ────────────────────────────────────────────────────
interface BackendStudent {
  _id: string;
  id?: string;
  form?: number;
  overall?: number;
  performance?: string;
  courses?: string[];
  user?: { firstName: string; lastName: string; email: string };
  firstName?: string;
  lastName?: string;
  email?: string;
}

interface BackendAttribute {
  _id: string;
  currentMastery: number;
  attribute?: {
    attribute_id?: string;
    name?: string;
    parent_unit?: string;
    description?: string;
  };
}

// ── Skill tree types ───────────────────────────────────────────────────────────
interface PlanSubskill {
  id: string;
  name: string;
  score: number;
  description?: string;
  currentMastery: number;
}
interface PlanSkill {
  id: string;
  name: string;
  score: number;
  subskills: PlanSubskill[];
}

// ── Helpers ────────────────────────────────────────────────────────────────────
function scoreBadgeClass(score: number): string {
  if (score >= 70) return 'bg-teal-50 text-teal-700 border border-teal-200';
  if (score >= 45) return 'bg-amber-50 text-amber-700 border border-amber-200';
  return 'bg-red-50 text-red-700 border border-red-200';
}

function scoreBarColor(score: number): string {
  if (score >= 70) return '#0d9488';
  if (score >= 45) return '#d97706';
  return '#ef4444';
}

function performanceLabel(score: number): string {
  if (score >= 90) return 'Excellent';
  if (score >= 70) return 'Good';
  if (score >= 50) return 'Average';
  if (score >= 30) return 'Needs Improvement';
  return 'At Risk';
}

function studentDisplayName(s: BackendStudent): string {
  if (s.user?.firstName) return `${s.user.firstName} ${s.user.lastName}`;
  if (s.firstName) return `${s.firstName} ${s.lastName ?? ''}`;
  return 'Unknown';
}

function studentInitials(s: BackendStudent): string {
  const f = s.user?.firstName?.[0] ?? s.firstName?.[0] ?? '?';
  const l = s.user?.lastName?.[0] ?? s.lastName?.[0] ?? '';
  return `${f}${l}`.toUpperCase();
}

function buildSkills(rawAttributes: BackendAttribute[]): PlanSkill[] {
  const unitMap = new Map<string, BackendAttribute[]>();
  (rawAttributes ?? []).forEach(attr => {
    const unit = attr.attribute?.parent_unit ?? 'General';
    if (!unitMap.has(unit)) unitMap.set(unit, []);
    unitMap.get(unit)!.push(attr);
  });

  return Array.from(unitMap.entries()).map(([unit, attrs]) => {
    const unitScore = Math.round(
      (attrs.reduce((sum, a) => sum + (a.currentMastery ?? 0), 0) / attrs.length) * 100
    );
    return {
      id: unit,
      name: unit,
      score: unitScore,
      subskills: attrs.map(a => ({
        id: a.attribute?.attribute_id ?? a._id,
        name: a.attribute?.name ?? unit,
        score: Math.round((a.currentMastery ?? 0) * 100),
        description: a.attribute?.description,
        currentMastery: a.currentMastery ?? 0,
      })),
    };
  });
}

const SKILL_CATEGORIES = [
  'Knowledge and Comprehension',
  'Application and Analysis',
  'Problem Solving',
] as const;

// ── Component ──────────────────────────────────────────────────────────────────
interface DevelopmentPlanCreationProps {
  studentId?: string;
  courseId?: string;
}

const DevelopmentPlanCreation: React.FC<DevelopmentPlanCreationProps> = ({
  studentId: propStudentId,
  courseId: propCourseId,
}) => {
  const { studentId: paramStudentId, courseId: paramCourseId } = useParams<{
    studentId: string;
    courseId: string;
  }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const toastRef = useRef(toast);
  toastRef.current = toast;
  const { selectedCourse } = useAuth();

  const initialStudentId = propStudentId ?? paramStudentId ?? '';
  const initialCourseId =
    propCourseId ?? paramCourseId ?? (selectedCourse as { _id?: string } | null)?._id ?? selectedCourse?.id ?? '';

  // ── State ──────────────────────────────────────────────────────────────────
  const [selectedStudent, setSelectedStudent] = useState<BackendStudent | null>(null);
  const [allStudents, setAllStudents] = useState<BackendStudent[]>([]);
  const [skills, setSkills] = useState<PlanSkill[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  const [expandedSkill, setExpandedSkill] = useState<{
    skillIndex: number | null;
    subskillIndex: number | null;
  }>({ skillIndex: null, subskillIndex: null });

  const [planName, setPlanName] = useState('');
  const [planDescription, setPlanDescription] = useState('');
  const [skillCategory, setSkillCategory] = useState<string>('Problem Solving');
  const [selectedSkills, setSelectedSkills] = useState<Set<string>>(new Set());
  const [selectedSubskills, setSelectedSubskills] = useState<Set<string>>(new Set());

  // ── Data loading ───────────────────────────────────────────────────────────
  useEffect(() => {
    studentService
      .getStudents()
      .then(data => setAllStudents(data as unknown as BackendStudent[]))
      .catch(console.error);
  }, []);

  useEffect(() => {
    if (!initialStudentId) { setLoading(false); return; }
    setLoading(true);
    setError(null);

    const load = async () => {
      try {
        const [studentData, devData] = await Promise.all([
          studentService.getStudent(initialStudentId),
          studentService.getStudentDevelopment(initialStudentId),
        ]);
        setSelectedStudent(studentData as unknown as BackendStudent);
        setSkills(buildSkills(devData.studentAttributes as BackendAttribute[]));
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Failed to load student data.';
        setError(msg);
        toastRef.current.error(msg);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [initialStudentId]);

  // ── Selection handlers ─────────────────────────────────────────────────────
  const toggleSkill = (index: number) => {
    setExpandedSkill(prev => ({
      skillIndex: prev.skillIndex === index ? null : index,
      subskillIndex: null,
    }));
  };

  const toggleSubskill = (skillIndex: number, subskillIndex: number) => {
    setExpandedSkill(prev => ({
      skillIndex,
      subskillIndex: prev.subskillIndex === subskillIndex ? null : subskillIndex,
    }));
  };

  const toggleSkillSelection = (skillId: string) => {
    const next = new Set(selectedSkills);
    if (next.has(skillId)) {
      next.delete(skillId);
      const skill = skills.find(s => s.id === skillId);
      if (skill) {
        const nextSubs = new Set(selectedSubskills);
        skill.subskills.forEach(sub => nextSubs.delete(sub.id));
        setSelectedSubskills(nextSubs);
      }
    } else {
      next.add(skillId);
    }
    setSelectedSkills(next);
  };

  const toggleSubskillSelection = (skillId: string, subId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const next = new Set(selectedSubskills);
    if (next.has(subId)) {
      next.delete(subId);
    } else {
      next.add(subId);
      if (!selectedSkills.has(skillId)) {
        setSelectedSkills(prev => new Set([...prev, skillId]));
      }
    }
    setSelectedSubskills(next);
  };

  // ── Create plan ────────────────────────────────────────────────────────────
  const handleCreatePlan = async () => {
    if (!selectedStudent || !initialCourseId || !planName.trim()) return;
    setIsCreating(true);
    try {
      const targetAttributes: Array<{ attributeId: string; initialMastery: number }> = [];
      skills.forEach(skill => {
        const skillChecked = selectedSkills.has(skill.id);
        skill.subskills.forEach(sub => {
          if (skillChecked || selectedSubskills.has(sub.id)) {
            targetAttributes.push({ attributeId: sub.id, initialMastery: sub.currentMastery });
          }
        });
      });

      await developmentService.createTeacherInitiatedPlan({
        student: selectedStudent._id,
        course: initialCourseId,
        title: planName,
        skillCategory,
        targetAttributes,
        description: planDescription,
      });

      const sName = studentDisplayName(selectedStudent);

      toast.success(`Plan created for ${sName}. Missions are being generated — it will be ready to review shortly.`);
      navigate(`/development/${selectedStudent._id}`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to create plan.';
      toast.error(msg);
    } finally {
      setIsCreating(false);
    }
  };

  // ── Guards ─────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-160px)]">
        <div className="flex items-center gap-2 text-sm text-gray-500 font-bold">
          <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-teal-500" />
          Loading Plan Builder...
        </div>
      </div>
    );
  }
  if (error) return <div className="p-4 text-red-500 text-sm font-bold border border-red-100 bg-red-50 rounded-lg">{error}</div>;

  const canCreate =
    !isCreating &&
    planName.trim().length > 0 &&
    (selectedSkills.size > 0 || selectedSubskills.size > 0);

  const totalSelected = selectedSkills.size + selectedSubskills.size;

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="flex gap-3 h-[calc(100vh-160px)] px-4 min-h-0">

      {/* ── LEFT: Student Roster ── */}
      <div className="w-56 shrink-0 bg-white rounded-lg shadow border border-slate-100 flex flex-col min-h-0 overflow-hidden">
        {/* Header */}
        <div className="px-3 py-2.5 border-b border-slate-100 shrink-0">
          <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest flex items-center gap-1">
            Students
            <span className="ml-auto text-[9px] font-bold bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded-full">
              {allStudents.length}
            </span>
          </p>
        </div>
        {/* List */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1.5 min-h-0">
          {allStudents.map(student => {
            const name = studentDisplayName(student);
            const isActive = student._id === selectedStudent?._id;
            const ovr = student.overall ?? 0;
            const perf = student.performance ?? performanceLabel(ovr);
            return (
              <div
                key={student._id}
                className={`p-2.5 rounded-lg cursor-pointer transition-all duration-150 border ${
                  isActive
                    ? 'bg-teal-50 border-teal-200 ring-1 ring-teal-400'
                    : 'bg-white border-slate-100 hover:bg-slate-50 hover:border-slate-200'
                }`}
                onClick={() => navigate(`/development/create/${student._id}/${initialCourseId}`)}
              >
                <div className="flex items-center gap-2">
                  {/* Avatar */}
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-[9px] font-black shrink-0 ${
                    isActive ? 'bg-teal-100 text-teal-800' : 'bg-slate-100 text-slate-600'
                  }`}>
                    {studentInitials(student)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-[10px] font-bold truncate leading-tight ${isActive ? 'text-teal-800' : 'text-slate-800'}`}>
                      {name}
                    </p>
                    <div className="flex items-center gap-1 mt-0.5">
                      <span className={`text-[8px] font-black px-1 py-px rounded-full border ${scoreBadgeClass(ovr)}`}>
                        {ovr}%
                      </span>
                      <span className="text-[8px] text-slate-400 truncate">{perf}</span>
                    </div>
                  </div>
                  {(perf === 'Excellent' || ovr >= 90) && (
                    <span className="text-amber-400 text-xs shrink-0">★</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── CENTRE: Plan Builder ── */}
      <div className="flex-1 bg-white rounded-lg shadow border border-slate-100 flex flex-col min-h-0 overflow-hidden">

        {/* ── Top bar ── */}
        <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between shrink-0 bg-slate-50">
          <div className="flex items-center gap-3">
            <button
              onClick={() => window.history.back()}
              className="text-slate-400 hover:text-slate-700 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
            <div>
              <h1 className="text-sm font-black text-slate-800 leading-tight">Create Development Plan</h1>
              {selectedStudent && (
                <p className="text-[10px] text-slate-400 font-semibold">
                  {studentDisplayName(selectedStudent)} · OVR {selectedStudent.overall ?? 'N/A'}%
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {totalSelected > 0 && (
              <span className="text-[9px] font-black uppercase tracking-wider text-teal-700 bg-teal-50 border border-teal-200 px-2 py-0.5 rounded-full">
                {totalSelected} focus area{totalSelected !== 1 ? 's' : ''} selected
              </span>
            )}
            <button
              onClick={handleCreatePlan}
              disabled={!canCreate}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all ${
                canCreate
                  ? 'bg-teal-600 text-white hover:bg-teal-700 shadow-sm'
                  : 'bg-slate-100 text-slate-400 cursor-not-allowed'
              }`}
            >
              <Zap className="w-3 h-3" />
              {isCreating ? 'Creating…' : 'Create Plan'}
            </button>
          </div>
        </div>

        {/* ── Body: two columns ── */}
        <div className="flex flex-1 min-h-0 overflow-hidden">

          {/* Plan config — left pane */}
          <div className="w-64 shrink-0 border-r border-slate-100 flex flex-col overflow-y-auto p-4 space-y-4">

            {/* Student chip */}
            {selectedStudent && (
              <div className="flex items-center gap-2.5 p-2.5 bg-teal-50 border border-teal-100 rounded-lg">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-teal-100 text-teal-800 font-black text-xs shrink-0">
                  {studentInitials(selectedStudent)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-black text-slate-800 truncate">{studentDisplayName(selectedStudent)}</p>
                  <p className="text-[9px] text-slate-500 truncate">
                    {selectedStudent.user?.email ?? selectedStudent.email ?? selectedStudent.id}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-[8px] text-slate-400 uppercase font-bold">OVR</p>
                  <p className="text-xs font-black text-teal-700">{selectedStudent.overall ?? 'N/A'}%</p>
                </div>
              </div>
            )}

            {/* Plan Name */}
            <div>
              <label className="block text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1.5">
                Plan Name <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                className="w-full px-2.5 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-transparent placeholder-slate-300"
                placeholder="e.g. Real Numbers Mastery Boost"
                value={planName}
                onChange={e => setPlanName(e.target.value)}
              />
            </div>

            {/* Skill Category */}
            <div>
              <label className="block text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1.5">
                Skill Category <span className="text-red-400">*</span>
              </label>
              <select
                className="w-full px-2.5 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-400 bg-white"
                value={skillCategory}
                onChange={e => setSkillCategory(e.target.value)}
              >
                {SKILL_CATEGORIES.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            {/* Description */}
            <div>
              <label className="block text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1.5">
                Description{' '}
                <span className="text-slate-300 font-normal normal-case tracking-normal">optional</span>
              </label>
              <textarea
                rows={4}
                className="w-full px-2.5 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-400 resize-none placeholder-slate-300"
                placeholder="Brief note for the student about this plan's goals…"
                value={planDescription}
                onChange={e => setPlanDescription(e.target.value)}
              />
            </div>

            {/* Summary of selections */}
            {totalSelected > 0 && (
              <div className="p-2.5 bg-slate-50 border border-slate-100 rounded-lg">
                <p className="text-[9px] font-black uppercase text-slate-400 tracking-widest mb-1.5">Selected Focus Areas</p>
                <div className="flex flex-wrap gap-1">
                  {Array.from(selectedSkills).map(id => {
                    const s = skills.find(sk => sk.id === id);
                    if (!s) return null;
                    return (
                      <span key={id} className="text-[8px] font-bold bg-teal-100 text-teal-700 px-1.5 py-0.5 rounded-full">
                        {s.name}
                      </span>
                    );
                  })}
                  {Array.from(selectedSubskills).map(id => {
                    let subName = '';
                    skills.forEach(sk => {
                      const sub = sk.subskills.find(s => s.id === id);
                      if (sub) subName = sub.name;
                    });
                    return subName ? (
                      <span key={id} className="text-[8px] font-bold bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-full">
                        {subName}
                      </span>
                    ) : null;
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Focus area selector — right pane */}
          <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
            <div className="px-4 pt-3 pb-2 shrink-0">
              <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest flex items-center">
                Select Focus Areas
                <span className="ml-2 flex-1 h-px bg-slate-100" />
              </p>
            </div>

            <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-2">
              {skills.length > 0 ? (
                skills.map((skill, skillIndex) => {
                  const isSkillChecked = selectedSkills.has(skill.id);
                  const hasCheckedSubs = skill.subskills.some(sub => selectedSubskills.has(sub.id));
                  const isExpanded = expandedSkill.skillIndex === skillIndex;
                  const checkedSubCount = skill.subskills.filter(sub => selectedSubskills.has(sub.id)).length;

                  return (
                    <div
                      key={skill.id}
                      className={`rounded-lg border overflow-hidden transition-all duration-150 ${
                        isSkillChecked || hasCheckedSubs
                          ? 'border-teal-200 shadow-sm'
                          : 'border-slate-100'
                      }`}
                    >
                      {/* Skill row */}
                      <div
                        className={`px-3 py-2.5 cursor-pointer transition-colors ${
                          isSkillChecked || hasCheckedSubs ? 'bg-teal-50' : 'bg-white hover:bg-slate-50'
                        }`}
                        onClick={() => toggleSkill(skillIndex)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2.5">
                            {/* Checkbox */}
                            <button
                              onClick={e => { e.stopPropagation(); toggleSkillSelection(skill.id); }}
                              className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-colors ${
                                isSkillChecked || hasCheckedSubs
                                  ? 'bg-teal-500 border-teal-500 text-white'
                                  : 'border-slate-300 hover:border-teal-400'
                              }`}
                            >
                              {(isSkillChecked || hasCheckedSubs) && <Check className="w-2.5 h-2.5" />}
                            </button>
                            <span className="text-xs font-bold text-slate-800">{skill.name}</span>
                            <span className={`text-[9px] font-black px-1.5 py-px rounded-full border ${scoreBadgeClass(skill.score)}`}>
                              {skill.score}%
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            {checkedSubCount > 0 && (
                              <span className="text-[8px] font-black text-teal-600 bg-teal-100 px-1.5 py-px rounded-full">
                                {checkedSubCount}/{skill.subskills.length}
                              </span>
                            )}
                            {isExpanded
                              ? <ChevronDown className="w-3 h-3 text-slate-400" />
                              : <ChevronRight className="w-3 h-3 text-slate-400" />}
                          </div>
                        </div>
                        {/* Score bar */}
                        <div className="mt-2 h-1 rounded-full bg-slate-100 overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all"
                            style={{ width: `${skill.score}%`, backgroundColor: scoreBarColor(skill.score) }}
                          />
                        </div>
                      </div>

                      {/* Subskills */}
                      {isExpanded && skill.subskills.length > 0 && (
                        <div className="border-t border-slate-100">
                          {skill.subskills.map((sub, subIndex) => {
                            const isSubChecked = selectedSubskills.has(sub.id);
                            const isSubExpanded = expandedSkill.subskillIndex === subIndex;
                            return (
                              <div key={sub.id} className="border-b border-slate-50 last:border-b-0">
                                <div
                                  className={`px-3 py-2 pl-9 flex justify-between items-center cursor-pointer transition-colors ${
                                    isSubChecked ? 'bg-teal-50/60' : 'hover:bg-slate-50'
                                  }`}
                                  onClick={() => toggleSubskill(skillIndex, subIndex)}
                                >
                                  <div className="flex items-center gap-2">
                                    <button
                                      onClick={e => toggleSubskillSelection(skill.id, sub.id, e)}
                                      className={`w-3.5 h-3.5 rounded border flex items-center justify-center shrink-0 transition-colors ${
                                        isSubChecked
                                          ? 'bg-teal-500 border-teal-500 text-white'
                                          : 'border-slate-300 hover:border-teal-400'
                                      }`}
                                    >
                                      {isSubChecked && <Check className="w-2 h-2" />}
                                    </button>
                                    <span className="text-[10px] font-semibold text-slate-700">{sub.name}</span>
                                    <span className={`text-[8px] font-black px-1 py-px rounded-full border ${scoreBadgeClass(sub.score)}`}>
                                      {sub.score}%
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-2 shrink-0">
                                    <div className="w-16 h-1 rounded-full bg-slate-100 overflow-hidden">
                                      <div
                                        className="h-full rounded-full"
                                        style={{ width: `${sub.score}%`, backgroundColor: scoreBarColor(sub.score) }}
                                      />
                                    </div>
                                    {isSubExpanded
                                      ? <ChevronDown className="w-3 h-3 text-slate-400" />
                                      : <ChevronRight className="w-3 h-3 text-slate-400" />}
                                  </div>
                                </div>

                                {isSubExpanded && (
                                  <div className="bg-slate-50 px-3 py-2.5 pl-14 border-t border-slate-100">
                                    <p className="text-[10px] text-slate-500 leading-relaxed mb-1.5">
                                      {sub.description ?? 'No description available.'}
                                    </p>
                                    <span className={`text-[8px] font-black px-1.5 py-px rounded-full border ${scoreBadgeClass(sub.score)}`}>
                                      {performanceLabel(sub.score)}
                                    </span>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })
              ) : (
                <div className="flex flex-col items-center justify-center h-40 text-slate-400 border border-dashed border-slate-200 rounded-lg bg-slate-50">
                  <p className="text-xs font-bold">No skills data available</p>
                  <p className="text-[10px] mt-1 text-slate-300">Mastery records haven't been loaded yet.</p>
                </div>
              )}
            </div>
          </div>

        </div>
      </div>

    </div>
  );
};

export default DevelopmentPlanCreation;