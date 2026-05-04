import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertCircle,
  Calendar,
  ChevronsLeft,
  ChevronsRight,
  CheckCircle,
  Clock,
  Eye,
  FileText,
  Loader2,
  ScanLine,
  Upload,
} from 'lucide-react';
import OcrReviewComponent, { CompiledSubmission } from '../ocr/OcrReviewComponent';
import {
  assessmentService,
  studentService,
  submissionService,
} from '../../services/api';
import { ApiError } from '../../services/apiClient';
import type { SubmissionReviewDetail, SubmissionReviewQuestionDetail } from '../../services/submissionService';
import type { StudentAssessmentDetail, StudentAssessmentHistoryItem } from '../../services/studentService';
import { toast } from 'sonner';
import TablePagination from '../ui/TablePagination';
import { QuestionText } from '../ui/DiagramRenderer';
import { useClientPagination } from '../../hooks/useClientPagination';

interface StudentAssignmentsProps {
  studentId: string;
  selectedSubjectId?: string;
  onOpenTutor?: (prompt?: string) => void;
}

type AssessmentTabKey = 'attempt' | 'list' | 'review';
type StatusFilterKey = 'all' | 'pending' | 'submitted' | 'graded' | 'overdue';
type AssignmentStatusKey = Exclude<StatusFilterKey, 'all'>;
type SubmissionMode = 'questions' | 'handwritten';

interface AssessmentQuestionPart {
  id?: string;
  text: string;
  type?: string;
  options?: string[];
  correctAnswer?: string;
  maxPoints?: number;
  diagram_manifest?: import('@/types').DiagramManifest | null;
}

interface AssessmentQuestionItem {
  id: string;
  assessmentQuestionId?: string;
  questionId?: string;
  stem: string;        // We map 'text' to 'stem' in ensureAssessmentWithQuestions
  options: string[];
  correctAnswer?: string;
  points?: number;
  diagram_manifest?: import('@/types').DiagramManifest | null;
  parts?: AssessmentQuestionPart[];
}
interface AssessmentWithQuestionsItem {
  id: string;
  subjectId?: string;
  name?: string;
  description?: string;
  assessmentType?: string;
  maxScore?: number;
  weightPct?: number;
  questions?: AssessmentQuestionItem[];
}

interface SubmissionSummaryItem {
  id: string;
  assessment: string;
  submissionType?: string;
  submittedAt?: string;
  status?: string;
  originalFilename?: string;
}

interface ResultItem {
  id: string;
  expectedMark?: number;
  actualMark?: number;
  grade?: string;
  feedback?: string;
  submittedDate?: string;
}

interface AssignmentEntry {
  id: string;
  assignmentId: string;
  assessmentId: string;
  assessmentName: string;
  dueTime: string | null;
  published: boolean;
  assessment: AssessmentWithQuestionsItem | null;
  submission: SubmissionSummaryItem | null;
  result: ResultItem | null;
  status: AssignmentStatusKey;
}

const asDate = (value?: string | null): Date | null => {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

const formatMark = (value?: number | null) => {
  if (typeof value !== 'number' || Number.isNaN(value)) return 'N/A';
  return Number.isInteger(value) ? String(value) : value.toFixed(1);
};

const formatAssessmentType = (assessment?: AssessmentWithQuestionsItem | null) => {
  const raw = String(assessment?.assessmentType || 'Assessment').trim();
  if (!raw) return 'Assessment';
  return raw
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());
};

const getEntryStatus = (entry: {
  submission: SubmissionSummaryItem | null;
  result: ResultItem | null;
  dueTime: string | null;
}): AssignmentStatusKey => {
  if (entry.result && typeof entry.result.actualMark === 'number') return 'graded';
  if (entry.submission) return 'submitted';
  const dueDate = asDate(entry.dueTime);
  if (dueDate && dueDate.getTime() < Date.now()) return 'overdue';
  return 'pending';
};

const normalizeStatus = (value?: string | null): AssignmentStatusKey | null => {
  const normalized = String(value || '').trim().toLowerCase();
  if (normalized === 'graded' || normalized === 'submitted' || normalized === 'overdue' || normalized === 'pending') {
    return normalized;
  }
  if (normalized === 'reviewed') return 'graded';
  if (normalized === 'assigned') return 'pending';
  return null;
};

const toResultItem = (item: any): ResultItem | null => {
  // If the backend returned a score, we display it immediately
  const actualMark = item.actualMark ?? item.score ?? item.totalScore;
  
  if (typeof actualMark !== 'number' && !item.grade) {
    return null;
  }

  return {
    id: item.assignmentId,
    expectedMark: item.maxScore ?? null,
    actualMark: actualMark,
    grade: item.grade ?? null,
    feedback: item.feedback ?? null,
    submittedDate: item.submittedAt,
  };
};

const getStatusPillClass = (status: AssignmentStatusKey) => {
  switch (status) {
    case 'graded':
      return 'text-emerald-700 bg-emerald-100';
    case 'submitted':
      return 'text-blue-700 bg-blue-100';
    case 'overdue':
      return 'text-rose-700 bg-rose-100';
    default:
      return 'text-amber-700 bg-amber-100';
  }
};

const getStatusLabel = (status: AssignmentStatusKey) => {
  switch (status) {
    case 'graded':
      return 'Graded';
    case 'submitted':
      return 'Submitted';
    case 'overdue':
      return 'Overdue';
    default:
      return 'Pending';
  }
};

const getStatusIcon = (status: AssignmentStatusKey) => {
  switch (status) {
    case 'graded':
      return <CheckCircle className="w-4 h-4" />;
    case 'submitted':
      return <Clock className="w-4 h-4" />;
    case 'overdue':
      return <AlertCircle className="w-4 h-4" />;
    default:
      return <Calendar className="w-4 h-4" />;
  }
};

const resolveAssessmentQuestionId = (question: AssessmentQuestionItem) =>
  question.assessmentQuestionId || question.id;

const StudentAssignments: React.FC<StudentAssignmentsProps> = ({ studentId, selectedSubjectId, onOpenTutor }) => {
  const [entries, setEntries] = useState<AssignmentEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [assessmentTab, setAssessmentTab] = useState<AssessmentTabKey>('attempt');
  const [selectedReviewEntryId, setSelectedReviewEntryId] = useState<string | null>(null);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<StatusFilterKey>('all');
  const [selectedType, setSelectedType] = useState<'all' | string>('all');

  const [activeAttemptEntryId, setActiveAttemptEntryId] = useState<string | null>(null);
  const [submissionMode, setSubmissionMode] = useState<SubmissionMode>('questions');
  const [answerDrafts, setAnswerDrafts] = useState<Record<string, string>>({});
  const [submittingEntryId, setSubmittingEntryId] = useState<string | null>(null);
  const [loadingAttemptEntryId, setLoadingAttemptEntryId] = useState<string | null>(null);

  const [ocrEntry, setOcrEntry] = useState<AssignmentEntry | null>(null);
  const [ocrInitialFiles, setOcrInitialFiles] = useState<File[]>([]);
  const handwrittenInputRef = useRef<HTMLInputElement>(null);

  const [reviewSubmissionDetail, setReviewSubmissionDetail] = useState<SubmissionReviewDetail | null>(null);
  const [loadingReviewDetail, setLoadingReviewDetail] = useState(false);
  const reviewDetailCacheRef = useRef<Record<string, SubmissionReviewDetail>>({});
  const [selectedAssessmentDetail, setSelectedAssessmentDetail] = useState<StudentAssessmentDetail | null>(null);
  const [loadingAssessmentDetail, setLoadingAssessmentDetail] = useState(false);
  const assessmentDetailCacheRef = useRef<Record<string, StudentAssessmentDetail>>({});
  const [activeResult, setActiveResult] = useState<any | null>(null);

  const mergeAssessmentIntoEntries = useCallback((assessmentId: string, patch: Partial<AssessmentWithQuestionsItem>) => {
    setEntries((previous) =>
      previous.map((entry) => {
        if (entry.assessmentId !== assessmentId) return entry;
        return {
          ...entry,
          assessment: {
            id: assessmentId,
            ...(entry.assessment || {}),
            ...patch,
          },
        };
      })
    );
  }, []);

  const fetchWorkspace = useCallback(async (options: { forceRefresh?: boolean } = {}) => {
    if (!studentId) {
      setEntries([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const subjectFilter = selectedSubjectId && selectedSubjectId !== 'all' ? selectedSubjectId : undefined;
      const history = await assessmentService.getAssessmentHistory(
        studentId,
        { subjectId: subjectFilter },
        { forceRefresh: !!options.forceRefresh }
      );

      const mappedEntries: AssignmentEntry[] = history
        .map((item) => {
          const assessment: AssessmentWithQuestionsItem = {
            id: item.assessmentId,
            subjectId: item.subjectId || undefined,
            name: item.assessmentName,
            assessmentType: item.assessmentType || undefined,
            maxScore: item.maxScore ?? undefined,
          };
          const submission: SubmissionSummaryItem | null = item.submissionId
            ? {
                id: item.submissionId,
                assessment: item.assessmentId,
                submittedAt: item.submittedAt || undefined,
                status: item.status || undefined,
              }
            : null;
          const result = toResultItem(item);
          const status =
            normalizeStatus(item.status) || getEntryStatus({ submission, result, dueTime: item.dueTime || null });

          return {
            id: item.enrollmentId,
            assignmentId: item.assignmentId,
            assessmentId: item.assessmentId,
            assessmentName: item.assessmentName,
            dueTime: item.dueTime || null,
            published: item.published,
            assessment,
            submission,
            result,
            status,
          };
        })
        .sort((a, b) => {
          const aDue = asDate(a.dueTime)?.getTime() || 0;
          const bDue = asDate(b.dueTime)?.getTime() || 0;
          return aDue - bDue;
        });

      setEntries(mappedEntries);
    } catch (err: any) {
      setEntries([]);
      if (err instanceof ApiError && err.status === 404) {
        setError(null);
      } else {
        setError('Unable to load assessments right now. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  }, [studentId, selectedSubjectId]);

  useEffect(() => {
    fetchWorkspace();
  }, [fetchWorkspace]);

  useEffect(() => {
    if (entries.length === 0) {
      setSelectedReviewEntryId(null);
      return;
    }

    const selectedStillExists = selectedReviewEntryId
      ? entries.some((entry) => entry.id === selectedReviewEntryId)
      : false;

    if (selectedStillExists) return;

    const defaultEntry = entries.find((entry) => entry.status === 'graded' || entry.status === 'submitted') || entries[0];
    setSelectedReviewEntryId(defaultEntry?.id || null);
  }, [entries, selectedReviewEntryId]);

  const selectedReviewEntry = useMemo(
    () => entries.find((entry) => entry.id === selectedReviewEntryId) || null,
    [entries, selectedReviewEntryId]
  );

  const ensureAssessmentWithQuestions = useCallback(
  async (entry: AssignmentEntry): Promise<AssessmentWithQuestionsItem | null> => {
    const existingQuestions = entry.assessment?.questions || [];
    if (existingQuestions.length > 0) {
      return entry.assessment;
    }

    // This now calls the method we just added to assessmentService
    const raw = (await assessmentService.getAssessmentWithQuestions(entry.assessmentId)) as AssessmentWithQuestionsItem;
    
    // Normalization logic ensures the UI doesn't crash if IDs are missing
    const normalizedQuestions = (raw?.questions || []).map((question: any) => ({
      ...question,
      id: question._id || question.id,
      stem: question.text,
      points: question.maxPoints,
      correctAnswer: question.correctAnswer,
      diagram_manifest: question.diagram_manifest ?? null,
      parts: Array.isArray(question.parts) ? question.parts.map((p: any, pi: number) => ({
        ...p,
        id: p._id || String(pi),
        text: p.text || '',
        options: Array.isArray(p.options) ? p.options : [],
      })) : [],
    }));

    const mergedAssessment: AssessmentWithQuestionsItem = {
      ...(entry.assessment || {}),
      ...(raw || {}),
      id: entry.assessmentId,
      questions: normalizedQuestions,
    };

    mergeAssessmentIntoEntries(entry.assessmentId, mergedAssessment);
    return mergedAssessment;
  },
  [mergeAssessmentIntoEntries]
);

  useEffect(() => {
    const assessmentId = selectedReviewEntry?.assessmentId;
    if (!assessmentId || !studentId) {
      setSelectedAssessmentDetail(null);
      setLoadingAssessmentDetail(false);
      return;
    }

    const cacheKey = `${studentId}:${assessmentId}`;
    const cached = assessmentDetailCacheRef.current[cacheKey];
    if (cached) {
      setSelectedAssessmentDetail(cached);
      setLoadingAssessmentDetail(false);
      mergeAssessmentIntoEntries(assessmentId, {
        description: cached.description || undefined,
        maxScore: cached.maxScore ?? undefined,
        assessmentType: cached.assessmentType || undefined,
      });
      return;
    }

    setSelectedAssessmentDetail(null);
    let cancelled = false;

    const fetchAssessmentDetail = async () => {
      setLoadingAssessmentDetail(true);
      try {
        const detail = await assessmentService.getAssessment(assessmentId);
        if (!cancelled) {
          assessmentDetailCacheRef.current[cacheKey] = detail;
          setSelectedAssessmentDetail(detail);
          mergeAssessmentIntoEntries(assessmentId, {
            description: detail.description || undefined,
            maxScore: detail.maxScore ?? undefined,
            assessmentType: detail.assessmentType || undefined,
          });
        }
      } catch {
        if (!cancelled) {
          setSelectedAssessmentDetail(null);
        }
      } finally {
        if (!cancelled) {
          setLoadingAssessmentDetail(false);
        }
      }
    };

    fetchAssessmentDetail();

    return () => {
      cancelled = true;
    };
  }, [studentId, selectedReviewEntry?.assessmentId, mergeAssessmentIntoEntries]);

// StudentAssignments.tsx (around line 425)

// StudentAssignments.tsx 
// StudentAssignments.tsx

// const reviewQuestions = useMemo(() => {
//   const rawData: any = reviewSubmissionDetail;
//   const rawAnswers = rawData?.answers || [];


//   // LOG 1: Check what status is coming back from the detailed fetch
//   console.log("Detailed Submission Status:", rawData?.status);
//   console.log("Detailed Raw Answers:", rawAnswers);
//   // Check the overall status of the submission
//   const isReleased = rawData?.status === 'graded' || rawData?.status === 'reviewed';

//   return rawAnswers.map((ans: any, index: number) => {
//     const questionRef = ans.questionId || {};
    
//     return {
//       assessmentQuestionId: questionRef._id || ans.questionId,
//       prompt: questionRef.text || "Question text unavailable",
//       studentAnswer: ans.studentAnswer || "No answer",

//       ...(index === 0 && console.log("Mapping Q1 - PointsEarned:", ans.pointsEarned, "isReleased:", isReleased)),
      
//       // Points are only shown if the grade is released
//       awardedMarks: isReleased ? (ans.pointsEarned ?? (ans.isCorrect ? questionRef.maxPoints : 0)) : null,
//       maxMarks: questionRef.maxPoints || 0,
      
//       // SURGICAL PROTECTION:
//       // Only reveal the Correct Answer if the status is officially 'graded'
//       expectedMarkingPoints: isReleased 
//         ? [questionRef.correctAnswer || "No marking scheme provided"] 
//         : ["Marking scheme hidden until grade is released"],
        
//       feedback: isReleased ? (ans.feedback || "Correct") : "Feedback pending review.",
//       order: index + 1
//     };
//   });
// }, [reviewSubmissionDetail]);

const reviewQuestions = useMemo(() => {
  const rawAnswers = (reviewSubmissionDetail as any)?.answers || [];
  const isReleased = activeResult?.status === 'Released';

  return rawAnswers.map((ans: any, index: number) => {
    const questionRef = ans.questionId || {};
    const partAnswers: string[] | undefined =
      Array.isArray(ans.partAnswers) && ans.partAnswers.length > 0 ? ans.partAnswers : undefined;

    return {
      assessmentQuestionId: questionRef._id || ans.questionId,
      prompt: questionRef.text || 'Question text unavailable',
      studentAnswer: partAnswers ? undefined : (ans.studentAnswer || 'No answer'),
      partAnswers,
      parts: Array.isArray(questionRef.parts) ? questionRef.parts : [],
      awardedMarks: isReleased ? (ans.pointsEarned ?? null) : null,
      maxMarks: questionRef.maxPoints ?? null,
      expectedMarkingPoints: isReleased
        ? (questionRef.correctAnswer ? [questionRef.correctAnswer] : [])
        : [],
      feedback: isReleased ? (ans.feedback ?? null) : null,
      order: index + 1,
    };
  });
}, [reviewSubmissionDetail, activeResult]);

useEffect(() => {
  const submissionId = selectedReviewEntry?.submission?.id;
  if (!submissionId) {
    setReviewSubmissionDetail(null);
    setActiveResult(null); // Reset result state
    return;
  }

  const loadReviewData = async () => {
    setLoadingReviewDetail(true);
    try {
      // 1. Get the raw submission (answers Natasha typed)
      const submission = await submissionService.getSubmissionReviewDetail(submissionId);
      setReviewSubmissionDetail(submission);

      // 2. Get the official Result (The grade Natasha is allowed to see)
      const result = await assessmentService.getSubmissionResult(submissionId);
      setActiveResult(result);
    } catch (err) {
      console.error("Error loading review data:", err);
      setActiveResult(null);
    } finally {
      setLoadingReviewDetail(false);
    }
  };

  loadReviewData();
}, [selectedReviewEntry?.submission?.id]);

  const assessmentTypes = useMemo(
    () =>
      Array.from(
        new Set(entries.map((entry) => formatAssessmentType(entry.assessment)))
      ).sort(),
    [entries]
  );

  const filteredEntries = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return entries.filter((entry) => {
      const statusMatch = selectedStatus === 'all' || entry.status === selectedStatus;
      const typeMatch = selectedType === 'all' || formatAssessmentType(entry.assessment) === selectedType;
      const queryMatch =
        !query ||
        entry.assessmentName.toLowerCase().includes(query) ||
        String(entry.assessment?.description || '').toLowerCase().includes(query);

      return statusMatch && typeMatch && queryMatch;
    });
  }, [entries, searchQuery, selectedStatus, selectedType]);

  const attemptEntries = useMemo(
    () => filteredEntries.filter((entry) => entry.status === 'pending' || entry.status === 'overdue'),
    [filteredEntries]
  );
  const {
    currentPage,
    pageSize,
    totalPages,
    totalItems,
    paginatedItems: paginatedEntries,
    rangeStart,
    rangeEnd,
    setCurrentPage,
    setPageSize,
  } = useClientPagination(filteredEntries, {
    initialPageSize: 10,
    resetKey: `${selectedSubjectId || 'all'}|${assessmentTab}|${selectedStatus}|${selectedType}|${searchQuery}|${filteredEntries.length}`,
  });
  const pendingCount = entries.filter((item) => item.status === 'pending' || item.status === 'overdue').length;
  const reviewedCount = entries.filter((item) => item.status === 'graded').length;
  const reviewedPercent = entries.length > 0 ? Math.round((reviewedCount / entries.length) * 100) : 0;

  const setAnswerDraft = (assessmentId: string, questionId: string, value: string) => {
    const key = `${assessmentId}:${questionId}`;
    setAnswerDrafts((previous) => ({ ...previous, [key]: value }));
  };

  const getAnswerDraft = (assessmentId: string, questionId: string) => {
    const key = `${assessmentId}:${questionId}`;
    return answerDrafts[key] || '';
  };

// Inside StudentAssignments.tsx

const submitQuestionAnswers = async (entry: AssignmentEntry) => {
  const questions = entry.assessment?.questions || [];
  const answers = questions.map(q => {
    const rawQuestion = q as any;
    const parts: AssessmentQuestionPart[] = Array.isArray(rawQuestion.parts) ? rawQuestion.parts : [];
    const isMultipart = parts.length > 0;

    if (isMultipart) {
      const partAnswers = parts.map((_: AssessmentQuestionPart, pi: number) =>
        (answerDrafts[`${entry.assessmentId}:${q.id}:p${pi}`] || '').trim()
      );
      const hasAny = partAnswers.some((a: string) => a !== '');
      if (!hasAny) return null;
      return {
        questionId: q.id,
        studentAnswer: partAnswers.filter((a: string) => a).join(' | '),
        partAnswers,
        isCorrect: undefined as boolean | undefined,
      };
    }

    const draft = (answerDrafts[`${entry.assessmentId}:${q.id}`] || '').trim();
    const isMcq = Array.isArray(rawQuestion.options) && rawQuestion.options.length > 0;
    const isCorrect = isMcq ? (draft === rawQuestion.correctAnswer) : undefined;
    return { questionId: q.id, studentAnswer: draft, isCorrect };
  }).filter((a): a is NonNullable<typeof a> => a !== null && a.studentAnswer !== '');

  if (answers.length === 0) {
    toast.error('Please answer at least one question.');
    return;
  }

  setSubmittingEntryId(entry.id);
  try {
    const res = await submissionService.submitAnswers({
      assessmentId: entry.assessmentId,
      studentId: studentId,
      submissionType: 'manual',
      answers: answers,
    });

    toast.success(res.message);
    setActiveAttemptEntryId(null);
    await fetchWorkspace({ forceRefresh: true });
  } catch (err: any) {
    toast.error(err.message || 'Submission failed');
  } finally {
    setSubmittingEntryId(null);
  }
};

  const openHandwrittenPicker = (entry: AssignmentEntry) => {
    setOcrEntry(entry);
    handwrittenInputRef.current?.click();
  };

  const handleHandwrittenFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    e.target.value = '';
    if (files.length) setOcrInitialFiles(files);
  };


  if (loading) {
    return (
      <div className="border border-slate-200 bg-white overflow-hidden animate-pulse">
        <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] min-h-[680px]">
          <aside className="border-b lg:border-b-0 lg:border-r border-slate-200 bg-slate-50 p-4 sm:p-5 space-y-4">
            <div className="h-3 w-24 rounded bg-slate-200" />
            <div className="-mx-4 sm:-mx-5 border-t border-slate-200">
              <div className="h-10 border-b border-slate-200 bg-slate-100" />
              <div className="h-10 border-b border-slate-200 bg-slate-100" />
              <div className="h-10 border-b border-slate-200 bg-slate-100" />
            </div>
            <div className="rounded-md border border-slate-200 bg-white p-3.5 space-y-2">
              <div className="h-3 w-20 rounded bg-slate-200" />
              <div className="h-9 rounded-md bg-slate-100" />
              <div className="h-9 rounded-md bg-slate-100" />
              <div className="h-9 rounded-md bg-slate-100" />
              <div className="h-1.5 rounded-full bg-slate-200 mt-2" />
            </div>
          </aside>
          <section className="p-4 sm:p-6 space-y-4">
            <div className="h-16 rounded-lg border border-slate-200 bg-slate-50" />
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-36 rounded-lg border border-slate-200 bg-white" />
            ))}
            <div className="h-16 rounded-lg border border-slate-200 bg-slate-50" />
            <div className="h-36 rounded-lg border border-slate-200 bg-white" />
          </section>
        </div>
      </div>
    );
  }

  return (
    <div className="border border-slate-200 bg-white overflow-hidden">
      <div className={`grid grid-cols-1 min-h-[680px] ${isSidebarCollapsed ? 'lg:grid-cols-[88px_1fr]' : 'lg:grid-cols-[280px_1fr]'}`}>
        <aside className="relative border-b lg:border-b-0 lg:border-r border-slate-200 bg-slate-50 p-4 sm:p-5 space-y-4">
          <button
            type="button"
            onClick={() => setIsSidebarCollapsed((prev) => !prev)}
            className="hidden lg:inline-flex absolute top-1/2 -translate-y-1/2 -right-4 z-10 h-8 w-8 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 shadow-sm hover:bg-slate-50"
            aria-label={isSidebarCollapsed ? 'Expand assessments panel' : 'Collapse assessments panel'}
          >
            {isSidebarCollapsed ? <ChevronsRight className="w-4 h-4" /> : <ChevronsLeft className="w-4 h-4" />}
          </button>

          <p
            className={`text-[11px] uppercase tracking-[0.18em] text-slate-500 font-semibold transition-[max-width,opacity,transform] duration-200 ${
              isSidebarCollapsed ? 'max-w-0 opacity-0 -translate-x-1 overflow-hidden' : 'max-w-[180px] opacity-100 translate-x-0'
            }`}
          >
            Assessments
          </p>

          <nav className={`${isSidebarCollapsed ? '-mx-4 sm:-mx-5 border-y border-slate-200 bg-white overflow-hidden' : '-mx-4 sm:-mx-5 border-t border-slate-200'}`}>
            <button
              type="button"
              onClick={() => setAssessmentTab('attempt')}
              className={`w-full inline-flex items-center text-sm transition ${
                isSidebarCollapsed
                  ? 'justify-center h-11 border-b border-slate-200'
                  : 'justify-between rounded-none border-b border-slate-200 px-4 sm:px-5 py-2.5'
              } ${
                assessmentTab === 'attempt'
                  ? isSidebarCollapsed
                    ? 'bg-blue-50 text-blue-700'
                    : 'bg-blue-50 border-l-4 border-l-blue-600 pl-2 text-blue-700 font-semibold'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
              aria-current={assessmentTab === 'attempt' ? 'page' : undefined}
            >
              <span className={`inline-flex items-center min-w-0 ${isSidebarCollapsed ? '' : 'gap-2'}`}>
                <span
                  className={`inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${
                    assessmentTab === 'attempt'
                      ? 'bg-blue-100 text-blue-700'
                      : 'bg-white border border-slate-200 text-slate-600'
                  }`}
                >
                    <Upload className="w-4 h-4" />
                </span>
                <span
                  className={`truncate transition-[max-width,opacity,transform] duration-200 ${
                    isSidebarCollapsed ? 'max-w-0 opacity-0 -translate-x-1 overflow-hidden' : 'max-w-[180px] opacity-100 translate-x-0'
                  }`}
                >
                  Attempt Assessment
                </span>
              </span>
              {!isSidebarCollapsed && (
                <span className={`text-xs font-semibold ${assessmentTab === 'attempt' ? 'text-blue-700' : 'text-slate-500'}`}>{pendingCount}</span>
              )}
            </button>
            <button
              type="button"
              onClick={() => setAssessmentTab('list')}
              className={`w-full inline-flex items-center text-sm transition ${
                isSidebarCollapsed
                  ? 'justify-center h-11 border-b border-slate-200'
                  : 'justify-between rounded-none border-b border-slate-200 px-4 sm:px-5 py-2.5'
              } ${
                assessmentTab === 'list'
                  ? isSidebarCollapsed
                    ? 'bg-blue-50 text-blue-700'
                    : 'bg-blue-50 border-l-4 border-l-blue-600 pl-2 text-blue-700 font-semibold'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
              aria-current={assessmentTab === 'list' ? 'page' : undefined}
            >
              <span className={`inline-flex items-center min-w-0 ${isSidebarCollapsed ? '' : 'gap-2'}`}>
                <span
                  className={`inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${
                    assessmentTab === 'list'
                      ? 'bg-blue-100 text-blue-700'
                      : 'bg-white border border-slate-200 text-slate-600'
                  }`}
                >
                  <FileText className="w-4 h-4" />
                </span>
                <span
                  className={`truncate transition-[max-width,opacity,transform] duration-200 ${
                    isSidebarCollapsed ? 'max-w-0 opacity-0 -translate-x-1 overflow-hidden' : 'max-w-[180px] opacity-100 translate-x-0'
                  }`}
                >
                  Assessment List
                </span>
              </span>
              {!isSidebarCollapsed && (
                <span className={`text-xs font-semibold ${assessmentTab === 'list' ? 'text-blue-700' : 'text-slate-500'}`}>{entries.length}</span>
              )}
            </button>
            <button
              type="button"
              onClick={() => setAssessmentTab('review')}
              className={`w-full inline-flex items-center text-sm transition ${
                isSidebarCollapsed
                  ? 'justify-center h-11 border-b border-slate-200'
                  : 'justify-between rounded-none border-b border-slate-200 px-4 sm:px-5 py-2.5'
              } ${
                assessmentTab === 'review'
                  ? isSidebarCollapsed
                    ? 'bg-blue-50 text-blue-700'
                    : 'bg-blue-50 border-l-4 border-l-blue-600 pl-2 text-blue-700 font-semibold'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
              aria-current={assessmentTab === 'review' ? 'page' : undefined}
            >
              <span className={`inline-flex items-center min-w-0 ${isSidebarCollapsed ? '' : 'gap-2'}`}>
                <span
                  className={`inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${
                    assessmentTab === 'review'
                      ? 'bg-blue-100 text-blue-700'
                      : 'bg-white border border-slate-200 text-slate-600'
                  }`}
                >
                  <Eye className="w-4 h-4" />
                </span>
                <span
                  className={`truncate transition-[max-width,opacity,transform] duration-200 ${
                    isSidebarCollapsed ? 'max-w-0 opacity-0 -translate-x-1 overflow-hidden' : 'max-w-[180px] opacity-100 translate-x-0'
                  }`}
                >
                  Assessment Review
                </span>
              </span>
              {!isSidebarCollapsed && (
                <span className={`text-xs font-semibold ${assessmentTab === 'review' ? 'text-blue-700' : 'text-slate-500'}`}>{reviewedCount}</span>
              )}
            </button>
          </nav>

        </aside>

        <section className="p-4 sm:p-6 space-y-4">
          {error && (
            <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {error}
            </div>
          )}

          {assessmentTab === 'attempt' && (
            <>
              {attemptEntries.map((entry) => {
                const dueDate = asDate(entry.dueTime);
                const questions = entry.assessment?.questions || [];
                const hasQuestions = questions.length > 0;
                const isActive = activeAttemptEntryId === entry.id;

                return (
                  <article key={entry.id} className="rounded-lg border border-slate-200 bg-white p-5">
                    <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
                      <div>
                        <h3 className="text-lg font-semibold text-slate-900">{entry.assessmentName}</h3>
                        <p className="mt-1 text-sm text-slate-600">{entry.assessment?.description || 'Open and complete the assessment attempt.'}</p>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium inline-flex items-center gap-1 ${getStatusPillClass(entry.status)}`}>
                        {getStatusIcon(entry.status)}
                        {getStatusLabel(entry.status)}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-4 text-sm text-slate-500 mb-4">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        <span>Due: {dueDate ? dueDate.toLocaleDateString() : 'Not set'}</span>
                      </div>
                      <span>Max Score: {Math.round(Number(entry.assessment?.maxScore || 0)) || 'N/A'}</span>
                      <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                        {formatAssessmentType(entry.assessment)}
                      </span>
                    </div>

                    {!isActive ? (
                      <button
                        type="button"
                        onClick={async () => {
                          setLoadingAttemptEntryId(entry.id);
                          try {
                            const hydratedAssessment = await ensureAssessmentWithQuestions(entry);
                            const questionCount = hydratedAssessment?.questions?.length || 0;
                            setActiveAttemptEntryId(entry.id);
                            setSubmissionMode(questionCount > 0 ? 'questions' : 'handwritten');
                          } catch {
                            toast.error('Unable to load assessment questions right now.');
                          } finally {
                            setLoadingAttemptEntryId(null);
                          }
                        }}
                        disabled={loadingAttemptEntryId === entry.id}
                        className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
                      >
                        {loadingAttemptEntryId === entry.id ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                        {loadingAttemptEntryId === entry.id ? 'Loading...' : 'Start attempt'}
                      </button>
                    ) : (
                      <div className="border-t border-slate-200 pt-4 space-y-4">
                        <div className="flex flex-wrap gap-2">
                          {hasQuestions && (
                            <button
                              type="button"
                              onClick={() => setSubmissionMode('questions')}
                              className={`px-3 py-1.5 rounded-md text-sm font-medium ${submissionMode === 'questions' ? 'bg-blue-600 text-white' : 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50'}`}
                            >
                              Question responses
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => setSubmissionMode('handwritten')}
                            className={`px-3 py-1.5 rounded-md text-sm font-medium ${submissionMode === 'handwritten' ? 'bg-blue-600 text-white' : 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50'}`}
                          >
                            Handwritten submission
                          </button>
                        </div>

                        {submissionMode === 'questions' && hasQuestions && (
                          <div className="space-y-4">
                            {questions
                              .slice()
                              .sort((a, b) => (a.sequenceIndex || 0) - (b.sequenceIndex || 0))
                              .map((question, index) => {
                                const options: string[] = Array.isArray((question as any).options)
                                  ? (question as any).options as string[]
                                  : [];
                                const questionId = resolveAssessmentQuestionId(question);
                                const currentAnswer = getAnswerDraft(entry.assessmentId, questionId);

                                const qParts: AssessmentQuestionPart[] = Array.isArray((question as any).parts) ? (question as any).parts : [];
                                const isMultipart = qParts.length > 0;

                                return (
                                  <div key={questionId} className="rounded-md border border-slate-200 bg-slate-50 p-4 space-y-3">
                                    <div>
                                      <p className="text-sm font-semibold text-slate-900">
                                        Question {index + 1}
                                        {isMultipart && <span className="ml-2 text-xs font-semibold px-1.5 py-0.5 rounded bg-blue-100 text-blue-700">{qParts.length} parts</span>}
                                      </p>
                                      <QuestionText
                                        text={question.stem}
                                        manifest={question.diagram_manifest}
                                        textClassName="mt-1 text-sm text-slate-700"
                                      />
                                    </div>

                                    {isMultipart ? (
                                      <div className="space-y-3">
                                        {qParts.map((part, pi) => {
                                          const partKey = `${entry.assessmentId}:${questionId}:p${pi}`;
                                          const partAnswer = answerDrafts[partKey] || '';
                                          const partOptions = Array.isArray(part.options) ? part.options : [];
                                          return (
                                            <div key={pi} className="pl-3 border-l-2 border-blue-100 space-y-2">
                                              <p className="text-xs font-bold text-blue-700">
                                                ({String.fromCharCode(97 + pi)}) {part.maxPoints != null ? `· ${part.maxPoints} pt${part.maxPoints !== 1 ? 's' : ''}` : ''}
                                              </p>
                                              <QuestionText
                                                text={part.text}
                                                manifest={part.diagram_manifest}
                                                textClassName="text-sm text-slate-700"
                                              />
                                              {partOptions.length > 0 ? (
                                                <div className="space-y-1.5">
                                                  {partOptions.map((opt) => (
                                                    <label key={`${questionId}-p${pi}-${opt}`} className="flex items-center gap-2 text-sm text-slate-700">
                                                      <input
                                                        type="radio"
                                                        name={`q-${questionId}-p${pi}`}
                                                        checked={partAnswer === opt}
                                                        onChange={() => setAnswerDrafts((prev) => ({ ...prev, [partKey]: opt }))}
                                                        className="h-4 w-4"
                                                      />
                                                      <span>{opt}</span>
                                                    </label>
                                                  ))}
                                                </div>
                                              ) : (
                                                <textarea
                                                  rows={2}
                                                  value={partAnswer}
                                                  onChange={(e) => setAnswerDrafts((prev) => ({ ...prev, [partKey]: e.target.value }))}
                                                  placeholder={`Answer for part (${String.fromCharCode(97 + pi)})`}
                                                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                />
                                              )}
                                            </div>
                                          );
                                        })}
                                      </div>
                                    ) : options.length > 0 ? (
                                      <div className="space-y-2">
                                        {options.map((option) => (
                                          <label key={`${questionId}-${option}`} className="flex items-center gap-2 text-sm text-slate-700">
                                            <input
                                              type="radio"
                                              name={`question-${questionId}`}
                                              checked={currentAnswer === option}
                                              onChange={() => setAnswerDraft(entry.assessmentId, questionId, option)}
                                              className="h-4 w-4"
                                            />
                                            <span>{option}</span>
                                          </label>
                                        ))}
                                      </div>
                                    ) : (
                                      <textarea
                                        rows={3}
                                        value={currentAnswer}
                                        onChange={(event) => setAnswerDraft(entry.assessmentId, questionId, event.target.value)}
                                        placeholder="Type your answer"
                                        className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                      />
                                    )}
                                  </div>
                                );
                              })}

                            <div className="flex justify-end">
                              <button
                                type="button"
                                onClick={() => submitQuestionAnswers(entry)}
                                disabled={submittingEntryId === entry.id}
                                className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
                              >
                                {submittingEntryId === entry.id ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                                Submit answers
                              </button>
                            </div>
                          </div>
                        )}

                        {submissionMode === 'handwritten' && (
                          <div className="space-y-3">
                            <p className="text-sm text-slate-500">
                              Upload photos or scans of your handwritten work. You can select multiple images and arrange them in order before extraction.
                            </p>
                            <button
                              type="button"
                              onClick={() => openHandwrittenPicker(entry)}
                              disabled={submittingEntryId === entry.id}
                              className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
                            >
                              {submittingEntryId === entry.id
                                ? <><Loader2 className="w-4 h-4 animate-spin" /> Submitting…</>
                                : <><ScanLine className="w-4 h-4" /> Upload handwritten work</>
                              }
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </article>
                );
              })}

              {attemptEntries.length === 0 && (
                <section className="p-4 sm:p-6 space-y-4">
                  <div className="rounded-lg border border-slate-200 bg-slate-50 p-8 text-center">
                    <CheckCircle className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
                    <p className="text-lg font-semibold text-slate-800">No pending assessments</p>
                    <p className="text-sm text-slate-500 mt-1">All assessments are already submitted.</p>
                  </div>
                </section>
              )}
            </>
          )}

          {assessmentTab === 'list' && (
            <>
              <div className="rounded-lg border border-slate-200 bg-white p-4">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
                  <div className="w-full lg:max-w-sm">
                    <input
                      value={searchQuery}
                      onChange={(event) => setSearchQuery(event.target.value)}
                      placeholder="Search assessments"
                      className="w-full px-3 py-2 text-sm border border-slate-200 rounded-md"
                    />
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <select
                      value={selectedType}
                      onChange={(event) => setSelectedType(event.target.value)}
                      className="px-3 py-2 text-sm border border-slate-200 rounded-md"
                    >
                      <option value="all">All types</option>
                      {assessmentTypes.map((type) => (
                        <option key={type} value={type}>
                          {type}
                        </option>
                      ))}
                    </select>
                    <select
                      value={selectedStatus}
                      onChange={(event) => setSelectedStatus(event.target.value as StatusFilterKey)}
                      className="px-3 py-2 text-sm border border-slate-200 rounded-md"
                    >
                      <option value="all">All status</option>
                      <option value="pending">Pending</option>
                      <option value="submitted">Submitted</option>
                      <option value="graded">Graded</option>
                      <option value="overdue">Overdue</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="rounded-md border border-slate-200 bg-white p-4 sm:p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-[11px] uppercase tracking-[0.16em] text-slate-500 font-semibold">Overview</p>
                    <p className="mt-1 text-xs text-slate-500">Review progress across your filtered assessments.</p>
                  </div>
                  <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-700">
                    {reviewedPercent}% reviewed
                  </span>
                </div>

                <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="rounded-md border border-slate-200 bg-slate-50 px-3 py-3">
                    <p className="text-[11px] uppercase tracking-wide text-slate-500 font-semibold">Total assessments</p>
                    <p className="mt-1 text-xl font-bold text-slate-900">{entries.length}</p>
                  </div>
                  <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-3">
                    <p className="text-[11px] uppercase tracking-wide text-amber-700 font-semibold">Pending action</p>
                    <p className="mt-1 text-xl font-bold text-amber-800">{pendingCount}</p>
                  </div>
                  <div className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-3">
                    <p className="text-[11px] uppercase tracking-wide text-emerald-700 font-semibold">Reviewed</p>
                    <p className="mt-1 text-xl font-bold text-emerald-800">{reviewedCount}</p>
                  </div>
                </div>

                <div className="mt-4">
                  <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                    <div className="h-2 rounded-full bg-blue-500 transition-all duration-300" style={{ width: `${reviewedPercent}%` }} />
                  </div>
                  <div className="mt-2 flex items-center justify-between text-[11px] text-slate-500">
                    <span>{reviewedCount} reviewed</span>
                    <span>{entries.length} total</span>
                  </div>
                </div>
              </div>

              <div className="rounded-lg border border-slate-200 bg-white overflow-x-auto">
                <table className="w-full min-w-[920px]">
                  <thead className="bg-slate-50 text-slate-700 text-xs uppercase tracking-wide">
                    <tr>
                      <th className="text-left font-semibold px-4 py-3">Assessment</th>
                      <th className="text-left font-semibold px-4 py-3">Status</th>
                      <th className="text-left font-semibold px-4 py-3">Due Date</th>
                      <th className="text-left font-semibold px-4 py-3">Type</th>
                      <th className="text-right font-semibold px-4 py-3">Max Score</th>
                      <th className="text-right font-semibold px-4 py-3">Score %</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedEntries.length > 0 ? (
                      paginatedEntries.map((entry) => {
                        const dueDate = asDate(entry.dueTime);
                        const scorePercent =
                          typeof entry.result?.actualMark === 'number' &&
                          typeof entry.assessment?.maxScore === 'number' &&
                          entry.assessment.maxScore > 0
                            ? Math.round((entry.result.actualMark / entry.assessment.maxScore) * 100)
                            : null;

                        return (
                          <tr
                            key={entry.id}
                            onClick={() => {
                              setSelectedReviewEntryId(entry.id);
                              setAssessmentTab('review');
                            }}
                            className="border-t border-slate-200 text-sm text-slate-800 hover:bg-blue-50/40 cursor-pointer"
                          >
                            <td className="px-4 py-3">
                              <p className="font-semibold text-slate-900 truncate max-w-[320px]">{entry.assessmentName}</p>
                              <p className="text-xs text-slate-500 truncate max-w-[320px]">
                                {entry.assessment?.description || 'Assessment available for review.'}
                              </p>
                            </td>
                            <td className="px-4 py-3">
                              <span className={`px-2 py-1 rounded-full text-xs font-medium inline-flex items-center gap-1 ${getStatusPillClass(entry.status)}`}>
                                {getStatusIcon(entry.status)}
                                {getStatusLabel(entry.status)}
                              </span>
                            </td>
                            <td className="px-4 py-3">{dueDate ? dueDate.toLocaleDateString() : 'Not set'}</td>
                            <td className="px-4 py-3">{formatAssessmentType(entry.assessment)}</td>
                            <td className="px-4 py-3 text-right">{Math.round(Number(entry.assessment?.maxScore || 0)) || 'N/A'}</td>
                            <td className="px-4 py-3 text-right font-semibold">
                              {scorePercent !== null ? (
                                <span className="text-emerald-700">{scorePercent}%</span>
                              ) : (
                                <span className="text-slate-400">-</span>
                              )}
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr className="border-t border-slate-200">
                        <td colSpan={6} className="px-4 py-10 text-center">
                          <FileText className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                          <p className="text-sm font-semibold text-slate-700">No Assessments</p>
                          <p className="text-xs text-slate-500 mt-1">No assessments match the selected filters.</p>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
              <TablePagination
                currentPage={currentPage}
                pageSize={pageSize}
                totalItems={totalItems}
                totalPages={totalPages}
                rangeStart={rangeStart}
                rangeEnd={rangeEnd}
                onPageChange={setCurrentPage}
                onPageSizeChange={setPageSize}
              />
            </>
          )}

          {assessmentTab === 'review' && (
            <>
              {!selectedReviewEntry ? (
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-8 text-center">
                  <Eye className="w-12 h-12 text-slate-400 mx-auto mb-3" />
                  <h3 className="text-lg font-semibold text-slate-700">Select an assessment to review</h3>
                  <p className="text-sm text-slate-500">Open Assessment List and pick an assessment.</p>
                </div>
              ) : (
                <>
                  <div className="rounded-lg border border-slate-200 bg-white p-5">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <h3 className="text-2xl font-bold text-slate-900">{selectedReviewEntry.assessmentName}</h3>
                        <p className="mt-1 text-sm text-slate-600">
                          {selectedAssessmentDetail?.description || selectedReviewEntry.assessment?.description || 'Assessment review detail'}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setAssessmentTab('list')}
                        className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                      >
                        Back to list
                      </button>
                    </div>

                  <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
  <div className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2">
    <p className="text-xs text-slate-500">Outcome</p>
    <p className="text-base font-semibold text-slate-800">
      {activeResult?.status === 'Released'
        ? `${activeResult.actualMark} / ${selectedAssessmentDetail?.totalPoints || selectedReviewEntry?.assessment?.maxScore || 0}`
        : 'Grading in progress'}
    </p>
  </div>
  <div className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2">
    <p className="text-xs text-slate-500">Grade</p>
    <p className="text-base font-semibold text-slate-800">
      {activeResult?.status === 'Released' ? (activeResult.percentage >= 50 ? 'Pass' : 'Fail') : 'Pending'}
    </p>
  </div>
  <div className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2">
    <p className="text-xs text-slate-500">Status</p>
    <p className="text-base font-semibold text-slate-800">
      {activeResult?.status || 'Submitted'}
    </p>
  </div>
</div>
                    {loadingAssessmentDetail && (
                      <p className="mt-3 text-xs text-slate-500">Loading assessment detail...</p>
                    )}
                  </div>

                  <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                    <div className="rounded-lg border border-slate-200 bg-white p-5 space-y-4">
                      <h4 className="text-lg font-semibold text-slate-900">My Attempt</h4>

                      {!selectedReviewEntry.submission ? (
                        <p className="text-sm text-slate-500">No submission has been made for this assessment yet.</p>
                      ) : (
                        <>
                          <div className="text-sm text-slate-600 space-y-1">
                            <p>Submitted: {asDate(selectedReviewEntry.submission.submittedAt)?.toLocaleString() || 'Unknown'}</p>
                            <p>Type: {selectedReviewEntry.submission.submissionType || 'manual'}</p>
                            {selectedReviewEntry.submission.originalFilename ? (
                              <p>File: {selectedReviewEntry.submission.originalFilename}</p>
                            ) : null}
                          </div>

                          {loadingReviewDetail ? (
                            <p className="text-sm text-slate-500">Loading submission detail...</p>
                          ) : reviewQuestions.length > 0 ? (
                            <div className="space-y-3">
                              {reviewQuestions.map((question: SubmissionReviewQuestionDetail, index: number) => (
                                <article
                                  key={question.assessmentQuestionId || `${question.order || index}-${index}`}
                                  className="rounded-md border border-slate-200 bg-slate-50 p-3 space-y-2"
                                >
                                  <p className="text-sm font-semibold text-slate-900">Question {question.order || index + 1}</p>
                                  <p className="text-sm text-slate-700">{question.prompt || 'Prompt not available.'}</p>
                                  {question.partAnswers && question.partAnswers.length > 0 ? (
                                    <div className="space-y-1.5">
                                      {question.partAnswers.map((partAns, pi) => (
                                        <div key={pi} className="rounded-md border border-slate-200 bg-white p-2">
                                          <p className="text-[10px] font-bold text-blue-600 mb-0.5">({String.fromCharCode(97 + pi)})</p>
                                          <p className="text-sm text-slate-700">{partAns || <span className="text-slate-400">No answer</span>}</p>
                                        </div>
                                      ))}
                                    </div>
                                  ) : (
                                    <div className="rounded-md border border-slate-200 bg-white p-2 text-sm text-slate-700">
                                      {question.studentAnswer ? (
                                        <pre className="whitespace-pre-wrap break-words font-sans">{question.studentAnswer}</pre>
                                      ) : (
                                        <p className="text-slate-500">No answer submitted for this question.</p>
                                      )}
                                    </div>
                                  )}
                                </article>
                              ))}
                            </div>
                          ) : (
                            <div className="rounded-md border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700">
                              Per-question attempt detail is not available for this submission.
                            </div>
                          )}
                        </>
                      )}
                    </div>

<div className="rounded-lg border border-slate-200 bg-white p-5 space-y-3">
  <h4 className="text-lg font-semibold text-slate-900">Feedback and Marking</h4>

  {loadingReviewDetail ? (
    <p className="text-sm text-slate-500">Loading feedback...</p>
  ) : (activeResult?.status === 'Released') && reviewQuestions.length > 0 ? ( // <-- CHANGE THIS LINE
    <div className="space-y-3">
      {reviewQuestions.map((question: SubmissionReviewQuestionDetail, index: number) => (
        <article key={`${question.assessmentQuestionId}-feedback`} className="rounded-md border border-slate-200 bg-slate-50 p-3 space-y-2">
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm font-semibold text-slate-900">Question {question.order || index + 1}</p>
            {/* Show marks because we confirmed it is Released */}
            <p className="text-xs font-semibold text-slate-600">
              {formatMark(question.awardedMarks)} / {formatMark(question.maxMarks)}
            </p>
          </div>

                              {question.expectedMarkingPoints && question.expectedMarkingPoints.length > 0 && (
                                <div className="rounded-md border border-slate-200 bg-white p-2">
                                  <p className="text-xs uppercase tracking-wide text-slate-500 font-semibold">Expected Answer</p>
                                  <ul className="mt-1 list-disc pl-5 space-y-1 text-sm text-slate-700">
                                    {question.expectedMarkingPoints.map((point: string, pointIndex: number) => (
                                      <li key={`${question.assessmentQuestionId || index}-${pointIndex}`}>{point}</li>
                                    ))}
                                  </ul>
                                </div>
                              )}

                              {question.feedback && (
                                <div className="rounded-md border border-blue-200 bg-blue-50 p-2 text-sm text-blue-900">
                                  <p className="font-semibold">Feedback</p>
                                  <p className="mt-1">{question.feedback}</p>
                                </div>
                              )}
                            </article>
                          ))}
                        </div>
                      ) : (
<div className="rounded-md border border-slate-200 bg-slate-50 p-4 text-center">
      <Clock className="w-8 h-8 text-slate-400 mx-auto mb-2" />
      <p className="text-sm text-slate-500 font-medium">Feedback will appear once graded.</p>
    </div>
                      )}

                      {activeResult?.status === 'Released' && (
                        <>
                          <div className="rounded-md border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700 space-y-1">
                            <p>
                              Max score: <span className="font-semibold">{activeResult.assessment?.totalPoints ?? selectedReviewEntry.assessment?.maxScore ?? 'N/A'}</span>
                            </p>
                            <p>
                              Actual mark: <span className="font-semibold">{activeResult.actualMark ?? 'N/A'}</span>
                            </p>
                            {activeResult.grade && (
                              <p>Grade: <span className="font-semibold">{activeResult.grade}</span></p>
                            )}
                          </div>
                          {activeResult.teacherFeedback && (
                            <div className="rounded-md border border-blue-200 bg-blue-50 p-3 text-sm text-blue-900">
                              <p className="font-semibold">Overall Feedback</p>
                              <p className="mt-1">{activeResult.teacherFeedback}</p>
                            </div>
                          )}
                        </>
                      )}

                      {onOpenTutor && activeResult?.status === 'Released' && (
                        <button
                          type="button"
                          onClick={() =>
                            onOpenTutor(
                              `Review my performance on "${selectedReviewEntry.assessmentName}". Feedback: ${activeResult?.teacherFeedback || 'No feedback provided'}. Help me fix the gaps.`
                            )
                          }
                          className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-700"
                        >
                          Review with AI Coach
                        </button>
                      )}
                    </div>
                  </div>
                </>
              )}
            </>
          )}
        </section>
      </div>

      {/* Hidden file input for handwritten image selection */}
      <input
        ref={handwrittenInputRef}
        type="file"
        accept="image/*,application/pdf"
        multiple
        className="hidden"
        onChange={handleHandwrittenFiles}
      />

      {/* OCR overlay — shown after files are selected and order is confirmed */}
      {ocrEntry && ocrInitialFiles.length > 0 && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 300, background: 'rgba(15,23,42,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div style={{ width: '100%', maxWidth: 1400, height: 'calc(100vh - 80px)' }}>
            <OcrReviewComponent
              mode="student-submit"
              assessmentId={ocrEntry.assessmentId}
              studentId={studentId}
              initialFiles={ocrInitialFiles}
              questions={ocrEntry.assessment?.questions?.map(q => ({
                id: resolveAssessmentQuestionId(q),
                stem: q.stem,
                parts: q.parts?.map((p, pi) => ({ id: p.id || String(pi), text: p.text })),
              }))}
              onSubmit={async ({ fullText, answers }: CompiledSubmission) => {
                const entry = ocrEntry;
                console.log('[OCR submit] answers count:', answers?.length ?? 0, '| fullText length:', fullText?.length);
                setOcrEntry(null);
                setOcrInitialFiles([]);
                setSubmittingEntryId(entry.id);
                try {
                  if (answers && answers.length > 0) {
                    await submissionService.submitAnswers({
                      assessmentId:   entry.assessmentId,
                      studentId,
                      submissionType: 'text',
                      answers: answers as any,
                    });
                  } else {
                    await submissionService.submitAssignment({
                      assessmentId:   entry.assessmentId,
                      studentId,
                      submissionType: 'text',
                      textContent:    fullText,
                    });
                  }
                  toast.success('Handwritten submission sent successfully.');
                  setActiveAttemptEntryId(null);
                  await fetchWorkspace({ forceRefresh: true });
                } catch (err: any) {
                  toast.error(err?.message || 'Failed to submit.');
                } finally {
                  setSubmittingEntryId(null);
                }
              }}
              onCancel={() => { setOcrEntry(null); setOcrInitialFiles([]); }}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentAssignments;
