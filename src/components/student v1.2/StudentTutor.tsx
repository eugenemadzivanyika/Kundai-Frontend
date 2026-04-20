import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertCircle,
  Brain,
  Loader2,
  Paperclip,
  Send,
  Sparkles,
  Target,
  X,
  Zap,
} from 'lucide-react';
import { DevelopmentPlan, Subject } from '../../types';
import { aiTutorService, AiTutorMessage, AiTutorSession } from '../../services/aiTutorService';

// ─── Types ────────────────────────────────────────────────────────────────────

type StudentTutorProps = {
  studentId: string;
  selectedSubjectId: string;
  subjects: Subject[];
  activePlan?: DevelopmentPlan | null;
  prefillMessage?: string;
  onPrefillApplied?: () => void;
};

type CoachMode = 'socratic' | 'hint';

type AttachedImage = {
  file: File;
  previewUrl: string;
  base64: string;
};

const SHORTCUT_CHIPS = [
  { label: 'Give me a hint',         kind: 'hint'      as const },
  { label: 'Challenge my reasoning',  kind: 'challenge' as const },
  { label: 'Practice question',       kind: 'practice'  as const },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

const fileToBase64 = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve((reader.result as string).split(',')[1]);
    reader.onerror = () => reject(new Error('File read failed'));
    reader.readAsDataURL(file);
  });

// ─── Subcomponents ────────────────────────────────────────────────────────────

const MessageBubble: React.FC<{ message: AiTutorMessage }> = ({ message }) => {
  const isStudent = message.senderRole === 'student';
  const isSystem  = message.senderRole === 'system';

  return (
    <div style={{ display: 'flex', justifyContent: isStudent ? 'flex-end' : 'flex-start', alignItems: 'flex-end', gap: 8 }}>
      {!isStudent && (
        <div style={{
          width: 28, height: 28, borderRadius: '50%',
          background: 'var(--color-background-info)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
        }}>
          <Sparkles style={{ width: 13, height: 13, color: 'var(--color-text-info)' }} />
        </div>
      )}

      <div style={{ maxWidth: '82%' }}>
        {!isStudent && !isSystem && (
          <p style={{
            fontSize: 10, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em',
            color: 'var(--color-text-tertiary)', margin: '0 0 3px',
            display: 'flex', alignItems: 'center', gap: 3,
          }}>
            <Sparkles style={{ width: 10, height: 10 }} /> Tutor guidance
          </p>
        )}

        {/* Image attachment */}
        {message.imageUrl && (
          <div style={{
            borderRadius: isStudent ? '12px 12px 3px 12px' : '12px 12px 12px 3px',
            overflow: 'hidden',
            border: '0.5px solid var(--color-border-tertiary)',
            marginBottom: message.content ? 4 : 0,
            maxWidth: 220,
          }}>
            <img src={message.imageUrl} alt="Student working" style={{ width: '100%', display: 'block' }} />
            <div style={{
              fontSize: 11, color: 'var(--color-text-secondary)',
              padding: '5px 9px', background: 'var(--color-background-secondary)',
              display: 'flex', alignItems: 'center', gap: 4,
            }}>
              <Paperclip style={{ width: 11, height: 11 }} />
              Photo of working
            </div>
          </div>
        )}

        {/* Text content */}
        {(message.content || message.transcript) && (
          <div style={{
            padding: '9px 13px',
            borderRadius: isStudent ? '14px 14px 3px 14px' : '14px 14px 14px 3px',
            fontSize: 14, lineHeight: 1.65,
            background: isStudent
              ? 'var(--color-background-info)'
              : isSystem
                ? 'var(--color-background-warning)'
                : 'var(--color-background-primary)',
            color: isStudent
              ? 'var(--color-text-info)'
              : isSystem
                ? 'var(--color-text-warning)'
                : 'var(--color-text-primary)',
            border: isStudent
              ? 'none'
              : `0.5px solid ${isSystem ? 'var(--color-border-warning)' : 'var(--color-border-tertiary)'}`,
          }}>
            <p style={{ margin: 0, whiteSpace: 'pre-wrap' }}>
              {message.content || message.transcript}
            </p>
            <p style={{
              margin: '4px 0 0', fontSize: 11,
              color: isStudent ? 'var(--color-text-info)' : 'var(--color-text-tertiary)',
              opacity: 0.75,
            }}>
              {new Date(message.ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

const TypingIndicator: React.FC = () => (
  <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8 }}>
    <div style={{
      width: 28, height: 28, borderRadius: '50%',
      background: 'var(--color-background-info)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
    }}>
      <Sparkles style={{ width: 13, height: 13, color: 'var(--color-text-info)' }} />
    </div>
    <div style={{
      padding: '10px 14px',
      borderRadius: '14px 14px 14px 3px',
      border: '0.5px solid var(--color-border-tertiary)',
      background: 'var(--color-background-primary)',
      display: 'flex', gap: 4, alignItems: 'center',
    }}>
      {[0, 0.15, 0.3].map((delay, i) => (
        <span key={i} style={{
          width: 6, height: 6, borderRadius: '50%',
          background: 'var(--color-border-secondary)',
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
  subjects,
  activePlan,
  prefillMessage,
  onPrefillApplied,
}) => {
  const [session,           setSession]           = useState<AiTutorSession | null>(null);
  const [messages,          setMessages]          = useState<AiTutorMessage[]>([]);
  const [loading,           setLoading]           = useState(false);
  const [sending,           setSending]           = useState(false);
  const [error,             setError]             = useState<string | null>(null);
  const [coachMode,         setCoachMode]         = useState<CoachMode>('socratic');
  const [messageText,       setMessageText]       = useState('');
  const [attachment,        setAttachment]        = useState<AttachedImage | null>(null);
  const [selectedStepTitle, setSelectedStepTitle] = useState('');

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef    = useRef<HTMLTextAreaElement>(null);
  const fileInputRef   = useRef<HTMLInputElement>(null);

  const planForSubject = useMemo(() => {
    if (!activePlan?.plan?.subjectId) return null;
    return activePlan.plan.subjectId === selectedSubjectId ? activePlan : null;
  }, [activePlan, selectedSubjectId]);

  const planSteps = useMemo(() => planForSubject?.plan?.steps || [], [planForSubject]);

  useEffect(() => {
    if (planSteps.length > 0) {
      setSelectedStepTitle((prev) => prev || planSteps[0]?.title || '');
    } else {
      setSelectedStepTitle('');
    }
  }, [planSteps]);

  useEffect(() => {
    if (!studentId || selectedSubjectId === 'all') {
      setSession(null);
      setMessages([]);
      return;
    }
    let active = true;
    setLoading(true);
    setError(null);

    (async () => {
      const s = await aiTutorService.getOrCreateSession(studentId, selectedSubjectId, studentId);
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

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages, sending]);

  useEffect(() => {
    if (!prefillMessage) return;
    setMessageText((prev) => prev.trim() ? prev : prefillMessage);
    onPrefillApplied?.();
    setTimeout(() => textareaRef.current?.focus(), 0);
  }, [prefillMessage, onPrefillApplied]);

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
      const previewUrl = URL.createObjectURL(file);
      setAttachment({ file, previewUrl, base64 });
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
    const focus = selectedStepTitle || 'this topic';
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
      await aiTutorService.sendMessage({
        sessionId: session.id,
        senderId: studentId,
        senderRole: 'student',
        contentType: 'text',
        content: text || undefined,
        imageBase64: attachment?.base64,
        contentPayload: {
          coachingMode: coachMode,
          noDirectSolutions: true,
          expectation: 'Guide with probing questions, hints, and reflective prompts.',
          selectedPlanStep: selectedStepTitle || null,
          hasImageAttachment: !!attachment,
        },
        autoReply: true,
      });

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
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const canSend = (messageText.trim().length > 0 || !!attachment) && !sending;

  // ── Empty state ─────────────────────────────────────────────────────────────
  if (selectedSubjectId === 'all') {
    return (
      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        justifyContent: 'center', minHeight: 400, gap: 12,
        color: 'var(--color-text-secondary)', padding: '2rem', textAlign: 'center',
      }}>
        <Brain style={{ width: 40, height: 40, opacity: 0.3 }} />
        <p style={{ fontSize: 15, margin: 0 }}>Select a subject to open your coaching workspace.</p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, justifyContent: 'center', marginTop: 4 }}>
          {subjects.map((s) => (
            <span key={s.id} style={{
              fontSize: 12, padding: '3px 10px', borderRadius: 99,
              border: '0.5px solid var(--color-border-tertiary)',
              color: 'var(--color-text-secondary)',
            }}>{s.name}</span>
          ))}
        </div>
      </div>
    );
  }

  // ── Loading skeleton ─────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: 12 }}>
        {[80, 55, 90, 60].map((w, i) => (
          <div key={i} style={{
            height: 14, width: `${w}%`, borderRadius: 6,
            background: 'var(--color-background-secondary)',
            animation: 'tutorPulse 1.5s infinite',
          }} />
        ))}
      </div>
    );
  }

  // ── Main layout ──────────────────────────────────────────────────────────────
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 640 }}>
      <style>{`
        @keyframes tutorBounce {
          0%,60%,100% { transform: translateY(0); }
          30% { transform: translateY(-4px); }
        }
        @keyframes tutorPulse {
          0%,100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
      `}</style>

      {/* ── Top bar ───────────────────────────────────────────────────────── */}
      <div style={{
        padding: '11px 18px',
        borderBottom: '0.5px solid var(--color-border-tertiary)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        gap: 12, flexWrap: 'wrap', flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
          <div style={{
            width: 30, height: 30, borderRadius: 'var(--border-radius-md)',
            background: 'var(--color-background-info)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}>
            <Target style={{ width: 14, height: 14, color: 'var(--color-text-info)' }} />
          </div>
          <div style={{ minWidth: 0 }}>
            <p style={{
              fontSize: 10, color: 'var(--color-text-tertiary)', margin: 0,
              fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em',
            }}>Current step</p>
            {planSteps.length > 1 ? (
              <select
                value={selectedStepTitle}
                onChange={(e) => setSelectedStepTitle(e.target.value)}
                style={{
                  fontSize: 13, fontWeight: 500, color: 'var(--color-text-primary)',
                  background: 'none', border: 'none', padding: 0, cursor: 'pointer', maxWidth: 280,
                }}
              >
                {planSteps.map((step) => (
                  <option key={step.title} value={step.title}>{step.title}</option>
                ))}
              </select>
            ) : (
              <p style={{ fontSize: 13, fontWeight: 500, margin: 0, color: 'var(--color-text-primary)' }}>
                {selectedStepTitle || planForSubject?.plan.name || 'Free study'}
              </p>
            )}
          </div>
        </div>

        {/* Coach mode toggle */}
        <div style={{
          display: 'flex', gap: 3, background: 'var(--color-background-secondary)',
          padding: 3, borderRadius: 'var(--border-radius-md)', flexShrink: 0,
        }}>
          {(['socratic', 'hint'] as CoachMode[]).map((mode) => (
            <button
              key={mode}
              type="button"
              onClick={() => setCoachMode(mode)}
              style={{
                fontSize: 12, fontWeight: 500, padding: '4px 10px',
                borderRadius: 6, border: 'none', cursor: 'pointer',
                background: coachMode === mode ? 'var(--color-background-primary)' : 'transparent',
                color: coachMode === mode ? 'var(--color-text-primary)' : 'var(--color-text-tertiary)',
                boxShadow: coachMode === mode ? '0 0 0 0.5px var(--color-border-secondary)' : 'none',
                transition: 'all 0.15s',
              }}
            >
              {mode === 'socratic' ? 'Socratic' : 'Hint-first'}
            </button>
          ))}
        </div>
      </div>

      {/* ── Message thread ─────────────────────────────────────────────────── */}
      <div style={{
        flex: 1, overflowY: 'auto', padding: '16px',
        display: 'flex', flexDirection: 'column', gap: 12,
      }}>
        {error && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '10px 12px', borderRadius: 'var(--border-radius-md)',
            border: '0.5px solid var(--color-border-danger)',
            background: 'var(--color-background-danger)',
            color: 'var(--color-text-danger)', fontSize: 13,
          }}>
            <AlertCircle style={{ width: 14, height: 14, flexShrink: 0 }} />
            {error}
          </div>
        )}

        {messages.length === 0 && !sending ? (
          <div style={{
            flex: 1, display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            gap: 10, textAlign: 'center', padding: '2rem 1rem',
            color: 'var(--color-text-tertiary)',
          }}>
            <div style={{
              width: 48, height: 48, borderRadius: '50%',
              border: '0.5px solid var(--color-border-tertiary)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Sparkles style={{ width: 20, height: 20 }} />
            </div>
            <p style={{ fontSize: 14, margin: 0, maxWidth: 280 }}>
              Describe where you're stuck — or attach a photo of your working and the coach will guide you from there.
            </p>
          </div>
        ) : (
          messages.map((msg) => <MessageBubble key={msg.id} message={msg} />)
        )}

        {sending && <TypingIndicator />}
        <div ref={messagesEndRef} />
      </div>

      {/* ── Input area ─────────────────────────────────────────────────────── */}
      <div style={{
        flexShrink: 0,
        borderTop: '0.5px solid var(--color-border-tertiary)',
        background: 'var(--color-background-primary)',
      }}>
        {/* Shortcut chips */}
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', padding: '10px 14px 0' }}>
          {SHORTCUT_CHIPS.map((chip) => (
            <button
              key={chip.kind}
              type="button"
              onClick={() => applyShortcut(chip.kind)}
              style={{
                fontSize: 12, padding: '4px 10px', borderRadius: 99,
                border: '0.5px solid var(--color-border-tertiary)',
                background: 'var(--color-background-secondary)',
                color: 'var(--color-text-secondary)',
                cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4,
              }}
            >
              <Zap style={{ width: 11, height: 11 }} />
              {chip.label}
            </button>
          ))}
        </div>

        {/* Attachment preview strip */}
        {attachment && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 10,
            margin: '8px 14px 0', padding: '7px 10px',
            borderRadius: 'var(--border-radius-md)',
            border: '0.5px solid var(--color-border-tertiary)',
            background: 'var(--color-background-secondary)',
          }}>
            <img
              src={attachment.previewUrl}
              alt="attachment preview"
              style={{
                width: 36, height: 36, borderRadius: 5, objectFit: 'cover',
                border: '0.5px solid var(--color-border-tertiary)', flexShrink: 0,
              }}
            />
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{
                fontSize: 12, fontWeight: 500, margin: 0,
                color: 'var(--color-text-primary)',
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              }}>
                {attachment.file.name}
              </p>
              <p style={{ fontSize: 11, color: 'var(--color-text-tertiary)', margin: 0 }}>
                Image · ready to send
              </p>
            </div>
            <button
              type="button"
              onClick={removeAttachment}
              aria-label="Remove attachment"
              style={{
                background: 'none', border: 'none', cursor: 'pointer', padding: 4,
                borderRadius: 4, color: 'var(--color-text-tertiary)',
                display: 'flex', alignItems: 'center',
              }}
            >
              <X style={{ width: 14, height: 14 }} />
            </button>
          </div>
        )}

        {/* Composer row */}
        <div style={{
          display: 'flex', alignItems: 'flex-end',
          margin: '8px 14px',
          border: '0.5px solid var(--color-border-secondary)',
          borderRadius: 10, overflow: 'hidden',
          background: 'var(--color-background-primary)',
        }}>
          {/* Hidden file input */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            style={{ display: 'none' }}
            onChange={handleFileChange}
          />

          {/* Paperclip button */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            title="Attach a photo of your working"
            style={{
              width: 40, minHeight: 40, border: 'none', background: 'none',
              cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: attachment ? 'var(--color-text-info)' : 'var(--color-text-tertiary)',
              flexShrink: 0, paddingBottom: 1, transition: 'color 0.15s',
            }}
          >
            <Paperclip style={{ width: 16, height: 16 }} />
          </button>

          {/* Vertical divider */}
          <div style={{
            width: '0.5px', background: 'var(--color-border-tertiary)',
            alignSelf: 'stretch', margin: '6px 0', flexShrink: 0,
          }} />

          {/* Textarea */}
          <textarea
            ref={textareaRef}
            rows={1}
            value={messageText}
            onChange={handleTextChange}
            onKeyDown={handleKeyDown}
            placeholder={
              attachment
                ? 'Add a message with your photo (optional)…'
                : "Ask the coach, describe where you're stuck, or attach a photo of your working…"
            }
            style={{
              flex: 1, resize: 'none', fontSize: 14, lineHeight: 1.55,
              padding: '9px 10px', border: 'none', background: 'transparent',
              color: 'var(--color-text-primary)', outline: 'none',
              minHeight: 40, maxHeight: 120, fontFamily: 'inherit',
            }}
          />

          {/* Send button */}
          <button
            type="button"
            onClick={handleSend}
            disabled={!canSend}
            aria-label="Send message"
            style={{
              width: 40, minHeight: 40, border: 'none', background: 'none',
              cursor: canSend ? 'pointer' : 'default',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: canSend ? 'var(--color-text-info)' : 'var(--color-text-tertiary)',
              flexShrink: 0, paddingBottom: 1, transition: 'color 0.15s',
            }}
          >
            {sending
              ? <Loader2 style={{ width: 16, height: 16, animation: 'spin 1s linear infinite' }} />
              : <Send style={{ width: 15, height: 15 }} />}
          </button>
        </div>
      </div>
    </div>
  );
};

export default StudentTutor;