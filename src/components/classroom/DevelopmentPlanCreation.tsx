import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { studentService, developmentService, notificationService } from '../../services/api';
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronRight, Check } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

// ── Backend response shapes ────────────────────────────────────────────────────
// The actual shape returned by GET /students/:id (user is populated)
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

// Individual StudentAttribute document (attribute is populated)
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

// Maps raw studentAttributes array into skill cards grouped by parent_unit
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
  // Keep a stable ref so the data-loading effect doesn't re-run when toast's
  // function identity changes on each render (which would cause an infinite loop).
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

      const createdPlan = await developmentService.createPlan({
        student: selectedStudent._id,
        course: initialCourseId,
        title: planName,
        skillCategory,
        targetAttributes,
        description: planDescription,
        status: 'Draft',
      });

      const sName = studentDisplayName(selectedStudent);
      const focusAreas = skills
        .filter(s => selectedSkills.has(s.id) || s.subskills.some(sub => selectedSubskills.has(sub.id)))
        .map(s => s.name);

      await notificationService.createNotification({
        recipient: selectedStudent._id,
        title: `New Development Plan: ${planName}`,
        message:
          `A new development plan "${planName}" has been created for ${sName}.\n\n` +
          (focusAreas.length > 0 ? `Focus areas: ${focusAreas.join(', ')}.\n\n` : '') +
          `Please check your plans section to get started.`,
        notifType: 'development_plan',
        data: { planId: (createdPlan as { _id?: string })._id ?? '' },
      });

      toast.success(`Plan created — ${sName} has been notified.`);
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
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-teal-500" />
      </div>
    );
  }
  if (error) return <div className="p-4 text-red-500">{error}</div>;

  const canCreate =
    !isCreating &&
    planName.trim().length > 0 &&
    (selectedSkills.size > 0 || selectedSubskills.size > 0);

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="container mx-auto p-6">
      <div className="flex flex-col md:flex-row gap-6">

        {/* ── Main content ── */}
        <div className="flex-1">

          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold">Create Development Plan</h1>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => window.history.back()}>Cancel</Button>
              <Button onClick={handleCreatePlan} disabled={!canCreate}>
                {isCreating ? 'Creating…' : 'Create Plan'}
              </Button>
            </div>
          </div>

          {/* Plan Name */}
          <div className="mb-4">
            <label htmlFor="planName" className="block text-sm font-semibold text-gray-700 mb-1">
              Plan Name <span className="text-red-500">*</span>
            </label>
            <input
              id="planName"
              type="text"
              className="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-teal-400"
              placeholder="e.g. Real Numbers Mastery Boost"
              value={planName}
              onChange={e => setPlanName(e.target.value)}
            />
          </div>

          {/* Skill Category */}
          <div className="mb-4">
            <label htmlFor="skillCategory" className="block text-sm font-semibold text-gray-700 mb-1">
              Skill Category <span className="text-red-500">*</span>
            </label>
            <select
              id="skillCategory"
              className="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-teal-400 bg-white"
              value={skillCategory}
              onChange={e => setSkillCategory(e.target.value)}
            >
              {SKILL_CATEGORIES.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          {/* Description */}
          <div className="mb-6">
            <label htmlFor="planDesc" className="block text-sm font-semibold text-gray-700 mb-1">
              Description{' '}
              <span className="text-gray-400 font-normal text-xs">(optional)</span>
            </label>
            <textarea
              id="planDesc"
              rows={2}
              className="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-teal-400 resize-none"
              placeholder="Brief note for the student about this plan's goals…"
              value={planDescription}
              onChange={e => setPlanDescription(e.target.value)}
            />
          </div>

          {/* Student info */}
          {selectedStudent && (
            <div className="mb-6">
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Student</p>
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-md border">
                <div className="w-10 h-10 rounded-full flex items-center justify-center bg-teal-100 text-teal-800 font-bold text-sm shrink-0">
                  {studentInitials(selectedStudent)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold">{studentDisplayName(selectedStudent)}</p>
                  <p className="text-xs text-gray-500">
                    {selectedStudent.user?.email ?? selectedStudent.email ?? selectedStudent.id}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-[10px] text-gray-400">Overall</p>
                  <p className="font-black text-teal-700">{selectedStudent.overall ?? 'N/A'}%</p>
                </div>
              </div>
            </div>
          )}

          {/* Focus area selection */}
          <div>
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">
              Select Focus Areas
            </p>

            {skills.length > 0 ? (
              <div className="space-y-2">
                {skills.map((skill, skillIndex) => {
                  const isSkillChecked = selectedSkills.has(skill.id);
                  const hasCheckedSubs = skill.subskills.some(sub => selectedSubskills.has(sub.id));
                  const isExpanded = expandedSkill.skillIndex === skillIndex;

                  return (
                    <div key={skill.id} className="overflow-hidden border rounded-lg">
                      <div
                        className={`p-3 cursor-pointer transition-colors ${
                          isSkillChecked || hasCheckedSubs ? 'bg-teal-50' : 'hover:bg-gray-50'
                        }`}
                        onClick={() => toggleSkill(skillIndex)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <button
                              onClick={e => { e.stopPropagation(); toggleSkillSelection(skill.id); }}
                              className={`w-5 h-5 rounded border flex items-center justify-center shrink-0 transition-colors ${
                                isSkillChecked || hasCheckedSubs
                                  ? 'bg-teal-500 border-teal-500 text-white'
                                  : 'border-gray-300 hover:border-teal-400'
                              }`}
                            >
                              {(isSkillChecked || hasCheckedSubs) && <Check className="w-3 h-3" />}
                            </button>
                            <span className="text-sm font-semibold">{skill.name}</span>
                            <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-bold ${scoreBadgeClass(skill.score)}`}>
                              {skill.score}%
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-gray-400">
                              {skill.subskills.filter(sub => selectedSubskills.has(sub.id)).length}/{skill.subskills.length}
                            </span>
                            {isExpanded
                              ? <ChevronDown className="w-4 h-4 text-gray-400" />
                              : <ChevronRight className="w-4 h-4 text-gray-400" />}
                          </div>
                        </div>
                        <div className="mt-2 h-1.5 rounded-full bg-gray-200 overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all"
                            style={{ width: `${skill.score}%`, backgroundColor: scoreBarColor(skill.score) }}
                          />
                        </div>
                      </div>

                      {isExpanded && skill.subskills.length > 0 && (
                        <div className="border-t">
                          {skill.subskills.map((sub, subIndex) => {
                            const isSubChecked = selectedSubskills.has(sub.id);
                            const isSubExpanded = expandedSkill.subskillIndex === subIndex;
                            return (
                              <div key={sub.id} className="border-b last:border-b-0">
                                <div
                                  className="p-3 pl-10 pr-4 flex justify-between items-center cursor-pointer hover:bg-gray-50"
                                  onClick={() => toggleSubskill(skillIndex, subIndex)}
                                >
                                  <div className="flex items-center gap-3">
                                    <button
                                      onClick={e => toggleSubskillSelection(skill.id, sub.id, e)}
                                      className={`w-5 h-5 rounded border flex items-center justify-center shrink-0 transition-colors ${
                                        isSubChecked
                                          ? 'bg-teal-500 border-teal-500 text-white'
                                          : 'border-gray-300 hover:border-teal-400'
                                      }`}
                                    >
                                      {isSubChecked && <Check className="w-3 h-3" />}
                                    </button>
                                    <span className="text-sm">{sub.name}</span>
                                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-bold ${scoreBadgeClass(sub.score)}`}>
                                      {sub.score}%
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-2 shrink-0">
                                    <div className="w-20 h-1.5 rounded-full bg-gray-200 overflow-hidden">
                                      <div
                                        className="h-full rounded-full transition-all"
                                        style={{ width: `${sub.score}%`, backgroundColor: scoreBarColor(sub.score) }}
                                      />
                                    </div>
                                    {isSubExpanded
                                      ? <ChevronDown className="w-4 h-4 text-gray-400" />
                                      : <ChevronRight className="w-4 h-4 text-gray-400" />}
                                  </div>
                                </div>

                                {isSubExpanded && (
                                  <div className="bg-gray-50 px-4 py-3 pl-16 text-sm text-gray-600 border-t">
                                    <p className="mb-2">{sub.description ?? 'No description available.'}</p>
                                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-bold ${scoreBadgeClass(sub.score)}`}>
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
                })}
              </div>
            ) : (
              <div className="text-center py-10 text-gray-400 border rounded-lg bg-gray-50">
                <p className="font-medium">No skills data available for this student.</p>
                <p className="text-xs mt-1">Mastery records haven't been loaded yet.</p>
              </div>
            )}
          </div>
        </div>

        {/* ── Sidebar: student list ── */}
        <div className="w-72 shrink-0">
          <div className="sticky top-4">
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Students</p>
            <div className="space-y-2 max-h-[calc(100vh-200px)] overflow-y-auto pr-1">
              {allStudents.map(student => {
                const name = studentDisplayName(student);
                const isActive = student._id === selectedStudent?._id;
                const ovr = student.overall ?? 0;
                const perf = student.performance ?? performanceLabel(ovr);
                return (
                  <div
                    key={student._id}
                    className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                      isActive ? 'ring-2 ring-teal-500 bg-teal-50' : 'bg-white hover:bg-gray-50'
                    }`}
                    onClick={() => navigate(`/development/create/${student._id}/${initialCourseId}`)}
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-black shrink-0 bg-teal-100 text-teal-800">
                        {studentInitials(student)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold truncate">{name}</p>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className={`inline-flex rounded-full px-1.5 py-0.5 text-[10px] font-bold ${scoreBadgeClass(ovr)}`}>
                            {perf}
                          </span>
                          <span className="text-[10px] text-gray-400">OVR: {ovr}%</span>
                        </div>
                      </div>
                      {(perf === 'Excellent' || ovr >= 90) && (
                        <span className="text-amber-400 text-sm shrink-0">★</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default DevelopmentPlanCreation;
