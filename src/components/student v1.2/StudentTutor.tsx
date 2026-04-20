import React, { useEffect, useRef, useState } from 'react';
import {
  AlertCircle,
  BookOpen,
  CheckCircle,
  ChevronRight,
  Loader2,
  Paperclip,
  Send,
  Sparkles,
  X,
  Zap,
} from 'lucide-react';
import { aiTutorService, AiTutorMessage, AiTutorSession } from '../../services/aiTutorService';

// ─── Types ────────────────────────────────────────────────────────────────────

/** Minimal step shape we need — matches what StudentPlanView passes */
export type TutorStep = {
  title: string;
  content?: string;
  type?: string;
  order?: number;
  exitCheckpoint?: {
    expectedLogic?: string;
    isPassed?: boolean;
  };
};

type StudentTutorProps = {
  studentId: string;
  selectedSubjectId: string;
  /** The step the student is currently working on */
  activeStep: TutorStep | null;
  /** All steps in the plan — used to render the mini progress trail */
  allSteps?: TutorStep[];
  /** Index of the currently active step in allSteps */
  activeStepIndex?: number;
  prefillMessage?: string;
  onPrefillApplied?: () => void;
  /** Called when the AI confirms a checkpoint is passed */
  onCheckpointPassed?: () => void;
};

type CoachMode = 'socratic' | 'hint';

type AttachedImage = {
  file: File;
  previewUrl: string;
  base64: string;
};

const SHORTCUT_CHIPS = [
  { label: 'Give me a hint',        kind: 'hint'      as const },
  { label: 'Challenge my reasoning', kind: 'challenge' as const },
  { label: 'Practice question',      kind: 'practice'  as const },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

const fileToBase64 = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve((reader.result as string).split(',')[1]);
    reader.onerror = () => reject(new Error('File read failed'));
    reader.readAsDataURL(file);
  });

// ─── Step progress trail ──────────────────────────────────────────────────────

const StepTrail: React.FC<{
  steps: TutorStep[];
  activeIndex: number;
}> = ({ steps, activeIndex }) => {
  if (steps.length === 0) return null;

  // Show at most 5 nodes: up to 2 before, active, up to 2 after
  const start  = Math.max(0, activeIndex - 2);
  const end    = Math.min(steps.length - 1, activeIndex + 2);
  const visible = steps.slice(start, end + 1);

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 4,
      padding: '10px 18px', borderBottom: '0.5px solid #e2e8f0',
      background: '#f8fafc', flexShrink: 0, overflowX: 'auto',
    }}>
      {start > 0 && (
        <span style={{ fontSize: 10, color: '#94a3b8', whiteSpace: 'nowrap' }}>
          +{start} before
        </span>
      )}
      {visible.map((step, i) => {
        const globalIndex = start + i;
        const isActive    = globalIndex === activeIndex;
        const isDone      = step.exitCheckpoint?.isPassed || globalIndex < activeIndex;

        return (
          <React.Fragment key={globalIndex}>
            {i > 0 && (
              <ChevronRight style={{ width: 12, height: 12, color: '#cbd5e1', flexShrink: 0 }} />
            )}
            <div style={{
              display: 'flex', alignItems: 'center', gap: 5, flexShrink: 0,
              padding: '3px 8px', borderRadius: 99,
              background: isActive ? '#eff6ff' : 'transparent',
              border: isActive ? '0.5px solid #bfdbfe' : '0.5px solid transparent',
            }}>
              <div style={{
                width: 18, height: 18, borderRadius: '50%', flexShrink: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: isDone ? '#d1fae5' : isActive ? '#3b82f6' : '#e2e8f0',
                color:      isDone ? '#059669' : isActive ? '#fff'    : '#94a3b8',
                fontSize: 9, fontWeight: 700,
              }}>
                {isDone
                  ? <CheckCircle style={{ width: 11, height: 11 }} />
                  : globalIndex + 1}
              </div>
              <span style={{
                fontSize: 11, fontWeight: isActive ? 600 : 400,
                color: isActive ? '#1d4ed8' : '#64748b',
                maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              }}>
                {step.title}
              </span>
            </div>
          </React.Fragment>
        );
      })}
      {end < steps.length - 1 && (
        <>
          <ChevronRight style={{ width: 12, height: 12, color: '#cbd5e1', flexShrink: 0 }} />
          <span style={{ fontSize: 10, color: '#94a3b8', whiteSpace: 'nowrap' }}>
            +{steps.length - 1 - end} more
          </span>
        </>
      )}
    </div>
  );
};

// ─── Message bubble ───────────────────────────────────────────────────────────

const MessageBubble: React.FC<{ message: AiTutorMessage }> = ({ message }) => {
  const isStudent = message.senderRole === 'student';
  const isSystem  = message.senderRole === 'system';

  return (
    <div style={{ display: 'flex', justifyContent: isStudent ? 'flex-end' : 'flex-start', alignItems: 'flex-end', gap: 8 }}>
      {!isStudent && (
        <div style={{
          width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
          background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Sparkles style={{ width: 13, height: 13, color: '#3b82f6' }} />
        </div>
      )}

      <div style={{ maxWidth: '82%' }}>
        {!isStudent && !isSystem && (
          <p style={{
            fontSize: 10, fontWeight: 500, textTransform: 'uppercase',
            letterSpacing: '0.05em', color: '#94a3b8', margin: '0 0 3px',
            display: 'flex', alignItems: 'center', gap: 3,
          }}>
            <Sparkles style={{ width: 10, height: 10 }} /> Tutor guidance
          </p>
        )}

        {/* Checkpoint-passed badge */}
        {message.checkpointPassed && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 5,
            background: '#d1fae5', border: '0.5px solid #6ee7b7',
            borderRadius: 8, padding: '4px 10px', marginBottom: 4, width: 'fit-content',
          }}>
            <CheckCircle style={{ width: 12, height: 12, color: '#059669' }} />
            <span style={{ fontSize: 11, fontWeight: 600, color: '#065f46' }}>
              Step checkpoint passed!
            </span>
          </div>
        )}

        {/* Image attachment */}
        {message.imageUrl && (
          <div style={{
            borderRadius: isStudent ? '12px 12px 3px 12px' : '12px 12px 12px 3px',
            overflow: 'hidden', border: '0.5px solid #e2e8f0',
            marginBottom: message.content ? 4 : 0, maxWidth: 220,
          }}>
            <img src={message.imageUrl} alt="Student working" style={{ width: '100%', display: 'block' }} />
            <div style={{
              fontSize: 11, color: '#64748b', padding: '5px 9px',
              background: '#f8fafc', display: 'flex', alignItems: 'center', gap: 4,
            }}>
              <Paperclip style={{ width: 11, height: 11 }} />
              Photo of working
            </div>
          </div>
        )}

        {/* Text content */}
        {(message.content || message.transcript) && (
          <div style={{
            padding: '9px 13px', fontSize: 14, lineHeight: 1.65,
            borderRadius: isStudent ? '14px 14px 3px 14px' : '14px 14px 14px 3px',
            background: isStudent ? '#eff6ff' : isSystem ? '#fffbeb' : '#fff',
            color:      isStudent ? '#1d4ed8' : isSystem ? '#92400e'  : '#1e293b',
            border:     isStudent ? 'none' : `0.5px solid ${isSystem ? '#fde68a' : '#e2e8f0'}`,
          }}>
            <p style={{ margin: 0, whiteSpace: 'pre-wrap' }}>
              {message.content || message.transcript}
            </p>
            <p style={{ margin: '4px 0 0', fontSize: 11, color: isStudent ? '#93c5fd' : '#94a3b8', opacity: 0.85 }}>
              {new Date(message.ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

// ─── Typing indicator ─────────────────────────────────────────────────────────

const TypingIndicator: React.FC = () => (
  <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8 }}>
    <div style={{
      width: 28, height: 28, borderRadius: '50%', background: '#eff6ff',
      display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
    }}>
      <Sparkles style={{ width: 13, height: 13, color: '#3b82f6' }} />
    </div>
    <div style={{
      padding: '10px 14px', borderRadius: '14px 14px 14px 3px',
      border: '0.5px solid #e2e8f0', background: '#fff',
      display: 'flex', gap: 4, alignItems: 'center',
    }}>
      {[0, 0.15, 0.3].map((delay, i) => (
        <span key={i} style={{
          width: 6, height: 6, borderRadius: '50%', background: '#cbd5e1',
          display: 'inline-block',
          animation: 'tutorBounce 0.9s infinite',
          animationDelay: `${delay}s`,
        }} />
      ))}
    </div>
  </div>
);

// ─── Main component ───────────────────────────────────────────────────────────

const StudentTutor: React.FC<StudentTutorProps> = ({
  studentId,
  selectedSubjectId,
  activeStep,
  allSteps = [],
  activeStepIndex = 0,
  prefillMessage,
  onPrefillApplied,
  onCheckpointPassed,
}) => {
  const [session,     setSession]     = useState<AiTutorSession | null>(null);
  const [messages,    setMessages]    = useState<AiTutorMessage[]>([]);
  const [loading,     setLoading]     = useState(false);
  const [sending,     setSending]     = useState(false);
  const [error,       setError]       = useState<string | null>(null);
  const [coachMode,   setCoachMode]   = useState<CoachMode>('socratic');
  const [messageText, setMessageText] = useState('');
  const [attachment,  setAttachment]  = useState<AttachedImage | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef    = useRef<HTMLTextAreaElement>(null);
  const fileInputRef   = useRef<HTMLInputElement>(null);

  // ── Session init ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (!studentId || !selectedSubjectId || selectedSubjectId === 'all') {
      setSession(null);
      setMessages([]);
      return;
    }
    let active = true;
    setLoading(true);
    setError(null);

    (async () => {
      const s = await aiTutorService.getOrCreateSession(studentId, selectedSubjectId);
      if (!active) return;
      setSession(s);
      const msgs = await aiTutorService.listMessages(s.id);
      if (!active) return;
      setMessages(msgs);
    })()
      .catch((err: any) => { if (active) setError(err?.message || 'Failed to load session.'); })
      .finally(() => { if (active) setLoading(false); });

    return () => { active = false; };
  }, [studentId, selectedSubjectId]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages, sending]);

  // Apply prefill when step changes
  useEffect(() => {
    if (!prefillMessage) return;
    setMessageText((prev) => (prev.trim() ? prev : prefillMessage));
    onPrefillApplied?.();
    setTimeout(() => textareaRef.current?.focus(), 0);
  }, [prefillMessage]);

  // ── Handlers ──────────────────────────────────────────────────────────────

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMessageText(e.target.value);
    e.target.style.height = 'auto';
    e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const base64 = await fileToBase64(file);
      setAttachment({ file, previewUrl: URL.createObjectURL(file), base64 });
      textareaRef.current?.focus();
    } catch {
      setError('Could not read image file.');
    }
    e.target.value = '';
  };

  const removeAttachment = () => {
    if (attachment) URL.revokeObjectURL(attachment.previewUrl);
    setAttachment(null);
  };

  const buildShortcutPrompt = (kind: 'hint' | 'challenge' | 'practice') => {
    const focus = activeStep?.title || 'this topic';
    if (kind === 'hint')      return `Give me one hint for "${focus}". Ask a guiding question — don't give the full answer.`;
    if (kind === 'challenge') return `Challenge my reasoning on "${focus}". Point out any gaps and ask me to defend each step.`;
    return `Give me one practice question on "${focus}". Let me attempt it first, then guide me with hints only.`;
  };

  const applyShortcut = (kind: 'hint' | 'challenge' | 'practice') => {
    setMessageText(buildShortcutPrompt(kind));
    setTimeout(() => textareaRef.current?.focus(), 0);
  };

  const handleSend = async () => {
    const text = messageText.trim();
    if (!session || sending || (!text && !attachment)) return;

    setSending(true);
    setError(null);

    try {
      const response = await aiTutorService.sendMessage({
        sessionId:   session.id,
        senderId:    studentId,
        senderRole:  'student',
        contentType: 'text',
        content:     text || undefined,
        imageBase64: attachment?.base64,
        contentPayload: {
          coachingMode:      coachMode,
          noDirectSolutions: true,
          expectation:       'Guide with probing questions, hints, and reflective prompts.',
          selectedPlanStep:  activeStep?.title || null,
        },
        autoReply: true,
      });

      // If checkpoint was passed, notify the parent so the sidebar can update
      if (response.checkpointPassed) {
        onCheckpointPassed?.();
      }

      setMessageText('');
      removeAttachment();
      if (textareaRef.current) textareaRef.current.style.height = 'auto';

      const msgs = await aiTutorService.listMessages(session.id);
      setMessages(msgs);
    } catch (err: any) {
      setError(err?.message || 'Failed to send message.');
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  const canSend = (messageText.trim().length > 0 || !!attachment) && !sending;

  // ── Loading skeleton ────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: 12 }}>
        {[80, 55, 90, 60].map((w, i) => (
          <div key={i} style={{
            height: 14, width: `${w}%`, borderRadius: 6,
            background: '#f1f5f9', animation: 'tutorPulse 1.5s infinite',
          }} />
        ))}
      </div>
    );
  }

  // ── Main layout ─────────────────────────────────────────────────────────────
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <style>{`
        @keyframes tutorBounce {
          0%,60%,100% { transform: translateY(0); }
          30%          { transform: translateY(-4px); }
        }
        @keyframes tutorPulse {
          0%,100% { opacity: 1; }
          50%     { opacity: 0.4; }
        }
      `}</style>

      {/* ── Step progress trail ─────────────────────────────────────────── */}
      <StepTrail steps={allSteps} activeIndex={activeStepIndex} />

      {/* ── Active step context bar ─────────────────────────────────────── */}
      <div style={{
        padding: '10px 18px', borderBottom: '0.5px solid #e2e8f0',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        gap: 12, flexWrap: 'wrap', flexShrink: 0, background: '#fff',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
          <div style={{
            width: 30, height: 30, borderRadius: 8, background: '#eff6ff',
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}>
            <BookOpen style={{ width: 14, height: 14, color: '#3b82f6' }} />
          </div>
          <div style={{ minWidth: 0 }}>
            <p style={{ fontSize: 10, color: '#94a3b8', margin: 0, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Current step
            </p>
            <p style={{ fontSize: 13, fontWeight: 600, margin: 0, color: '#0f172a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 320 }}>
              {activeStep?.title || 'No step selected'}
            </p>
            {activeStep?.exitCheckpoint?.expectedLogic && (
              <p style={{ fontSize: 11, color: '#64748b', margin: '1px 0 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 320 }}>
                Goal: {activeStep.exitCheckpoint.expectedLogic}
              </p>
            )}
          </div>
        </div>

        {/* Coach mode toggle */}
        <div style={{
          display: 'flex', gap: 3, background: '#f8fafc',
          padding: 3, borderRadius: 8, flexShrink: 0,
        }}>
          {(['socratic', 'hint'] as CoachMode[]).map((mode) => (
            <button key={mode} type="button" onClick={() => setCoachMode(mode)} style={{
              fontSize: 12, fontWeight: 500, padding: '4px 10px', borderRadius: 6,
              border: 'none', cursor: 'pointer',
              background: coachMode === mode ? '#fff' : 'transparent',
              color:      coachMode === mode ? '#0f172a' : '#94a3b8',
              boxShadow:  coachMode === mode ? '0 0 0 0.5px #cbd5e1' : 'none',
              transition: 'all 0.15s',
            }}>
              {mode === 'socratic' ? 'Socratic' : 'Hint-first'}
            </button>
          ))}
        </div>
      </div>

      {/* ── Message thread ──────────────────────────────────────────────── */}
      <div style={{
        flex: 1, overflowY: 'auto', padding: '16px',
        display: 'flex', flexDirection: 'column', gap: 12,
        background: '#f8fafc',
      }}>
        {error && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8, padding: '10px 12px',
            borderRadius: 8, border: '0.5px solid #fecaca',
            background: '#fef2f2', color: '#b91c1c', fontSize: 13,
          }}>
            <AlertCircle style={{ width: 14, height: 14, flexShrink: 0 }} />
            {error}
          </div>
        )}

        {messages.length === 0 && !sending ? (
          <div style={{
            flex: 1, display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            gap: 12, textAlign: 'center', padding: '2rem 1rem', color: '#94a3b8',
          }}>
            <div style={{
              width: 52, height: 52, borderRadius: '50%',
              border: '0.5px solid #e2e8f0', background: '#fff',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Sparkles style={{ width: 22, height: 22 }} />
            </div>
            <div>
              <p style={{ fontSize: 14, margin: '0 0 4px', fontWeight: 500, color: '#475569' }}>
                Ready to tackle <strong>{activeStep?.title || 'this step'}</strong>?
              </p>
              <p style={{ fontSize: 13, margin: 0, maxWidth: 260 }}>
                Ask a question, describe where you're stuck, or attach a photo of your working.
              </p>
            </div>
          </div>
        ) : (
          messages.map((msg) => <MessageBubble key={msg.id} message={msg} />)
        )}

        {sending && <TypingIndicator />}
        <div ref={messagesEndRef} />
      </div>

      {/* ── Input area ──────────────────────────────────────────────────── */}
      <div style={{ flexShrink: 0, borderTop: '0.5px solid #e2e8f0', background: '#fff' }}>

        {/* Shortcut chips */}
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', padding: '10px 14px 0' }}>
          {SHORTCUT_CHIPS.map((chip) => (
            <button key={chip.kind} type="button" onClick={() => applyShortcut(chip.kind)} style={{
              fontSize: 12, padding: '4px 10px', borderRadius: 99,
              border: '0.5px solid #e2e8f0', background: '#f8fafc', color: '#64748b',
              cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4,
            }}>
              <Zap style={{ width: 11, height: 11 }} />
              {chip.label}
            </button>
          ))}
        </div>

        {/* Attachment preview */}
        {attachment && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 10,
            margin: '8px 14px 0', padding: '7px 10px',
            borderRadius: 8, border: '0.5px solid #e2e8f0', background: '#f8fafc',
          }}>
            <img src={attachment.previewUrl} alt="preview" style={{
              width: 36, height: 36, borderRadius: 5, objectFit: 'cover',
              border: '0.5px solid #e2e8f0', flexShrink: 0,
            }} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontSize: 12, fontWeight: 500, margin: 0, color: '#0f172a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {attachment.file.name}
              </p>
              <p style={{ fontSize: 11, color: '#94a3b8', margin: 0 }}>Image · ready to send</p>
            </div>
            <button type="button" onClick={removeAttachment} style={{
              background: 'none', border: 'none', cursor: 'pointer', padding: 4,
              color: '#94a3b8', display: 'flex', alignItems: 'center',
            }}>
              <X style={{ width: 14, height: 14 }} />
            </button>
          </div>
        )}

        {/* Composer */}
        <div style={{
          display: 'flex', alignItems: 'flex-end', margin: '8px 14px',
          border: '0.5px solid #cbd5e1', borderRadius: 10, overflow: 'hidden',
          background: '#fff',
        }}>
          <input ref={fileInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleFileChange} />

          <button type="button" onClick={() => fileInputRef.current?.click()} title="Attach photo of your working" style={{
            width: 40, minHeight: 40, border: 'none', background: 'none', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            color: attachment ? '#3b82f6' : '#94a3b8', paddingBottom: 1, transition: 'color 0.15s',
          }}>
            <Paperclip style={{ width: 16, height: 16 }} />
          </button>

          <div style={{ width: '0.5px', background: '#e2e8f0', alignSelf: 'stretch', margin: '6px 0', flexShrink: 0 }} />

          <textarea
            ref={textareaRef}
            rows={1}
            value={messageText}
            onChange={handleTextChange}
            onKeyDown={handleKeyDown}
            placeholder={attachment ? 'Add a message with your photo (optional)…' : "Ask the coach or describe where you're stuck…"}
            style={{
              flex: 1, resize: 'none', fontSize: 14, lineHeight: 1.55,
              padding: '9px 10px', border: 'none', background: 'transparent',
              color: '#0f172a', outline: 'none', minHeight: 40, maxHeight: 120,
              fontFamily: 'inherit',
            }}
          />

          <button type="button" onClick={handleSend} disabled={!canSend} aria-label="Send" style={{
            width: 40, minHeight: 40, border: 'none', background: 'none', flexShrink: 0,
            cursor: canSend ? 'pointer' : 'default', paddingBottom: 1,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: canSend ? '#3b82f6' : '#cbd5e1', transition: 'color 0.15s',
          }}>
            {sending
              ? <Loader2 style={{ width: 16, height: 16, animation: 'spin 1s linear infinite' }} />
              : <Send style={{ width: 15, height: 15 }} />}
          </button>
        </div>

        <p style={{ fontSize: 11, color: '#94a3b8', padding: '0 14px 10px' }}>
          ↵ to send · shift+↵ new line · coach gives hints, not answers
        </p>
      </div>
    </div>
  );
};

export default StudentTutor;