import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, BookOpen, Target, Lightbulb, CheckCircle } from 'lucide-react';

interface MissionContentOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  resource: any;
}

const MissionContentOverlay: React.FC<MissionContentOverlayProps> = ({ isOpen, onClose, resource }) => {
  if (!resource) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[100]" 
          />
          {/* Panel */}
          <motion.div 
            initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed right-0 top-0 h-full w-full max-w-2xl bg-white shadow-2xl z-[101] overflow-y-auto"
          >
            <div className="sticky top-0 bg-white border-b border-slate-100 p-6 flex justify-between items-center">
              <div>
                <span className="text-[10px] font-black uppercase text-blue-600 tracking-widest bg-blue-50 px-2 py-1 rounded">
                  {resource.resourceType}
                </span>
                <h2 className="text-xl font-bold text-slate-900 mt-2">{resource.title}</h2>
              </div>
              <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                <X className="w-6 h-6 text-slate-400" />
              </button>
            </div>

            <div className="p-8 space-y-10 pb-20">
              {/* Theory Content (Natasha's Garden Example) */}
              {resource.resourceType === 'Theory' && (
                <div className="space-y-8">
                  <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100">
                    <h3 className="text-sm font-black uppercase text-slate-400 mb-4 flex items-center gap-2">
                      <Target className="w-4 h-4" /> Contextual Scenario
                    </h3>
                    <p className="text-lg font-bold text-slate-800 mb-2">{resource.content.relatable_context?.scenario}</p>
                    <p className="text-slate-600 leading-relaxed">{resource.content.relatable_context?.setup}</p>
                  </div>

                  <div className="grid grid-cols-1 gap-4">
                    <h3 className="text-sm font-black uppercase text-slate-400 mb-2">Key Insights</h3>
                    {resource.content.misconceptions?.aha_moments.map((aha: any, i: number) => (
                      <div key={i} className="flex gap-4 p-4 bg-emerald-50 border border-emerald-100 rounded-xl">
                        <Lightbulb className="text-emerald-500 shrink-0" />
                        <div>
                          <p className="text-sm font-bold text-emerald-900">{aha.pitfall}</p>
                          <p className="text-sm text-emerald-700 mt-1">{aha.correction}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Practice Content */}
              {resource.resourceType === 'Practice' && (
                <div className="space-y-6">
                  {resource.content.map((item: any, i: number) => (
                    <div key={i} className="border border-slate-100 rounded-2xl p-6 space-y-4 shadow-sm">
                      <div className="flex gap-3">
                        <span className="w-6 h-6 bg-slate-900 text-white rounded text-[10px] flex items-center justify-center font-bold">{i+1}</span>
                        <p className="font-bold text-slate-800">{item.question}</p>
                      </div>
                      <div className="pl-9 space-y-2">
                        {item.steps.map((step: string, j: number) => (
                          <div key={j} className="text-sm text-slate-500 flex gap-2">
                            <span className="text-blue-400">•</span> {step}
                          </div>
                        ))}
                      </div>
                      <div className="mt-4 pt-4 border-t border-dashed border-slate-100 text-sm font-black text-emerald-600 uppercase">
                        Correct Answer: {item.final_answer}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default MissionContentOverlay;