import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { developmentService } from '../../services/api';
import { ArrowLeft, BookOpen, Lightbulb, CheckCircle, Pencil, Trophy } from 'lucide-react';

const AIResourceViewer: React.FC = () => {
  const { resourceId } = useParams<{ resourceId: string }>();
  const [resource, setResource] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchResource = async () => {
      try {
        if (resourceId) {
          const data = await developmentService.getAIResourceById(resourceId);
          setResource(data);
        }
      } catch (err) {
        console.error("Failed to load AI resource", err);
      } finally {
        setLoading(false);
      }
    };
    fetchResource();
  }, [resourceId]);

  if (loading) return <div className="p-10 text-center animate-pulse font-bold text-slate-500 italic">Consulting Digital Twin...</div>;
  if (!resource) return <div className="p-10 text-center text-red-500">Resource not found.</div>;

  const { resourceType, content, title, targetAttribute } = resource;

  // --- RENDERER A: THEORY ---
  const renderTheory = () => (
    <div className="space-y-8">
      <section className="bg-white rounded-3xl p-8 shadow-sm border border-slate-200">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-amber-100 text-amber-600 rounded-xl flex items-center justify-center"><BookOpen /></div>
          <h2 className="text-xl font-black text-slate-800 uppercase tracking-tight">The Scenario</h2>
        </div>
        <p className="text-lg font-bold text-blue-600 mb-2">{content.relatable_context?.scenario}</p>
        <p className="text-slate-600 leading-relaxed mb-6">{content.relatable_context?.setup}</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {content.relatable_context?.examples?.map((ex: any, i: number) => 
            Object.entries(ex).map(([key, val]: any) => (
              <div key={key} className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <span className="text-[10px] font-black uppercase text-slate-400 block mb-1">{key.replace('_', ' ')}</span>
                <p className="text-sm text-slate-700 font-medium">{val}</p>
              </div>
            ))
          )}
        </div>
      </section>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <section className="bg-rose-50 rounded-3xl p-6 border border-rose-100">
          <h3 className="text-rose-700 font-black uppercase text-xs mb-4 tracking-widest">Common Errors</h3>
          <ul className="space-y-3">
            {content.misconceptions?.common_errors?.map((err: string, i: number) => (
              <li key={i} className="text-sm text-rose-900 flex gap-2"><span className="font-black text-rose-400">✕</span> {err}</li>
            ))}
          </ul>
        </section>
        <section className="bg-emerald-50 rounded-3xl p-6 border border-emerald-100">
          <h3 className="text-emerald-700 font-black uppercase text-xs mb-4 tracking-widest flex items-center gap-2"><Lightbulb className="w-4 h-4" /> Aha Moments</h3>
          <div className="space-y-4">
            {content.misconceptions?.aha_moments?.map((aha: any, i: number) => (
              <div key={i} className="text-sm"><p className="font-black text-emerald-800 mb-1">{aha.pitfall}</p><p className="text-emerald-700 italic text-xs">"{aha.correction}"</p></div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );

  // --- RENDERER B: PRACTICE (ARRAY OF STEPS) ---
  const renderPractice = () => (
    <div className="space-y-6">
      {content.map((item: any, i: number) => (
        <section key={i} className="bg-white rounded-3xl p-8 shadow-sm border border-slate-200">
          <div className="flex gap-4 mb-4">
            <span className="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-xs">{i + 1}</span>
            <h3 className="text-lg font-bold text-slate-800">{item.question}</h3>
          </div>
          <div className="bg-blue-50 p-4 rounded-2xl mb-4 italic text-sm text-blue-700 border-l-4 border-blue-400">
            <strong>Hint:</strong> {item.hint}
          </div>
          <div className="space-y-2 mb-6">
            {item.steps?.map((step: string, j: number) => (
              <p key={j} className="text-sm text-slate-500 flex gap-2 font-medium">
                <span className="text-blue-400">→</span> {step}
              </p>
            ))}
          </div>
          <div className="bg-emerald-500 text-white p-4 rounded-2xl font-black text-center uppercase tracking-widest text-sm shadow-lg">
            Final Answer: {item.final_answer}
          </div>
        </section>
      ))}
    </div>
  );

  // --- RENDERER C: QUIZ (MCQ) ---
  const renderQuiz = () => (
    <div className="space-y-6">
      {content.map((item: any, i: number) => (
        <section key={i} className="bg-white rounded-3xl p-8 shadow-sm border border-slate-200">
          <h3 className="text-lg font-bold text-slate-800 mb-6">{i + 1}. {item.question}</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-6">
            {Object.entries(item.options).map(([key, val]: any) => (
              <div key={key} className={`p-4 rounded-2xl border-2 transition-all font-bold ${item.correct_answer === key ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : 'border-slate-100 bg-slate-50 text-slate-500 opacity-60'}`}>
                <span className="mr-2">{key}.</span> {val}
              </div>
            ))}
          </div>
          <div className="bg-slate-900 text-slate-300 p-4 rounded-2xl text-xs leading-relaxed italic">
            <span className="font-black text-blue-400 uppercase mr-2 tracking-tighter">Explanation:</span> {item.explanation}
          </div>
        </section>
      ))}
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      {/* Dynamic Header based on Resource Type */}
      <div className="bg-slate-900 text-white p-6 sticky top-0 z-20 shadow-lg">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-slate-400 hover:text-white mb-4 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back to Dashboard
        </button>
        <div className="flex items-center gap-4">
           <div className={`p-3 rounded-2xl ${resourceType === 'Theory' ? 'bg-blue-600' : resourceType === 'Practice' ? 'bg-amber-500' : 'bg-emerald-600'}`}>
              {resourceType === 'Theory' ? <BookOpen /> : resourceType === 'Practice' ? <Pencil /> : <Trophy />}
           </div>
           <div>
              <h1 className="text-2xl font-black tracking-tight">{title}</h1>
              <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mt-1">Targeting {targetAttribute}</p>
           </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-6">
        {resourceType === 'Theory' && renderTheory()}
        {resourceType === 'Practice' && renderPractice()}
        {resourceType === 'Quiz' && renderQuiz()}
      </div>
    </div>
  );
};

export default AIResourceViewer;