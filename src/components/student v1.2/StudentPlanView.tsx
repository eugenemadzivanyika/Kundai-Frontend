import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { DevelopmentPlan, Step } from '../../types';
import {
  BookOpen,
  CheckCircle,
  ChevronDown,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Edit,
  ExternalLink,
  FileText,
  Lock,
  Play,
} from 'lucide-react';
import StudentTutor, { TutorStep } from '../student v1.2/StudentTutor';
import StudentPracticeRunner, { buildMockPracticeQuestions } from './StudentPracticeRunner';

// ─────────────────────────────────────────────────────────────────────────────
// BACKEND ADAPTOR
// ─────────────────────────────────────────────────────────────────────────────
interface BackendStep {
  _id?: string;
  title: string;
  content?: string;
  type?: 'Theory' | 'Interactive_Exercise' | 'Hinted_Practice';
  exitCheckpoint?: {
    question?: string;
    expectedLogic?: string;
    isPassed?: boolean;
  };
}

interface BackendMission {
  _id?: string;
  task: string;
  objective?: string;
  status: 'Pending' | 'In Progress' | 'Completed';
  resourceLink?: string;
  steps?: BackendStep[];
}

interface BackendPlan {
  _id: string;
  title: string;
  description?: string;
  progress: number;
  status: string;
  missions?: BackendMission[];
  course?: { _id: string; name?: string; code?: string } | string;
}

const backendTypeToUiType = (type?: string): Step['type'] => {
  switch (type) {
    case 'Theory':               return 'document';
    case 'Interactive_Exercise': return 'assignment';
    case 'Hinted_Practice':      return 'assignment';
    default:                     return 'document';
  }
};

export const adaptBackendPlan = (backendPlan: BackendPlan): DevelopmentPlan => {
  const missions = backendPlan.missions ?? [];
  let order = 0;

  const steps: Step[] = missions.flatMap((mission) => {
    if (mission.steps && mission.steps.length > 0) {
      return mission.steps.map((step) => ({
        title:   step.title,
        type:    backendTypeToUiType(step.type),
        order:   order++,
        link:    mission.resourceLink,
        content:           step.content || mission.objective || '',
        exitCheckpoint:    step.exitCheckpoint,
        missionId:         mission._id,
        stepId:            step._id,
        parentMissionTask: mission.task,
        additionalResources: mission.objective ? [mission.objective] : undefined,
      }));
    }
    return [{
      title:   mission.task,
      type:    'document' as Step['type'],
      order:   order++,
      link:    mission.resourceLink,
      content: mission.objective || '',
      exitCheckpoint: {
        question:      '',
        expectedLogic: mission.objective || `Demonstrate understanding of: ${mission.task}`,
        isPassed:      mission.status === 'Completed',
      },
      missionId:         mission._id,
      stepId:            undefined,
      parentMissionTask: mission.task,
    }];
  });

  return {
    id:              backendPlan._id,
    currentProgress: backendPlan.progress ?? 0,
    plan: { name: backendPlan.title, steps },
  };
};

// ─────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────

type EnrichedStep = Step & {
  flatIndex: number;
  content?: string;
  exitCheckpoint?: { question?: string; expectedLogic?: string; isPassed?: boolean };
  missionId?: string;
  stepId?: string;
  parentMissionTask?: string;
};

interface MissionGroup {
  task: string;
  missionId?: string;
  backendStatus?: 'Pending' | 'In Progress' | 'Completed';
  steps: EnrichedStep[];
  firstFlatIndex: number;
}

interface StudentPlanViewProps {
  plan: any;
  studentId: string;
  selectedSubjectId: string;
  initialStepIndex?: number;
  onOpenMission: (link: string) => void;
}

const isBackendPlan = (p: any): p is BackendPlan =>
  p && 'missions' in p && !('plan' in p);

// ─── UI helpers ───────────────────────────────────────────────────────────────

const getStepIcon = (type: string) => {
  switch (type) {
    case 'document':   return <FileText className="w-3.5 h-3.5" />;
    case 'assignment': return <Edit     className="w-3.5 h-3.5" />;
    case 'quiz':       return <BookOpen className="w-3.5 h-3.5" />;
    default:           return <BookOpen className="w-3.5 h-3.5" />;
  }
};

const getProgressColor = (progress: number) => {
  if (progress >= 80) return 'bg-emerald-500';
  if (progress >= 60) return 'bg-amber-500';
  if (progress >= 40) return 'bg-amber-400';
  return 'bg-orange-400';
};

const isPracticeStep = (type: string) => type === 'assignment' || type === 'quiz';

// ─────────────────────────────────────────────────────────────────────────────
// COMPONENT
// ─────────────────────────────────────────────────────────────────────────────

const StudentPlanView: React.FC<StudentPlanViewProps> = ({
  plan: planProp,
  studentId,
  selectedSubjectId,
  initialStepIndex,
  onOpenMission,
}) => {
  const plan: DevelopmentPlan = useMemo(
    () => (isBackendPlan(planProp) ? adaptBackendPlan(planProp) : planProp),
    [planProp]
  );

  const sortedSteps = useMemo(
    () => plan.plan.steps?.slice().sort((a, b) => (a.order || 0) - (b.order || 0)) || [],
    [plan.plan.steps]
  );

  const totalSteps          = sortedSteps.length;
  const safeProgress        = Math.max(0, Math.min(100, plan.currentProgress || 0));
  const completedStepsCount = Math.floor((safeProgress / 100) * totalSteps);
  const currentStepIndex    = Math.min(completedStepsCount, Math.max(totalSteps - 1, 0));

  const [selectedStepIndex,      setSelectedStepIndex]      = useState(0);
  const [isSidebarCollapsed,     setIsSidebarCollapsed]     = useState(false);
  const [completedPracticeSteps, setCompletedPracticeSteps] = useState<Record<number, boolean>>({});
  const [expandedMissions,       setExpandedMissions]       = useState<Set<number>>(new Set([0]));

  // ── Raw missions from backend (for status lookup) ──────────────────────────
  const rawMissions: BackendMission[] = useMemo(
    () => (isBackendPlan(planProp) ? planProp.missions ?? [] : []),
    [planProp]
  );

  // ── Group flat steps back into mission buckets for the sidebar ─────────────
  const missionGroups = useMemo<MissionGroup[]>(() => {
    const groups: MissionGroup[] = [];
    const seenKeys = new Map<string, number>();

    sortedSteps.forEach((step: any, flatIndex: number) => {
      const key = step.missionId || step.parentMissionTask || `step-${flatIndex}`;
      if (!seenKeys.has(key)) {
        const backend = rawMissions.find(m => m._id === step.missionId);
        seenKeys.set(key, groups.length);
        groups.push({
          task:          step.parentMissionTask || step.title,
          missionId:     step.missionId,
          backendStatus: backend?.status,
          steps:         [],
          firstFlatIndex: flatIndex,
        });
      }
      groups[seenKeys.get(key)!].steps.push({ ...step, flatIndex } as EnrichedStep);
    });

    return groups;
  }, [sortedSteps, rawMissions]);

  // ── Lock helpers ───────────────────────────────────────────────────────────

  const isStepDone = useCallback((flatIndex: number, step: any): boolean =>
    Boolean(step.exitCheckpoint?.isPassed)
    || Boolean(completedPracticeSteps[flatIndex])
    || flatIndex < completedStepsCount,
    [completedPracticeSteps, completedStepsCount]
  );

  const isMissionGroupDone = useCallback((group: MissionGroup): boolean => {
    if (group.backendStatus === 'Completed') return true;
    if (group.steps.length === 0) return false;
    return group.steps.every(s => isStepDone(s.flatIndex, s));
  }, [isStepDone]);

  const isMissionGroupLocked = useCallback((groupIndex: number): boolean => {
    if (groupIndex === 0) return false;
    return !isMissionGroupDone(missionGroups[groupIndex - 1]);
  }, [missionGroups, isMissionGroupDone]);

  const isStepWithinGroupLocked = useCallback(
    (groupIndex: number, stepInGroupIndex: number): boolean => {
      if (isMissionGroupLocked(groupIndex)) return true;
      if (stepInGroupIndex === 0) return false;
      const prev = missionGroups[groupIndex].steps[stepInGroupIndex - 1];
      return !isStepDone(prev.flatIndex, prev);
    },
    [missionGroups, isMissionGroupLocked, isStepDone]
  );

  const selectedStep = sortedSteps[selectedStepIndex] || null;
  const nextStep     = selectedStepIndex < totalSteps - 1 ? sortedSteps[selectedStepIndex + 1] : null;

  const sidebarDesktopWidth = isSidebarCollapsed ? 'md:w-[72px]' : 'md:w-[280px]';

  // ── TutorStep wiring ───────────────────────────────────────────────────────
  const activeTutorStep = useMemo<TutorStep | null>(() => {
    if (!selectedStep) return null;
    const s = selectedStep as any;
    return {
      title:          s.title,
      content:        s.content        || '',
      type:           s.type,
      order:          s.order,
      exitCheckpoint: s.exitCheckpoint || undefined,
    };
  }, [selectedStep]);

  const allTutorSteps = useMemo<TutorStep[]>(
    () => sortedSteps.map((s: any) => ({
      title:          s.title,
      content:        s.content        || '',
      type:           s.type,
      order:          s.order,
      exitCheckpoint: s.exitCheckpoint || undefined,
    })),
    [sortedSteps]
  );

  const prefillMessage = useMemo(() => {
    if (!selectedStep) return undefined;
    return `I'm ready to work on: "${selectedStep.title}". Please guide me.`;
  }, [selectedStep?.title]);

  // ── Effects ────────────────────────────────────────────────────────────────

  useEffect(() => {
    if (selectedStepIndex > sortedSteps.length - 1) {
      setSelectedStepIndex(Math.max(sortedSteps.length - 1, 0));
    }
  }, [selectedStepIndex, sortedSteps.length]);

  useEffect(() => {
    if (typeof initialStepIndex === 'number') {
      setSelectedStepIndex(
        Math.max(0, Math.min(initialStepIndex, Math.max(sortedSteps.length - 1, 0)))
      );
      return;
    }
    setSelectedStepIndex(currentStepIndex);
  }, [plan.id, currentStepIndex, initialStepIndex, sortedSteps.length]);

  useEffect(() => {
    setCompletedPracticeSteps({});
  }, [plan.id]);

  // Auto-expand the mission that contains the active/selected step
  useEffect(() => {
    const activeMissionIdx = missionGroups.findIndex(g =>
      g.steps.some(s => s.flatIndex === currentStepIndex || s.flatIndex === selectedStepIndex)
    );
    if (activeMissionIdx >= 0) {
      setExpandedMissions(prev => new Set([...prev, activeMissionIdx]));
    }
  }, [currentStepIndex, selectedStepIndex, missionGroups]);

  const handleCheckpointPassed = () => {
    setCompletedPracticeSteps(prev => ({ ...prev, [selectedStepIndex]: true }));
  };

  const toggleMission = (groupIndex: number) => {
    setExpandedMissions(prev => {
      const next = new Set(prev);
      next.has(groupIndex) ? next.delete(groupIndex) : next.add(groupIndex);
      return next;
    });
  };

  const selectedStepIsPractice = Boolean(selectedStep && isPracticeStep(selectedStep.type));
  const showUpNextFooter = !selectedStepIsPractice || Boolean(completedPracticeSteps[selectedStepIndex]);

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="flex h-full overflow-hidden bg-amber-50/30">
      {/* ── LEFT SIDEBAR ─────────────────────────────────────────────────── */}
      <aside
        className={`relative flex-shrink-0 bg-white border-r border-amber-100/80 transition-all duration-300 flex flex-col shadow-sm overflow-y-auto ${sidebarDesktopWidth}`}
      >
        {/* Collapse toggle */}
        <button
          type="button"
          onClick={() => setIsSidebarCollapsed(prev => !prev)}
          className="hidden md:inline-flex absolute top-1/2 -translate-y-1/2 -right-3.5 z-30 h-7 w-7 items-center justify-center rounded-full border border-amber-200 bg-white text-amber-600 shadow-sm hover:bg-amber-50 transition-colors"
          aria-label={isSidebarCollapsed ? 'Expand panel' : 'Collapse panel'}
        >
          {isSidebarCollapsed
            ? <ChevronsRight className="w-3.5 h-3.5" />
            : <ChevronsLeft  className="w-3.5 h-3.5" />}
        </button>

        {/* Plan header — kept the same height as the StepTrail (≈38px) */}
        <div className="border-b border-amber-100/80 px-3 py-2 bg-gradient-to-r from-amber-50/80 to-orange-50/60 flex items-center gap-2.5">
          <div className="w-6 h-6 rounded-md bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
            <BookOpen className="w-3.5 h-3.5" />
          </div>
          <div className={`min-w-0 flex-1 overflow-hidden transition-[max-width,opacity] duration-200 ${isSidebarCollapsed ? 'max-w-0 opacity-0' : 'max-w-[200px] opacity-100'}`}>
            <div className="flex items-center gap-2">
              <h2 className="text-xs font-bold text-slate-800 truncate flex-1">{plan.plan.name}</h2>
              <span className="text-[10px] text-slate-400 shrink-0">{safeProgress}%</span>
            </div>
            <div className="mt-1 h-1 rounded-full bg-amber-100 overflow-hidden">
              <div
                className={`${getProgressColor(safeProgress)} h-1 transition-all duration-500`}
                style={{ width: `${safeProgress}%` }}
              />
            </div>
          </div>
        </div>

        {/* Mission list */}
        <div className="flex-1 overflow-y-auto">
          {missionGroups.map((group, groupIndex) => {
            const locked    = isMissionGroupLocked(groupIndex);
            const done      = isMissionGroupDone(group);
            const expanded  = expandedMissions.has(groupIndex);
            const hasActive = group.steps.some(s => s.flatIndex === selectedStepIndex);
            const doneCount = group.steps.filter(s => isStepDone(s.flatIndex, s)).length;

            return (
              <div key={group.missionId || groupIndex} className="border-b border-slate-100/80 last:border-0">

                {/* ── Mission row ── */}
                <button
                  type="button"
                  onClick={() => !locked && (isSidebarCollapsed
                    ? setSelectedStepIndex(group.firstFlatIndex)
                    : toggleMission(groupIndex)
                  )}
                  disabled={locked}
                  title={isSidebarCollapsed ? group.task : undefined}
                  className={`w-full transition-colors ${
                    isSidebarCollapsed
                      ? 'flex justify-center items-center py-4 px-2'
                      : 'flex items-center gap-2.5 px-3 py-3 text-left'
                  } ${locked
                    ? 'opacity-50 cursor-not-allowed bg-slate-50/60'
                    : hasActive
                      ? 'bg-amber-50/70 hover:bg-amber-50'
                      : 'hover:bg-slate-50/80 cursor-pointer'
                  }`}
                >
                  {/* Status icon */}
                  <div className={`shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                    locked
                      ? 'bg-slate-100 text-slate-400'
                      : done
                        ? 'bg-emerald-100 text-emerald-600'
                        : hasActive
                          ? 'bg-amber-100 text-amber-700'
                          : 'bg-slate-100 text-slate-500'
                  }`}>
                    {locked
                      ? <Lock className="w-3.5 h-3.5" />
                      : done
                        ? <CheckCircle className="w-3.5 h-3.5" />
                        : hasActive
                          ? <Play className="w-3.5 h-3.5" />
                          : groupIndex + 1}
                  </div>

                  {/* Mission name + meta (hidden when collapsed) */}
                  <div className={`flex-1 min-w-0 overflow-hidden transition-[max-width,opacity] duration-200 ${
                    isSidebarCollapsed ? 'max-w-0 opacity-0' : 'max-w-[200px] opacity-100'
                  }`}>
                    <p className={`text-xs font-bold truncate leading-tight ${
                      locked ? 'text-slate-400' : done ? 'text-emerald-700' : 'text-slate-800'
                    }`}>
                      {group.task}
                    </p>
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      {locked
                        ? 'Complete previous mission first'
                        : done
                          ? 'Completed'
                          : `${doneCount} / ${group.steps.length} steps done`}
                    </p>
                  </div>

                  {/* Expand chevron (only when not collapsed and not locked) */}
                  {!isSidebarCollapsed && !locked && (
                    <div className="shrink-0 text-slate-400 ml-auto">
                      {expanded
                        ? <ChevronDown  className="w-3.5 h-3.5" />
                        : <ChevronRight className="w-3.5 h-3.5" />}
                    </div>
                  )}
                </button>

                {/* ── Steps (expanded, not collapsed sidebar) ── */}
                <AnimatePresence initial={false}>
                  {expanded && !locked && !isSidebarCollapsed && (
                    <motion.div
                      key="steps"
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2, ease: 'easeInOut' }}
                      className="overflow-hidden bg-slate-50/60"
                    >
                      {group.steps.map((step, stepInGroupIndex) => {
                        const stepLocked   = isStepWithinGroupLocked(groupIndex, stepInGroupIndex);
                        const stepDone     = isStepDone(step.flatIndex, step);
                        const isSelected   = step.flatIndex === selectedStepIndex;
                        const isCurrent    = step.flatIndex === currentStepIndex;

                        return (
                          <button
                            key={step.stepId || `${groupIndex}-${stepInGroupIndex}`}
                            type="button"
                            disabled={stepLocked}
                            onClick={() => !stepLocked && setSelectedStepIndex(step.flatIndex)}
                            className={`w-full flex items-center gap-2.5 pl-9 pr-3 py-2.5 text-left border-b border-slate-100/60 last:border-0 transition-colors ${
                              stepLocked
                                ? 'cursor-not-allowed opacity-40'
                                : isSelected
                                  ? 'bg-amber-100/60 border-l-[3px] border-l-amber-500 cursor-pointer'
                                  : 'hover:bg-white/80 cursor-pointer'
                            }`}
                          >
                            {/* Step status dot */}
                            <div className={`shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold ${
                              stepLocked
                                ? 'bg-slate-200 text-slate-400'
                                : stepDone
                                  ? 'bg-emerald-100 text-emerald-600'
                                  : isCurrent
                                    ? 'bg-amber-100 text-amber-700'
                                    : 'bg-slate-200 text-slate-500'
                            }`}>
                              {stepLocked
                                ? <Lock className="w-2.5 h-2.5" />
                                : stepDone
                                  ? <CheckCircle className="w-3 h-3" />
                                  : step.flatIndex + 1}
                            </div>

                            {/* Step info */}
                            <div className="min-w-0 flex-1">
                              <p className={`text-xs font-semibold truncate leading-tight ${
                                stepLocked  ? 'text-slate-400' :
                                isSelected  ? 'text-amber-800' :
                                stepDone    ? 'text-emerald-700' :
                                             'text-slate-700'
                              }`}>
                                {step.title}
                              </p>
                              <p className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5">
                                {getStepIcon(step.type)}
                                <span className="capitalize">
                                  {stepLocked ? 'Locked' : stepDone ? 'Done' : isCurrent ? 'Active' : step.type}
                                </span>
                              </p>
                            </div>
                          </button>
                        );
                      })}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </aside>

      {/* ── MAIN CONTENT ──────────────────────────────────────────────────── */}
      <main className="flex-1 transition-all duration-300 flex flex-col overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.div
            key={selectedStepIndex}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.18 }}
            className="flex-1 flex flex-col overflow-hidden"
          >
            {/* Theory / Practice step → AI Coach chat */}
            {selectedStep && (selectedStep.type === 'document' || selectedStep.type === 'assignment') && (
              <div className="flex-1 bg-white overflow-hidden flex flex-col">
                <StudentTutor
                  studentId={studentId}
                  selectedSubjectId={selectedSubjectId}
                  activeStep={activeTutorStep}
                  allSteps={allTutorSteps}
                  activeStepIndex={selectedStepIndex}
                  prefillMessage={prefillMessage}
                  onCheckpointPassed={handleCheckpointPassed}
                />
              </div>
            )}

            {/* Quiz step */}
            {selectedStep && selectedStep.type === 'quiz' && !completedPracticeSteps[selectedStepIndex] && (
              <div className="flex-1 p-6 bg-white overflow-y-auto">
                <header className="mb-6 pb-5 border-b border-amber-100">
                  <p className="text-[10px] font-black uppercase tracking-widest text-amber-600 mb-1.5">Final Assessment</p>
                  <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight italic leading-none">
                    Mastery Check
                  </h2>
                  <p className="text-slate-500 mt-2 text-sm max-w-lg">
                    Prove your understanding of{' '}
                    <span className="font-semibold text-slate-700">{selectedStep.title}</span>{' '}
                    to complete this mission stage.
                  </p>
                </header>

                <StudentPracticeRunner
                  key={`${plan.id}-${selectedStepIndex}`}
                  title={selectedStep.title}
                  subtitle="Answer each question carefully. You must complete the quiz to unlock the next step."
                  questions={buildMockPracticeQuestions(selectedStep.title, 'quiz')}
                  onComplete={() =>
                    setCompletedPracticeSteps(prev => ({ ...prev, [selectedStepIndex]: true }))
                  }
                />

                {selectedStep.link && (
                  <div className="mt-6 pt-5 border-t border-slate-100">
                    <button
                      onClick={() => onOpenMission(selectedStep.link!)}
                      className="inline-flex items-center gap-2 bg-slate-900 text-white px-5 py-2.5 rounded-xl font-bold text-sm hover:bg-amber-600 transition-all"
                    >
                      Open External Assessment
                      <ExternalLink className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Quiz completed */}
            {selectedStep && selectedStep.type === 'quiz' && completedPracticeSteps[selectedStepIndex] && (
              <div className="flex-1 flex flex-col items-center justify-center p-8 bg-white text-center">
                <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mb-5">
                  <CheckCircle className="w-8 h-8 text-emerald-600" />
                </div>
                <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight italic">
                  Mission Stage Complete
                </h2>
                <p className="text-slate-500 mt-2 max-w-sm text-sm">
                  You've passed the mastery check for{' '}
                  <span className="font-semibold text-slate-700">{selectedStep.title}</span>.
                </p>
                {nextStep && (
                  <button
                    type="button"
                    onClick={() => setSelectedStepIndex(prev => Math.min(prev + 1, totalSteps - 1))}
                    className="mt-6 inline-flex items-center gap-2 bg-amber-500 text-white px-5 py-2.5 rounded-xl font-bold text-sm hover:bg-amber-600 transition-all"
                  >
                    Continue to: {nextStep.title}
                  </button>
                )}
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Up-next footer */}
        {showUpNextFooter && selectedStep?.type === 'quiz' && completedPracticeSteps[selectedStepIndex] && nextStep && (
          <footer className="shrink-0 border-t border-amber-100 bg-white px-5 py-3 flex justify-end">
            <button
              type="button"
              onClick={() => setSelectedStepIndex(prev => Math.min(prev + 1, totalSteps - 1))}
              className="inline-flex items-center gap-2 rounded-xl bg-amber-500 px-5 py-2 text-sm font-bold text-white hover:bg-amber-600 transition-all"
            >
              Up next: {nextStep.title}
            </button>
          </footer>
        )}
      </main>
    </div>
  );
};

export default StudentPlanView;
