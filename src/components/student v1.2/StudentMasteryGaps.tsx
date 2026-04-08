import React, { useMemo } from 'react';
import { AlertCircle, Brain, CheckCircle2, Sparkles, Target } from 'lucide-react';
import { DevelopmentPlan, Subject } from '../../types';

type StudentMasteryGapsProps = {
  selectedSubjectId: string;
  subjects: Subject[];
  activePlan?: any | null; // Using any to handle root-level backend model
  onOpenTutor?: (prompt?: string) => void;
};

const StudentMasteryGaps: React.FC<StudentMasteryGapsProps> = ({
  selectedSubjectId,
  subjects: _subjects,
  activePlan,
  onOpenTutor,
}) => {
  /**
   * ADAPTOR LOGIC:
   * Maps the backend 'course' field (which could be an object or ID string)
   * to the frontend's selectedSubjectId.
   */
  const planForSubject = useMemo(() => {
    if (!activePlan) return null;

    // Handle both populated object { _id: "..." } and raw ID string
    const planCourseId = typeof activePlan.course === 'object' 
      ? activePlan.course._id 
      : activePlan.course;

    return planCourseId === selectedSubjectId ? activePlan : null;
  }, [activePlan, selectedSubjectId]);

  if (selectedSubjectId === 'all') {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-12 text-center">
        <Target className="w-12 h-12 text-slate-200 mx-auto mb-4" />
        <p className="text-slate-500 font-bold uppercase tracking-tight">Select a subject</p>
        <p className="text-slate-400 text-xs mt-1">View your current surgical remediation missions and gaps.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {planForSubject ? (
        <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_1.3fr] gap-6">
          {/* Left Column: Active Missions */}
          <div className="space-y-4">
            <h3 className="text-[10px] font-black uppercase text-slate-400 tracking-widest px-1">Remediation Path</h3>
            {(planForSubject.missions || []).map((mission: any) => (
              <div key={mission._id} className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 transition-all hover:border-blue-300 border-l-4 border-l-blue-600">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-black uppercase text-slate-800 tracking-tighter">
                    {mission.task}
                  </h3>
                  <span className={`text-[9px] font-black px-2 py-1 rounded-full uppercase tracking-tighter ${
                    mission.status === 'Completed' 
                      ? 'bg-emerald-100 text-emerald-700' 
                      : 'bg-amber-100 text-amber-700'
                  }`}>
                    {mission.status}
                  </span>
                </div>
                <p className="text-xs text-slate-500 leading-relaxed italic">
                  {mission.objective}
                </p>
                
                {onOpenTutor && (
                  <button
                    type="button"
                    onClick={() => onOpenTutor(`I'm working on my mission: "${mission.task}". Can you guide me through the core concepts?`)}
                    className="mt-4 flex items-center gap-2 text-[10px] font-black uppercase text-blue-600 hover:text-blue-800 tracking-widest transition-colors"
                  >
                    Ask AI Tutor for guidance →
                  </button>
                )}
              </div>
            ))}
          </div>

          {/* Right Column: Retrieval & Reflection */}
          <div className="space-y-4">
            {/* Retrieval Practice Card */}
            <div className="bg-slate-900 text-white rounded-2xl shadow-xl p-6 border border-white/5">
              <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-blue-400 mb-6">
                <Sparkles className="w-4 h-4" />
                Active Retrieval
              </div>
              
              <div className="space-y-4">
                {/* We focus retrieval on the first non-completed mission */}
                {planForSubject.missions?.filter((m: any) => m.status !== 'Completed').slice(0, 1).map((mission: any) => (
                  <div key={mission._id} className="bg-white/5 border border-white/10 rounded-2xl p-5">
                    <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-1">Current Focus</p>
                    <p className="text-sm font-bold text-white mb-2">{mission.task}</p>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      "Close your notes. Try to explain the steps to solve a problem in this area to the tutor."
                    </p>
                    <div className="flex gap-2 mt-5">
                      <button
                        type="button"
                        onClick={() => onOpenTutor?.(`Test my knowledge on ${mission.task} with a practical scenario.`)}
                        className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-black text-[10px] uppercase tracking-widest transition-all shadow-lg shadow-blue-900/20"
                      >
                        Start Practice
                      </button>
                      <button
                        type="button"
                        onClick={() => onOpenTutor?.(`What are the common ZIMSEC pitfalls for ${mission.task}?`)}
                        className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-black text-[10px] uppercase tracking-widest transition-all"
                      >
                        Pitfalls
                      </button>
                    </div>
                  </div>
                ))}
                {planForSubject.missions?.every((m: any) => m.status === 'Completed') && (
                   <div className="text-center py-6">
                      <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-2" />
                      <p className="text-xs font-bold text-slate-400 uppercase">Unit Mastered</p>
                   </div>
                )}
              </div>
            </div>

            {/* Surgical Checklist */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
              <div className="flex items-center gap-2 text-[10px] font-black uppercase text-slate-400 mb-6 tracking-widest">
                <AlertCircle className="w-4 h-4 text-amber-500" />
                Remediation Integrity
              </div>
              <ul className="space-y-4">
                {[
                  "I attempted the task before seeking AI hints.",
                  "I explained my reasoning in plain English.",
                  "I identified my specific misconception."
                ].map((text, idx) => (
                  <li key={idx} className="flex items-start gap-3">
                    <div className="mt-0.5 bg-emerald-50 rounded-full p-0.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    </div>
                    <span className="text-xs font-bold text-slate-600 uppercase tracking-tighter leading-tight">{text}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border-2 border-dashed border-slate-200 p-16 text-center">
          <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <Brain className="w-8 h-8 text-slate-200" />
          </div>
          <h3 className="text-slate-400 font-black uppercase tracking-widest text-sm">No Active Interventions</h3>
          <p className="text-slate-400 text-xs mt-2 max-w-xs mx-auto">
            You are performing at or above your personal average for this subject. Use the Tutor to explore advanced topics.
          </p>
        </div>
      )}

      {/* Footer Tip */}
      <div className="bg-blue-600 rounded-2xl shadow-xl p-6 text-white overflow-hidden relative group">
        <div className="relative z-10 flex items-center gap-4">
          <div className="bg-white/20 p-2 rounded-lg backdrop-blur-md">
            <Brain className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-200">Pro-Tip</p>
            <p className="text-sm font-bold leading-tight mt-1">
              The AI Tutor is a coach, not a calculator. Always attempt, explain, and then verify.
            </p>
          </div>
        </div>
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16 group-hover:scale-110 transition-transform duration-700" />
      </div>
    </div>
  );
};

export default StudentMasteryGaps;