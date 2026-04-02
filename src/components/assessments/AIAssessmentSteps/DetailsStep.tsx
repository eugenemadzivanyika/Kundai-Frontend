import React, { useState, useMemo } from 'react';
import {
  ChevronRight,
  ChevronDown,
  Check,
  Target,
  BookOpen,
  AlertCircle,
  Filter,
  X,
} from 'lucide-react';
import { CourseAttribute } from '@/types';

interface LearningObjectivesStepProps {
  formData: { selectedAttributes: string[] };
  attributes: CourseAttribute[];
  onToggleAttribute: (id: string) => void;
}

const COLOUR_MAP: Record<number, { bg: string; text: string; ring: string; icon: string }> = {
  0: { bg: 'bg-blue-600',   text: 'text-white',        ring: 'ring-blue-200',   icon: 'text-white' },
  1: { bg: 'bg-purple-600', text: 'text-white',        ring: 'ring-purple-200', icon: 'text-white' },
  2: { bg: 'bg-emerald-600',text: 'text-white',        ring: 'ring-emerald-200',icon: 'text-white' },
  3: { bg: 'bg-orange-500', text: 'text-white',        ring: 'ring-orange-200', icon: 'text-white' },
  4: { bg: 'bg-red-600',    text: 'text-white',        ring: 'ring-red-200',    icon: 'text-white' },
};
const getColour = (i: number) => COLOUR_MAP[i % 5];

export function LearningObjectivesStep({
  formData,
  attributes,
  onToggleAttribute,
}: LearningObjectivesStepProps) {
  // Group: level → { topicName → attrs[] }
  const groupedData = useMemo(() => {
    return attributes.reduce((acc, attr) => {
      const level = attr.level || 'General';
      const topic = attr.parent_unit || 'General';
      if (!acc[level]) acc[level] = {};
      if (!acc[level][topic]) acc[level][topic] = [];
      acc[level][topic].push(attr);
      return acc;
    }, {} as Record<string, Record<string, CourseAttribute[]>>);
  }, [attributes]);

  const levels = useMemo(() => Object.keys(groupedData).sort(), [groupedData]);
  const [activeLevel, setActiveLevel] = useState<string>('All');
  const [expandedTopics, setExpandedTopics] = useState<string[]>([]);

  const toggleTopic = (key: string) =>
    setExpandedTopics((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );

  const visibleLevels =
    activeLevel === 'All' ? levels : levels.filter((l) => l === activeLevel);

  const totalSelected = formData.selectedAttributes.length;

  const countInTopic = (attrs: CourseAttribute[]) =>
    attrs.filter((a) => formData.selectedAttributes.includes(a._id)).length;

  if (attributes.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3 text-center">
        <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center">
          <AlertCircle className="w-6 h-6 text-gray-400" />
        </div>
        <p className="text-sm font-semibold text-gray-600">No learning objectives found for this course.</p>
        <p className="text-xs text-gray-400">Add objectives in course settings to continue.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 h-full">

      {/* ── Top bar ── */}
      <div className="flex items-center justify-between pb-1 border-b border-gray-100">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-blue-50 border border-blue-100 rounded-lg flex items-center justify-center">
            <Target className="w-4 h-4 text-blue-600" />
          </div>
          <div>
            <p className="text-sm font-bold text-gray-900">Assessment  Focus Areas</p>
            <p className="text-[11px] text-gray-500">Pick the objectives this assessment will cover</p>
          </div>
        </div>
        {totalSelected > 0 && (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-blue-600 text-white rounded-full text-xs font-bold">
            <Check className="w-3 h-3" /> {totalSelected} selected
          </span>
        )}
      </div>

      <div className="flex gap-4 flex-1 min-h-0" style={{ height: '380px' }}>

        {/* ── LEFT: Level filter ── */}
        <div className="w-36 shrink-0 flex flex-col gap-1 overflow-y-auto">
          <div className="flex items-center gap-1 mb-1 text-gray-400">
            <Filter className="w-3 h-3" />
            <span className="text-[9px] font-black uppercase tracking-widest">Syllabus</span>
          </div>
          {['All', ...levels].map((lvl, i) => {
            const sel = activeLevel === lvl;
            return (
              <button
                key={lvl}
                onClick={() => setActiveLevel(lvl)}
                className={`flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold transition-all text-left
                  ${sel ? 'bg-blue-600 text-white shadow-sm' : 'text-gray-600 hover:bg-gray-100'}`}
              >
                <span className="truncate">{lvl === 'All' ? 'All Levels' : lvl}</span>
                {sel && <Check className="w-3 h-3 shrink-0 ml-1" />}
              </button>
            );
          })}
        </div>

        {/* Divider */}
        <div className="w-px bg-gray-100 shrink-0" />

        {/* ── RIGHT: Topics + 2-col attribute grid ── */}
        <div className="flex-1 overflow-y-auto space-y-3 pr-1">
          {visibleLevels.map((level, levelIdx) => {
            const colour = getColour(levelIdx);
            return (
              <div key={level} className="space-y-2">
                {/* Level badge */}
                <div className="sticky top-0 z-10 bg-white/95 backdrop-blur py-1">
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${colour.bg} ${colour.text}`}>
                    <BookOpen className="w-3 h-3" /> {level}
                  </span>
                </div>

                {/* Topics within this level */}
                {Object.entries(groupedData[level]).map(([topicName, attrs]) => {
                  const key = `${level}-${topicName}`;
                  const isExpanded = expandedTopics.includes(key);
                  const sel = countInTopic(attrs);
                  const allSel = sel === attrs.length;

                  return (
                    <div key={key} className="border border-gray-100 rounded-xl overflow-hidden bg-white shadow-sm">
                      {/* Topic header */}
                      {/* Change <button> to <div> */}
                      <div
                        role="button" // Accessibility hint
                        tabIndex={0}  // Makes it focusable
                        onClick={() => toggleTopic(key)}
                        onKeyDown={(e) => e.key === 'Enter' && toggleTopic(key)} // Keyboard support
                        className={`w-full flex items-center gap-3 px-4 py-3 text-left cursor-pointer transition-colors ${
                          isExpanded ? 'bg-blue-50/50' : 'hover:bg-gray-50'
                        }`}
                      >
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ...`}>
                          <BookOpen className="w-3.5 h-3.5" />
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold text-gray-800 truncate">{topicName}</p>
                          <p className="text-[10px] text-gray-500">{attrs.length} objective{attrs.length !== 1 ? 's' : ''}</p>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          {sel > 0 && (
                            <span className={`text-[10px] font-black px-1.5 py-0.5 rounded-md ${colour.bg} text-white`}>
                              {sel}/{attrs.length}
                            </span>
                          )}
                          
                          {/* NOW THIS BUTTON IS VALID BECAUSE THE PARENT IS A DIV */}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              attrs.forEach((a) => {
                                const currentlySelected = formData.selectedAttributes.includes(a._id);
                                if (allSel ? currentlySelected : !currentlySelected) {
                                  onToggleAttribute(a._id);
                                }
                              });
                            }}
                            className="text-[10px] font-bold text-blue-600 hover:text-blue-800 px-1.5 py-0.5 rounded hover:bg-blue-50 transition-colors"
                          >
                            {allSel ? 'None' : 'All'}
                          </button>
                          
                          {isExpanded ? <ChevronDown className="..." /> : <ChevronRight className="..." />}
                        </div>
                      </div>

                      {/* 2-column attribute grid */}
                      {isExpanded && (
                        <div className="p-3 pt-0 border-t border-gray-50 bg-gray-50/50 grid grid-cols-2 gap-2 animate-in slide-in-from-top-1 duration-150">
                          {attrs.map((attr) => {
                            const checked = formData.selectedAttributes.includes(attr._id);
                            return (
                              <button
                                key={attr._id}
                                onClick={() => onToggleAttribute(attr._id)}
                                className={`flex items-start gap-2.5 p-3 rounded-xl border-2 text-left transition-all
                                  ${checked
                                    ? 'border-blue-400 bg-white shadow-sm ring-2 ring-blue-50'
                                    : 'border-white bg-white/60 hover:border-gray-200 hover:bg-white'
                                  }`}
                              >
                                {/* Checkbox */}
                                <span className={`mt-0.5 shrink-0 w-4 h-4 rounded border-2 flex items-center justify-center transition-colors
                                  ${checked ? `${colour.bg} border-transparent` : 'border-gray-300 bg-white'}`}>
                                  {checked && <Check className="w-2.5 h-2.5 text-white" />}
                                </span>
                                <span className="min-w-0">
                                  <span className="block text-[11px] font-bold text-gray-800 leading-snug">{attr.name}</span>
                                  {attr.description && (
                                    <span className="block text-[10px] text-gray-500 mt-0.5 leading-relaxed line-clamp-2">{attr.description}</span>
                                  )}
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Selected pills strip ── */}
      {totalSelected > 0 && (
        <div className="pt-3 border-t border-gray-100">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[10px] font-black text-gray-400 uppercase tracking-wider shrink-0">Selected:</span>
            {formData.selectedAttributes.map((id) => {
              const attr = attributes.find((a) => a._id === id);
              if (!attr) return null;
              return (
                <span key={id} className="inline-flex items-center gap-1 pl-2 pr-1 py-0.5 bg-blue-100 text-blue-800 rounded-full text-[11px] font-semibold">
                  {attr.name}
                  <button onClick={() => onToggleAttribute(id)} className="hover:bg-blue-200 rounded-full p-0.5 transition-colors">
                    <X className="w-2.5 h-2.5" />
                  </button>
                </span>
              );
            })}
          </div>
        </div>
      )}

      {/* Validation nudge */}
      {totalSelected === 0 && (
        <div className="flex items-center gap-2 px-3 py-2 bg-amber-50 border border-amber-200 rounded-lg">
          <AlertCircle className="w-3.5 h-3.5 text-amber-500 shrink-0" />
          <p className="text-xs text-amber-700">Select at least one objective to continue.</p>
        </div>
      )}
    </div>
  );
}