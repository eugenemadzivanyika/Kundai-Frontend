import React, { useEffect, useState, useCallback } from 'react';
import {
  BookOpen, ChevronDown, RefreshCw, X, AlertTriangle,
  CheckCircle, Loader2, Sparkles, ClipboardList,
} from 'lucide-react';
import { ReteachCard, ExitTicketQuestion } from '../../types/reteach';
import {
  getReteachCards, generateReteachCards, dismissReteachCard,
} from '../../services/reteachService';
import { toast } from 'sonner';

/* ──────────────────────────────────────────────────────────────────────────
   Design tokens (mirrors the global Kundai teacher palette — paper & ink)
   ────────────────────────────────────────────────────────────────────── */
const T = {
  canvas:   '#f6f1e7',
  paper:    '#fffaf2',
  rule:     '#e7dcc8',
  ruleSoft: '#f0e7d3',
  inkHi:    '#2b1d10',
  inkMid:   '#4d3a26',
  inkLo:    '#846c52',
  inkFaint: '#ad9a80',
  accent:   '#b85e2c',
  good:     '#15784f',
  warn:     '#9a6418',
  risk:     '#a93333',
  serif:    "'Source Serif 4', Georgia, serif",
  mono:     "'JetBrains Mono', ui-monospace, monospace",
} as const;

interface ReteachCardsDashboardProps {
  classId: string;
  subjectId: string;
}

/* ──────────────────────────────────────────────────────────────────────── */

function masteryColor(v: number): string {
  if (v >= 0.6) return T.good;
  if (v >= 0.4) return T.warn;
  if (v >= 0.25) return T.accent;
  return T.risk;
}

function masteryLabel(v: number): string {
  if (v >= 0.6) return 'Approaching';
  if (v >= 0.4) return 'Developing';
  if (v >= 0.25) return 'Struggling';
  return 'Critical';
}

function MasteryBar({ value }: { value: number }) {
  const pct = Math.round(value * 100);
  const color = masteryColor(value);
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <div style={{
        flex: 1, height: 6, background: T.ruleSoft,
        borderRadius: 999, overflow: 'hidden', position: 'relative',
      }}>
        <div style={{
          height: '100%', width: `${pct}%`, background: color,
          borderRadius: 999, transition: 'width .3s',
        }} />
        {/* mastery threshold marker at 60% */}
        <div style={{
          position: 'absolute', top: -2, bottom: -2, left: '60%',
          width: 1, background: T.inkFaint, opacity: 0.5,
        }} />
      </div>
      <span
        className="tnum"
        style={{
          fontFamily: T.mono, fontSize: 11, fontWeight: 600,
          color, minWidth: 36, textAlign: 'right',
        }}
      >
        {pct}%
      </span>
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────────────── */

function Pill({
  tone = 'neutral', children,
}: { tone?: 'neutral' | 'accent' | 'good' | 'warn' | 'risk'; children: React.ReactNode }) {
  const tones = {
    neutral: { bg: 'rgba(120,90,60,.08)', fg: T.inkMid },
    accent:  { bg: 'rgba(176,90,40,.10)', fg: T.accent },
    good:    { bg: 'rgba(20,120,80,.10)', fg: T.good },
    warn:    { bg: 'rgba(190,140,40,.12)', fg: T.warn },
    risk:    { bg: 'rgba(190,50,50,.10)',  fg: T.risk },
  } as const;
  const t = tones[tone];
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      padding: '2px 8px', borderRadius: 999,
      background: t.bg, color: t.fg,
      fontSize: 10.5, fontWeight: 600, letterSpacing: '.02em',
      whiteSpace: 'nowrap',
    }}>
      {children}
    </span>
  );
}

/* ──────────────────────────────────────────────────────────────────────── */

function ExitTicketPreview({ questions }: { questions: ExitTicketQuestion[] }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {questions.map((q, i) => (
        <div
          key={i}
          style={{
            borderTop: i === 0 ? 'none' : `1px solid ${T.ruleSoft}`,
            paddingTop: i === 0 ? 0 : 10,
          }}
        >
          <div style={{ display: 'flex', gap: 8, marginBottom: 6 }}>
            <span
              className="tnum"
              style={{
                fontFamily: T.mono, fontSize: 10.5, fontWeight: 700,
                color: T.inkFaint, minWidth: 18,
              }}
            >
              Q{i + 1}
            </span>
            <p style={{
              margin: 0, fontSize: 12.5, lineHeight: 1.45,
              color: T.inkHi, fontWeight: 500,
            }}>
              {q.question}
            </p>
          </div>

          {q.type === 'mcq' && q.options && q.options.length > 0 ? (
            <ul style={{ listStyle: 'none', margin: '0 0 0 26px', padding: 0, display: 'flex', flexDirection: 'column', gap: 4 }}>
              {q.options.map((opt, j) => {
                const isAns = opt === q.answer;
                return (
                  <li key={j} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{
                      width: 10, height: 10, borderRadius: 999,
                      border: `1.5px solid ${isAns ? T.good : T.rule}`,
                      background: isAns ? T.good : 'transparent',
                      flexShrink: 0,
                    }} />
                    <span style={{
                      fontSize: 11.5,
                      color: isAns ? T.good : T.inkMid,
                      fontWeight: isAns ? 600 : 400,
                    }}>
                      {opt}
                    </span>
                  </li>
                );
              })}
            </ul>
          ) : (
            <div style={{
              marginLeft: 26, padding: '6px 10px',
              borderLeft: `2px solid ${T.good}`,
              background: 'rgba(20,120,80,.05)',
              fontSize: 11.5, color: T.inkMid, fontStyle: 'italic',
            }}>
              Expected: <span style={{ color: T.good, fontWeight: 600, fontStyle: 'normal' }}>{q.answer}</span>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────────────── */

function CardItem({
  card, onDismiss,
}: { card: ReteachCard; onDismiss: (id: string) => void }) {
  const [tab, setTab] = useState<'script' | 'ticket'>('script');
  const [dismissing, setDismissing] = useState(false);

  const handleDismiss = async () => {
    setDismissing(true);
    try {
      await dismissReteachCard(card._id);
      onDismiss(card._id);
      toast.success('Card dismissed');
    } catch {
      toast.error('Failed to dismiss card');
      setDismissing(false);
    }
  };

  const tone = masteryColor(card.avgMastery);
  const ticketCount = card.exitTicket?.length ?? 0;

  return (
    <article style={{
      background: T.paper,
      border: `1px solid ${T.rule}`,
      borderRadius: 6,
      boxShadow: '0 1px 0 rgba(60,40,20,.04), 0 1px 2px rgba(60,40,20,.04)',
      overflow: 'hidden',
      display: 'flex', flexDirection: 'column',
      borderLeft: `3px solid ${tone}`,
    }}>
      {/* ─── header ─────────────────────────────────────────────── */}
      <header style={{
        padding: '14px 16px 12px',
        display: 'flex', gap: 12,
        alignItems: 'flex-start', justifyContent: 'space-between',
      }}>
        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 4 }}>
            <Pill tone="neutral">
              <span style={{
                width: 5, height: 5, borderRadius: 999, background: tone,
              }} />
              {masteryLabel(card.avgMastery)}
            </Pill>
            {card.subtopic && <Pill tone="accent">{card.subtopic}</Pill>}
          </div>
          <h3 style={{
            margin: 0, fontFamily: T.serif,
            fontSize: 17, fontWeight: 600, lineHeight: 1.25,
            color: T.inkHi, letterSpacing: '-.01em',
          }}>
            {card.topic}
          </h3>
          <div style={{ marginTop: 10 }}>
            <MasteryBar value={card.avgMastery} />
          </div>
        </div>

        <button
          onClick={handleDismiss}
          disabled={dismissing}
          title="Dismiss this card"
          aria-label="Dismiss"
          style={{
            width: 26, height: 26, padding: 0,
            display: 'grid', placeItems: 'center',
            background: 'transparent',
            border: `1px solid ${T.rule}`, borderRadius: 6,
            color: T.inkLo,
            cursor: dismissing ? 'not-allowed' : 'pointer',
            opacity: dismissing ? 0.4 : 1,
            fontFamily: 'inherit', flexShrink: 0,
            transition: 'all .15s ease',
          }}
          onMouseEnter={e => {
            if (dismissing) return;
            e.currentTarget.style.background = 'rgba(190,50,50,.08)';
            e.currentTarget.style.borderColor = 'rgba(190,50,50,.3)';
            e.currentTarget.style.color = T.risk;
          }}
          onMouseLeave={e => {
            e.currentTarget.style.background = 'transparent';
            e.currentTarget.style.borderColor = T.rule;
            e.currentTarget.style.color = T.inkLo;
          }}
        >
          <X size={13} strokeWidth={2} />
        </button>
      </header>

      {/* ─── tab strip ─────────────────────────────────────────── */}
      <div style={{
        display: 'flex', borderTop: `1px solid ${T.ruleSoft}`,
        background: T.canvas,
      }}>
        {([
          ['script', BookOpen, '2-min script'],
          ['ticket', ClipboardList, `Exit ticket · ${ticketCount}`],
        ] as const).map(([key, IconC, label]) => {
          const active = tab === key;
          return (
            <button
              key={key}
              onClick={() => setTab(key)}
              style={{
                flex: 1,
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                gap: 6, padding: '8px 10px',
                background: active ? T.paper : 'transparent',
                border: 'none',
                borderBottom: `2px solid ${active ? T.accent : 'transparent'}`,
                color: active ? T.inkHi : T.inkLo,
                fontFamily: 'inherit',
                fontSize: 11, fontWeight: 600,
                letterSpacing: '.04em', textTransform: 'uppercase',
                cursor: 'pointer',
                transition: 'all .15s ease',
              }}
            >
              <IconC size={12} />
              {label}
            </button>
          );
        })}
      </div>

      {/* ─── body ──────────────────────────────────────────────── */}
      <div style={{ padding: 16, background: T.paper, flex: 1 }}>
        {tab === 'script' ? (
          card.interventionScript ? (
            <div style={{
              padding: '12px 14px',
              background: T.canvas,
              borderLeft: `2px solid ${T.accent}`,
              borderRadius: '0 4px 4px 0',
              fontFamily: T.serif,
              fontSize: 13.5, lineHeight: 1.55,
              color: T.inkHi,
              whiteSpace: 'pre-wrap',
            }}>
              {card.interventionScript}
            </div>
          ) : (
            <p style={{ margin: 0, fontSize: 12, color: T.inkFaint, fontStyle: 'italic' }}>
              No intervention script generated.
            </p>
          )
        ) : (
          ticketCount > 0
            ? <ExitTicketPreview questions={card.exitTicket!} />
            : <p style={{ margin: 0, fontSize: 12, color: T.inkFaint, fontStyle: 'italic' }}>
                No exit ticket questions.
              </p>
        )}
      </div>
    </article>
  );
}

/* ──────────────────────────────────────────────────────────────────────── */

function HeaderBar({
  count, onGenerate, generating, polling,
}: {
  count: number;
  onGenerate: () => void;
  generating: boolean;
  polling: boolean;
}) {
  const busy = generating || polling;
  return (
    <div style={{
      flexShrink: 0,
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      gap: 12, flexWrap: 'wrap',
      padding: '12px 16px',
      background: T.paper,
      border: `1px solid ${T.rule}`,
      borderRadius: 6,
      boxShadow: '0 1px 0 rgba(60,40,20,.04)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{
          width: 30, height: 30, borderRadius: 6,
          background: 'rgba(176,90,40,.10)',
          color: T.accent,
          display: 'grid', placeItems: 'center',
        }}>
          <Sparkles size={15} />
        </div>
        <div>
          <h2 style={{
            margin: 0, fontFamily: T.serif,
            fontSize: 16, fontWeight: 600, color: T.inkHi,
            letterSpacing: '-.01em',
          }}>
            Re-teach cards
            {count > 0 && (
              <span
                className="tnum"
                style={{
                  marginLeft: 8, fontFamily: T.mono,
                  fontSize: 11, fontWeight: 600, color: T.inkLo,
                  background: T.canvas,
                  border: `1px solid ${T.rule}`,
                  borderRadius: 999,
                  padding: '1px 8px',
                  verticalAlign: 2,
                }}
              >
                {count}
              </span>
            )}
          </h2>
          <p style={{ margin: '2px 0 0', fontSize: 11.5, color: T.inkLo }}>
            AI-surfaced topics where the class is below the mastery threshold
          </p>
        </div>
      </div>

      <button
        onClick={onGenerate}
        disabled={busy}
        style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          padding: '7px 14px', borderRadius: 6,
          background: busy ? T.canvas : T.accent,
          color: busy ? T.inkLo : T.paper,
          border: `1px solid ${busy ? T.rule : T.accent}`,
          fontSize: 12, fontWeight: 600, fontFamily: 'inherit',
          cursor: busy ? 'not-allowed' : 'pointer',
          whiteSpace: 'nowrap',
          transition: 'opacity .15s',
        }}
      >
        {busy
          ? <><Loader2 size={13} className="animate-spin" /> Generating…</>
          : <><RefreshCw size={13} /> Generate cards</>
        }
      </button>
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────────────── */

function EmptyState({
  icon: IconC, title, body, action,
  tone = 'neutral',
}: {
  icon: React.ComponentType<{ size?: number; style?: React.CSSProperties }>;
  title: string;
  body?: string;
  action?: React.ReactNode;
  tone?: 'neutral' | 'good';
}) {
  return (
    <div style={{
      flex: 1, minHeight: 280,
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      textAlign: 'center', padding: 40,
      background: T.paper, border: `1px dashed ${T.rule}`, borderRadius: 6,
    }}>
      <div style={{
        width: 44, height: 44, borderRadius: 999,
        background: tone === 'good' ? 'rgba(20,120,80,.10)' : T.canvas,
        border: `1px solid ${tone === 'good' ? 'rgba(20,120,80,.25)' : T.rule}`,
        color: tone === 'good' ? T.good : T.inkLo,
        display: 'grid', placeItems: 'center', marginBottom: 14,
      }}>
        <IconC size={20} />
      </div>
      <p style={{
        margin: 0, fontFamily: T.serif,
        fontSize: 15, fontWeight: 600, color: T.inkHi,
        letterSpacing: '-.01em',
      }}>
        {title}
      </p>
      {body && (
        <p style={{
          margin: '6px 0 0', fontSize: 12, color: T.inkLo,
          maxWidth: 360, lineHeight: 1.5,
        }}>
          {body}
        </p>
      )}
      {action && <div style={{ marginTop: 16 }}>{action}</div>}
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────────────── */

const ReteachCardsDashboard: React.FC<ReteachCardsDashboardProps> = ({ classId, subjectId }) => {
  const [cards, setCards] = useState<ReteachCard[]>([]);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [isPolling, setIsPolling] = useState(false);
  const [noIssues, setNoIssues] = useState(false);

  const fetchCards = useCallback(async (silent = false) => {
    if (!classId || !subjectId) return;
    if (!silent) setLoading(true);
    try {
      const res = await getReteachCards(classId, subjectId);
      setCards(res.cards);
      if (res.generating) {
        setIsPolling(true);
      } else {
        setIsPolling(false);
        setNoIssues(res.cards.length === 0);
      }
    } catch {
      toast.error('Failed to load re-teach cards');
    } finally {
      if (!silent) setLoading(false);
    }
  }, [classId, subjectId]);

  useEffect(() => { fetchCards(); }, [fetchCards]);

  // Poll every 5s while cards are being generated
  useEffect(() => {
    if (!isPolling) return;
    const id = window.setInterval(() => fetchCards(true), 5_000);
    return () => window.clearInterval(id);
  }, [isPolling, fetchCards]);

  const handleGenerate = async () => {
    if (!classId || !subjectId) {
      toast.error('Select a class and subject first');
      return;
    }
    setGenerating(true);
    try {
      const { generated } = await generateReteachCards(classId, subjectId);
      if (generated === 0) {
        setNoIssues(true);
        toast.success('No underperforming topics found — class is on track!');
      } else {
        toast.success(`${generated} re-teach card${generated > 1 ? 's' : ''} generated`);
        fetchCards();
      }
    } catch {
      toast.error('Failed to generate cards');
    } finally {
      setGenerating(false);
    }
  };

  const handleDismiss = (cardId: string) => {
    setCards(prev => prev.filter(c => c._id !== cardId));
    if (cards.length <= 1) setNoIssues(true);
  };

  if (!classId || !subjectId) {
    return (
      <EmptyState
        icon={AlertTriangle}
        title="Select a class and subject"
        body="Re-teach cards are scoped to a single class and subject. Pick both above to begin."
      />
    );
  }

  /* ── content area ─────────────────────────────────────────── */
  let content: React.ReactNode;
  if (loading) {
    content = (
      <div style={{
        flex: 1, minHeight: 280, display: 'grid', placeItems: 'center',
      }}>
        <Loader2 size={28} className="animate-spin" style={{ color: T.accent }} />
      </div>
    );
  } else if (isPolling) {
    content = (
      <EmptyState
        icon={Loader2 as any}
        title="Analysing class mastery data…"
        body="This usually takes under 30 seconds. We'll refresh this view automatically."
      />
    );
  } else if (noIssues && cards.length === 0) {
    content = (
      <EmptyState
        icon={CheckCircle}
        tone="good"
        title="No underperforming topics"
        body="The class is performing above the mastery threshold on every topic in this subject."
        action={
          <button
            onClick={handleGenerate}
            style={{
              padding: '6px 12px', borderRadius: 6,
              background: 'transparent', color: T.inkMid,
              border: `1px solid ${T.rule}`,
              fontSize: 11.5, fontWeight: 600, fontFamily: 'inherit',
              cursor: 'pointer',
            }}
          >
            Re-check
          </button>
        }
      />
    );
  } else if (cards.length === 0) {
    content = (
      <EmptyState
        icon={BookOpen}
        title="No re-teach cards yet"
        body="Generate cards to surface the topics where students are struggling most."
        action={
          <button
            onClick={handleGenerate}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              padding: '7px 14px', borderRadius: 6,
              background: T.accent, color: T.paper,
              border: `1px solid ${T.accent}`,
              fontSize: 12, fontWeight: 600, fontFamily: 'inherit',
              cursor: 'pointer',
            }}
          >
            <Sparkles size={13} /> Generate cards
          </button>
        }
      />
    );
  } else {
    content = (
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
        gap: 12, paddingBottom: 4,
      }}>
        {cards.map(card => (
          <CardItem key={card._id} card={card} onDismiss={handleDismiss} />
        ))}
      </div>
    );
  }

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', gap: 12, height: '100%',
      fontFamily: "'Inter', -apple-system, system-ui, sans-serif",
      color: T.inkMid,
    }}>
      <HeaderBar
        count={cards.length}
        onGenerate={handleGenerate}
        generating={generating}
        polling={isPolling}
      />
      <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
        {content}
      </div>
    </div>
  );
};

export default ReteachCardsDashboard;
