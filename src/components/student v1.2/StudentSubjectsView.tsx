import React, { useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  BookOpen,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  ExternalLink,
  FileText,
  GripHorizontal,
  MessageCircle,
  PlayCircle,
  Send,
  Sparkles,
  Target,
  X,
} from 'lucide-react';
import { CourseAttribute, StudentAttribute, Subject } from '../../types';
import { courseService } from '../../services/courseService';
import { fetchAiData } from '../../services/apiClient';
import StudentPracticeRunner, { buildMockPracticeQuestions, PracticeQuestion, PracticeRunSummary } from './StudentPracticeRunner';

// ─── Local placeholder types for removed external services ───────────────────
// These kept only so the AI-challenge code compiles; the real data now comes
// from courseService (CourseAttribute + StudentAttribute).
type Question = { text?: string; type?: string; options?: unknown[]; correctAnswer?: unknown };
// eslint-disable-next-line @typescript-eslint/no-unused-vars
type CurriculumTopicApi = never;
// eslint-disable-next-line @typescript-eslint/no-unused-vars
type CurriculumTopicResource = {
  id: string; type?: string; mimeType?: string; contentType?: string;
  name?: string; originalName?: string; status?: string;
};

type PracticeStatus = 'not-started' | 'in-progress' | 'mastered';
type ResourceType = 'video' | 'notes' | 'article';

interface CurriculumResource {
  id: string;
  title: string;
  type: ResourceType;
}

interface CurriculumPractice {
  id: string;
  title: string;
  status: PracticeStatus;
  target: string;
}

interface CurriculumAssessment {
  id: string;
  title: string;
  status: string;
}

interface CurriculumTopic {
  id: string;
  title: string;
  masteryPercent: number;
  learn: CurriculumResource[];
  practice: CurriculumPractice[];
  practiceMaterials: CurriculumResource[];
  assessments: CurriculumAssessment[];
}

type TopicContentItemKind = 'learn' | 'practice' | 'assessment';

interface TopicContentItem {
  id: string;
  title: string;
  kind: TopicContentItemKind;
  resource?: CurriculumResource;
  practice?: CurriculumPractice;
  assessment?: CurriculumAssessment;
}

interface CurriculumUnit {
  id: string;
  code: string;
  title: string;
  summary: string;
  masteryPercent: number;
  topics: CurriculumTopic[];
}

interface StudentSubjectsViewProps {
  studentId: string;
  selectedSubjectId: string;
  subjects: Subject[];
}

type UnitChallengeStage = 'intro' | 'running' | 'completed';
type ChallengeDifficulty = 'easy' | 'medium' | 'hard';

interface ChallengeGenerationConfig {
  questionCount: number;
  difficulty: ChallengeDifficulty;
  prompt: string;
  questions: PracticeQuestion[];
  isGenerating: boolean;
  generatedWithAi: boolean;
  error: string | null;
}

interface SubjectsChatMessage {
  id: string;
  sender: 'student' | 'coach';
  text: string;
}

interface SubjectsChatDragState {
  startX: number;
  startY: number;
  originX: number;
  originY: number;
}

const DEFAULT_UNIT_CHALLENGE_COUNT = 10;
const DEFAULT_SUBJECT_CHALLENGE_COUNT = 12;
const CRITICAL_TOPIC_MASTERY_THRESHOLD = 50;

const createChallengeGenerationConfig = (questionCount: number): ChallengeGenerationConfig => ({
  questionCount,
  difficulty: 'medium',
  prompt: '',
  questions: [],
  isGenerating: false,
  generatedWithAi: false,
  error: null,
});

const getPracticeActionLabel = (status: PracticeStatus) => {
  if (status === 'mastered') return 'Review';
  if (status === 'in-progress') return 'Resume';
  return 'Start';
};

const getResourceBadgeClassName = (type: ResourceType) => {
  if (type === 'video') return 'bg-red-100 text-red-700';
  if (type === 'notes') return 'bg-blue-100 text-blue-700';
  return 'bg-slate-100 text-slate-700';
};

const getTopicContentItems = (topic: CurriculumTopic): TopicContentItem[] => [
  ...topic.learn.map((resource) => ({
    id: `learn-${resource.id}`,
    title: resource.title,
    kind: 'learn' as const,
    resource,
  })),
  ...topic.practiceMaterials.map((resource) => ({
    id: `learn-${resource.id}`,
    title: resource.title,
    kind: 'learn' as const,
    resource,
  })),
  ...topic.practice.map((practice) => ({
    id: `practice-${practice.id}`,
    title: practice.title,
    kind: 'practice' as const,
    practice,
  })),
  ...topic.assessments.map((assessment) => ({
    id: `assessment-${assessment.id}`,
    title: assessment.title,
    kind: 'assessment' as const,
    assessment,
  })),
];

const getUpNextLabelForContentItem = (item: TopicContentItem) => {
  if (item.kind === 'practice') return 'quiz';
  if (item.kind === 'assessment') return 'assessment';
  if (!item.resource) return 'lesson';
  if (item.resource.type === 'video') return 'video';
  if (item.resource.type === 'notes') return 'notes';
  return 'article';
};

const normalizeText = (value: string | null | undefined) => String(value || '').trim().toLowerCase();

const getQuestionOptionText = (option: unknown): string => {
  if (typeof option === 'string') return option.trim();
  if (option && typeof option === 'object' && 'text' in option) {
    const text = (option as { text?: unknown }).text;
    return typeof text === 'string' ? text.trim() : '';
  }
  return '';
};

const isQuestionOptionCorrect = (option: unknown): boolean => {
  if (!option || typeof option !== 'object' || !('isCorrect' in option)) return false;
  return Boolean((option as { isCorrect?: unknown }).isCorrect);
};

const getResourceTypeFromItem = (
  resource: Pick<CurriculumTopicResource, 'type' | 'mimeType' | 'contentType' | 'name' | 'originalName'>
): ResourceType => {
  const normalizedType = normalizeText(resource.type);
  const normalizedMime = normalizeText(resource.mimeType);
  const normalizedContentType = normalizeText(resource.contentType);
  const normalizedName = normalizeText(resource.name || resource.originalName);

  if (
    normalizedType.includes('video') ||
    normalizedMime.startsWith('video/') ||
    normalizedContentType.includes('video') ||
    normalizedName.endsWith('.mp4') ||
    normalizedName.endsWith('.mov')
  ) {
    return 'video';
  }

  if (
    normalizedType.includes('document') ||
    normalizedType.includes('notes') ||
    normalizedName.endsWith('.pdf') ||
    normalizedName.endsWith('.doc') ||
    normalizedName.endsWith('.docx') ||
    normalizedName.endsWith('.ppt') ||
    normalizedName.endsWith('.pptx')
  ) {
    return 'notes';
  }

  return 'article';
};

// ─────────────────────────────────────────────────────────────────────────────
// DATA MAPPER
//
// Maps your real backend data to the CurriculumUnit[] shape the view uses.
//
// CourseAttribute schema:
//   { _id, attribute_id, name, parent_unit, level, description,
//     prerequisites, total_mastery_points, tags }
//
// StudentAttribute schema:
//   { _id, student, course, attribute, currentMastery }
//   where `attribute` is populated as a CourseAttribute document.
//
// Strategy:
//   - Group CourseAttributes by `parent_unit` → each group = one CurriculumUnit
//   - Each attribute within a unit = one CurriculumTopic
//   - Mastery comes from the matching StudentAttribute.currentMastery (0–1 → ×100)
// ─────────────────────────────────────────────────────────────────────────────

const mapAttributesToUnits = (
  courseAttributes: CourseAttribute[],
  studentAttributes: StudentAttribute[],
): CurriculumUnit[] => {
  // Build a mastery lookup: attributeId → mastery percent (0–100)
  const masteryByAttributeId = new Map<string, number>();
  studentAttributes.forEach((sa) => {
    const attrId = (sa.attribute as any)?._id?.toString()
      || (sa.attribute as any)?.toString()
      || '';
    if (attrId) {
      masteryByAttributeId.set(attrId, Math.round((sa.currentMastery || 0) * 100));
    }
  });

  // Group attributes by parent_unit
  const unitMap = new Map<string, CourseAttribute[]>();
  courseAttributes.forEach((attr) => {
    const unitName = attr.parent_unit || 'General';
    if (!unitMap.has(unitName)) unitMap.set(unitName, []);
    unitMap.get(unitName)!.push(attr);
  });

  let unitIndex = 0;
  const units: CurriculumUnit[] = [];

  unitMap.forEach((attrs, unitName) => {
    unitIndex += 1;
    const unitMastery = attrs.length > 0
      ? Math.round(attrs.reduce((sum, a) => {
          const m = masteryByAttributeId.get(a._id?.toString() || '') ?? 0;
          return sum + m;
        }, 0) / attrs.length)
      : 0;

    const topics: CurriculumTopic[] = attrs.map((attr) => {
      const topicMastery = masteryByAttributeId.get(attr._id?.toString() || '') ?? 0;

      return {
        id: attr._id?.toString() || attr.attribute_id,
        title: attr.name || attr.attribute_id,
        masteryPercent: topicMastery,
        learn: attr.description
          ? [{ id: `learn-${attr.attribute_id}`, title: attr.description, type: 'notes' as ResourceType }]
          : [],
        practice: [
          {
            id: `practice-${attr.attribute_id}`,
            title: `Practice: ${attr.name || attr.attribute_id}`,
            status: topicMastery >= 80 ? 'mastered' : topicMastery > 0 ? 'in-progress' : 'not-started',
            target: 'Complete practice questions',
          },
        ],
        practiceMaterials: [],
        assessments: [],
      };
    });

    units.push({
      id: `unit-${unitIndex}`,
      code: `Unit ${unitIndex}`,
      title: unitName,
      summary: `${attrs.length} attribute${attrs.length === 1 ? '' : 's'} · ${attrs.filter(a => (masteryByAttributeId.get(a._id?.toString() || '') ?? 0) >= 80).length} mastered`,
      masteryPercent: unitMastery,
      topics,
    });
  });

  return units;
};

const buildUnitChallengeQuestions = (unit: CurriculumUnit, targetCount = DEFAULT_UNIT_CHALLENGE_COUNT): PracticeQuestion[] => {
  const topicSeedPool = unit.topics.flatMap((topic, topicIndex) =>
    buildMockPracticeQuestions(`${unit.title} ${topic.title}`, 'quiz').map((question, questionIndex) => ({
      ...question,
      id: `${unit.id}-topic-${topicIndex + 1}-q-${questionIndex + 1}`,
    }))
  );

  const fallbackPool = buildMockPracticeQuestions(`${unit.title} unit challenge`, 'mixed').map((question, index) => ({
    ...question,
    id: `${unit.id}-fallback-q-${index + 1}`,
  }));

  const dedupedByPrompt: PracticeQuestion[] = [];
  const seenPrompts = new Set<string>();

  [...topicSeedPool, ...fallbackPool].forEach((question) => {
    const key = `${question.type}:${question.prompt.toLowerCase()}`;
    if (seenPrompts.has(key)) return;
    seenPrompts.add(key);
    dedupedByPrompt.push(question);
  });

  const finalizedQuestions = [...dedupedByPrompt];
  let fallbackIndex = 0;

  while (finalizedQuestions.length < targetCount) {
    const fallbackQuestion = fallbackPool[fallbackIndex % fallbackPool.length];
    finalizedQuestions.push({
      ...fallbackQuestion,
      id: `${unit.id}-extra-q-${fallbackIndex + 1}`,
    });
    fallbackIndex += 1;
  }

  return finalizedQuestions.slice(0, targetCount).map((question, index) => ({
    ...question,
    id: `${unit.id}-challenge-q-${index + 1}`,
  }));
};

const buildSubjectChallengeQuestions = (units: CurriculumUnit[], targetCount = DEFAULT_SUBJECT_CHALLENGE_COUNT): PracticeQuestion[] => {
  const pooledQuestions = units.flatMap((unit, unitIndex) =>
    buildUnitChallengeQuestions(unit).map((question, questionIndex) => ({
      ...question,
      id: `subject-${unitIndex + 1}-q-${questionIndex + 1}`,
    }))
  );

  const dedupedByPrompt: PracticeQuestion[] = [];
  const seenPrompts = new Set<string>();

  pooledQuestions.forEach((question) => {
    const key = `${question.type}:${question.prompt.toLowerCase()}`;
    if (seenPrompts.has(key)) return;
    seenPrompts.add(key);
    dedupedByPrompt.push(question);
  });

  const fallbackPool = dedupedByPrompt.length > 0 ? dedupedByPrompt : buildMockPracticeQuestions('subject challenge', 'mixed');
  const finalizedQuestions = [...dedupedByPrompt];
  let fallbackIndex = 0;

  while (finalizedQuestions.length < targetCount) {
    const fallbackQuestion = fallbackPool[fallbackIndex % fallbackPool.length];
    finalizedQuestions.push({
      ...fallbackQuestion,
      id: `subject-extra-q-${fallbackIndex + 1}`,
    });
    fallbackIndex += 1;
  }

  return finalizedQuestions.slice(0, targetCount).map((question, index) => ({
    ...question,
    id: `subject-challenge-q-${index + 1}`,
  }));
};

const mapAiQuestionsToPractice = (
  aiQuestions: Question[],
  fallbackSeed: string,
  targetCount: number
): PracticeQuestion[] => {
  const mappedQuestions: PracticeQuestion[] = aiQuestions.map((question, index) => {
    const prompt = (question.text || `Question ${index + 1}`).trim();
    const questionOptions = Array.isArray(question.options) ? (question.options as unknown[]) : [];

    const optionTexts = questionOptions.map((option) => getQuestionOptionText(option)).filter((option): option is string => option.length > 0);

    if ((question.type === 'multiple_choice' || question.type === 'true_false') && optionTexts.length >= 2) {
      const correctIndexesFromFlags = questionOptions
        .map((option, optionIndex) => {
          return isQuestionOptionCorrect(option) ? optionIndex : null;
        })
        .filter((value): value is number => typeof value === 'number');

      let correctOptionIndexes = correctIndexesFromFlags;
      if (correctOptionIndexes.length === 0 && question.correctAnswer) {
        const correctAnswers = Array.isArray(question.correctAnswer)
          ? question.correctAnswer.map((answer) => String(answer).trim().toLowerCase())
          : [String(question.correctAnswer).trim().toLowerCase()];
        correctOptionIndexes = optionTexts
          .map((option, optionIndex) => (correctAnswers.includes(option.trim().toLowerCase()) ? optionIndex : -1))
          .filter((value) => value >= 0);
      }

      if (correctOptionIndexes.length === 0) {
        correctOptionIndexes = [0];
      }

      return {
        id: `ai-choice-${index + 1}`,
        type: correctOptionIndexes.length > 1 ? 'multiple' : 'single',
        prompt,
        options: optionTexts,
        correctOptionIndexes,
      } as PracticeQuestion;
    }

    const acceptedAnswers = Array.isArray(question.correctAnswer)
      ? question.correctAnswer.map((answer) => String(answer))
      : question.correctAnswer
        ? [String(question.correctAnswer)]
        : ['sample answer'];

    return {
      id: `ai-input-${index + 1}`,
      type: 'input',
      prompt,
      placeholder: 'Type your answer',
      acceptedAnswers,
    } as PracticeQuestion;
  });

  const fallbackQuestions = buildMockPracticeQuestions(fallbackSeed, 'quiz');
  const finalizedQuestions = [...mappedQuestions];

  while (finalizedQuestions.length < targetCount) {
    const fallbackQuestion = fallbackQuestions[finalizedQuestions.length % fallbackQuestions.length];
    finalizedQuestions.push({
      ...fallbackQuestion,
      id: `fallback-${finalizedQuestions.length + 1}`,
    });
  }

  return finalizedQuestions.slice(0, targetCount).map((question, index) => ({
    ...question,
    id: `generated-${index + 1}`,
  }));
};

const StudentSubjectsView: React.FC<StudentSubjectsViewProps> = ({ studentId, selectedSubjectId, subjects }) => {
  const navigate = useNavigate();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isSubjectOverviewActive, setIsSubjectOverviewActive] = useState(false);
  const [selectedUnitIndex, setSelectedUnitIndex] = useState(0);
  const [backendUnits, setBackendUnits] = useState<CurriculumUnit[]>([]);
  const [subjectOverview, setSubjectOverview] = useState<StudentSubjectOverview | null>(null);
  const [isCurriculumLoading, setIsCurriculumLoading] = useState(false);
  const [, setCurriculumError] = useState<string | null>(null);
  const [practiceStatusOverrides, setPracticeStatusOverrides] = useState<Record<string, PracticeStatus>>({});
  const [collapsedTopicIds, setCollapsedTopicIds] = useState<Record<string, boolean>>({});
  const [detailState, setDetailState] = useState<{ unitId: string; topicId: string; contentItemId: string } | null>(null);
  const [unitChallengeState, setUnitChallengeState] = useState<{
    unitId: string;
    stage: UnitChallengeStage;
    summary?: PracticeRunSummary | null;
  } | null>(null);
  const [subjectChallengeState, setSubjectChallengeState] = useState<{
    stage: UnitChallengeStage;
    summary?: PracticeRunSummary | null;
  } | null>(null);
  const [unitChallengeStep, setUnitChallengeStep] = useState<1 | 2>(1);
  const [subjectChallengeStep, setSubjectChallengeStep] = useState<1 | 2>(1);
  const [unitChallengeConfigByUnitId, setUnitChallengeConfigByUnitId] = useState<Record<string, ChallengeGenerationConfig>>({});
  const [subjectChallengeConfigBySubjectId, setSubjectChallengeConfigBySubjectId] = useState<Record<string, ChallengeGenerationConfig>>({});
  const [isSubjectsChatOpen, setIsSubjectsChatOpen] = useState(false);
  const [subjectsChatInput, setSubjectsChatInput] = useState('');
  const [subjectsChatMessages, setSubjectsChatMessages] = useState<SubjectsChatMessage[]>([
    {
      id: 'subjects-chat-welcome',
      sender: 'coach',
      text: 'Need help on this topic? Ask a question and I will guide your next step.',
    },
  ]);
  const [subjectsChatPosition, setSubjectsChatPosition] = useState<{ x: number; y: number } | null>(null);
  const subjectsChatFloatingRef = useRef<HTMLDivElement | null>(null);
  const subjectsChatDragStateRef = useRef<SubjectsChatDragState | null>(null);
  const subjectsChatDragCleanupRef = useRef<(() => void) | null>(null);

  const activeSubject = useMemo(() => {
    if (subjects.length === 0) return null;
    if (selectedSubjectId === 'all') return subjects[0];
    return subjects.find((subject) => subject.id === selectedSubjectId) || subjects[0];
  }, [selectedSubjectId, subjects]);

  const units = useMemo(() => backendUnits, [backendUnits]);

  const selectedUnit = units[selectedUnitIndex] || units[0];
  const nextUnit = selectedUnitIndex < units.length - 1 ? units[selectedUnitIndex + 1] : null;
  const sidebarDesktopWidth = isSidebarCollapsed ? 'xl:w-[88px]' : 'xl:w-[320px]';
  const contentDesktopOffset = isSidebarCollapsed ? 'xl:ml-[88px]' : 'xl:ml-[320px]';
  const desktopSidebarWidthPx = isSidebarCollapsed ? 88 : 320;
  const desktopContainerInset = 'max(1rem, calc((100vw - 1400px)/2 + 1rem))';
  const activeUnitChallenge = unitChallengeState && unitChallengeState.unitId === selectedUnit?.id ? unitChallengeState : null;
  const isUnitChallengeActive = Boolean(activeUnitChallenge);
  const isUnitChallengeRunning = activeUnitChallenge?.stage === 'running';
  const isSubjectChallengeActive = Boolean(subjectChallengeState);
  const isSubjectChallengeRunning = subjectChallengeState?.stage === 'running';
  const activeUnitChallengeStep: 1 | 2 = isUnitChallengeRunning ? 2 : unitChallengeStep;
  const activeSubjectChallengeStep: 1 | 2 = isSubjectChallengeRunning ? 2 : subjectChallengeStep;
  const selectedUnitChallengeConfig = selectedUnit
    ? unitChallengeConfigByUnitId[selectedUnit.id] || createChallengeGenerationConfig(DEFAULT_UNIT_CHALLENGE_COUNT)
    : createChallengeGenerationConfig(DEFAULT_UNIT_CHALLENGE_COUNT);
  const selectedSubjectChallengeConfig = activeSubject
    ? subjectChallengeConfigBySubjectId[activeSubject.id] || createChallengeGenerationConfig(DEFAULT_SUBJECT_CHALLENGE_COUNT)
    : createChallengeGenerationConfig(DEFAULT_SUBJECT_CHALLENGE_COUNT);
  const unitChallengeQuestionTotal = selectedUnitChallengeConfig.questions.length > 0
    ? selectedUnitChallengeConfig.questions.length
    : selectedUnitChallengeConfig.questionCount;
  const subjectChallengeQuestionTotal = selectedSubjectChallengeConfig.questions.length > 0
    ? selectedSubjectChallengeConfig.questions.length
    : selectedSubjectChallengeConfig.questionCount;
  const unitChallengeEstimatedMinutes = Math.max(15, unitChallengeQuestionTotal * 2);
  const subjectChallengeEstimatedMinutes = Math.max(20, subjectChallengeQuestionTotal * 2);
  const subjectChallengeEligibility = subjectOverview?.challengeEligibility || null;
  const isSubjectChallengeEligible = subjectChallengeEligibility ? subjectChallengeEligibility.eligible : true;
  const subjectChallengeBlockedReason = !isSubjectChallengeEligible
    ? subjectChallengeEligibility?.reason || 'Subject challenge is currently unavailable.'
    : null;
  const shouldShowSubjectsChat = !isUnitChallengeActive && !isSubjectChallengeActive && Boolean(detailState);

  useEffect(() => {
    const loadCurriculum = async () => {
      if (!activeSubject?.id || !studentId) {
        setBackendUnits([]);
        setSubjectOverview(null);
        setCurriculumError(null);
        return;
      }

      setIsCurriculumLoading(true);
      setCurriculumError(null);

      try {
        // Fetch syllabus attributes and student mastery in parallel
        const [courseAttrs, studentAttrs] = await Promise.all([
          courseService.getCourseAttributes(activeSubject.id).catch(() => [] as CourseAttribute[]),
          courseService.getStudentAttributes(studentId, activeSubject.id).catch(() => [] as StudentAttribute[]),
        ]);

        const mappedUnits = mapAttributesToUnits(courseAttrs, studentAttrs);
        // Stash the raw attributes on the subject object for the challenge generator
        if (activeSubject) (activeSubject as any)._courseAttributes = courseAttrs;
        setBackendUnits(mappedUnits);

        // Build a minimal subjectOverview-compatible object so the rest of
        // the component (challenge eligibility, etc.) keeps working.
        setSubjectOverview({
          challengeEligibility: {
            eligible: mappedUnits.length > 0,
            reason: mappedUnits.length === 0 ? 'No syllabus attributes published yet.' : null,
          },
        } as any);

        if (mappedUnits.length === 0) {
          setCurriculumError('No syllabus attributes have been published for this subject yet.');
        } else {
          setCurriculumError(null);
        }
      } catch (loadError: any) {
        setBackendUnits([]);
        setSubjectOverview(null);
        setCurriculumError(loadError?.message || 'Unable to load curriculum. Please try again.');
      } finally {
        setIsCurriculumLoading(false);
      }
    };

    void loadCurriculum();
  }, [activeSubject?.id, activeSubject?.name, studentId]);

  useEffect(() => {
    setSelectedUnitIndex(0);
    setDetailState(null);
    setPracticeStatusOverrides({});
    setCollapsedTopicIds({});
    setSubjectOverview(null);
    setUnitChallengeState(null);
    setSubjectChallengeState(null);
    setUnitChallengeStep(1);
    setSubjectChallengeStep(1);
    setUnitChallengeConfigByUnitId({});
    setSubjectChallengeConfigBySubjectId({});
    setIsSubjectOverviewActive(false);
    setIsSubjectsChatOpen(false);
    setSubjectsChatInput('');
    setSubjectsChatPosition(null);
    setSubjectsChatMessages([
      {
        id: 'subjects-chat-welcome',
        sender: 'coach',
        text: 'Need help on this topic? Ask a question and I will guide your next step.',
      },
    ]);
  }, [activeSubject?.id]);

  useEffect(() => () => {
    if (subjectsChatDragCleanupRef.current) {
      subjectsChatDragCleanupRef.current();
    }
  }, []);

  useEffect(() => {
    if (!detailState) return;
    if (detailState.unitId !== selectedUnit?.id) {
      setDetailState(null);
    }
  }, [selectedUnit?.id]);

  useEffect(() => {
    if (!unitChallengeState || !selectedUnit?.id) return;
    if (unitChallengeState.unitId !== selectedUnit.id) {
      setUnitChallengeState(null);
    }
  }, [selectedUnit?.id, unitChallengeState]);

  const allTopics = useMemo(
    () => units.flatMap((unit) => unit.topics),
    [units]
  );

  const masteredTopics = allTopics.filter((topic) => topic.masteryPercent >= 80).length;
  const inProgressTopics = allTopics.filter((topic) => topic.masteryPercent >= 50 && topic.masteryPercent < 80).length;
  const overallCoverage = allTopics.length > 0
    ? Math.round(allTopics.reduce((sum, topic) => sum + topic.masteryPercent, 0) / allTopics.length)
    : 0;

  const getPracticeStatus = (practice: CurriculumPractice): PracticeStatus => (
    practiceStatusOverrides[practice.id] || practice.status
  );

  const hasTopicBeenAttempted = (topic: CurriculumTopic): boolean => {
    if (topic.masteryPercent > 0) return true;
    return topic.practice.some((practice) => getPracticeStatus(practice) !== 'not-started');
  };

  const updateUnitChallengeConfig = (updater: (current: ChallengeGenerationConfig) => ChallengeGenerationConfig) => {
    if (!selectedUnit) return;
    setUnitChallengeConfigByUnitId((previous) => {
      const current = previous[selectedUnit.id] || createChallengeGenerationConfig(DEFAULT_UNIT_CHALLENGE_COUNT);
      return {
        ...previous,
        [selectedUnit.id]: updater(current),
      };
    });
  };

  const updateSubjectChallengeConfig = (updater: (current: ChallengeGenerationConfig) => ChallengeGenerationConfig) => {
    if (!activeSubject) return;
    setSubjectChallengeConfigBySubjectId((previous) => {
      const current = previous[activeSubject.id] || createChallengeGenerationConfig(DEFAULT_SUBJECT_CHALLENGE_COUNT);
      return {
        ...previous,
        [activeSubject.id]: updater(current),
      };
    });
  };

  // ── Challenge question generation ─────────────────────────────────────────
  // Calls /devPlan-content-gen/unit-challenge on the Python AI service.
  // Falls back to local mock questions if the service is unavailable.

  const fetchAiChallengeQuestions = async (
    attributesForUnit: CourseAttribute[],
    unitTitle: string,
    count: number,
    difficulty: ChallengeDifficulty,
  ): Promise<{ questions: PracticeQuestion[]; fromAi: boolean }> => {
    try {
      const data = await fetchAiData<{ questions?: Array<{
        id?: string;
        prompt?: string;
        options?: string[];
        correctOptionIndex?: number;
        explanation?: string;
      }> }>('/devPlan-content-gen/unit-challenge', {
        method: 'POST',
        body: JSON.stringify({
          attributes:   attributesForUnit,
          unit_title:   unitTitle,
          subject_name: activeSubject?.name || unitTitle,
          count,
          difficulty,
        }),
      });

      const rawQuestions = data?.questions || [];
      if (rawQuestions.length === 0) throw new Error('No questions returned');

      const mapped: PracticeQuestion[] = rawQuestions.map((q, i) => ({
        id:                   q.id || `ai-${i + 1}`,
        type:                 'single' as const,
        prompt:               q.prompt || `Question ${i + 1}`,
        options:              q.options || [],
        correctOptionIndexes: [q.correctOptionIndex ?? 0],
      }));

      return { questions: mapped, fromAi: true };
    } catch {
      return { questions: [], fromAi: false };
    }
  };

  const generateUnitChallengeWithAi = async () => {
    if (!activeSubject || !selectedUnit) return;
    const currentConfig = selectedUnitChallengeConfig;
    updateUnitChallengeConfig((current) => ({ ...current, isGenerating: true, error: null }));

    // Gather the CourseAttribute objects that back this unit's topics
    const unitAttributeIds = new Set(selectedUnit.topics.map((t) => t.id));
    const unitAttributes = (activeSubject as any)._courseAttributes?.filter(
      (a: CourseAttribute) => unitAttributeIds.has((a as any)._id?.toString())
    ) || [];

    const { questions: aiQuestions, fromAi } = await fetchAiChallengeQuestions(
      unitAttributes,
      selectedUnit.title,
      currentConfig.questionCount,
      currentConfig.difficulty,
    );

    const finalQuestions = aiQuestions.length > 0
      ? aiQuestions
      : buildUnitChallengeQuestions(selectedUnit, currentConfig.questionCount);

    updateUnitChallengeConfig((current) => ({
      ...current,
      questions: finalQuestions,
      isGenerating: false,
      generatedWithAi: fromAi && aiQuestions.length > 0,
      error: !fromAi ? 'AI generation unavailable — using practice questions instead.' : null,
    }));
  };

  const generateSubjectChallengeWithAi = async () => {
    if (!activeSubject) return;
    if (!isSubjectChallengeEligible) {
      updateSubjectChallengeConfig((current) => ({
        ...current,
        error: subjectChallengeBlockedReason || 'Subject challenge is currently unavailable.',
      }));
      return;
    }
    const currentConfig = selectedSubjectChallengeConfig;
    updateSubjectChallengeConfig((current) => ({ ...current, isGenerating: true, error: null }));

    // For the subject challenge we pull questions from each unit and combine
    const allUnitQuestions: PracticeQuestion[] = [];
    const perUnit = Math.ceil(currentConfig.questionCount / Math.max(units.length, 1));

    for (const unit of units) {
      const { questions: aiQuestions } = await fetchAiChallengeQuestions(
        [],
        unit.title,
        perUnit,
        currentConfig.difficulty,
      );
      allUnitQuestions.push(...aiQuestions);
    }

    const finalQuestions = allUnitQuestions.length > 0
      ? allUnitQuestions.slice(0, currentConfig.questionCount)
      : buildSubjectChallengeQuestions(units, currentConfig.questionCount);

    updateSubjectChallengeConfig((current) => ({
      ...current,
      questions: finalQuestions,
      isGenerating: false,
      generatedWithAi: allUnitQuestions.length > 0,
      error: allUnitQuestions.length === 0 ? 'AI generation unavailable — using practice questions instead.' : null,
    }));
  };

  const openSubjectOverview = () => {
    setDetailState(null);
    setUnitChallengeState(null);
    setSubjectChallengeState(null);
    setIsSubjectOverviewActive(true);
  };

  const openUnitPage = (unit: CurriculumUnit) => {
    const unitIndex = units.findIndex((currentUnit) => currentUnit.id === unit.id);
    if (unitIndex >= 0) setSelectedUnitIndex(unitIndex);
    setDetailState(null);
    setUnitChallengeState(null);
    setSubjectChallengeState(null);
    setIsSubjectOverviewActive(false);
  };

  const openPractice = (unit: CurriculumUnit, topic: CurriculumTopic, practice: CurriculumPractice) => {
    const effectiveStatus = getPracticeStatus(practice);
    if (effectiveStatus !== 'mastered') {
      setPracticeStatusOverrides((previous) => ({ ...previous, [practice.id]: 'in-progress' }));
    }
    const items = getTopicContentItems(topic);
    const practiceItem = items.find((item) => item.kind === 'practice' && item.practice?.id === practice.id);
    if (practiceItem) {
      setUnitChallengeState(null);
      setSubjectChallengeState(null);
      setIsSubjectOverviewActive(false);
      setDetailState({
        unitId: unit.id,
        topicId: topic.id,
        contentItemId: practiceItem.id,
      });
    }
  };

  const openTopicDetail = (unit: CurriculumUnit, topic: CurriculumTopic, preferredContentItemId?: string) => {
    const items = getTopicContentItems(topic);
    if (items.length === 0) return;
    const selectedContentItemId = preferredContentItemId && items.some((item) => item.id === preferredContentItemId)
      ? preferredContentItemId
      : items[0].id;

    const unitIndex = units.findIndex((currentUnit) => currentUnit.id === unit.id);
    if (unitIndex >= 0) setSelectedUnitIndex(unitIndex);

    setUnitChallengeState(null);
    setSubjectChallengeState(null);
    setIsSubjectOverviewActive(false);
    setDetailState({
      unitId: unit.id,
      topicId: topic.id,
      contentItemId: selectedContentItemId,
    });
  };

  const toggleTopicCollapsed = (topicId: string) => {
    setCollapsedTopicIds((previous) => ({
      ...previous,
      [topicId]: !previous[topicId],
    }));
  };

  const sendSubjectsChatMessage = () => {
    const message = subjectsChatInput.trim();
    if (!message) return;

    const studentMessage: SubjectsChatMessage = {
      id: `subjects-student-${Date.now()}`,
      sender: 'student',
      text: message,
    };

    const focusLabel = detailTopic?.title || selectedUnit?.title || activeSubject?.name || 'this topic';
    const coachReply: SubjectsChatMessage = {
      id: `subjects-coach-${Date.now() + 1}`,
      sender: 'coach',
      text: `Focus on "${focusLabel}". Review one example, then attempt one practice item and explain each step.`,
    };

    setSubjectsChatMessages((previous) => [...previous, studentMessage, coachReply]);
    setSubjectsChatInput('');
  };

  const clampSubjectsChatPosition = (x: number, y: number) => {
    const floatingNode = subjectsChatFloatingRef.current;
    if (!floatingNode) return { x, y };

    const margin = 8;
    const width = floatingNode.offsetWidth;
    const height = floatingNode.offsetHeight;

    return {
      x: Math.min(Math.max(margin, x), window.innerWidth - width - margin),
      y: Math.min(Math.max(margin, y), window.innerHeight - height - margin),
    };
  };

  const setSubjectsChatOpenWithAnchor = (nextOpen: boolean) => {
    if (nextOpen === isSubjectsChatOpen) return;

    const floatingNode = subjectsChatFloatingRef.current;
    const previousRect = floatingNode?.getBoundingClientRect() || null;

    setIsSubjectsChatOpen(nextOpen);

    if (!previousRect) return;

    window.requestAnimationFrame(() => {
      const updatedNode = subjectsChatFloatingRef.current;
      if (!updatedNode) return;
      const nextRect = updatedNode.getBoundingClientRect();

      setSubjectsChatPosition((previous) => {
        const base = previous || { x: previousRect.left, y: previousRect.top };
        return clampSubjectsChatPosition(
          base.x + (previousRect.width - nextRect.width),
          base.y + (previousRect.height - nextRect.height)
        );
      });
    });
  };

  const startSubjectsChatDrag = (event: React.PointerEvent<HTMLElement>) => {
    if (event.pointerType === 'mouse' && event.button !== 0) return;

    event.preventDefault();
    event.stopPropagation();

    const floatingNode = subjectsChatFloatingRef.current;
    if (!floatingNode) return;

    const rect = floatingNode.getBoundingClientRect();
    const initialPosition = subjectsChatPosition || { x: rect.left, y: rect.top };

    if (!subjectsChatPosition) {
      setSubjectsChatPosition(initialPosition);
    }

    subjectsChatDragStateRef.current = {
      startX: event.clientX,
      startY: event.clientY,
      originX: initialPosition.x,
      originY: initialPosition.y,
    };

    const handlePointerMove = (moveEvent: PointerEvent) => {
      if (!subjectsChatDragStateRef.current) return;
      const nextX = subjectsChatDragStateRef.current.originX + (moveEvent.clientX - subjectsChatDragStateRef.current.startX);
      const nextY = subjectsChatDragStateRef.current.originY + (moveEvent.clientY - subjectsChatDragStateRef.current.startY);
      setSubjectsChatPosition(clampSubjectsChatPosition(nextX, nextY));
    };

    const cleanup = () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerEnd);
      window.removeEventListener('pointercancel', handlePointerEnd);
      subjectsChatDragStateRef.current = null;
      subjectsChatDragCleanupRef.current = null;
    };

    const handlePointerEnd = () => {
      cleanup();
    };

    if (subjectsChatDragCleanupRef.current) {
      subjectsChatDragCleanupRef.current();
    }

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerEnd);
    window.addEventListener('pointercancel', handlePointerEnd);
    subjectsChatDragCleanupRef.current = cleanup;
  };

  useEffect(() => {
    if (!subjectsChatPosition) return;

    const keepSubjectsChatInViewport = () => {
      setSubjectsChatPosition((previous) => {
        if (!previous) return previous;
        const clamped = clampSubjectsChatPosition(previous.x, previous.y);
        if (clamped.x === previous.x && clamped.y === previous.y) return previous;
        return clamped;
      });
    };

    const frameId = window.requestAnimationFrame(keepSubjectsChatInViewport);
    const handleResize = () => window.requestAnimationFrame(keepSubjectsChatInViewport);
    window.addEventListener('resize', handleResize);

    return () => {
      window.cancelAnimationFrame(frameId);
      window.removeEventListener('resize', handleResize);
    };
  }, [isSubjectsChatOpen, subjectsChatPosition?.x, subjectsChatPosition?.y]);

  const openUnitChallenge = () => {
    setIsSidebarCollapsed(false);
    setIsSubjectOverviewActive(false);
    setSubjectChallengeState(null);
    setUnitChallengeStep(1);
    setDetailState(null);
    setUnitChallengeState({
      unitId: selectedUnit.id,
      stage: 'intro',
      summary: null,
    });
  };

  const startUnitChallenge = () => {
    if (!selectedUnitChallengeConfig.questions.length) {
      updateUnitChallengeConfig((current) => ({
        ...current,
        error: 'Generate questions with AI before you start this challenge.',
      }));
      return;
    }
    setUnitChallengeState({
      unitId: selectedUnit.id,
      stage: 'running',
      summary: null,
    });
    setUnitChallengeStep(2);
  };

  const exitUnitChallenge = () => {
    setUnitChallengeState(null);
  };

  const completeUnitChallenge = (summary: PracticeRunSummary) => {
    setUnitChallengeState({
      unitId: selectedUnit.id,
      stage: 'completed',
      summary,
    });
    setUnitChallengeStep(2);
  };

  const openSubjectChallenge = () => {
    if (!isSubjectChallengeEligible) {
      updateSubjectChallengeConfig((current) => ({
        ...current,
        error: subjectChallengeBlockedReason || 'Subject challenge is currently unavailable.',
      }));
      setIsSubjectOverviewActive(true);
      return;
    }
    setIsSidebarCollapsed(false);
    setDetailState(null);
    setUnitChallengeState(null);
    setIsSubjectOverviewActive(true);
    setSubjectChallengeStep(1);
    setSubjectChallengeState({
      stage: 'intro',
      summary: null,
    });
  };

  const startSubjectChallenge = () => {
    if (!isSubjectChallengeEligible) {
      updateSubjectChallengeConfig((current) => ({
        ...current,
        error: subjectChallengeBlockedReason || 'Subject challenge is currently unavailable.',
      }));
      return;
    }
    if (!selectedSubjectChallengeConfig.questions.length) {
      updateSubjectChallengeConfig((current) => ({
        ...current,
        error: 'Generate questions with AI before you start this challenge.',
      }));
      return;
    }
    setSubjectChallengeState({
      stage: 'running',
      summary: null,
    });
    setSubjectChallengeStep(2);
  };

  const exitSubjectChallenge = () => {
    setSubjectChallengeState(null);
  };

  const completeSubjectChallenge = (summary: PracticeRunSummary) => {
    setSubjectChallengeState({
      stage: 'completed',
      summary,
    });
    setSubjectChallengeStep(2);
  };

  const openUnitChallengeStep = (step: 1 | 2) => {
    if (isUnitChallengeRunning) return;
    if (step === 2 && selectedUnitChallengeConfig.questions.length === 0) {
      updateUnitChallengeConfig((current) => ({
        ...current,
        error: 'Generate questions with AI in Step 1 before attempting Step 2.',
      }));
      return;
    }
    setUnitChallengeStep(step);
  };

  const openSubjectChallengeStep = (step: 1 | 2) => {
    if (isSubjectChallengeRunning) return;
    if (step === 2 && selectedSubjectChallengeConfig.questions.length === 0) {
      updateSubjectChallengeConfig((current) => ({
        ...current,
        error: 'Generate questions with AI in Step 1 before attempting Step 2.',
      }));
      return;
    }
    setSubjectChallengeStep(step);
  };

  const detailUnit = detailState ? units.find((unit) => unit.id === detailState.unitId) || null : null;
  const detailTopic = detailUnit
    ? detailUnit.topics.find((topic) => topic.id === detailState?.topicId) || null
    : null;
  const detailItems = detailTopic ? getTopicContentItems(detailTopic) : [];
  const selectedDetailItem =
    detailItems.find((item) => item.id === detailState?.contentItemId) || detailItems[0] || null;
  const isDetailPracticeView = Boolean(
    selectedDetailItem &&
    selectedDetailItem.kind === 'practice' &&
    selectedDetailItem.practice
  );
  const selectedDetailItemIndex = selectedDetailItem
    ? detailItems.findIndex((item) => item.id === selectedDetailItem.id)
    : -1;
  const nextDetailItem =
    selectedDetailItemIndex >= 0 && selectedDetailItemIndex < detailItems.length - 1
      ? detailItems[selectedDetailItemIndex + 1]
      : null;

  if (!activeSubject) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-8 text-center text-slate-500">
        Select a subject to load curriculum.
      </div>
    );
  }

  if (isCurriculumLoading && units.length === 0) {
    return (
      <div className="bg-white rounded-xl overflow-hidden">
        <div className="grid grid-cols-1 xl:grid-cols-[320px_minmax(0,1fr)]">
          <aside className="border-r border-slate-200 bg-slate-50 min-h-[760px] p-4 space-y-3">
            <div className="rounded-md border border-slate-200 bg-white p-4 space-y-3">
              <div className="h-10 w-10 rounded-lg bg-slate-200 animate-pulse" />
              <div className="h-4 w-3/4 rounded-md bg-slate-200 animate-pulse" />
              <div className="h-3 w-1/2 rounded-md bg-slate-200 animate-pulse" />
              <div className="h-1.5 w-full rounded-full bg-slate-200 animate-pulse" />
            </div>

            {Array.from({ length: 5 }).map((_, index) => (
              <div key={index} className="rounded-md border border-slate-200 bg-white p-3 space-y-2">
                <div className="h-3 w-16 rounded-md bg-slate-200 animate-pulse" />
                <div className="h-4 w-5/6 rounded-md bg-slate-200 animate-pulse" />
                <div className="h-3 w-20 rounded-md bg-slate-200 animate-pulse" />
              </div>
            ))}
          </aside>

          <section className="min-w-0 border border-slate-200 bg-white">
            <header className="px-6 py-5 border-b border-slate-200 space-y-4">
              <div className="h-8 w-2/3 rounded-md bg-slate-200 animate-pulse" />
              <div className="h-4 w-4/5 rounded-md bg-slate-200 animate-pulse" />
              <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
                {Array.from({ length: 3 }).map((_, index) => (
                  <div key={index} className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-3 space-y-2">
                    <div className="h-3 w-20 rounded-md bg-slate-200 animate-pulse" />
                    <div className="h-5 w-24 rounded-md bg-slate-200 animate-pulse" />
                  </div>
                ))}
              </div>
            </header>

            <div className="p-6 pb-28 space-y-4">
              {Array.from({ length: 2 }).map((_, sectionIndex) => (
                <section key={sectionIndex} className="border border-slate-200 rounded-lg p-5 space-y-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="h-7 w-2/5 rounded-md bg-slate-200 animate-pulse" />
                    <div className="h-7 w-28 rounded-md bg-slate-200 animate-pulse" />
                  </div>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                    <div className="space-y-2">
                      <div className="h-4 w-20 rounded-md bg-slate-200 animate-pulse" />
                      {Array.from({ length: 2 }).map((__, rowIndex) => (
                        <div key={rowIndex} className="h-10 w-full rounded-md bg-slate-200 animate-pulse" />
                      ))}
                    </div>
                    <div className="space-y-2">
                      <div className="h-4 w-20 rounded-md bg-slate-200 animate-pulse" />
                      {Array.from({ length: 2 }).map((__, rowIndex) => (
                        <div key={rowIndex} className="h-16 w-full rounded-md bg-slate-200 animate-pulse" />
                      ))}
                    </div>
                  </div>
                </section>
              ))}

              <section className="border border-slate-200 rounded-lg p-5 bg-slate-50 space-y-3">
                <div className="h-5 w-40 rounded-md bg-slate-200 animate-pulse" />
                <div className="h-4 w-3/5 rounded-md bg-slate-200 animate-pulse" />
                <div className="h-9 w-44 rounded-md bg-slate-200 animate-pulse" />
              </section>
            </div>
          </section>
        </div>
      </div>
    );
  }

  if (units.length === 0 || !selectedUnit) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-8 text-center text-slate-500">
        No curriculum topics available yet.
      </div>
    );
  }

  return (
    <motion.div
      className="bg-white rounded-xl overflow-visible"
      style={{
        ['--subjects-footer-left' as string]: `calc(${desktopContainerInset} + ${desktopSidebarWidthPx}px)`,
        ['--subjects-footer-right' as string]: desktopContainerInset,
      }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2 }}
    >
      {detailUnit && detailTopic && selectedDetailItem ? (
        <>
          <div className="grid grid-cols-1">
            <aside className={`relative border-r border-slate-200 bg-slate-50 flex flex-col min-h-[760px] xl:fixed xl:top-[calc(var(--student-header-offset)+0.75rem)] xl:left-[max(1rem,calc((100vw-1400px)/2+1rem))] xl:h-auto xl:max-h-[calc(100vh-var(--student-header-offset)-1.5rem)] xl:min-h-0 xl:z-20 xl:overflow-visible xl:will-change-[width] xl:transition-[width] xl:duration-300 xl:ease-in-out ${sidebarDesktopWidth}`}>
              <button
                type="button"
                onClick={() => setIsSidebarCollapsed((prev) => !prev)}
                className="hidden xl:inline-flex absolute top-1/2 -translate-y-1/2 -right-4 z-30 h-8 w-8 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 shadow-sm hover:bg-slate-50"
                aria-label={isSidebarCollapsed ? 'Expand topics panel' : 'Collapse topics panel'}
              >
                {isSidebarCollapsed ? <ChevronsRight className="w-4 h-4" /> : <ChevronsLeft className="w-4 h-4" />}
              </button>

              <div className="border-b border-slate-200 px-5 py-4 space-y-3">
                <button
                  type="button"
                  onClick={() => setDetailState(null)}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-blue-700"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  Back to topic overview
                </button>

                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
                    <BookOpen className="w-5 h-5" />
                  </div>
                  <div
                    className={`min-w-0 overflow-hidden transition-[max-width,max-height,opacity,transform] duration-200 ease-out ${
                      isSidebarCollapsed ? 'max-w-0 max-h-0 opacity-0 -translate-x-1' : 'max-w-[240px] max-h-20 opacity-100 translate-x-0'
                    }`}
                  >
                    <h2 className="text-lg font-bold text-slate-900 truncate">{activeSubject.name}</h2>
                    <p className="text-xs text-slate-500 mt-0.5 truncate">{detailUnit.code}: {detailTopic.title}</p>
                  </div>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto">
                {detailItems.map((item, index) => {
                  const isSelected = selectedDetailItem.id === item.id;
                  const practiceStatus = item.practice ? getPracticeStatus(item.practice) : null;

                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setDetailState((previous) => (previous ? { ...previous, contentItemId: item.id } : previous))}
                      title={item.title}
                      className={`w-full border-b border-slate-200 transition ${
                        isSelected ? 'bg-blue-50 border-l-4 border-l-blue-600 pl-3' : 'hover:bg-slate-100'
                      } ${isSidebarCollapsed ? 'px-2 py-3 min-h-[72px] flex items-center justify-center' : 'px-4 py-3 text-left min-h-[78px]'}`}
                    >
                      {isSidebarCollapsed ? (
                        <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-blue-100 text-blue-700 text-xs font-semibold">
                          {index + 1}
                        </span>
                      ) : (
                        <div>
                          <p className="text-[11px] uppercase tracking-wide text-slate-400 font-semibold">Item {index + 1}</p>
                          <p className="text-sm font-semibold text-slate-800 truncate">{item.title}</p>
                          <p className="text-xs text-slate-500 mt-0.5 capitalize">
                            {item.kind === 'practice'
                              ? `${practiceStatus || 'not-started'} • quiz`
                              : item.kind === 'assessment'
                                ? `${item.assessment?.status || 'published'} • assessment`
                                : `${item.resource?.type || 'notes'} • learn`}
                          </p>
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </aside>

            <section className={`min-w-0 rounded-none border border-slate-200 bg-white overflow-hidden xl:will-change-[margin] xl:transition-[margin] xl:duration-300 xl:ease-in-out ${contentDesktopOffset} ${
              isUnitChallengeActive || isDetailPracticeView ? 'min-h-[calc(100vh-var(--student-header-offset)-1.5rem)]' : ''
            }`}>
              <header className="px-6 py-5 border-b border-slate-200">
                <h1 className="text-3xl font-bold text-slate-900">{selectedDetailItem.title}</h1>
                <p className="text-sm text-slate-500 mt-1">{detailUnit.code}: {detailTopic.title}</p>
              </header>

              <div className={isDetailPracticeView ? 'p-0' : 'p-6 pb-28 space-y-6'}>
                {selectedDetailItem.kind === 'practice' && selectedDetailItem.practice ? (
                  <StudentPracticeRunner
                    key={`${detailTopic.id}-${selectedDetailItem.practice.id}`}
                    title={selectedDetailItem.practice.title}
                    subtitle="Practice questions run on a dedicated screen and are answered one by one."
                    questions={buildMockPracticeQuestions(`${activeSubject.name} ${selectedDetailItem.practice.title}`, 'quiz')}
                    contentWrapperClassName="px-6 py-6 pb-8 space-y-6 md:pb-12"
                    fixedFooterStyle={{
                      left: 'var(--subjects-footer-left)',
                      right: 'var(--subjects-footer-right)',
                      bottom: '0.75rem',
                    }}
                    onComplete={() =>
                      setPracticeStatusOverrides((previous) => ({
                        ...previous,
                        [selectedDetailItem.practice!.id]: 'mastered',
                      }))
                    }
                  />
                ) : selectedDetailItem.kind === 'assessment' && selectedDetailItem.assessment ? (
                  <section className="space-y-6 max-w-4xl">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-md bg-amber-100 text-amber-700">
                        <FileText className="w-4 h-4" />
                        Assessment
                      </span>
                      <span className="text-xs text-slate-500 capitalize">
                        Status: {selectedDetailItem.assessment.status || 'published'}
                      </span>
                    </div>
                    <p className="text-lg text-slate-800">
                      This assessment was published by your teacher for this topic.
                    </p>
                    <button
                      type="button"
                      onClick={() => navigate('/student/assessments')}
                      className="inline-flex items-center gap-2 rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100"
                    >
                      <ExternalLink className="w-4 h-4" />
                      Open Assessments
                    </button>
                  </section>
                ) : (
                  <section className="space-y-6">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-md ${getResourceBadgeClassName(selectedDetailItem.resource?.type || 'notes')}`}>
                        {selectedDetailItem.resource?.type === 'video' ? <PlayCircle className="w-4 h-4" /> : <FileText className="w-4 h-4" />}
                        <span className="capitalize">{selectedDetailItem.resource?.type || 'notes'}</span>
                      </span>
                      <span className="text-xs text-slate-500">Learning material</span>
                    </div>

                    {selectedDetailItem.resource?.type === 'video' && (
                      <div className="aspect-video w-full max-w-4xl rounded-lg border border-slate-200 bg-slate-900 text-white flex items-center justify-center">
                        <div className="text-center">
                          <PlayCircle className="w-10 h-10 mx-auto mb-2 text-blue-300" />
                          <p className="text-sm font-medium">{selectedDetailItem.title}</p>
                        </div>
                      </div>
                    )}

                    <div className="space-y-4 max-w-4xl">
                      <h3 className="text-2xl font-semibold text-slate-900">What you will learn</h3>
                      <p className="text-lg text-slate-800">
                        This section explains <span className="font-semibold">{detailTopic.title.toLowerCase()}</span> and how it connects to unit mastery.
                      </p>
                      <p className="text-lg text-slate-800">
                        Work through the explanations first, then move to practice for one-by-one question attempts.
                      </p>
                    </div>

                    <div className="border-t border-slate-200 pt-4">
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Related content</p>
                      <div className="mt-2 space-y-2">
                        {[...detailTopic.learn, ...detailTopic.practiceMaterials].map((resource) => (
                          <button
                            key={resource.id}
                            type="button"
                            onClick={() => setDetailState((previous) => (previous ? { ...previous, contentItemId: `learn-${resource.id}` } : previous))}
                            className="w-full text-left rounded-md border border-slate-200 px-3 py-2 text-sm hover:bg-slate-50 flex items-center justify-between gap-2"
                          >
                            <span className="truncate">{resource.title}</span>
                            <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
                          </button>
                        ))}
                      </div>
                    </div>
                  </section>
                )}
              </div>
            </section>
          </div>

          {selectedDetailItem.kind !== 'practice' && (
            <>
              <div
                className="hidden xl:block fixed bottom-3 z-30"
                style={{
                  left: 'var(--subjects-footer-left)',
                  right: 'var(--subjects-footer-right)',
                }}
              >
                <footer className="box-border border-t border-l border-r border-slate-200 bg-white px-6 py-4">
                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={() => {
                        if (!nextDetailItem) return;
                        setDetailState((previous) =>
                          previous ? { ...previous, contentItemId: nextDetailItem.id } : previous
                        );
                      }}
                      disabled={!nextDetailItem}
                      className="inline-flex items-center rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:bg-slate-400 disabled:cursor-not-allowed"
                    >
                      {nextDetailItem ? `Up next: ${getUpNextLabelForContentItem(nextDetailItem)}` : 'Topic complete'}
                    </button>
                  </div>
                </footer>
              </div>

              <div className="xl:hidden border-t border-slate-200 bg-white px-6 py-4">
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => {
                      if (!nextDetailItem) return;
                      setDetailState((previous) =>
                        previous ? { ...previous, contentItemId: nextDetailItem.id } : previous
                      );
                    }}
                    disabled={!nextDetailItem}
                    className="inline-flex items-center rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:bg-slate-400 disabled:cursor-not-allowed"
                  >
                    {nextDetailItem ? `Up next: ${getUpNextLabelForContentItem(nextDetailItem)}` : 'Topic complete'}
                  </button>
                </div>
              </div>
            </>
          )}
        </>
      ) : (
        <>
          <div className="grid grid-cols-1">
            <aside className={`relative border-r border-slate-200 bg-slate-50 flex flex-col min-h-[760px] xl:fixed xl:top-[calc(var(--student-header-offset)+0.75rem)] xl:left-[max(1rem,calc((100vw-1400px)/2+1rem))] xl:h-auto xl:max-h-[calc(100vh-var(--student-header-offset)-1.5rem)] xl:min-h-0 xl:z-20 xl:overflow-visible xl:will-change-[width] xl:transition-[width] xl:duration-300 xl:ease-in-out ${sidebarDesktopWidth}`}>
              {!isUnitChallengeActive && !isSubjectChallengeActive && (
                <button
                  type="button"
                  onClick={() => setIsSidebarCollapsed((prev) => !prev)}
                  className="hidden xl:inline-flex absolute top-1/2 -translate-y-1/2 -right-4 z-30 h-8 w-8 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 shadow-sm hover:bg-slate-50"
                  aria-label={isSidebarCollapsed ? 'Expand topics panel' : 'Collapse topics panel'}
                >
                  {isSidebarCollapsed ? <ChevronsRight className="w-4 h-4" /> : <ChevronsLeft className="w-4 h-4" />}
                </button>
              )}

              {isUnitChallengeActive ? (
                <>
                  <div className="border-b border-slate-200 px-5 py-4 space-y-3">
                    <button
                      type="button"
                      onClick={exitUnitChallenge}
                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-blue-700"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" />
                      Back to unit page
                    </button>

                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
                        <Sparkles className="w-5 h-5" />
                      </div>
                      <div className="min-w-0">
                        <h2 className="text-xl font-bold text-slate-900 truncate">Unit test</h2>
                        <p className="text-xs text-slate-500 mt-0.5 truncate">{selectedUnit.code}: {selectedUnit.title}</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex-1 overflow-y-auto p-4 space-y-3">
                    <div className="rounded-md border border-slate-200 bg-white overflow-hidden">
                      <button
                        type="button"
                        onClick={() => openUnitChallengeStep(1)}
                        className={`w-full border-b border-slate-200 px-3 py-2 text-left transition ${
                          activeUnitChallengeStep === 1 ? 'bg-blue-50 border-l-4 border-l-blue-600 pl-2' : 'hover:bg-slate-50'
                        }`}
                      >
                        <p className="text-[11px] uppercase tracking-wide text-slate-400 font-semibold">Step 1</p>
                        <p className="text-sm font-semibold text-slate-800">Generate challenge</p>
                        <p className="text-xs text-slate-500">Set question count and prompt AI.</p>
                      </button>
                      <button
                        type="button"
                        onClick={() => openUnitChallengeStep(2)}
                        className={`w-full px-3 py-2 text-left transition ${
                          activeUnitChallengeStep === 2 ? 'bg-blue-50 border-l-4 border-l-blue-600 pl-2' : 'hover:bg-slate-50'
                        }`}
                      >
                        <p className="text-[11px] uppercase tracking-wide text-slate-400 font-semibold">Step 2</p>
                        <p className="text-sm font-semibold text-slate-800">Attempt challenge</p>
                        <p className="text-xs text-slate-500">
                          {isUnitChallengeRunning
                            ? 'In progress'
                            : activeUnitChallenge?.stage === 'completed'
                              ? 'Completed'
                              : selectedUnitChallengeConfig.questions.length > 0
                                ? 'Ready'
                                : 'Locked until generated'}
                        </p>
                      </button>
                    </div>
                  </div>
                </>
              ) : isSubjectChallengeActive ? (
                <>
                  <div className="border-b border-slate-200 px-5 py-4 space-y-3">
                    <button
                      type="button"
                      onClick={exitSubjectChallenge}
                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-blue-700"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" />
                      Back to subject overview
                    </button>

                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
                        <Sparkles className="w-5 h-5" />
                      </div>
                      <div className="min-w-0">
                        <h2 className="text-xl font-bold text-slate-900 truncate">Subject challenge</h2>
                        <p className="text-xs text-slate-500 mt-0.5 truncate">{activeSubject.name}</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex-1 overflow-y-auto p-4 space-y-3">
                    <div className="rounded-md border border-slate-200 bg-white overflow-hidden">
                      <button
                        type="button"
                        onClick={() => openSubjectChallengeStep(1)}
                        className={`w-full border-b border-slate-200 px-3 py-2 text-left transition ${
                          activeSubjectChallengeStep === 1 ? 'bg-blue-50 border-l-4 border-l-blue-600 pl-2' : 'hover:bg-slate-50'
                        }`}
                      >
                        <p className="text-[11px] uppercase tracking-wide text-slate-400 font-semibold">Step 1</p>
                        <p className="text-sm font-semibold text-slate-800">Generate challenge</p>
                        <p className="text-xs text-slate-500">Set question count and prompt AI.</p>
                      </button>
                      <button
                        type="button"
                        onClick={() => openSubjectChallengeStep(2)}
                        className={`w-full px-3 py-2 text-left transition ${
                          activeSubjectChallengeStep === 2 ? 'bg-blue-50 border-l-4 border-l-blue-600 pl-2' : 'hover:bg-slate-50'
                        }`}
                      >
                        <p className="text-[11px] uppercase tracking-wide text-slate-400 font-semibold">Step 2</p>
                        <p className="text-sm font-semibold text-slate-800">Attempt challenge</p>
                        <p className="text-xs text-slate-500">
                          {isSubjectChallengeRunning
                            ? 'In progress'
                            : subjectChallengeState?.stage === 'completed'
                              ? 'Completed'
                              : selectedSubjectChallengeConfig.questions.length > 0
                                ? 'Ready'
                                : 'Locked until generated'}
                        </p>
                      </button>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div className={`border-b border-slate-200 px-5 py-4 ${
                    isSubjectOverviewActive ? 'bg-blue-50 border-l-4 border-l-blue-600 pl-3' : ''
                  }`}>
                    <button
                      type="button"
                      onClick={openSubjectOverview}
                      className="w-full text-left"
                      title={`Open ${activeSubject.name} overview`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center">
                          <BookOpen className="w-5 h-5" />
                        </div>
                        <div
                          className={`min-w-0 overflow-hidden transition-[max-width,max-height,opacity,transform] duration-200 ease-out ${
                            isSidebarCollapsed ? 'max-w-0 max-h-0 opacity-0 -translate-x-1' : 'max-w-[240px] max-h-16 opacity-100 translate-x-0'
                          }`}
                        >
                          <h2 className="text-xl font-bold text-slate-900 truncate">{activeSubject.name}</h2>
                          <p className="text-xs text-slate-500 mt-0.5">{allTopics.length} topics in curriculum</p>
                        </div>
                      </div>
                    </button>
                    <div className={`mt-3 h-1.5 rounded-full bg-slate-200 overflow-hidden transition-opacity duration-200 ${isSidebarCollapsed ? 'opacity-0' : 'opacity-100'}`}>
                      <div className="h-1.5 rounded-full bg-blue-500" style={{ width: `${Math.max(0, Math.min(100, overallCoverage))}%` }} />
                    </div>
                  </div>

                  <div className="flex-1 overflow-y-auto">
                    {units.map((unit, index) => {
                      const isSelected = !isSubjectOverviewActive && selectedUnit.id === unit.id;
                      return (
                        <button
                          key={unit.id}
                          type="button"
                          onClick={() => openUnitPage(unit)}
                          title={`${unit.code}: ${unit.title}`}
                          className={`w-full border-b border-slate-200 transition ${
                            isSelected ? 'bg-blue-50 border-l-4 border-l-blue-600 pl-3' : 'hover:bg-slate-100'
                          } ${isSidebarCollapsed ? 'px-2 py-3 min-h-[72px] flex items-center justify-center' : 'px-4 py-3 text-left min-h-[84px]'}`}
                        >
                          {isSidebarCollapsed ? (
                            <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-blue-100 text-blue-700 text-xs font-semibold">
                              {index + 1}
                            </span>
                          ) : (
                            <div>
                              <p className="text-[11px] uppercase tracking-wide text-slate-400 font-semibold">{unit.code}</p>
                              <p className="text-sm font-semibold text-slate-800 truncate">{unit.title}</p>
                              <p className="text-xs text-slate-500 mt-0.5">{unit.masteryPercent}% mastery</p>
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </>
              )}

            </aside>

            <section className={`min-w-0 rounded-none border border-slate-200 bg-white overflow-hidden xl:will-change-[margin] xl:transition-[margin] xl:duration-300 xl:ease-in-out ${contentDesktopOffset} ${
              isUnitChallengeActive || isSubjectChallengeActive ? 'min-h-[calc(100vh-var(--student-header-offset)-1.5rem)]' : ''
            }`}>
              {!isUnitChallengeActive && !isSubjectChallengeActive && !isSubjectOverviewActive && (
                <header className="px-6 py-5 border-b border-slate-200">
                  <h1 className="text-3xl font-bold text-slate-900">{selectedUnit.code}: {selectedUnit.title}</h1>

                  <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2">
                      <p className="text-[11px] uppercase font-semibold tracking-wide text-emerald-700">Mastered</p>
                      <p className="text-lg font-semibold text-emerald-800">{masteredTopics} topics</p>
                    </div>
                    <div className="rounded-lg border border-blue-200 bg-blue-50 px-3 py-2">
                      <p className="text-[11px] uppercase font-semibold tracking-wide text-blue-700">In Progress</p>
                      <p className="text-lg font-semibold text-blue-800">{inProgressTopics} topics</p>
                    </div>
                  </div>
                </header>
              )}

              {isSubjectChallengeActive ? (
                activeSubjectChallengeStep === 1 && !isSubjectChallengeRunning ? (
                  <div className="p-6 pb-24 space-y-4">
                    <div className="rounded-md border border-slate-200 bg-white p-3 space-y-3">
                      <p className="text-[11px] uppercase tracking-wide text-slate-400 font-semibold">AI challenge builder</p>
                      <div>
                        <label className="text-xs font-semibold text-slate-600">Questions</label>
                        <input
                          type="number"
                          min={6}
                          max={40}
                          value={selectedSubjectChallengeConfig.questionCount}
                          onChange={(event) => {
                            const parsed = Number.parseInt(event.target.value, 10);
                            const nextCount = Number.isNaN(parsed) ? DEFAULT_SUBJECT_CHALLENGE_COUNT : Math.max(6, Math.min(40, parsed));
                            updateSubjectChallengeConfig((current) => ({ ...current, questionCount: nextCount }));
                          }}
                          className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm text-slate-700"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={generateSubjectChallengeWithAi}
                        disabled={selectedSubjectChallengeConfig.isGenerating || !isSubjectChallengeEligible}
                        className="w-full rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-400"
                      >
                        {selectedSubjectChallengeConfig.isGenerating ? 'Generating...' : 'Generate with AI'}
                      </button>
                      {!isSubjectChallengeEligible && (
                        <p className="text-xs text-amber-700">
                          {subjectChallengeBlockedReason}
                        </p>
                      )}
                      {selectedSubjectChallengeConfig.questions.length > 0 && (
                        <p className="text-xs text-emerald-700">
                          {selectedSubjectChallengeConfig.questions.length} questions ready.
                          {selectedSubjectChallengeConfig.generatedWithAi ? ' Generated by AI.' : ' Generated locally.'}
                        </p>
                      )}
                      {selectedSubjectChallengeConfig.error && (
                        <p className="text-xs text-amber-700">{selectedSubjectChallengeConfig.error}</p>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className={isSubjectChallengeRunning ? '' : 'p-6 pb-24'}>
                    {subjectChallengeState?.stage === 'running' ? (
                      <StudentPracticeRunner
                        title={`${activeSubject.name} subject challenge`}
                        subtitle="Subject challenge"
                        questions={selectedSubjectChallengeConfig.questions}
                        contentWrapperClassName="px-6 py-6 pb-8 space-y-6 md:pb-12"
                        fixedFooterStyle={{
                          left: 'var(--subjects-footer-left)',
                          right: 'var(--subjects-footer-right)',
                          bottom: '0.75rem',
                        }}
                        onComplete={completeSubjectChallenge}
                      />
                    ) : (
                      <section className="overflow-hidden rounded-lg border border-slate-200">
                        <div className="bg-slate-900 px-6 py-10 text-center text-white">
                          <p className="text-xs uppercase tracking-[0.2em] text-blue-200">Step 2 of 2</p>
                          <h3 className="mt-3 text-4xl font-bold">Attempt subject challenge</h3>
                          <p className="mt-3 text-lg text-blue-100">
                            {!isSubjectChallengeEligible
                              ? `${subjectChallengeBlockedReason}`
                              : selectedSubjectChallengeConfig.questions.length > 0
                              ? `Your AI challenge is ready. Test your skills across all units and topics in ${activeSubject.name}.`
                              : `Return to Step 1 and generate questions first.`}
                          </p>
                          <p className="mt-4 text-xl font-semibold">
                            {subjectChallengeQuestionTotal} questions • {subjectChallengeEstimatedMinutes}-{subjectChallengeEstimatedMinutes + 5} minutes
                          </p>
                        </div>
                      </section>
                    )}
                  </div>
                )
              ) : isSubjectOverviewActive && !isUnitChallengeActive ? (
                <div className="p-6 pb-10 space-y-4">
                  <section className="rounded-lg border border-slate-200 bg-slate-50 px-5 py-4">
                    <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Subject overview</p>
                    <h1 className="mt-2 text-3xl font-bold text-slate-900">{activeSubject.name}</h1>
                    <p className="mt-2 text-sm text-slate-600">
                      Browse all units and topics. Click a unit for the in-depth unit page or click a topic to jump directly into it.
                    </p>
                  </section>

                  {units.map((unit) => {
                    const isCurrentUnit = selectedUnit.id === unit.id;
                    return (
                      <section
                        key={unit.id}
                        className={`rounded-lg border p-5 ${
                          isCurrentUnit ? 'border-blue-200 bg-blue-50/40' : 'border-slate-200 bg-white'
                        }`}
                      >
                        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-3">
                          <button
                            type="button"
                            onClick={() => openUnitPage(unit)}
                            className="text-left text-2xl font-semibold text-slate-900 hover:text-blue-700"
                          >
                            {unit.code}: {unit.title}
                          </button>
                          <span className="inline-flex items-center gap-1.5 rounded-md bg-slate-100 px-3 py-1 text-sm font-semibold text-slate-700">
                            <Target className="h-3.5 w-3.5" />
                            Unit mastery: {unit.masteryPercent}%
                          </span>
                        </div>

                        <div className="mt-4 grid grid-cols-1 gap-x-10 gap-y-2 lg:grid-cols-2">
                          {unit.topics.map((topic) => (
                            <button
                              key={topic.id}
                              type="button"
                              onClick={() => openTopicDetail(unit, topic)}
                              className="inline-flex items-center justify-between gap-2 rounded-md px-2 py-1.5 text-left text-base text-slate-700 hover:bg-slate-100 hover:text-slate-900"
                            >
                              <span className="truncate">{topic.title}</span>
                              <ChevronRight className="h-4 w-4 shrink-0 text-slate-400" />
                            </button>
                          ))}
                        </div>
                      </section>
                    );
                  })}

                  <section className="rounded-lg border border-slate-200 bg-slate-50 p-5">
                    <div className="flex items-center gap-2 text-slate-700 font-semibold">
                      <Sparkles className="w-4 h-4" />
                      Subject challenge
                    </div>
                    <p className="text-sm text-slate-600 mt-2">Take one challenge that spans all units in this subject.</p>
                    {!isSubjectChallengeEligible && (
                      <p className="mt-2 text-xs text-amber-700">{subjectChallengeBlockedReason}</p>
                    )}
                    <button
                      type="button"
                      onClick={openSubjectChallenge}
                      disabled={!isSubjectChallengeEligible}
                      className="mt-3 inline-flex items-center gap-2 rounded-md border border-slate-300 bg-white text-slate-700 px-4 py-2 text-sm font-semibold hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      <ChevronRight className="w-4 h-4" />
                      Start subject challenge
                    </button>
                  </section>
                </div>
              ) : (
                <div className={isUnitChallengeActive ? (isUnitChallengeRunning ? '' : 'p-6 pb-24') : 'p-6 pb-28 space-y-4'}>
                  {isUnitChallengeActive ? (
                    activeUnitChallengeStep === 1 && !isUnitChallengeRunning ? (
                      <div className="space-y-4">
                        <div className="rounded-md border border-slate-200 bg-white p-3 space-y-3">
                          <p className="text-[11px] uppercase tracking-wide text-slate-400 font-semibold">AI challenge builder</p>
                          <div>
                            <label className="text-xs font-semibold text-slate-600">Questions</label>
                            <input
                              type="number"
                              min={4}
                              max={30}
                              value={selectedUnitChallengeConfig.questionCount}
                              onChange={(event) => {
                                const parsed = Number.parseInt(event.target.value, 10);
                                const nextCount = Number.isNaN(parsed) ? DEFAULT_UNIT_CHALLENGE_COUNT : Math.max(4, Math.min(30, parsed));
                                updateUnitChallengeConfig((current) => ({ ...current, questionCount: nextCount }));
                              }}
                              className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm text-slate-700"
                            />
                          </div>
                          <button
                            type="button"
                            onClick={generateUnitChallengeWithAi}
                            disabled={selectedUnitChallengeConfig.isGenerating}
                            className="w-full rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-400"
                          >
                            {selectedUnitChallengeConfig.isGenerating ? 'Generating...' : 'Generate with AI'}
                          </button>
                          {selectedUnitChallengeConfig.questions.length > 0 && (
                            <p className="text-xs text-emerald-700">
                              {selectedUnitChallengeConfig.questions.length} questions ready.
                              {selectedUnitChallengeConfig.generatedWithAi ? ' Generated by AI.' : ' Generated locally.'}
                            </p>
                          )}
                          {selectedUnitChallengeConfig.error && (
                            <p className="text-xs text-amber-700">{selectedUnitChallengeConfig.error}</p>
                          )}
                        </div>
                      </div>
                    ) : activeUnitChallenge?.stage === 'running' ? (
                      <StudentPracticeRunner
                        title={`${selectedUnit.code}: ${selectedUnit.title}`}
                        subtitle="Unit challenge"
                        questions={selectedUnitChallengeConfig.questions}
                        contentWrapperClassName="px-6 py-6 pb-8 space-y-6 md:pb-12"
                        fixedFooterStyle={{
                          left: 'var(--subjects-footer-left)',
                          right: 'var(--subjects-footer-right)',
                          bottom: '0.75rem',
                        }}
                        onComplete={completeUnitChallenge}
                      />
                    ) : (
                      <section className="overflow-hidden rounded-lg border border-slate-200">
                        <div className="bg-slate-900 px-6 py-10 text-center text-white">
                          <p className="text-xs uppercase tracking-[0.2em] text-blue-200">Step 2 of 2</p>
                          <h3 className="mt-3 text-4xl font-bold">Attempt unit challenge</h3>
                          <p className="mt-3 text-lg text-blue-100">
                            {selectedUnitChallengeConfig.questions.length > 0
                              ? 'Your AI challenge is ready. Test your skills across all topics in this unit.'
                              : 'Return to Step 1 and generate questions first.'}
                          </p>
                          <p className="mt-4 text-xl font-semibold">
                            {unitChallengeQuestionTotal} questions • {unitChallengeEstimatedMinutes}-{unitChallengeEstimatedMinutes + 5} minutes
                          </p>
                        </div>
                      </section>
                    )
                  ) : (
                    <>
                      {selectedUnit.topics.map((topic) => {
                        const isTopicCollapsed = Boolean(collapsedTopicIds[topic.id]);
                        const isCriticalTopic =
                          hasTopicBeenAttempted(topic) && topic.masteryPercent < CRITICAL_TOPIC_MASTERY_THRESHOLD;

                        return (
                        <section
                          key={topic.id}
                          className={`border rounded-lg p-5 space-y-4 ${
                            isCriticalTopic ? 'border-red-300 bg-red-50/30' : 'border-slate-200'
                          }`}
                        >
                          <div className="flex flex-wrap items-center justify-between gap-3">
                            <button
                              type="button"
                              onClick={() => toggleTopicCollapsed(topic.id)}
                              className="text-left text-2xl font-semibold text-slate-900 hover:text-blue-700"
                              aria-expanded={!isTopicCollapsed}
                            >
                              {topic.title}
                            </button>
                            <div className="flex items-center gap-2">
                              {isCriticalTopic && (
                                <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-md border border-red-200 bg-red-100 text-red-700">
                                  Critical unit
                                </span>
                              )}
                              <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-md bg-slate-100 text-slate-700">
                                <Target className="w-3.5 h-3.5" />
                                {topic.masteryPercent}% mastery
                              </span>
                              <button
                                type="button"
                                onClick={() => openTopicDetail(selectedUnit, topic)}
                                className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                              >
                                Open topic
                                <ChevronRight className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>

                          {!isTopicCollapsed && (
                          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                            <div>
                              <p className="text-sm font-semibold text-slate-700 mb-2">Learn</p>
                              <div className="space-y-2">
                                {topic.learn.length > 0 ? topic.learn.map((resource) => (
                                  <button
                                    key={resource.id}
                                    type="button"
                                    onClick={() => openTopicDetail(selectedUnit, topic, `learn-${resource.id}`)}
                                    className="w-full flex items-center justify-between gap-2 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
                                  >
                                    <span className="flex items-center gap-2 min-w-0">
                                      <PlayCircle className="w-4 h-4 text-slate-500 shrink-0" />
                                      <span className="truncate">{resource.title}</span>
                                    </span>
                                    <span className="text-xs text-slate-400 capitalize shrink-0">{resource.type}</span>
                                  </button>
                                )) : (
                                  <p className="rounded-md border border-dashed border-slate-300 bg-slate-50 px-3 py-2 text-xs text-slate-500">
                                    No published learning resources yet.
                                  </p>
                                )}
                              </div>
                            </div>

                            <div>
                              <p className="text-sm font-semibold text-slate-700 mb-2">Practice</p>
                              <div className="space-y-2">
                                {topic.practiceMaterials.map((material) => (
                                  <button
                                    key={material.id}
                                    type="button"
                                    onClick={() => openTopicDetail(selectedUnit, topic, `learn-${material.id}`)}
                                    className="w-full flex items-center justify-between gap-2 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
                                  >
                                    <span className="flex items-center gap-2 min-w-0">
                                      <FileText className="w-4 h-4 text-slate-500 shrink-0" />
                                      <span className="truncate">{material.title}</span>
                                    </span>
                                    <span className="text-xs text-slate-400 shrink-0">teacher material</span>
                                  </button>
                                ))}
                                {topic.practice.map((practice) => (
                                  <div key={practice.id} className="rounded-md border border-slate-200 bg-slate-50 p-3 flex items-start justify-between gap-3">
                                    <div>
                                      <button
                                        type="button"
                                        onClick={() => openPractice(selectedUnit, topic, practice)}
                                        className="text-left text-sm font-semibold text-slate-800 hover:text-blue-700"
                                      >
                                        {practice.title}
                                      </button>
                                      <p className="text-xs text-slate-500 mt-0.5">{practice.target}</p>
                                    </div>
                                    <button
                                      type="button"
                                      onClick={() => openPractice(selectedUnit, topic, practice)}
                                      className={`text-xs font-semibold px-3 py-1.5 rounded-md ${
                                        getPracticeStatus(practice) === 'mastered'
                                          ? 'bg-emerald-100 text-emerald-700'
                                          : getPracticeStatus(practice) === 'in-progress'
                                            ? 'bg-blue-600 text-white hover:bg-blue-700'
                                            : 'border border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100'
                                      }`}
                                    >
                                      {getPracticeActionLabel(getPracticeStatus(practice))}
                                    </button>
                                  </div>
                                ))}
                                {topic.practiceMaterials.length === 0 && topic.practice.length === 0 && (
                                  <p className="rounded-md border border-dashed border-slate-300 bg-slate-50 px-3 py-2 text-xs text-slate-500">
                                    No published practice items yet.
                                  </p>
                                )}
                              </div>
                            </div>

                            <div>
                              <p className="text-sm font-semibold text-slate-700 mb-2">Assessments</p>
                              <div className="space-y-2">
                                {topic.assessments.map((assessment) => (
                                  <button
                                    key={assessment.id}
                                    type="button"
                                    onClick={() => openTopicDetail(selectedUnit, topic, `assessment-${assessment.id}`)}
                                    className="w-full flex items-center justify-between gap-2 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
                                  >
                                    <span className="flex items-center gap-2 min-w-0">
                                      <FileText className="w-4 h-4 text-slate-500 shrink-0" />
                                      <span className="truncate">{assessment.title}</span>
                                    </span>
                                    <span className="text-xs text-slate-400 capitalize shrink-0">
                                      {assessment.status || 'published'}
                                    </span>
                                  </button>
                                ))}
                                {topic.assessments.length === 0 && (
                                  <p className="rounded-md border border-dashed border-slate-300 bg-slate-50 px-3 py-2 text-xs text-slate-500">
                                    No published assessments yet.
                                  </p>
                                )}
                              </div>
                            </div>
                          </div>
                          )}
                        </section>
                      )})}

                      <div className="border border-slate-200 rounded-lg p-5 bg-slate-50">
                        <div className="flex items-center gap-2 text-slate-700 font-semibold">
                          <Sparkles className="w-4 h-4" />
                          Topic challenge
                        </div>
                        <p className="text-sm text-slate-600 mt-2">Test your understanding across all topics in this unit.</p>
                        <button
                          type="button"
                          onClick={openUnitChallenge}
                          className="mt-3 inline-flex items-center gap-2 rounded-md border border-slate-300 bg-white text-slate-700 px-4 py-2 text-sm font-semibold hover:bg-slate-100"
                        >
                          <ChevronRight className="w-4 h-4" />
                          Start unit challenge
                        </button>
                      </div>
                    </>
                  )}
                </div>
              )}
            </section>
          </div>

          {!isUnitChallengeActive && !isSubjectChallengeActive && !isSubjectOverviewActive && (
            <>
              <div
                className="hidden xl:block fixed bottom-3 z-30"
                style={{
                  left: 'var(--subjects-footer-left)',
                  right: 'var(--subjects-footer-right)',
                }}
              >
                <footer className="box-border border-t border-l border-r border-slate-200 bg-white px-6 py-4">
                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={() => {
                        if (nextUnit) setSelectedUnitIndex((previous) => Math.min(previous + 1, units.length - 1));
                      }}
                      disabled={!nextUnit}
                      className="inline-flex items-center rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:bg-slate-400 disabled:cursor-not-allowed"
                    >
                      {nextUnit ? `Up next: ${nextUnit.title.toLowerCase()}` : 'Unit complete'}
                    </button>
                  </div>
                </footer>
              </div>

              <div className="xl:hidden border-t border-slate-200 bg-white px-6 py-4">
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => {
                      if (nextUnit) setSelectedUnitIndex((previous) => Math.min(previous + 1, units.length - 1));
                    }}
                    disabled={!nextUnit}
                    className="inline-flex items-center rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:bg-slate-400 disabled:cursor-not-allowed"
                  >
                    {nextUnit ? `Up next: ${nextUnit.title.toLowerCase()}` : 'Unit complete'}
                  </button>
                </div>
              </div>
            </>
          )}

          {isUnitChallengeActive && !isUnitChallengeRunning && (
            <>
              <div
                className="hidden xl:block fixed bottom-3 z-30"
                style={{
                  left: 'var(--subjects-footer-left)',
                  right: 'var(--subjects-footer-right)',
                }}
              >
                <footer className="box-border border-t border-l border-r border-slate-200 bg-white px-6 py-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    {activeUnitChallenge?.stage === 'completed' && activeUnitChallenge.summary ? (
                      <div className="rounded-md border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm text-emerald-800">
                        Unit challenge complete: {activeUnitChallenge.summary.correct}/{activeUnitChallenge.summary.total} correct.
                      </div>
                    ) : (
                      <div />
                    )}

                    <div className="flex flex-wrap items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={exitUnitChallenge}
                        className="inline-flex items-center rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                      >
                        Back to unit
                      </button>
                      <button
                        type="button"
                        onClick={startUnitChallenge}
                        disabled={selectedUnitChallengeConfig.questions.length === 0 || selectedUnitChallengeConfig.isGenerating}
                        className="inline-flex items-center rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:bg-slate-400 disabled:cursor-not-allowed"
                      >
                        {activeUnitChallenge?.stage === 'completed' ? 'Retake challenge' : "Let's go"}
                      </button>
                    </div>
                  </div>
                </footer>
              </div>

              <div className="xl:hidden border-t border-slate-200 bg-white px-6 py-4">
                {activeUnitChallenge?.stage === 'completed' && activeUnitChallenge.summary ? (
                  <div className="mb-3 rounded-md border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm text-emerald-800">
                    Unit challenge complete: {activeUnitChallenge.summary.correct}/{activeUnitChallenge.summary.total} correct.
                  </div>
                ) : null}

                <div className="flex flex-wrap items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={exitUnitChallenge}
                    className="inline-flex items-center rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                  >
                    Back to unit
                  </button>
                  <button
                    type="button"
                    onClick={startUnitChallenge}
                    disabled={selectedUnitChallengeConfig.questions.length === 0 || selectedUnitChallengeConfig.isGenerating}
                    className="inline-flex items-center rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:bg-slate-400 disabled:cursor-not-allowed"
                  >
                    {activeUnitChallenge?.stage === 'completed' ? 'Retake challenge' : "Let's go"}
                  </button>
                </div>
              </div>
            </>
          )}

          {isSubjectChallengeActive && !isSubjectChallengeRunning && (
            <>
              <div
                className="hidden xl:block fixed bottom-3 z-30"
                style={{
                  left: 'var(--subjects-footer-left)',
                  right: 'var(--subjects-footer-right)',
                }}
              >
                <footer className="box-border border-t border-l border-r border-slate-200 bg-white px-6 py-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    {subjectChallengeState?.stage === 'completed' && subjectChallengeState.summary ? (
                      <div className="rounded-md border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm text-emerald-800">
                        Subject challenge complete: {subjectChallengeState.summary.correct}/{subjectChallengeState.summary.total} correct.
                      </div>
                    ) : (
                      <div />
                    )}

                    <div className="flex flex-wrap items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={exitSubjectChallenge}
                        className="inline-flex items-center rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                      >
                        Back to overview
                      </button>
                      <button
                        type="button"
                        onClick={startSubjectChallenge}
                        disabled={selectedSubjectChallengeConfig.questions.length === 0 || selectedSubjectChallengeConfig.isGenerating}
                        className="inline-flex items-center rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:bg-slate-400 disabled:cursor-not-allowed"
                      >
                        {subjectChallengeState?.stage === 'completed' ? 'Retake challenge' : "Let's go"}
                      </button>
                    </div>
                  </div>
                </footer>
              </div>

              <div className="xl:hidden border-t border-slate-200 bg-white px-6 py-4">
                {subjectChallengeState?.stage === 'completed' && subjectChallengeState.summary ? (
                  <div className="mb-3 rounded-md border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm text-emerald-800">
                    Subject challenge complete: {subjectChallengeState.summary.correct}/{subjectChallengeState.summary.total} correct.
                  </div>
                ) : null}

                <div className="flex flex-wrap items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={exitSubjectChallenge}
                    className="inline-flex items-center rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                  >
                    Back to overview
                  </button>
                  <button
                    type="button"
                    onClick={startSubjectChallenge}
                    disabled={selectedSubjectChallengeConfig.questions.length === 0 || selectedSubjectChallengeConfig.isGenerating}
                    className="inline-flex items-center rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:bg-slate-400 disabled:cursor-not-allowed"
                  >
                    {subjectChallengeState?.stage === 'completed' ? 'Retake challenge' : "Let's go"}
                  </button>
                </div>
              </div>
            </>
          )}
        </>
      )}

      {shouldShowSubjectsChat && (
        <div
          ref={subjectsChatFloatingRef}
          className="fixed z-40"
          style={
            subjectsChatPosition
              ? { left: `${subjectsChatPosition.x}px`, top: `${subjectsChatPosition.y}px` }
              : {
                  right: 'calc(var(--subjects-footer-right) + 1rem)',
                  bottom: '6rem',
                }
          }
        >
          <div className="flex flex-col items-end gap-3">
            {isSubjectsChatOpen && (
              <div className="w-[460px] max-w-[calc(100vw-1.5rem)] overflow-hidden rounded-lg border border-slate-200 bg-white shadow-lg">
                <div className="flex items-center justify-between border-b border-slate-200 px-3 py-2">
                  <p className="text-sm font-semibold text-slate-800">Topic Chat</p>
                  <div className="inline-flex items-center gap-1.5">
                    <button
                      type="button"
                      onPointerDown={startSubjectsChatDrag}
                      className="inline-flex h-7 w-7 cursor-grab items-center justify-center rounded-md text-slate-500 hover:bg-slate-100 active:cursor-grabbing"
                      aria-label="Drag topic chat window"
                      title="Drag"
                    >
                      <GripHorizontal className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setSubjectsChatOpenWithAnchor(false)}
                      className="inline-flex h-7 w-7 items-center justify-center rounded-md text-slate-500 hover:bg-slate-100"
                      aria-label="Close topic chat"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                <div className="h-[300px] max-h-[52vh] space-y-2 overflow-y-auto px-3 py-3">
                  {subjectsChatMessages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${message.sender === 'student' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[88%] rounded-lg px-3 py-2 text-sm ${
                          message.sender === 'student'
                            ? 'bg-blue-600 text-white'
                            : 'border border-slate-200 bg-slate-50 text-slate-700'
                        }`}
                      >
                        {message.text}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="border-t border-slate-200 p-3">
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={subjectsChatInput}
                      onChange={(event) => setSubjectsChatInput(event.target.value)}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter' && !event.shiftKey) {
                          event.preventDefault();
                          sendSubjectsChatMessage();
                        }
                      }}
                      placeholder="Ask about this topic..."
                      className="min-w-0 flex-1 rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-700 focus:border-blue-500 focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={sendSubjectsChatMessage}
                      className="inline-flex h-9 w-9 items-center justify-center rounded-md bg-blue-600 text-white hover:bg-blue-700"
                      aria-label="Send message"
                    >
                      <Send className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            )}

            <div className="inline-flex items-center gap-2 rounded-md border border-slate-200 bg-white px-2 py-2 shadow-sm">
              <button
                type="button"
                onPointerDown={startSubjectsChatDrag}
                className="inline-flex h-8 w-8 cursor-grab items-center justify-center rounded-md text-slate-500 hover:bg-slate-100 active:cursor-grabbing"
                aria-label="Drag topic chat button"
                title="Drag"
              >
                <GripHorizontal className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => setSubjectsChatOpenWithAnchor(!isSubjectsChatOpen)}
                className="inline-flex items-center gap-2 rounded-md bg-white px-1.5 py-1 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                <MessageCircle className="h-4 w-4" />
                {isSubjectsChatOpen ? 'Hide chat' : 'Open chat'}
              </button>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default StudentSubjectsView;