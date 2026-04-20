import React, { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { DevelopmentPlan, Step } from '../../types';
import {
  BookOpen,
  ChevronsLeft,
  ChevronsRight,
  CheckCircle,
  FileText,
  Edit,
  ExternalLink,
} from 'lucide-react';
import StudentTutor from '../student v1.2/StudentTutor';
import StudentPracticeRunner, { buildMockPracticeQuestions } from './StudentPracticeRunner';

// ─────────────────────────────────────────────────────────────────────────────
// BACKEND ADAPTOR
// ─────────────────────────────────────────────────────────────────────────────

/** Shape returned by the backend Plan model / development controller */
interface BackendMission {
  _id?: string;
  task: string;
  objective?: string;
  status: 'Pending' | 'Completed';
  resourceLink?: string;
  resourceType?: 'Theory' | 'Practice' | 'Quiz';
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

const resourceTypeToStepType = (resourceType?: string): Step['type'] => {
  switch (resourceType) {
    case 'Theory':   return 'document';
    case 'Practice': return 'assignment';
    case 'Quiz':     return 'quiz';
    default:         return 'document';
  }
};

const inferStepType = (index: number): Step['type'] => {
  if (index === 1) return 'assignment';
  if (index === 2) return 'quiz';
  return 'document';
};

// StudentPlanView.tsx

export const adaptBackendPlan = (backendPlan: BackendPlan): DevelopmentPlan => {
  const backendMissions = backendPlan.missions ?? [];

  // We map the missions while preserving the nested steps
  const steps: Step[] = backendMissions.flatMap((mission, mIndex) => {
    return (mission.steps || []).map((step, sIndex) => ({
      title: step.title,
      content: step.content,
      type: step.type === 'Theory' ? 'document' : 'assignment', 
      order: mIndex * 10 + sIndex, 
      link: mission.resourceLink,
      exitCheckpoint: step.exitCheckpoint,
      // CRITICAL: We attach the parent mission's task name so we can group them
      parentMissionTask: mission.task, 
      missionId: mission._id,
    }));
  });

  return {
    id: backendPlan._id,
    currentProgress: backendPlan.progress ?? 0,
    plan: {
      name: backendPlan.title,
      steps,
    },
  };
};
interface StudentPlanViewProps {
  plan: any;
  studentId: string;
  selectedSubjectId: string;
  initialStepIndex?: number;
  onOpenMission: (link: string) => void;
}

const isBackendPlan = (p: DevelopmentPlan | BackendPlan): p is BackendPlan =>
  'missions' in p && !('plan' in p);

// ─── Step type helpers ────────────────────────────────────────────────────────

const getStepIcon = (type: string) => {
  switch (type) {
    case 'document':   return <FileText className="w-4 h-4" />;
    case 'assignment': return <Edit className="w-4 h-4" />;
    case 'quiz':       return <BookOpen className="w-4 h-4" />;
    default:           return <BookOpen className="w-4 h-4" />;
  }
};

const getProgressColor = (progress: number) => {
  if (progress >= 80) return 'bg-green-500';
  if (progress >= 60) return 'bg-blue-600';
  if (progress >= 40) return 'bg-blue-500';
  return 'bg-blue-400';
};

const isPracticeStep = (type: string) => type === 'assignment' || type === 'quiz';

// ─────────────────────────────────────────────────────────────────────────────

const StudentPlanView: React.FC<StudentPlanViewProps> = ({
  plan: planProp,
  studentId,
  selectedSubjectId,
  initialStepIndex,
  onOpenMission,
}) => {
  // ── ADAPTOR ENTRY POINT ───────────────────────────────────────────────────
  const plan: DevelopmentPlan = useMemo(
    () => (isBackendPlan(planProp) ? adaptBackendPlan(planProp) : planProp),
    [planProp]
  );

  const sortedSteps = useMemo(
    () => plan.plan.steps?.slice().sort((a, b) => (a.order || 0) - (b.order || 0)) || [],
    [plan.plan.steps]
  );

  const totalSteps = sortedSteps.length;
  const safeProgress = Math.max(0, Math.min(100, plan.currentProgress || 0));
  const completedStepsCount = Math.floor((safeProgress / 100) * totalSteps);
  const currentStepIndex = Math.min(completedStepsCount, Math.max(totalSteps - 1, 0));

  const [selectedStepIndex, setSelectedStepIndex] = useState(0);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [completedPracticeSteps, setCompletedPracticeSteps] = useState<Record<number, boolean>>({});

  const selectedStep = sortedSteps[selectedStepIndex] || null;
  const nextStep = selectedStepIndex < totalSteps - 1 ? sortedSteps[selectedStepIndex + 1] : null;

  const sidebarDesktopWidth = isSidebarCollapsed ? 'md:w-[88px]' : 'md:w-[340px]';
  const contentDesktopOffset = isSidebarCollapsed ? 'md:ml-[88px]' : 'md:ml-[340px]';

  // Derive mission context for the AI Coach prefill
 // Derive mission context for the AI Coach prefill
const prefillMessage = useMemo(() => {
  if (!selectedStep) return undefined;
  // This triggers when the user initializes a specific mission step
  return `I am ready to start Mission Step: "${selectedStep.title}". Can you guide me?`;
}, [selectedStep]);

  useEffect(() => {
    if (selectedStepIndex > sortedSteps.length - 1) {
      setSelectedStepIndex(Math.max(sortedSteps.length - 1, 0));
    }
  }, [selectedStepIndex, sortedSteps.length]);

  useEffect(() => {
    if (typeof initialStepIndex === 'number') {
      setSelectedStepIndex(Math.max(0, Math.min(initialStepIndex, Math.max(sortedSteps.length - 1, 0))));
      return;
    }
    setSelectedStepIndex(currentStepIndex);
  }, [plan.id, currentStepIndex, initialStepIndex, sortedSteps.length]);

  useEffect(() => {
    setCompletedPracticeSteps({});
  }, [plan.id]);

  const selectedStepIsPractice = Boolean(selectedStep && isPracticeStep(selectedStep.type));
  const showUpNextFooter = !selectedStepIsPractice || Boolean(completedPracticeSteps[selectedStepIndex]);

  return (
    <div className="flex bg-slate-50" style={{ height: 'calc(100vh - var(--student-header-offset, 9rem))', overflow: 'hidden' }}>

      {/* ── LEFT SIDEBAR: Mission Progress ─────────────────────────────────── */}
      <aside
        className={`fixed left-0 bg-slate-50 border-r border-slate-200 transition-all duration-300 z-30 flex flex-col ${sidebarDesktopWidth}`}
        style={{ top: 'var(--student-header-offset, 9rem)', height: 'calc(100vh - var(--student-header-offset, 9rem))' }}
      >
        {/* Collapse toggle */}
        <button
          type="button"
          onClick={() => setIsSidebarCollapsed((prev) => !prev)}
          className="hidden md:inline-flex absolute top-1/2 -translate-y-1/2 -right-4 z-30 h-8 w-8 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 shadow-sm hover:bg-slate-50"
          aria-label={isSidebarCollapsed ? 'Expand steps panel' : 'Collapse steps panel'}
        >
          {isSidebarCollapsed ? (
            <ChevronsRight className="w-4 h-4 transition-transform duration-200 ease-out" />
          ) : (
            <ChevronsLeft className="w-4 h-4 transition-transform duration-200 ease-out" />
          )}
        </button>

        {/* Plan header */}
        <div className="border-b border-slate-200 px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
              <BookOpen className="w-5 h-5" />
            </div>
            <div
              className={`min-w-0 overflow-hidden transition-[max-width,max-height,opacity,transform] duration-200 ease-out ${
                isSidebarCollapsed
                  ? 'max-w-0 max-h-0 opacity-0 -translate-x-1'
                  : 'max-w-[240px] max-h-16 opacity-100 translate-x-0'
              }`}
            >
              <h2 className="text-lg font-bold text-slate-900 truncate">{plan.plan.name}</h2>
              <p className="text-xs text-slate-500 mt-0.5">{totalSteps} steps</p>
            </div>
          </div>

          {/* Progress bar */}
          <div
            className={`mt-3 h-1.5 rounded-full bg-slate-200 overflow-hidden transition-opacity duration-200 ease-out ${
              isSidebarCollapsed ? 'opacity-0' : 'opacity-100'
            }`}
          >
            <div
              className={`${getProgressColor(safeProgress)} h-1.5 transition-all duration-500`}
              style={{ width: `${safeProgress}%` }}
            />
          </div>
          {!isSidebarCollapsed && (
            <p className="text-xs text-slate-500 mt-1">{safeProgress}% complete</p>
          )}
        </div>

        {/* Step list */}
        <div className="flex-1 overflow-y-auto">
          {sortedSteps.map((step, index) => {
            const isCompleted = index < completedStepsCount;
            const isCurrent   = index === currentStepIndex;
            const isSelected  = index === selectedStepIndex;

            return (
              <button
                key={`${step.title}-${index}`}
                type="button"
                onClick={() => setSelectedStepIndex(index)}
                title={`Step ${index + 1}: ${step.title}`}
                className={`relative w-full min-h-[72px] transition border-b border-slate-200 ${
                  isSelected
                    ? 'bg-blue-50 border-l-4 border-l-blue-600 pl-3'
                    : 'bg-transparent hover:bg-slate-100'
                } ${isSidebarCollapsed ? 'px-2 py-3 flex justify-center' : 'text-left px-4 py-3'}`}
              >
                <div className={`flex items-start transition-all duration-200 ease-out ${isSidebarCollapsed ? 'justify-center gap-0' : 'gap-3'}`}>
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold shrink-0 ${
                      isCompleted
                        ? 'bg-emerald-100 text-emerald-700'
                        : isCurrent
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {isCompleted ? <CheckCircle className="w-4 h-4" /> : index + 1}
                  </div>

                  <div
                    className={`min-w-0 overflow-hidden transition-[max-width,max-height,opacity,transform] duration-200 ease-out ${
                      isSidebarCollapsed
                        ? 'max-w-0 max-h-0 opacity-0 -translate-x-1'
                        : 'max-w-[240px] max-h-16 opacity-100 translate-x-0'
                    }`}
                  >
                    <p className="text-[11px] uppercase tracking-wide text-slate-400 font-semibold">Step {index + 1}</p>
                    <p className="text-sm font-semibold text-slate-800 truncate">{step.title}</p>
                    <p className="text-xs text-slate-500 capitalize flex items-center gap-1">
                      {isCompleted ? 'Completed' : isCurrent ? 'In progress' : 'Not started'}
                      <span className="text-slate-300">·</span>
                      {getStepIcon(step.type)}
                      {step.type}
                    </p>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </aside>

      {/* ── RIGHT CONTENT: AI Coach Workspace ──────────────────────────────── */}
      <main className={`flex-1 transition-all duration-300 ${contentDesktopOffset} flex flex-col overflow-y-auto`}>

        <AnimatePresence mode="wait">
          <motion.div
            key={selectedStepIndex}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.2 }}
            className="flex-1 flex flex-col"
          >
            {/* ── Knowledge or Practice → StudentTutor workspace ─────────── */}
            {selectedStep && (selectedStep.type === 'document' || selectedStep.type === 'assignment') && (
              <div className="flex-1 bg-white">
                <StudentTutor
                  studentId={studentId}
                  selectedSubjectId={selectedSubjectId}
                  subjects={[]}
                  activePlan={planProp}
                  prefillMessage={prefillMessage}
                />
              </div>
            )}

            {/* ── Quiz → Final Mastery Check ─────────────────────────────── */}
            {selectedStep && selectedStep.type === 'quiz' && !completedPracticeSteps[selectedStepIndex] && (
              <div className="flex-1 p-8 bg-white">
                <header className="mb-10 border-b border-slate-100 pb-8">
                  <p className="text-[11px] font-black uppercase tracking-widest text-blue-500 mb-2">Final Assessment</p>
                  <h2 className="text-4xl font-black text-slate-900 uppercase tracking-tight italic leading-none">
                    Mastery Check
                  </h2>
                  <p className="text-slate-500 mt-3 text-base max-w-xl">
                    Prove your understanding of <span className="font-semibold text-slate-700">{selectedStep.title}</span> to complete this mission stage.
                  </p>
                </header>

                {/* Inline practice runner for quiz */}
                <StudentPracticeRunner
                  key={`${plan.id}-${selectedStepIndex}`}
                  title={selectedStep.title}
                  subtitle="Answer each question carefully. You must complete the quiz to unlock the next step."
                  questions={buildMockPracticeQuestions(selectedStep.title, 'quiz')}
                  onComplete={() =>
                    setCompletedPracticeSteps((prev) => ({ ...prev, [selectedStepIndex]: true }))
                  }
                />

                {/* Optionally open external mission link */}
                {selectedStep.link && (
                  <div className="mt-8 pt-6 border-t border-slate-100">
                    <button
                      onClick={() => onOpenMission(selectedStep.link!)}
                      className="inline-flex items-center gap-2.5 bg-slate-900 text-white px-6 py-3 rounded-xl font-bold uppercase tracking-widest text-sm hover:bg-blue-600 transition-all shadow-lg"
                    >
                      Open External Assessment
                      <ExternalLink className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* ── Quiz completed state ────────────────────────────────────── */}
            {selectedStep && selectedStep.type === 'quiz' && completedPracticeSteps[selectedStepIndex] && (
              <div className="flex-1 flex flex-col items-center justify-center p-8 bg-white text-center">
                <div className="w-20 h-20 rounded-full bg-emerald-100 flex items-center justify-center mb-6">
                  <CheckCircle className="w-10 h-10 text-emerald-600" />
                </div>
                <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tight italic">Mission Stage Complete</h2>
                <p className="text-slate-500 mt-3 max-w-sm">
                  You've passed the mastery check for <span className="font-semibold text-slate-700">{selectedStep.title}</span>.
                </p>
                {nextStep && (
                  <button
                    type="button"
                    onClick={() => setSelectedStepIndex((prev) => Math.min(prev + 1, totalSteps - 1))}
                    className="mt-8 inline-flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-xl font-bold text-sm hover:bg-blue-700 transition-all shadow-lg"
                  >
                    Continue to: {nextStep.title}
                  </button>
                )}
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        {/* ── Up-next footer (non-practice steps) ──────────────────────────── */}
        {showUpNextFooter && selectedStep?.type !== 'document' && selectedStep?.type !== 'assignment' && (
          <footer className="sticky bottom-0 z-20 border-t border-slate-200 bg-white/90 backdrop-blur-sm px-6 py-4">
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => {
                  if (nextStep) setSelectedStepIndex((prev) => Math.min(prev + 1, totalSteps - 1));
                }}
                disabled={!nextStep}
                className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed transition-all shadow-md"
              >
                {nextStep ? `Up next: ${nextStep.title}` : '🎉 Mission Complete'}
              </button>
            </div>
          </footer>
        )}
      </main>
    </div>
  );
};

export default StudentPlanView;