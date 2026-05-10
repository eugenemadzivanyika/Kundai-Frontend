import React, { useCallback, useEffect, useRef, useState } from 'react';
import { X, Loader2, AlertTriangle, RefreshCw, Search } from 'lucide-react';
import { toast } from 'sonner';

import { HandwritingFilePicker } from './HandwritingFilePicker';
import OcrReviewComponent from '../ocr/OcrReviewComponent';
import SubmissionReviewModal from './SubmissionReviewModal';

import { assessmentService, studentService } from '../../services/api';
import { submitHandwrittenAnswers } from '../../services/handwritingService';
import { aiService } from '../../services/aiService';
import type { OcrQuestion, CompiledSubmission } from '../ocr/ocr.types';
import type { Student } from '../../types';

// ── Types ──────────────────────────────────────────────────────────────────

export interface HandwritingMarkModalProps {
  isOpen: boolean;
  onClose: () => void;
  assessmentId: string;
  studentId?: string;
  submissionId?: string;
  onMarkComplete?: () => void;
}

type MarkPhase = 'selecting' | 'picking' | 'reviewing' | 'grading' | 'confirming';

// ── Student selector ───────────────────────────────────────────────────────

const StudentSelector: React.FC<{
  onSelect: (student: Student) => void;
  onCancel: () => void;
}> = ({ onSelect, onCancel }) => {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading]   = useState(true);
  const [search, setSearch]     = useState('');

  useEffect(() => {
    setLoading(true);
    studentService.getStudents()
      .then(setStudents)
      .catch(() => toast.error('Failed to load students'))
      .finally(() => setLoading(false));
  }, []);

  const filtered = students.filter(s => {
    const q = search.toLowerCase();
    return (
      s.firstName.toLowerCase().includes(q) ||
      s.lastName.toLowerCase().includes(q) ||
      s.id?.toLowerCase().includes(q)
    );
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', background: 'white', minHeight: 0, flex: 1 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 20px', borderBottom: '1px solid #f1f5f9', flexShrink: 0 }}>
        <div>
          <div style={{ fontSize: 14, fontWeight: 800, color: '#0f172a' }}>Select Student</div>
          <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>Click a student to continue to file upload</div>
        </div>
        <button onClick={onCancel} style={{ color: '#94a3b8', background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}>
          <X size={16} />
        </button>
      </div>

      {/* Search */}
      <div style={{ padding: '10px 20px', borderBottom: '1px solid #f1f5f9', flexShrink: 0 }}>
        <div style={{ position: 'relative' }}>
          <Search size={13} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', pointerEvents: 'none' }} />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by name or ID…"
            style={{ width: '100%', borderRadius: 8, border: '1.5px solid #e2e8f0', padding: '7px 10px 7px 30px', fontSize: 13, color: '#334155', outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit' }}
          />
        </div>
      </div>

      {/* List — scrollable */}
      <div style={{ flex: 1, overflowY: 'auto', maxHeight: 380 }}>
        {loading ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '40px 0', color: '#94a3b8' }}>
            <Loader2 size={18} style={{ animation: 'spin 0.8s linear infinite', color: '#3b82f6' }} />
            <span style={{ fontSize: 12 }}>Loading students…</span>
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 0', color: '#94a3b8', fontSize: 12 }}>
            No students match your search
          </div>
        ) : (
          filtered.map(student => (
            <button
              key={student._id}
              onClick={() => onSelect(student)}
              style={{
                width: '100%', display: 'flex', alignItems: 'center', gap: 12,
                padding: '10px 20px', background: 'none', border: 'none',
                borderBottom: '1px solid #f8fafc', cursor: 'pointer',
                fontFamily: 'inherit', textAlign: 'left', transition: 'background 0.1s',
              }}
              onMouseEnter={e => (e.currentTarget.style.background = '#f8fafc')}
              onMouseLeave={e => (e.currentTarget.style.background = 'none')}
            >
              <div style={{ width: 34, height: 34, borderRadius: 8, background: '#eff6ff', border: '1.5px solid #bfdbfe', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 800, color: '#2563eb', flexShrink: 0 }}>
                {student.firstName[0]}{student.lastName[0]}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#0f172a' }}>
                  {student.firstName} {student.lastName}
                </div>
                <div style={{ fontSize: 10, color: '#94a3b8', fontFamily: 'monospace', marginTop: 1 }}>{student.id}</div>
              </div>
              <div style={{ fontSize: 11, color: '#94a3b8', flexShrink: 0 }}>→</div>
            </button>
          ))
        )}
      </div>

      {/* Footer */}
      <div style={{ padding: '10px 20px', borderTop: '1px solid #f1f5f9', flexShrink: 0, display: 'flex', justifyContent: 'flex-end' }}>
        <button
          onClick={onCancel}
          style={{ padding: '7px 16px', borderRadius: 8, border: '1.5px solid #e2e8f0', background: 'white', fontSize: 12, fontWeight: 600, color: '#475569', cursor: 'pointer', fontFamily: 'inherit' }}
        >
          Cancel
        </button>
      </div>
    </div>
  );
};

// ── Main Modal ─────────────────────────────────────────────────────────────

const HandwritingMarkModal: React.FC<HandwritingMarkModalProps> = ({
  isOpen,
  onClose,
  assessmentId,
  studentId: propStudentId,
  onMarkComplete,
}) => {
  const [phase, setPhase]         = useState<MarkPhase>(propStudentId ? 'picking' : 'selecting');
  const [studentId, setStudentId] = useState<string | null>(propStudentId ?? null);
  const [pickedFiles, setPickedFiles]   = useState<File[] | null>(null);
  const [questions, setQuestions]       = useState<OcrQuestion[]>([]);
  const [resultId, setResultId]         = useState<string | null>(null);
  const [gradeError, setGradeError]     = useState<string | null>(null);

  // Fetch assessment questions on open
  const fetchedRef = useRef(false);
  useEffect(() => {
    if (!isOpen || fetchedRef.current) return;
    fetchedRef.current = true;
    assessmentService.getAssessmentWithQuestions(assessmentId)
      .then(assessment => {
        const rawQuestions: any[] = Array.isArray(assessment.questions)
          ? (assessment.questions as any[])
          : [];
        const qs: OcrQuestion[] = rawQuestions.map((q: any) => ({
          id:    q._id,
          stem:  q.text ?? q.stem ?? '',
          parts: q.parts?.length
            ? q.parts.map((p: any) => ({ id: p._id, text: p.text }))
            : undefined,
        }));
        setQuestions(qs);
      })
      .catch(() => {});
  }, [isOpen, assessmentId]);

  // Reset when closed
  useEffect(() => {
    if (!isOpen) {
      setPhase(propStudentId ? 'picking' : 'selecting');
      setStudentId(propStudentId ?? null);
      setPickedFiles(null);
      setResultId(null);
      setGradeError(null);
      fetchedRef.current = false;
    }
  }, [isOpen, propStudentId]);

  const handleStudentSelected = useCallback((student: Student) => {
    setStudentId(student._id);
    setPhase('picking');
  }, []);

  const handleFilesSelected = useCallback((files: File[]) => {
    setPickedFiles(files);
    setPhase('reviewing');
  }, []);

  // Called by OcrReviewComponent when teacher clicks "Mark" in teacher-mark mode
  const handleOcrSubmit = useCallback(async (data: CompiledSubmission) => {
    if (!studentId) return;
    // POST to create/upsert the submission
    const result = await submitHandwrittenAnswers(
      assessmentId,
      studentId,
      data.answers ?? []
    );
    const submissionId = result.submissionId;

    // Transition to grading spinner
    setPhase('grading');

    // Call ASAG
    setGradeError(null);
    try {
      const gradeResult = await aiService.suggestAIGrade(submissionId);
      setResultId(gradeResult.resultId);
      setPhase('confirming');
    } catch {
      setGradeError('AI grading failed. Please retry.');
    }
  }, [assessmentId, studentId]);

  const handleRetryGrading = async () => {
    // handleOcrSubmit already set phase to 'grading' then failed
    // We need the submissionId — go back to reviewing so teacher can re-trigger
    setGradeError(null);
    setPhase('reviewing');
  };

  const handleMarkComplete = useCallback(() => {
    onMarkComplete?.();
    onClose();
  }, [onMarkComplete, onClose]);

  if (!isOpen) return null;

  // ── Confirming phase: full-screen SubmissionReviewModal ──────────────────

  if (phase === 'confirming' && resultId) {
    return (
      <div style={{ position: 'fixed', inset: 0, zIndex: 60, background: '#f8fafc', display: 'flex', flexDirection: 'column' }}>
        <SubmissionReviewModal
          isOpen={true}
          resultId={resultId}
          onClose={handleMarkComplete}
          onReviewComplete={handleMarkComplete}
        />
      </div>
    );
  }

  // ── All other phases: standard modal overlay ─────────────────────────────

  return (
    <div
      style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'stretch', justifyContent: 'center', background: 'rgba(15,23,42,0.5)', backdropFilter: 'blur(2px)' }}
      onClick={() => { if (phase !== 'reviewing') onClose(); }}
    >
      <div
        style={{
          background:    'white',
          borderRadius:  phase === 'reviewing' ? 0 : 16,
          boxShadow:     '0 20px 60px rgba(0,0,0,0.18)',
          display:       'flex',
          flexDirection: 'column',
          overflow:      'hidden',
          width:         phase === 'reviewing' ? '100%' : 560,
          maxWidth:      phase === 'reviewing' ? '100%' : 560,
          height:        phase === 'reviewing' ? '100%' : phase === 'picking' ? 560 : undefined,
          maxHeight:     phase === 'reviewing' ? '100%' : '88vh',
          margin:        phase === 'reviewing' ? 0 : 'auto',
          alignSelf:     phase === 'reviewing' ? 'stretch' : 'center',
        }}
        onClick={e => e.stopPropagation()}
      >

        {/* ── Selecting ── */}
        {phase === 'selecting' && (
          <StudentSelector
            onSelect={handleStudentSelected}
            onCancel={onClose}
          />
        )}

        {/* ── Picking ── */}
        {phase === 'picking' && (
          <HandwritingFilePicker
            onFilesSelected={handleFilesSelected}
            onCancel={onClose}
          />
        )}

        {/* ── Reviewing ── */}
        {phase === 'reviewing' && pickedFiles && (
          <OcrReviewComponent
            mode="teacher-mark"
            assessmentId={assessmentId}
            studentId={studentId ?? undefined}
            questions={questions.length ? questions : undefined}
            initialFiles={pickedFiles}
            onSubmit={handleOcrSubmit}
            onCancel={() => setPhase('picking')}
          />
        )}

        {/* ── Grading spinner ── */}
        {phase === 'grading' && (
          <div className="flex flex-col items-center justify-center gap-4 py-16 px-8 flex-1">
            {gradeError ? (
              <>
                <div className="w-14 h-14 rounded-2xl bg-red-50 flex items-center justify-center">
                  <AlertTriangle size={24} className="text-red-500" />
                </div>
                <div className="text-center">
                  <p className="text-sm font-bold text-slate-800 mb-1">Grading failed</p>
                  <p className="text-[11px] text-slate-500">{gradeError}</p>
                </div>
                <button
                  onClick={handleRetryGrading}
                  className="flex items-center gap-1.5 px-4 py-2 text-xs font-extrabold text-white rounded-lg bg-blue-500 hover:bg-blue-600 transition-colors"
                >
                  <RefreshCw size={12} /> Go Back & Retry
                </button>
              </>
            ) : (
              <>
                <div className="w-14 h-14 rounded-2xl bg-blue-50 flex items-center justify-center">
                  <Loader2 size={28} className="animate-spin text-blue-500" />
                </div>
                <div className="text-center">
                  <p className="text-sm font-extrabold text-slate-800 mb-1">AI is marking…</p>
                  <p className="text-[11px] text-slate-400">
                    Running chain-of-thought grading on the submitted answers
                  </p>
                </div>
              </>
            )}
          </div>
        )}

      </div>
    </div>
  );
};

export default HandwritingMarkModal;
