import React, { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { DevelopmentPlan, Step } from '../../types';
import {
  BookOpen,
  CheckCircle,
  ChevronsLeft,
  ChevronsRight,
  Edit,
  ExternalLink,
  FileText,
} from 'lucide-react';
import StudentTutor, { TutorStep } from '../student v1.2/StudentTutor';
import StudentPracticeRunner, { buildMockPracticeQuestions } from './StudentPracticeRunner';

// ─────────────────────────────────────────────────────────────────────────────
// BACKEND ADAPTOR
// ─────────────────────────────────────────────────────────────────────────────
//
// Real schema (planModel.js):
//
//   plan.missions[]
//     ├── task          (string)   ← the mission headline shown in the sidebar
//     ├── objective     (string)   ← used as fallback step content
//     ├── status        (string)
//     ├── resourceLink  (string)
//     └── steps[]
//           ├── title          (string)
//           ├── content        (string)  ← theory text / instructions for the AI
//           ├── type           ('Theory' | 'Interactive_Exercise' | 'Hinted_Practice')
//           └── exitCheckpoint
//                 ├── question      (string)
//                 ├── expectedLogic (string)  ← what the AI checks the student against
//                 └── isPassed      (boolean)
//
// We flatMap missions → steps so the sidebar lists individual steps.
// Each step carries its parentMissionId so the controller can update it.
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

/**
 * Maps a backend step type to the UI step type used by icons / routing logic.
 */
const backendTypeToUiType = (type?: string): Step['type'] => {
  switch (type) {
    case 'Theory':                return 'document';
    case 'Interactive_Exercise':  return 'assignment';
    case 'Hinted_Practice':       return 'assignment';
    default:                      return 'document';
  }
};

/**
 * Flattens plan.missions[].steps[] into a single ordered Step array.
 *
 * If a mission has no steps we emit one synthetic step from the mission
 * itself (task + objective) so the sidebar always has something to show.
 *
 * We attach extra fields (missionId, stepId, exitCheckpoint) as non-schema
 * properties so StudentTutor can pass them straight through to the backend.
 */
export const adaptBackendPlan = (backendPlan: BackendPlan): DevelopmentPlan => {
  const missions = backendPlan.missions ?? [];
  let order = 0;

  const steps: Step[] = missions.flatMap((mission) => {
    if (mission.steps && mission.steps.length > 0) {
      return mission.steps.map((step) => ({
        // Core Step fields
        title:   step.title,
        type:    backendTypeToUiType(step.type),
        order:   order++,
        link:    mission.resourceLink,

        // Extra fields carried through for the tutor
        content:          step.content || mission.objective || '',
        exitCheckpoint:   step.exitCheckpoint,
        missionId:        mission._id,
        stepId:           step._id,
        parentMissionTask: mission.task,

        additionalResources: mission.objective ? [mission.objective] : undefined,
      }));
    }

    // Synthetic step for missions that have no nested steps yet
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
    plan: {
      name: backendPlan.title,
      steps,
    },
  };
};

// ─────────────────────────────────────────────────────────────────────────────

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
    case 'document':   return <FileText className="w-4 h-4" />;
    case 'assignment': return <Edit     className="w-4 h-4" />;
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

  const selectedStep = sortedSteps[selectedStepIndex] || null;
  const nextStep     = selectedStepIndex < totalSteps - 1 ? sortedSteps[selectedStepIndex + 1] : null;

  const sidebarDesktopWidth  = isSidebarCollapsed ? 'md:w-[88px]'  : 'md:w-[300px]';
  const contentDesktopOffset = isSidebarCollapsed ? 'md:ml-[88px]' : 'md:ml-[300px]';

  // ── Build TutorStep for the current step ───────────────────────────────────
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

  // All steps as TutorStep for the progress trail in StudentTutor
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

  // Prefill message shown in the tutor chat when the step changes
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

  // ── Checkpoint callback from StudentTutor ──────────────────────────────────
  // The backend has already updated the DB; we just reflect it in local UI state.
  const handleCheckpointPassed = () => {
    setCompletedPracticeSteps((prev) => ({ ...prev, [selectedStepIndex]: true }));
  };

  const selectedStepIsPractice = Boolean(selectedStep && isPracticeStep(selectedStep.type));
  const showUpNextFooter = !selectedStepIsPractice || Boolean(completedPracticeSteps[selectedStepIndex]);

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div
      className="flex bg-slate-50"
      style={{ height: 'calc(100vh - var(--student-header-offset, 9rem))', overflow: 'hidden' }}
    >
      {/* ── LEFT SIDEBAR ─────────────────────────────────────────────────── */}
      <aside
        className={`fixed left-0 bg-slate-50 border-r border-slate-200 transition-all duration-300 z-30 flex flex-col ${sidebarDesktopWidth}`}
        style={{
          top:    'var(--student-header-offset, 9rem)',
          height: 'calc(100vh - var(--student-header-offset, 9rem))',
        }}
      >
        {/* Collapse toggle */}
        <button
          type="button"
          onClick={() => setIsSidebarCollapsed((prev) => !prev)}
          className="hidden md:inline-flex absolute top-1/2 -translate-y-1/2 -right-4 z-30 h-8 w-8 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 shadow-sm hover:bg-slate-50"
          aria-label={isSidebarCollapsed ? 'Expand panel' : 'Collapse panel'}
        >
          {isSidebarCollapsed
            ? <ChevronsRight className="w-4 h-4" />
            : <ChevronsLeft  className="w-4 h-4" />}
        </button>

        {/* Plan header */}
        <div className="border-b border-slate-200 px-4 py-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
              <BookOpen className="w-4 h-4" />
            </div>
            <div className={`min-w-0 overflow-hidden transition-[max-width,opacity] duration-200 ${isSidebarCollapsed ? 'max-w-0 opacity-0' : 'max-w-[200px] opacity-100'}`}>
              <h2 className="text-sm font-bold text-slate-900 truncate">{plan.plan.name}</h2>
              <p className="text-xs text-slate-500">{totalSteps} steps · {safeProgress}% done</p>
            </div>
          </div>
          <div className={`mt-3 h-1.5 rounded-full bg-slate-200 overflow-hidden transition-opacity duration-200 ${isSidebarCollapsed ? 'opacity-0' : 'opacity-100'}`}>
            <div
              className={`${getProgressColor(safeProgress)} h-1.5 transition-all duration-500`}
              style={{ width: `${safeProgress}%` }}
            />
          </div>
        </div>

        {/* Step list */}
        <div className="flex-1 overflow-y-auto">
          {sortedSteps.map((step: any, index) => {
            // A step is completed if: exitCheckpoint.isPassed is true, OR we locally recorded it
            const isCompleted = step.exitCheckpoint?.isPassed
              || completedPracticeSteps[index]
              || index < completedStepsCount;
            const isCurrent  = index === currentStepIndex;
            const isSelected = index === selectedStepIndex;

            return (
              <button
                key={`${step.title}-${index}`}
                type="button"
                onClick={() => setSelectedStepIndex(index)}
                title={`Step ${index + 1}: ${step.title}`}
                className={`relative w-full min-h-[68px] transition border-b border-slate-200 ${
                  isSelected
                    ? 'bg-blue-50 border-l-4 border-l-blue-600 pl-3'
                    : 'hover:bg-slate-100'
                } ${isSidebarCollapsed ? 'px-2 py-3 flex justify-center' : 'text-left px-4 py-3'}`}
              >
                <div className={`flex items-start gap-3 ${isSidebarCollapsed ? 'justify-center' : ''}`}>
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold shrink-0 ${
                    isCompleted
                      ? 'bg-emerald-100 text-emerald-700'
                      : isCurrent
                        ? 'bg-blue-100 text-blue-700'
                        : 'bg-slate-100 text-slate-600'
                  }`}>
                    {isCompleted ? <CheckCircle className="w-4 h-4" /> : index + 1}
                  </div>

                  <div className={`min-w-0 overflow-hidden transition-[max-width,opacity] duration-200 ${isSidebarCollapsed ? 'max-w-0 opacity-0' : 'max-w-[200px] opacity-100'}`}>
                    {/* Show parent mission task as group label */}
                    {step.parentMissionTask && (
                      <p className="text-[10px] uppercase tracking-wide text-slate-400 font-semibold truncate">
                        {step.parentMissionTask}
                      </p>
                    )}
                    <p className="text-sm font-semibold text-slate-800 truncate">{step.title}</p>
                    <p className="text-xs text-slate-500 capitalize flex items-center gap-1 mt-0.5">
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

      {/* ── MAIN CONTENT ──────────────────────────────────────────────────── */}
      <main className={`flex-1 transition-all duration-300 ${contentDesktopOffset} flex flex-col overflow-hidden`}>
        <AnimatePresence mode="wait">
          <motion.div
            key={selectedStepIndex}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
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
              <div className="flex-1 p-8 bg-white overflow-y-auto">
                <header className="mb-8 pb-6 border-b border-slate-100">
                  <p className="text-[11px] font-black uppercase tracking-widest text-blue-500 mb-2">Final Assessment</p>
                  <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tight italic leading-none">
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
                    setCompletedPracticeSteps((prev) => ({ ...prev, [selectedStepIndex]: true }))
                  }
                />

                {selectedStep.link && (
                  <div className="mt-8 pt-6 border-t border-slate-100">
                    <button
                      onClick={() => onOpenMission(selectedStep.link!)}
                      className="inline-flex items-center gap-2 bg-slate-900 text-white px-6 py-3 rounded-xl font-bold text-sm hover:bg-blue-600 transition-all"
                    >
                      Open External Assessment
                      <ExternalLink className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Quiz completed state */}
            {selectedStep && selectedStep.type === 'quiz' && completedPracticeSteps[selectedStepIndex] && (
              <div className="flex-1 flex flex-col items-center justify-center p-8 bg-white text-center">
                <div className="w-20 h-20 rounded-full bg-emerald-100 flex items-center justify-center mb-6">
                  <CheckCircle className="w-10 h-10 text-emerald-600" />
                </div>
                <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tight italic">
                  Mission Stage Complete
                </h2>
                <p className="text-slate-500 mt-3 max-w-sm">
                  You've passed the mastery check for{' '}
                  <span className="font-semibold text-slate-700">{selectedStep.title}</span>.
                </p>
                {nextStep && (
                  <button
                    type="button"
                    onClick={() => setSelectedStepIndex((prev) => Math.min(prev + 1, totalSteps - 1))}
                    className="mt-8 inline-flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-xl font-bold text-sm hover:bg-blue-700 transition-all"
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
          <footer className="shrink-0 border-t border-slate-200 bg-white px-6 py-3 flex justify-end">
            <button
              type="button"
              onClick={() => setSelectedStepIndex((prev) => Math.min(prev + 1, totalSteps - 1))}
              className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-blue-700 transition-all"
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