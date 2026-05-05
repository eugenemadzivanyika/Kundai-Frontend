import React, { useEffect, useMemo, useState } from 'react';
import {
  BookOpen,
  ChevronDown,
  ChevronRight,
  Filter,
  Pencil,
  Plus,
  RefreshCw,
  Trash2,
} from 'lucide-react';
import { subjectService, curriculumService } from '../../../services/api';
import AdminSectionHeader from '../components/AdminSectionHeader';
import AdminConfirmDialog from '../components/AdminConfirmDialog';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '../../ui/dialog';
import { useToast } from '../../ui/use-toast';

const FORM_LEVELS = ['Form 1', 'Form 2', 'Form 3', 'Form 4', 'Form 5', 'Form 6'];

const COLOUR_MAP: Record<number, { bg: string; text: string; light: string }> = {
  0: { bg: 'bg-blue-600',    text: 'text-white', light: 'bg-blue-50 border-blue-200' },
  1: { bg: 'bg-purple-600',  text: 'text-white', light: 'bg-purple-50 border-purple-200' },
  2: { bg: 'bg-emerald-600', text: 'text-white', light: 'bg-emerald-50 border-emerald-200' },
  3: { bg: 'bg-orange-500',  text: 'text-white', light: 'bg-orange-50 border-orange-200' },
  4: { bg: 'bg-red-600',     text: 'text-white', light: 'bg-red-50 border-red-200' },
};
const getColour = (i: number) => COLOUR_MAP[i % 5];

interface SubjectOption {
  id: string;
  code: string;
  name: string;
  grades: string[];
}

interface TopicItem {
  id: string;
  code: string;
  name: string;
  description: string;
  sequenceIndex: number;
  parent_unit: string;
  level: string;
}

interface TopicFormState {
  code: string;
  name: string;
  description: string;
  sequenceIndex: string;
  parent_unit: string;
  level: string;
}

interface SubjectFormState {
  code: string;
  name: string;
  examBoardCode: string;
  description: string;
  grades: string[];
}

const defaultTopicForm: TopicFormState = {
  code: '', name: '', description: '', sequenceIndex: '', parent_unit: '', level: '',
};
const defaultSubjectForm: SubjectFormState = {
  code: '', name: '', examBoardCode: 'ZIMSEC', description: '', grades: [],
};

function groupByLevelThenUnit(topics: TopicItem[]): Record<string, Record<string, TopicItem[]>> {
  return topics.reduce((acc, t) => {
    const level = t.level.trim() || 'General';
    const unit = t.parent_unit.trim() || 'General';
    if (!acc[level]) acc[level] = {};
    if (!acc[level][unit]) acc[level][unit] = [];
    acc[level][unit].push(t);
    return acc;
  }, {} as Record<string, Record<string, TopicItem[]>>);
}

const AdminCurriculumPage: React.FC = () => {
  const { toast } = useToast();

  // -- subjects --
  const [subjects, setSubjects] = useState<SubjectOption[]>([]);
  const [selectedForm, setSelectedForm] = useState<string>('All');

  // -- accordion state --
  const [expandedSubjectIds, setExpandedSubjectIds] = useState<Set<string>>(new Set());
  const [expandedUnits, setExpandedUnits] = useState<Set<string>>(new Set());

  // -- topics lazy cache: subjectId → TopicItem[] --
  const [topicsCache, setTopicsCache] = useState<Record<string, TopicItem[]>>({});
  const [loadingIds, setLoadingIds] = useState<Set<string>>(new Set());

  // -- topic dialog --
  const [isTopicOpen, setIsTopicOpen] = useState(false);
  const [editingTopicId, setEditingTopicId] = useState<string | null>(null);
  const [activeSubjectId, setActiveSubjectId] = useState<string>('');
  const [topicForm, setTopicForm] = useState<TopicFormState>(defaultTopicForm);
  const [deleteTopicTarget, setDeleteTopicTarget] = useState<{ id: string; name: string } | null>(null);

  // -- subject dialog --
  const [isSubjectOpen, setIsSubjectOpen] = useState(false);
  const [subjectForm, setSubjectForm] = useState<SubjectFormState>(defaultSubjectForm);
  const [subjectSaving, setSubjectSaving] = useState(false);

  // subjects visible in current form filter
  const visibleSubjects = useMemo(() => {
    if (selectedForm === 'All') return subjects;
    return subjects.filter((s) => s.grades.includes(selectedForm));
  }, [subjects, selectedForm]);

  const loadSubjects = async () => {
    try {
      const data = await subjectService.getSubjects();
      setSubjects(
        (Array.isArray(data) ? data : []).map((s: any) => ({
          id: s.id,
          code: s.code || '',
          name: s.name || '',
          grades: Array.isArray(s.grades) ? s.grades : [],
        }))
      );
    } catch (err: any) {
      toast.error(err?.message || 'Failed to load subjects.');
    }
  };

  const fetchTopics = async (subjectId: string) => {
    setLoadingIds((prev) => new Set(prev).add(subjectId));
    try {
      const data = await curriculumService.listTopics(subjectId);
      const topics: TopicItem[] = (Array.isArray(data) ? data : []).map((t: any) => ({
        id: t.id,
        code: t.code || '',
        name: t.name || '',
        description: t.description || '',
        sequenceIndex: t.sequenceIndex ?? 0,
        parent_unit: t.parent_unit || '',
        level: t.level || '',
      }));
      setTopicsCache((prev) => ({ ...prev, [subjectId]: topics }));
    } catch (err: any) {
      toast.error(err?.message || 'Failed to load topics.');
    } finally {
      setLoadingIds((prev) => {
        const next = new Set(prev);
        next.delete(subjectId);
        return next;
      });
    }
  };

  useEffect(() => { loadSubjects(); }, []);

  // -- accordion toggles --
  const toggleSubject = async (id: string) => {
    setExpandedSubjectIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) { next.delete(id); } else { next.add(id); }
      return next;
    });
    if (!topicsCache[id]) {
      await fetchTopics(id);
    }
  };

  const toggleUnit = (key: string) => {
    setExpandedUnits((prev) => {
      const next = new Set(prev);
      if (next.has(key)) { next.delete(key); } else { next.add(key); }
      return next;
    });
  };

  // -- topic CRUD --
  const openCreateTopic = (subjectId: string, prefillUnit = '') => {
    const subject = subjects.find((s) => s.id === subjectId);
    setActiveSubjectId(subjectId);
    setEditingTopicId(null);
    setTopicForm({
      ...defaultTopicForm,
      parent_unit: prefillUnit,
      level: subject?.grades[0] || '',
    });
    setIsTopicOpen(true);
  };

  const openEditTopic = (topic: TopicItem, subjectId: string) => {
    setActiveSubjectId(subjectId);
    setEditingTopicId(topic.id);
    setTopicForm({
      code: topic.code,
      name: topic.name,
      description: topic.description,
      sequenceIndex: topic.sequenceIndex != null ? String(topic.sequenceIndex) : '',
      parent_unit: topic.parent_unit,
      level: topic.level,
    });
    setIsTopicOpen(true);
  };

  const saveTopic = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topicForm.code.trim() || !topicForm.name.trim()) {
      toast.error('Code and name are required.');
      return;
    }
    const payload = {
      code: topicForm.code.trim(),
      name: topicForm.name.trim(),
      description: topicForm.description.trim() || undefined,
      sequenceIndex: topicForm.sequenceIndex ? Number(topicForm.sequenceIndex) : undefined,
      parent_unit: topicForm.parent_unit.trim() || undefined,
      level: topicForm.level.trim() || undefined,
    };
    try {
      if (editingTopicId) {
        await curriculumService.updateTopic(editingTopicId, payload);
        toast.success('Topic updated.');
      } else {
        await curriculumService.createTopic(activeSubjectId, payload);
        toast.success('Topic created.');
      }
      setIsTopicOpen(false);
      // Refresh cache for this subject
      delete topicsCache[activeSubjectId];
      await fetchTopics(activeSubjectId);
    } catch (err: any) {
      toast.error(err?.message || 'Failed to save topic.');
    }
  };

  const deleteTopic = async () => {
    if (!deleteTopicTarget) return;
    try {
      await curriculumService.deleteTopic(deleteTopicTarget.id);
      toast.success('Topic deleted.');
      // Find which subject owns this topic and refresh it
      const subjectId = Object.keys(topicsCache).find((sid) =>
        topicsCache[sid].some((t) => t.id === deleteTopicTarget.id)
      );
      setDeleteTopicTarget(null);
      if (subjectId) {
        delete topicsCache[subjectId];
        await fetchTopics(subjectId);
      }
    } catch (err: any) {
      toast.error(err?.message || 'Failed to delete topic.');
    }
  };

  // -- subject CRUD --
  const saveSubject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subjectForm.code.trim() || !subjectForm.name.trim()) {
      toast.error('Code and name are required.');
      return;
    }
    setSubjectSaving(true);
    try {
      await subjectService.createSubject({
        code: subjectForm.code.trim(),
        name: subjectForm.name.trim(),
        examBoardCode: subjectForm.examBoardCode || undefined,
        description: subjectForm.description.trim() || undefined,
        grades: subjectForm.grades,
      });
      toast.success('Subject created.');
      setIsSubjectOpen(false);
      await loadSubjects();
    } catch (err: any) {
      toast.error(err?.message || 'Failed to create subject.');
    } finally {
      setSubjectSaving(false);
    }
  };

  const toggleSubjectGrade = (grade: string) =>
    setSubjectForm((prev) => ({
      ...prev,
      grades: prev.grades.includes(grade)
        ? prev.grades.filter((g) => g !== grade)
        : [...prev.grades, grade],
    }));

  return (
    <div className="space-y-4">
      <AdminSectionHeader
        title="Curriculum"
        description="Course topics grouped by form level and unit."
        icon={BookOpen}
      />

      {/* Two-panel layout */}
      <div className="flex gap-4 min-h-[calc(100vh-200px)]">

        {/* ── LEFT: Form level sidebar ── */}
        <div className="w-44 shrink-0 bg-white rounded-lg shadow-sm border border-slate-100 p-3 flex flex-col gap-1 self-start sticky top-4">
          <div className="flex items-center gap-1.5 mb-2 text-slate-400">
            <Filter className="w-3 h-3" />
            <span className="text-[9px] font-black uppercase tracking-widest">Syllabus</span>
          </div>
          {['All', ...FORM_LEVELS].map((lvl) => {
            const count = lvl === 'All'
              ? subjects.length
              : subjects.filter((s) => s.grades.includes(lvl)).length;
            const active = selectedForm === lvl;
            return (
              <button
                key={lvl}
                onClick={() => setSelectedForm(lvl)}
                className={`flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold transition-all text-left ${
                  active
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <span className="truncate">{lvl === 'All' ? 'All Levels' : lvl}</span>
                <span className={`text-[10px] font-bold shrink-0 ml-1 ${active ? 'text-blue-200' : 'text-slate-400'}`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* ── RIGHT: Subject accordions ── */}
        <div className="flex-1 min-w-0 space-y-3">
          {/* Top action bar */}
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
              {visibleSubjects.length} subject{visibleSubjects.length !== 1 ? 's' : ''}{selectedForm !== 'All' ? ` — ${selectedForm}` : ''}
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={loadSubjects}
                className="p-1.5 border border-slate-200 rounded-md hover:bg-slate-50"
                title="Refresh"
              >
                <RefreshCw className="h-3.5 w-3.5 text-slate-500" />
              </button>
              <button
                onClick={() => {
                  setSubjectForm({ ...defaultSubjectForm, grades: selectedForm !== 'All' ? [selectedForm] : [] });
                  setIsSubjectOpen(true);
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold bg-blue-600 text-white hover:bg-blue-700"
              >
                <Plus className="h-3.5 w-3.5" />
                Add Subject
              </button>
            </div>
          </div>

          {visibleSubjects.length === 0 && (
            <div className="bg-white rounded-lg border border-slate-100 shadow-sm p-10 text-center text-slate-400 text-sm">
              No subjects for {selectedForm === 'All' ? 'any form level' : selectedForm} yet.
            </div>
          )}

          {visibleSubjects.map((subject, subjectIdx) => {
            const colour = getColour(subjectIdx);
            const isExpanded = expandedSubjectIds.has(subject.id);
            const isLoading = loadingIds.has(subject.id);
            const allTopics = topicsCache[subject.id] || [];
            // Two-level grouping: form level → parent unit → topics
            const levelGroups = groupByLevelThenUnit(allTopics);
            // When a specific form is selected, only show that level's topics
            const visibleLevelNames = selectedForm === 'All'
              ? Object.keys(levelGroups).sort()
              : Object.keys(levelGroups).filter((l) => l === selectedForm);
            const topicCount = visibleLevelNames.reduce(
              (sum, lvl) => sum + Object.values(levelGroups[lvl]).flat().length, 0
            );
            // Only show the level badge when multiple levels are visible
            const showLevelBadge = selectedForm === 'All' && visibleLevelNames.length > 1;

            return (
              <div
                key={subject.id}
                className="bg-white rounded-lg border border-slate-100 shadow-sm overflow-hidden"
              >
                {/* Subject header */}
                <div
                  role="button"
                  tabIndex={0}
                  onClick={() => toggleSubject(subject.id)}
                  onKeyDown={(e) => e.key === 'Enter' && toggleSubject(subject.id)}
                  className={`flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors select-none ${
                    isExpanded ? 'bg-slate-50' : 'hover:bg-slate-50'
                  }`}
                >
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${colour.bg}`}>
                    <BookOpen className="w-3.5 h-3.5 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-slate-800 truncate">{subject.name}</p>
                    <p className="text-[11px] text-slate-400">
                      {subject.code}
                      {subject.grades.length > 0 && (
                        <span className="ml-2">{subject.grades.join(', ')}</span>
                      )}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {isExpanded && topicCount > 0 && (
                      <span className={`text-[10px] font-black px-1.5 py-0.5 rounded-md ${colour.bg} text-white`}>
                        {topicCount} topic{topicCount !== 1 ? 's' : ''}
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        openCreateTopic(subject.id);
                      }}
                      className="text-[10px] font-bold text-blue-600 hover:text-blue-800 px-1.5 py-0.5 rounded hover:bg-blue-50 transition-colors"
                    >
                      + Topic
                    </button>
                    {isLoading
                      ? <RefreshCw className="w-4 h-4 text-slate-400 animate-spin" />
                      : isExpanded
                        ? <ChevronDown className="w-4 h-4 text-slate-400" />
                        : <ChevronRight className="w-4 h-4 text-slate-400" />
                    }
                  </div>
                </div>

                {/* Expanded content: level → parent unit → topics */}
                {isExpanded && (
                  <div className="border-t border-slate-100">
                    {isLoading && (
                      <div className="p-4 space-y-2">
                        {[1, 2, 3].map((i) => (
                          <div key={i} className="h-8 bg-slate-100 rounded animate-pulse" />
                        ))}
                      </div>
                    )}

                    {!isLoading && allTopics.length === 0 && (
                      <div className="p-6 text-center text-slate-400 text-xs">
                        No topics yet.{' '}
                        <button
                          className="text-blue-600 hover:underline font-medium"
                          onClick={() => openCreateTopic(subject.id)}
                        >
                          Add the first topic
                        </button>
                      </div>
                    )}

                    {!isLoading && allTopics.length > 0 && topicCount === 0 && (
                      <div className="p-6 text-center text-slate-400 text-xs">
                        No {selectedForm} topics for this subject.
                      </div>
                    )}

                    {!isLoading && visibleLevelNames.map((levelName, levelIdx) => {
                      const lvlColour = getColour(levelIdx);
                      const unitGroups = levelGroups[levelName];
                      const unitNames = Object.keys(unitGroups).sort();
                      return (
                        <div key={levelName} className="divide-y divide-slate-50">
                          {/* Level badge — only shown in "All" view */}
                          {showLevelBadge && (
                            <div className="sticky top-0 z-10 bg-white/95 backdrop-blur px-4 py-2 border-b border-slate-100">
                              <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${lvlColour.bg} text-white`}>
                                <BookOpen className="w-3 h-3" /> {levelName}
                              </span>
                            </div>
                          )}

                          {unitNames.map((unitName, unitIdx) => {
                            const unitKey = `${subject.id}::${levelName}::${unitName}`;
                            const isUnitOpen = expandedUnits.has(unitKey);
                            const unitTopics = unitGroups[unitName].sort(
                              (a, b) => a.sequenceIndex - b.sequenceIndex
                            );
                            const unitColour = getColour(unitIdx);

                            return (
                              <div key={unitKey} className="bg-white">
                                {/* Parent-unit header */}
                                <div
                                  role="button"
                                  tabIndex={0}
                                  onClick={() => toggleUnit(unitKey)}
                                  onKeyDown={(e) => e.key === 'Enter' && toggleUnit(unitKey)}
                                  className={`flex items-center gap-3 px-5 py-2.5 cursor-pointer transition-colors select-none ${
                                    isUnitOpen ? 'bg-slate-50/80' : 'hover:bg-slate-50'
                                  }`}
                                >
                                  <div className={`w-1 h-4 rounded-full shrink-0 ${unitColour.bg}`} />
                                  <div className="flex-1 min-w-0">
                                    <p className="text-xs font-bold text-slate-700 truncate">{unitName}</p>
                                    <p className="text-[10px] text-slate-400">
                                      {unitTopics.length} topic{unitTopics.length !== 1 ? 's' : ''}
                                    </p>
                                  </div>
                                  <div className="flex items-center gap-2 shrink-0">
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        openCreateTopic(subject.id, unitName);
                                      }}
                                      className="text-[10px] font-bold text-blue-600 hover:text-blue-800 px-1.5 py-0.5 rounded hover:bg-blue-50"
                                    >
                                      + Add
                                    </button>
                                    {isUnitOpen
                                      ? <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                                      : <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                                    }
                                  </div>
                                </div>

                                {/* Topics table */}
                                {isUnitOpen && (
                                  <div className="mx-5 mb-2 rounded-lg border border-slate-100 bg-slate-50/50 overflow-hidden">
                                    <table className="min-w-full text-xs">
                                      <thead>
                                        <tr className="border-b border-slate-100 text-slate-400 uppercase tracking-wide">
                                          <th className="py-2 px-3 text-left w-8">#</th>
                                          <th className="py-2 px-3 text-left w-24">Code</th>
                                          <th className="py-2 px-3 text-left">Topic</th>
                                          <th className="py-2 px-3 text-left hidden md:table-cell">Objectives</th>
                                          <th className="py-2 px-3 text-right">Actions</th>
                                        </tr>
                                      </thead>
                                      <tbody>
                                        {unitTopics.map((topic) => (
                                          <tr
                                            key={topic.id}
                                            className="border-b border-slate-100 last:border-0 hover:bg-white transition-colors"
                                          >
                                            <td className="py-2 px-3 text-slate-400">{topic.sequenceIndex || '—'}</td>
                                            <td className="py-2 px-3 font-mono text-slate-500">{topic.code}</td>
                                            <td className="py-2 px-3 font-semibold text-slate-800">{topic.name}</td>
                                            <td className="py-2 px-3 text-slate-500 hidden md:table-cell max-w-xs truncate">
                                              {topic.description || '—'}
                                            </td>
                                            <td className="py-2 px-3 text-right">
                                              <div className="flex items-center justify-end gap-3">
                                                <button
                                                  onClick={() => openEditTopic(topic, subject.id)}
                                                  className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-700"
                                                >
                                                  <Pencil className="h-3 w-3" /> Edit
                                                </button>
                                                <button
                                                  onClick={() => setDeleteTopicTarget({ id: topic.id, name: topic.name })}
                                                  className="inline-flex items-center gap-1 text-red-600 hover:text-red-700"
                                                >
                                                  <Trash2 className="h-3 w-3" /> Delete
                                                </button>
                                              </div>
                                            </td>
                                          </tr>
                                        ))}
                                      </tbody>
                                    </table>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      );
                    })}

                    {/* Footer */}
                    {!isLoading && allTopics.length > 0 && (
                      <div className="px-5 py-2.5 border-t border-slate-100">
                        <button
                          onClick={() => openCreateTopic(subject.id)}
                          className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 font-medium"
                        >
                          <Plus className="h-3 w-3" />
                          Add topic to {subject.name}
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Topic dialog ── */}
      <Dialog open={isTopicOpen} onOpenChange={setIsTopicOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingTopicId ? 'Edit Topic' : 'Add Topic'}</DialogTitle>
            <DialogDescription>
              {subjects.find((s) => s.id === activeSubjectId)?.name || 'Curriculum topic'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={saveTopic} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-slate-500">Code *</label>
                <input
                  value={topicForm.code}
                  onChange={(e) => setTopicForm((p) => ({ ...p, code: e.target.value }))}
                  className="w-full border border-slate-200 rounded-md px-3 py-2 text-sm mt-1"
                  placeholder="e.g. ALG-1"
                />
              </div>
              <div>
                <label className="text-xs text-slate-500">Sequence</label>
                <input
                  type="number"
                  value={topicForm.sequenceIndex}
                  onChange={(e) => setTopicForm((p) => ({ ...p, sequenceIndex: e.target.value }))}
                  className="w-full border border-slate-200 rounded-md px-3 py-2 text-sm mt-1"
                  placeholder="1"
                />
              </div>
            </div>
            <div>
              <label className="text-xs text-slate-500">Topic name *</label>
              <input
                value={topicForm.name}
                onChange={(e) => setTopicForm((p) => ({ ...p, name: e.target.value }))}
                className="w-full border border-slate-200 rounded-md px-3 py-2 text-sm mt-1"
                placeholder="e.g. Algebraic Expressions"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-slate-500">Parent unit</label>
                <input
                  value={topicForm.parent_unit}
                  onChange={(e) => setTopicForm((p) => ({ ...p, parent_unit: e.target.value }))}
                  className="w-full border border-slate-200 rounded-md px-3 py-2 text-sm mt-1"
                  placeholder="e.g. Algebra"
                />
              </div>
              <div>
                <label className="text-xs text-slate-500">Level</label>
                <select
                  value={topicForm.level}
                  onChange={(e) => setTopicForm((p) => ({ ...p, level: e.target.value }))}
                  className="w-full border border-slate-200 rounded-md px-3 py-2 text-sm mt-1"
                >
                  <option value="">— select —</option>
                  {FORM_LEVELS.map((f) => (
                    <option key={f} value={f}>{f}</option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <label className="text-xs text-slate-500">Objectives</label>
              <textarea
                value={topicForm.description}
                onChange={(e) => setTopicForm((p) => ({ ...p, description: e.target.value }))}
                className="w-full min-h-[80px] border border-slate-200 rounded-md px-3 py-2 text-sm mt-1"
                placeholder="Learning objectives for this topic"
              />
            </div>
            <div className="flex justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setIsTopicOpen(false)}
                className="px-4 py-2 text-sm border border-slate-200 rounded-md text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-sm font-medium bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                {editingTopicId ? 'Update' : 'Create'}
              </button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* ── Add Subject dialog ── */}
      <Dialog open={isSubjectOpen} onOpenChange={setIsSubjectOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Add Subject</DialogTitle>
            <DialogDescription>Create a new subject for the curriculum catalog.</DialogDescription>
          </DialogHeader>
          <form onSubmit={saveSubject} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-slate-500">Code *</label>
                <input
                  value={subjectForm.code}
                  onChange={(e) => setSubjectForm((p) => ({ ...p, code: e.target.value }))}
                  className="w-full border border-slate-200 rounded-md px-3 py-2 text-sm mt-1"
                  placeholder="e.g. MATH-F1"
                  required
                />
              </div>
              <div>
                <label className="text-xs text-slate-500">Name *</label>
                <input
                  value={subjectForm.name}
                  onChange={(e) => setSubjectForm((p) => ({ ...p, name: e.target.value }))}
                  className="w-full border border-slate-200 rounded-md px-3 py-2 text-sm mt-1"
                  placeholder="e.g. Mathematics Form 1"
                  required
                />
              </div>
            </div>
            <div>
              <label className="text-xs text-slate-500">Exam board</label>
              <select
                value={subjectForm.examBoardCode}
                onChange={(e) => setSubjectForm((p) => ({ ...p, examBoardCode: e.target.value }))}
                className="w-full border border-slate-200 rounded-md px-3 py-2 text-sm mt-1"
              >
                <option value="ZIMSEC">ZIMSEC</option>
                <option value="CAMBRIDGE">Cambridge</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-slate-500 block mb-1">Form levels</label>
              <div className="flex flex-wrap gap-3">
                {FORM_LEVELS.map((f) => (
                  <label key={f} className="flex items-center gap-1.5 text-sm cursor-pointer">
                    <input
                      type="checkbox"
                      checked={subjectForm.grades.includes(f)}
                      onChange={() => toggleSubjectGrade(f)}
                      className="rounded"
                    />
                    {f}
                  </label>
                ))}
              </div>
            </div>
            <div>
              <label className="text-xs text-slate-500">Description</label>
              <textarea
                value={subjectForm.description}
                onChange={(e) => setSubjectForm((p) => ({ ...p, description: e.target.value }))}
                className="w-full min-h-[70px] border border-slate-200 rounded-md px-3 py-2 text-sm mt-1"
                placeholder="Subject scope or objectives"
              />
            </div>
            <div className="flex justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setIsSubjectOpen(false)}
                className="px-4 py-2 text-sm border border-slate-200 rounded-md text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={subjectSaving}
                className="px-4 py-2 text-sm font-medium bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-60"
              >
                {subjectSaving ? 'Saving…' : 'Create Subject'}
              </button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <AdminConfirmDialog
        open={!!deleteTopicTarget}
        title="Delete topic"
        description={`Remove "${deleteTopicTarget?.name}" from the curriculum?`}
        onConfirm={deleteTopic}
        onOpenChange={(open) => { if (!open) setDeleteTopicTarget(null); }}
        confirmLabel="Delete"
      />
    </div>
  );
};

export default AdminCurriculumPage;
