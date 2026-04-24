import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { DevelopmentPlan, Student, SkillColor } from '../../types';
import { studentService, developmentService } from '../../services/api';
import { Activity, Plus, ChevronDown } from 'lucide-react';

interface DevelopmentViewProps {
  studentId?: string;
}

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
  const [expandedSkill, setExpandedSkill] = useState<{
    skillIndex: number | null;
    subskillIndex: number | null;
  }>({ skillIndex: null, subskillIndex: null });

  // ── Helpers ───────────────────────────────────────────────────────────────────

  const getStudentName = (s: any): string => {
    if (s?.user?.firstName) return `${s.user.firstName} ${s.user.lastName}`;
    if (s?.firstName) return `${s.firstName} ${s.lastName}`;
    return 'Unknown';
  };

  const getPlanData = (dp: DevelopmentPlan | null): any => {
    if (!dp) return null;
    if ((dp as any).plan?.name) return (dp as any).plan;
    return dp as any;
  };

  const getPlanProgress = (dp: DevelopmentPlan | null): number => {
    if (!dp) return 0;
    return (dp as any).currentProgress ?? (dp as any).progress ?? 0;
  };

  const getPlanName = (dp: DevelopmentPlan | null): string => {
    if (!dp) return 'Unnamed Plan';
    const d = getPlanData(dp);
    return d?.title ?? d?.name ?? 'Unnamed Plan';
  };

  const getPlanMissions = (dp: DevelopmentPlan | null): any[] => {
    if (!dp) return [];
    const d = getPlanData(dp);
    return d?.missions ?? d?.steps ?? [];
  };

  const getPlanSkills = (dp: DevelopmentPlan | null): any[] => {
    if (!dp) return [];
    const d = getPlanData(dp);
    return d?.skills ?? [];
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
        const activePlan = plansData.find((p: any) => p.status === 'Active');
        setCurrentDisplayPlan(activePlan || plansData[0] || null);
      } catch (err: any) {
        setError(err.message || 'Failed to load student development data.');
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
      const activePlan = plansData.find((p: any) => p.status === 'Active');
      setCurrentDisplayPlan(activePlan || plansData[0] || null);
    } catch (err: any) {
      setError(err.message || 'Failed to load data for selected student.');
    } finally {
      setLoading(false);
    }
  };

  const handlePlanSelect = (plan: DevelopmentPlan) => {
    setCurrentDisplayPlan(plan);
    setExpandedSkill({ skillIndex: null, subskillIndex: null });
  };

  const handleCreatePlan = () => {
    if (!selectedStudent) return;
    const courseId = (selectedStudent as any).courses?.[0] ?? (selectedStudent as any).course ?? '';
    navigate(`/classroom/development/create/${(selectedStudent as any)._id}/${courseId}`);
  };

  const getCurrentSkills = (): any[] =>
    getPlanSkills(currentDisplayPlan).map((skill: any) => ({
      ...skill,
      subskills: (skill.subskills || []).map((sub: any) => ({
        ...sub,
        color: (sub.score > 70 ? 'teal' : 'amber') as SkillColor,
      })),
    }));

  // ── Guards ────────────────────────────────────────────────────────────────────

  if (loading) return (
    <div className="flex items-center justify-center h-64 text-zinc-400 text-sm italic gap-2">
      <Activity className="animate-spin h-4 w-4" />
      Loading development data...
    </div>
  );

  if (error) return (
    <div className="p-4 text-sm text-red-500 font-bold bg-red-50 rounded-xl border border-red-100">
      Error: {error}
    </div>
  );

  if (!selectedStudent) return (
    <div className="flex justify-center items-center h-full text-sm text-zinc-400 italic">
      No student found.
    </div>
  );

  // ── Derived values ────────────────────────────────────────────────────────────

  const fullName        = getStudentName(selectedStudent);
  const mainSkills      = getCurrentSkills();
  const planData        = getPlanData(currentDisplayPlan);
  const planName        = getPlanName(currentDisplayPlan);
  const planDescription = planData?.description ?? '';
  const planPerformance = planData?.performance ?? planData?.skillCategory ?? '—';
  const planEta         = planData?.eta ?? null;
  const planMissions    = getPlanMissions(currentDisplayPlan);
  const currentProgress = getPlanProgress(currentDisplayPlan);

  // ── Shared surface tokens (zinc + teal) ───────────────────────────────────────
  // All three columns share the same bg, border, and accent language.
  // Active/selected state = teal-tinted highlight (bg-teal-50 border-teal-200).

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 h-[60vh]">

      {/* ── Left Sidebar: Identity + Plan List ── */}
      <div className="lg:col-span-2 col-span-12 bg-white rounded-xl border border-zinc-200 flex flex-col overflow-hidden">

        {/* Student card */}
        <div className="p-3 border-b border-zinc-100">
          <div className="w-9 h-9 bg-teal-50 border border-teal-200 rounded-lg flex items-center justify-center mx-auto mb-2 text-teal-700 font-black text-xs">
            {(selectedStudent.firstName?.[0] || '?')}{(selectedStudent.lastName?.[0] || '')}
          </div>
          <div className="text-center">
            <h2 className="text-[10px] font-black text-zinc-800 uppercase tracking-tight leading-none truncate">{fullName}</h2>
            <p className="text-[9px] text-zinc-400 mt-0.5 font-bold tracking-widest truncate px-1 uppercase">
              {(selectedStudent as any).id || ''}
            </p>
          </div>
          <div className="mt-2 text-center">
            <span className="text-xl font-black text-teal-600 leading-none">{selectedStudent.overall}</span>
            <span className="text-[9px] text-zinc-400 font-bold uppercase ml-1">OVR</span>
          </div>
        </div>

        {/* Plan list */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          <h3 className="text-[9px] font-black uppercase text-zinc-400 tracking-widest px-1 mb-2">Growth Areas</h3>
          {allStudentDevelopmentPlans.length > 0 ? (
            allStudentDevelopmentPlans.map((planItem) => {
              const isSelected = (planItem as any)._id === (currentDisplayPlan as any)?._id;
              return (
                <button
                  key={(planItem as any)._id}
                  onClick={() => handlePlanSelect(planItem)}
                  className={`w-full p-2 rounded-lg text-[10px] font-bold transition-all duration-150 flex justify-between items-center text-left border ${
                    isSelected
                      ? 'bg-teal-50 border-teal-200 text-teal-800'
                      : 'bg-zinc-50 border-zinc-100 text-zinc-600 hover:bg-zinc-100 hover:border-zinc-200'
                  }`}
                >
                  <span className="truncate">{getPlanName(planItem)}</span>
                  {planItem.status === 'Active' && (
                    <span className="ml-1 flex-shrink-0 text-[8px] bg-teal-100 text-teal-700 px-1.5 py-0.5 rounded-full font-black uppercase">
                      Active
                    </span>
                  )}
                </button>
              );
            })
          ) : (
            <p className="text-[9px] text-zinc-400 italic px-1">No plans yet.</p>
          )}
        </div>

        {/* CTA */}
        <div className="p-2 border-t border-zinc-100">
          <button
            onClick={handleCreatePlan}
            className="w-full bg-teal-600 hover:bg-teal-700 text-white py-1.5 px-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-colors flex items-center justify-center gap-1"
          >
            <Plus className="w-3 h-3" /> New Plan
          </button>
        </div>
      </div>

      {/* ── Main Content: Plan Detail ── */}
      <div className="lg:col-span-7 col-span-12 bg-white rounded-xl border border-zinc-200 flex flex-col overflow-hidden">
        {currentDisplayPlan ? (
          <>
            {/* Plan header */}
            <div className="p-4 border-b border-zinc-100 bg-zinc-50">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <h1 className="text-sm font-black text-zinc-800 uppercase tracking-tight truncate">{planName}</h1>
                  {planDescription && (
                    <p className="text-[10px] text-zinc-500 mt-1 line-clamp-1">{planDescription}</p>
                  )}
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  {planEta && (
                    <div className="bg-teal-50 border border-teal-100 px-2 py-1 rounded-lg text-center">
                      <div className="text-[8px] text-teal-600 uppercase font-black tracking-wider">ETA</div>
                      <div className="text-[11px] font-black text-teal-800">{planEta}d</div>
                    </div>
                  )}
                  {planPerformance !== '—' && (
                    <div className="bg-zinc-100 border border-zinc-200 px-2 py-1 rounded-lg text-center">
                      <div className="text-[8px] text-zinc-500 uppercase font-black tracking-wider">Type</div>
                      <div className="text-[10px] font-black text-zinc-700 leading-tight max-w-[72px] truncate">{planPerformance}</div>
                    </div>
                  )}
                </div>
              </div>
              {/* Progress bar */}
              <div className="mt-3 flex items-center gap-2">
                <div className="flex-1 h-1.5 bg-zinc-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-teal-500 rounded-full transition-all duration-700"
                    style={{ width: `${currentProgress}%` }}
                  />
                </div>
                <span className="text-[10px] font-black text-zinc-600">{currentProgress}%</span>
              </div>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto p-4">

              {/* Skills (legacy plans) */}
              {mainSkills.length > 0 && (
                <>
                  <h3 className="text-[10px] font-black uppercase text-zinc-400 tracking-widest mb-3 flex items-center">
                    Skill Breakdown
                    <div className="ml-2 flex-1 h-[1px] bg-zinc-100" />
                  </h3>
                  <div className={`grid gap-2 ${mainSkills.length <= 3 ? 'grid-cols-3' : 'grid-cols-4'}`}>
                    {mainSkills.map((skill, skillIndex) => {
                      const isExpanded = expandedSkill.skillIndex === skillIndex;
                      return (
                        <div
                          key={skillIndex}
                          className={`rounded-xl border overflow-hidden transition-all duration-200 cursor-pointer hover:shadow-sm ${
                            isExpanded ? 'bg-teal-50 border-teal-200' : 'bg-zinc-50 border-zinc-100'
                          }`}
                          onClick={() => setExpandedSkill(prev => ({
                            skillIndex: prev.skillIndex === skillIndex ? null : skillIndex,
                            subskillIndex: null,
                          }))}
                        >
                          <div className="p-2">
                            <div className="flex justify-between items-start">
                              <div>
                                <div className={`text-base font-black leading-none ${isExpanded ? 'text-teal-700' : 'text-zinc-800'}`}>{skill.score}</div>
                                <div className="text-[9px] font-bold text-zinc-500 uppercase tracking-tight mt-0.5">{skill.name}</div>
                              </div>
                              <ChevronDown className={`w-3 h-3 text-zinc-400 transition-transform duration-200 flex-shrink-0 ${isExpanded ? 'rotate-180 text-teal-500' : ''}`} />
                            </div>
                            <div className="mt-1.5 h-1 bg-zinc-200 rounded-full overflow-hidden">
                              <div className={`h-full rounded-full ${isExpanded ? 'bg-teal-500' : 'bg-zinc-400'}`} style={{ width: `${skill.score}%` }} />
                            </div>
                          </div>
                          <div className={`overflow-hidden transition-all duration-300 ${isExpanded ? 'max-h-60' : 'max-h-0'}`}>
                            <div className="px-2 pb-2 space-y-1 border-t border-teal-100 pt-1.5">
                              {skill.subskills?.map((sub: any, subIndex: number) => {
                                const isSubExpanded = expandedSkill.subskillIndex === subIndex;
                                return (
                                  <div
                                    key={subIndex}
                                    className={`p-1 rounded-lg cursor-pointer transition-all border ${
                                      isSubExpanded ? 'bg-teal-50 border-teal-200' : 'bg-white border-zinc-100 hover:border-zinc-200'
                                    }`}
                                    onClick={(e) => { e.stopPropagation(); setExpandedSkill(prev => ({ skillIndex, subskillIndex: prev.subskillIndex === subIndex ? null : subIndex })); }}
                                  >
                                    <div className="flex justify-between items-center">
                                      <span className="text-[9px] font-bold text-zinc-700 truncate pr-1">{sub.name}</span>
                                      <span className="text-[9px] font-black text-zinc-900 flex-shrink-0">{sub.score}</span>
                                    </div>
                                    <div className="mt-0.5 h-0.5 bg-zinc-100 rounded-full overflow-hidden">
                                      <div className={`h-full rounded-full ${sub.score > 70 ? 'bg-teal-500' : 'bg-amber-400'}`} style={{ width: `${sub.score}%` }} />
                                    </div>
                                    {isSubExpanded && (
                                      <div className="mt-1 pt-1 border-t border-teal-100 grid grid-cols-2 gap-x-2 text-[8px] text-zinc-500">
                                        <span>Status</span>
                                        <span className="text-right font-bold text-zinc-700">{sub.score > 70 ? 'Excellent' : sub.score > 40 ? 'Good' : 'Needs Work'}</span>
                                        <span>Target</span>
                                        <span className="text-right font-bold text-zinc-700">100</span>
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </>
              )}

              {/* Missions (new planModel shape) */}
              {planMissions.length > 0 && (
                <div className={mainSkills.length > 0 ? 'mt-5' : ''}>
                  <h3 className="text-[10px] font-black uppercase text-zinc-400 tracking-widest mb-2 flex items-center">
                    Missions
                    <div className="ml-2 flex-1 h-[1px] bg-zinc-100" />
                  </h3>
                  <ol className="space-y-1.5">
                    {planMissions.map((mission: any, idx: number) => {
                      const isInProgress = mission.status === 'In Progress';
                      const isDone = mission.status === 'Completed';
                      return (
                        <li
                          key={mission._id ?? idx}
                          className={`rounded-xl border overflow-hidden transition-all ${
                            isInProgress
                              ? 'bg-teal-50 border-teal-200'
                              : isDone
                              ? 'bg-zinc-50 border-zinc-100'
                              : 'bg-white border-zinc-100'
                          }`}
                        >
                          <div className="flex items-center gap-3 px-3 py-2.5">
                            <span className={`w-5 h-5 rounded-full flex items-center justify-center font-black text-[8px] flex-shrink-0 ${
                              isDone ? 'bg-teal-500 text-white' : isInProgress ? 'bg-teal-100 text-teal-700 ring-1 ring-teal-300' : 'bg-zinc-100 text-zinc-400'
                            }`}>
                              {idx + 1}
                            </span>
                            <div className="flex-1 min-w-0">
                              <p className={`text-[10px] font-black leading-tight ${isInProgress ? 'text-teal-800' : 'text-zinc-800'}`}>{mission.task}</p>
                              {mission.objective && (
                                <p className="text-[9px] text-zinc-400 mt-0.5 line-clamp-1">{mission.objective}</p>
                              )}
                            </div>
                            <span className={`flex-shrink-0 text-[8px] px-1.5 py-0.5 rounded-full font-black uppercase ${
                              isDone ? 'bg-teal-100 text-teal-700' : isInProgress ? 'bg-teal-200 text-teal-800' : 'bg-zinc-100 text-zinc-500'
                            }`}>
                              {mission.status ?? 'Pending'}
                            </span>
                          </div>
                          {mission.steps?.length > 0 && (
                            <div className={`border-t px-3 pb-2 pt-1.5 space-y-1 ${isInProgress ? 'border-teal-100' : 'border-zinc-100'}`}>
                              {mission.steps.map((step: any, sIdx: number) => (
                                <div key={sIdx} className="flex items-center gap-2 text-[9px]">
                                  <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${step.exitCheckpoint?.isPassed ? 'bg-teal-400' : 'bg-zinc-200'}`} />
                                  <span className={step.exitCheckpoint?.isPassed ? 'text-teal-700 font-bold' : 'text-zinc-500'}>{step.title}</span>
                                  {step.type && (
                                    <span className="ml-auto text-[8px] text-zinc-400 font-bold uppercase">{step.type.replace('_', ' ')}</span>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}
                        </li>
                      );
                    })}
                  </ol>
                </div>
              )}

              {mainSkills.length === 0 && planMissions.length === 0 && (
                <div className="flex flex-col items-center justify-center h-40 text-zinc-300 text-xs italic gap-2">
                  <Activity className="w-6 h-6" />
                  <span>No missions generated yet.</span>
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center h-full gap-3 text-zinc-300">
            <Activity className="w-8 h-8" />
            <p className="text-sm italic text-zinc-400">No development plan found.</p>
            <button
              onClick={handleCreatePlan}
              className="mt-1 bg-teal-600 text-white px-4 py-2 rounded-lg text-xs font-black uppercase tracking-widest hover:bg-teal-700 transition-colors flex items-center gap-2"
            >
              <Plus className="w-3 h-3" /> Create First Plan
            </button>
          </div>
        )}
      </div>

      {/* ── Right Sidebar: Students List ── */}
      <div className="lg:col-span-3 col-span-12 bg-white rounded-xl border border-zinc-200 overflow-hidden flex flex-col">
        <div className="px-3 pt-3 pb-2 border-b border-zinc-100">
          <h3 className="text-[10px] font-black uppercase text-zinc-400 tracking-widest">Students</h3>
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {allStudents.map((s) => {
            const sName = getStudentName(s);
            const isActive = (s as any)._id === (selectedStudent as any)?._id;
            const studentPlan = allStudentDevelopmentPlans.find(
              (p: any) => p.student === (s as any)._id || p.student?._id === (s as any)._id
            );
            const sPlanProgress = getPlanProgress(studentPlan ?? null);

            return (
              <div
                key={(s as any)._id}
                onClick={() => handleStudentSelect((s as any)._id)}
                className={`cursor-pointer rounded-xl p-2.5 border transition-all duration-150 ${
                  isActive
                    ? 'bg-teal-50 border-teal-200'
                    : 'bg-white border-zinc-100 hover:bg-zinc-50 hover:border-zinc-200'
                }`}
              >
                <div className="flex items-center gap-2">
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-[9px] font-black flex-shrink-0 border ${
                    isActive
                      ? 'bg-teal-100 text-teal-700 border-teal-200'
                      : 'bg-zinc-100 text-zinc-500 border-zinc-200'
                  }`}>
                    {s.firstName?.[0]}{s.lastName?.[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className={`text-[10px] font-black truncate ${isActive ? 'text-teal-800' : 'text-zinc-800'}`}>
                      {sName}
                    </div>
                    <div className="text-[9px] font-bold text-zinc-400">
                      OVR: <span className={isActive ? 'text-teal-600' : 'text-zinc-600'}>{s.overall || 'N/A'}</span>
                    </div>
                  </div>
                  {s.performance === 'Excellent' && (
                    <span className="text-[8px] bg-teal-50 text-teal-600 border border-teal-100 px-1 py-0.5 rounded-full font-black flex-shrink-0">★</span>
                  )}
                </div>

                {studentPlan && (
                  <div className="mt-1.5">
                    <div className={`h-1 rounded-full overflow-hidden ${isActive ? 'bg-teal-100' : 'bg-zinc-100'}`}>
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${isActive ? 'bg-teal-500' : 'bg-zinc-300'}`}
                        style={{ width: `${sPlanProgress}%` }}
                      />
                    </div>
                    <div className={`text-[8px] font-bold mt-0.5 ${isActive ? 'text-teal-600' : 'text-zinc-400'}`}>
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
  );
};

export default DevelopmentView;