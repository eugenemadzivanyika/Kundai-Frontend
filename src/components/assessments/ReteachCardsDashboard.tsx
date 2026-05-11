import React, { useEffect, useState, useCallback } from 'react';
import { BookOpen, ChevronDown, ChevronUp, RefreshCw, Trash2, AlertTriangle, CheckCircle, Loader2 } from 'lucide-react';
import { ReteachCard, ExitTicketQuestion } from '../../types/reteach';
import { getReteachCards, generateReteachCards, dismissReteachCard } from '../../services/reteachService';
import { toast } from 'sonner';

interface ReteachCardsDashboardProps {
  classId: string;
  subjectId: string;
}

function MasteryBar({ value }: { value: number }) {
  const pct = Math.round(value * 100);
  const color = pct < 30 ? '#ef4444' : pct < 50 ? '#f59e0b' : '#10b981';
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 rounded-full bg-slate-100 overflow-hidden">
        <div className="h-full rounded-full" style={{ width: `${pct}%`, background: color }} />
      </div>
      <span className="text-xs font-semibold shrink-0" style={{ color }}>{pct}% mastery</span>
    </div>
  );
}

function ExitTicketPreview({ questions }: { questions: ExitTicketQuestion[] }) {
  return (
    <div className="space-y-3">
      {questions.map((q, i) => (
        <div key={i} className="rounded-lg border border-slate-100 bg-slate-50 p-3">
          <p className="text-xs font-semibold text-slate-700 mb-2">Q{i + 1}. {q.question}</p>
          {q.type === 'mcq' && q.options && q.options.length > 0 ? (
            <ul className="space-y-1">
              {q.options.map((opt, j) => (
                <li key={j} className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full border-2 shrink-0 ${opt === q.answer ? 'border-green-500 bg-green-500' : 'border-slate-300'}`} />
                  <span className={`text-xs ${opt === q.answer ? 'font-semibold text-green-700' : 'text-slate-600'}`}>{opt}</span>
                </li>
              ))}
            </ul>
          ) : (
            <div className="rounded border border-slate-200 bg-white px-3 py-2 text-xs text-slate-400 italic">
              Short answer — expected: <span className="font-semibold text-slate-600 not-italic">{q.answer}</span>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function CardItem({ card, onDismiss }: { card: ReteachCard; onDismiss: (id: string) => void }) {
  const [scriptOpen, setScriptOpen] = useState(false);
  const [ticketOpen, setTicketOpen] = useState(false);
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

  return (
    <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
      {/* Card header */}
      <div className="px-4 py-3 flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-bold text-slate-800">{card.topic}</span>
            {card.subtopic && (
              <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100">
                {card.subtopic}
              </span>
            )}
          </div>
          <div className="mt-1.5">
            <MasteryBar value={card.avgMastery} />
          </div>
        </div>
        <button
          onClick={handleDismiss}
          disabled={dismissing}
          title="Dismiss card"
          style={{
            padding: '5px 7px', borderRadius: 7,
            border: '1.5px solid #fee2e2', background: '#fef2f2',
            color: '#ef4444', cursor: dismissing ? 'not-allowed' : 'pointer',
            display: 'flex', alignItems: 'center', gap: 4,
            fontSize: 11, fontWeight: 600, fontFamily: 'inherit',
            opacity: dismissing ? 0.5 : 1,
          }}
        >
          <Trash2 size={12} /> Dismiss
        </button>
      </div>

      {/* Intervention Script */}
      <div className="border-t border-slate-100">
        <button
          onClick={() => setScriptOpen(o => !o)}
          className="w-full flex items-center justify-between px-4 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
        >
          <div className="flex items-center gap-1.5">
            <BookOpen size={13} className="text-blue-500" />
            2-Minute Intervention Script
          </div>
          {scriptOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>
        {scriptOpen && (
          <div className="px-4 pb-4">
            <div className="rounded-lg bg-blue-50 border border-blue-100 px-4 py-3 text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">
              {card.interventionScript || <em className="text-slate-400">No script generated.</em>}
            </div>
          </div>
        )}
      </div>

      {/* Exit Ticket */}
      <div className="border-t border-slate-100">
        <button
          onClick={() => setTicketOpen(o => !o)}
          className="w-full flex items-center justify-between px-4 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
        >
          <div className="flex items-center gap-1.5">
            <CheckCircle size={13} className="text-green-500" />
            Exit Ticket ({card.exitTicket?.length ?? 0} questions)
          </div>
          {ticketOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>
        {ticketOpen && (
          <div className="px-4 pb-4">
            {card.exitTicket && card.exitTicket.length > 0
              ? <ExitTicketPreview questions={card.exitTicket} />
              : <p className="text-xs text-slate-400 italic">No exit ticket questions.</p>
            }
          </div>
        )}
      </div>
    </div>
  );
}

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
      <div className="flex flex-col items-center justify-center py-16 text-slate-400">
        <AlertTriangle className="w-10 h-10 mb-3" />
        <p className="text-sm font-medium">Select a class and subject to view re-teach cards.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3 h-full">
      {/* Header */}
      <div className="shrink-0 flex items-center justify-between gap-2 bg-white border border-slate-200 rounded-lg px-3 py-2 shadow-sm">
        <div>
          <span className="text-sm font-bold text-slate-800">Re-teach Cards</span>
          <span className="ml-2 text-xs text-slate-400">AI-generated for underperforming topics</span>
        </div>
        <button
          onClick={handleGenerate}
          disabled={generating || isPolling}
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '6px 14px', borderRadius: 8,
            border: 'none', background: generating || isPolling ? '#e0e7ff' : '#4f46e5',
            color: generating || isPolling ? '#6366f1' : 'white',
            fontSize: 12, fontWeight: 700, cursor: generating || isPolling ? 'not-allowed' : 'pointer',
            fontFamily: 'inherit',
          }}
        >
          {generating || isPolling
            ? <><Loader2 size={13} className="animate-spin" /> Generating…</>
            : <><RefreshCw size={13} /> Generate Cards</>
          }
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
          </div>
        ) : isPolling ? (
          <div className="flex flex-col items-center justify-center py-16 text-slate-500">
            <Loader2 className="w-8 h-8 text-indigo-400 animate-spin mb-3" />
            <p className="text-sm font-medium">Analysing class mastery data…</p>
            <p className="text-xs text-slate-400 mt-1">This usually takes under 30 seconds.</p>
          </div>
        ) : noIssues && cards.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-slate-400">
            <CheckCircle className="w-10 h-10 text-green-400 mb-3" />
            <p className="text-sm font-semibold text-slate-600">No underperforming topics found</p>
            <p className="text-xs mt-1">The class is performing above the mastery threshold on all topics.</p>
            <button
              onClick={handleGenerate}
              className="mt-4 text-xs font-semibold px-4 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700"
            >
              Re-check
            </button>
          </div>
        ) : cards.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-slate-400">
            <BookOpen className="w-10 h-10 mb-3" />
            <p className="text-sm font-medium">No re-teach cards yet.</p>
            <button
              onClick={handleGenerate}
              className="mt-4 text-xs font-semibold px-4 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700"
            >
              Generate Cards
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-3 pb-4">
            {cards.map(card => (
              <CardItem key={card._id} card={card} onDismiss={handleDismiss} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ReteachCardsDashboard;
