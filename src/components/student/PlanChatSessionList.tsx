import React, { useEffect, useState } from 'react';
import { MessageSquare, Lock, Archive } from 'lucide-react';
import { planChatService, PlanChatSessionSummary } from '../../services/planChatService';

// ── Status badge ───────────────────────────────────────────────────────────────

const STATUS_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  Active:   { bg: '#eff6ff', text: '#1d4ed8', border: '#bfdbfe' },
  Mastered: { bg: '#f0fdf4', text: '#15803d', border: '#bbf7d0' },
  'On Hold':{ bg: '#fefce8', text: '#a16207', border: '#fde68a' },
  Failed:   { bg: '#fef2f2', text: '#b91c1c', border: '#fecaca' },
  Draft:    { bg: '#f8fafc', text: '#64748b', border: '#e2e8f0' },
};

const StatusBadge: React.FC<{ status: string | null }> = ({ status }) => {
  if (!status) return null;
  const colors = STATUS_COLORS[status] ?? STATUS_COLORS['Draft'];
  return (
    <span style={{
      fontSize: 10, fontWeight: 600, padding: '2px 7px', borderRadius: 99,
      background: colors.bg, color: colors.text, border: `0.5px solid ${colors.border}`,
      whiteSpace: 'nowrap',
    }}>
      {status}
    </span>
  );
};

// ── Progress bar ───────────────────────────────────────────────────────────────

const ProgressBar: React.FC<{ pct: number; archived: boolean }> = ({ pct, archived }) => (
  <div style={{ height: 3, background: '#f1f5f9', borderRadius: 99, overflow: 'hidden', marginTop: 6 }}>
    <div style={{
      height: '100%', borderRadius: 99, width: `${Math.min(pct, 100)}%`,
      background: archived ? '#94a3b8' : '#3b82f6',
      transition: 'width 0.3s ease',
    }} />
  </div>
);

// ── Props ──────────────────────────────────────────────────────────────────────

interface PlanChatSessionListProps {
  studentId:       string;
  activeSessionId: string | null;
  onSelectSession: (s: PlanChatSessionSummary) => void;
}

// ── Component ──────────────────────────────────────────────────────────────────

const PlanChatSessionList: React.FC<PlanChatSessionListProps> = ({
  studentId,
  activeSessionId,
  onSelectSession,
}) => {
  const [sessions, setSessions] = useState<PlanChatSessionSummary[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState<string | null>(null);

  useEffect(() => {
    if (!studentId) return;
    let active = true;
    setLoading(true);

    planChatService.listSessions(studentId)
      .then(data => { if (active) setSessions(data); })
      .catch(err  => { if (active) setError(err?.message || 'Failed to load sessions'); })
      .finally(() => { if (active) setLoading(false); });

    return () => { active = false; };
  }, [studentId]);

  const activeSessions   = sessions.filter(s => s.planStatus === 'Active');
  const recentSessions   = sessions.filter(s => s.sessionStatus === 'active' && s.planStatus !== 'Active');
  const archivedSessions = sessions.filter(s => s.sessionStatus === 'archived');

  if (loading) {
    return (
      <div style={{ padding: '16px 12px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        {[90, 75, 85].map((w, i) => (
          <div key={i} style={{
            height: 64, borderRadius: 8, background: '#f1f5f9',
            animation: 'planListPulse 1.5s infinite', opacity: 1 - i * 0.15,
          }} />
        ))}
        <style>{`@keyframes planListPulse { 0%,100%{opacity:1} 50%{opacity:0.45} }`}</style>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: 16, fontSize: 13, color: '#b91c1c' }}>{error}</div>
    );
  }

  if (sessions.length === 0) {
    return (
      <div style={{ padding: '24px 16px', textAlign: 'center', color: '#94a3b8', fontSize: 13 }}>
        <MessageSquare style={{ width: 28, height: 28, margin: '0 auto 8px' }} />
        No plan sessions yet.
      </div>
    );
  }

  const renderSession = (s: PlanChatSessionSummary) => {
    const isActive   = s.sessionId === activeSessionId;
    const isArchived = s.sessionStatus === 'archived';
    const snippet    = s.lastMessage?.content?.slice(0, 60) ?? '';
    const fromTutor  = s.lastMessage?.senderRole === 'tutor';
    const relTime    = s.lastMessageAt
      ? new Date(s.lastMessageAt).toLocaleDateString([], { month: 'short', day: 'numeric' })
      : '';

    return (
      <button
        key={s.sessionId}
        type="button"
        onClick={() => onSelectSession(s)}
        style={{
          width: '100%', textAlign: 'left', padding: '10px 12px', borderRadius: 8,
          border: isActive ? '1px solid #bfdbfe' : '1px solid transparent',
          background: isActive ? '#eff6ff' : 'transparent',
          cursor: 'pointer', transition: 'background 0.12s',
          opacity: isArchived ? 0.75 : 1,
        }}
        onMouseEnter={e => { if (!isActive) (e.currentTarget as HTMLButtonElement).style.background = '#f8fafc'; }}
        onMouseLeave={e => { if (!isActive) (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; }}
      >
        {/* Title row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 3 }}>
          {isArchived
            ? <Lock style={{ width: 11, height: 11, color: '#94a3b8', flexShrink: 0 }} />
            : <MessageSquare style={{ width: 11, height: 11, color: isActive ? '#3b82f6' : '#94a3b8', flexShrink: 0 }} />
          }
          <span style={{
            fontSize: 13, fontWeight: 600, color: isActive ? '#1d4ed8' : '#0f172a',
            overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical', lineHeight: 1.35, flex: 1,
          }}>
            {s.title}
          </span>
        </div>

        {/* Badge row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 4, flexWrap: 'wrap' }}>
          <StatusBadge status={s.planStatus} />
          {s.skillCategory && (
            <span style={{ fontSize: 10, color: '#94a3b8', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {s.skillCategory}
            </span>
          )}
          <span style={{ marginLeft: 'auto', fontSize: 10, color: '#94a3b8', whiteSpace: 'nowrap' }}>
            {relTime}
          </span>
        </div>

        {/* Last message snippet */}
        {snippet && (
          <p style={{
            fontSize: 11, color: '#64748b', margin: '0 0 2px',
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            fontStyle: fromTutor ? 'italic' : 'normal',
          }}>
            {fromTutor ? 'Coach: ' : 'You: '}{snippet}
          </p>
        )}

        {/* Progress bar */}
        <ProgressBar pct={s.progress ?? 0} archived={isArchived} />
      </button>
    );
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      <div style={{ flex: 1, overflowY: 'auto', padding: '8px 6px' }}>

        {activeSessions.length > 0 && (
          <section>
            <p style={{ fontSize: 10, fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.1em', padding: '4px 6px 2px' }}>
              Active
            </p>
            {activeSessions.map(renderSession)}
          </section>
        )}

        {recentSessions.length > 0 && (
          <section style={{ marginTop: activeSessions.length > 0 ? 8 : 0 }}>
            <p style={{ fontSize: 10, fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.1em', padding: '4px 6px 2px' }}>
              Recent
            </p>
            {recentSessions.map(renderSession)}
          </section>
        )}

        {archivedSessions.length > 0 && (
          <section style={{ marginTop: 8 }}>
            <p style={{
              fontSize: 10, fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase',
              letterSpacing: '0.1em', padding: '4px 6px 2px',
              display: 'flex', alignItems: 'center', gap: 4,
            }}>
              <Archive style={{ width: 10, height: 10 }} /> Archived
            </p>
            {archivedSessions.map(renderSession)}
          </section>
        )}
      </div>
    </div>
  );
};

export default PlanChatSessionList;
export type { PlanChatSessionSummary };
