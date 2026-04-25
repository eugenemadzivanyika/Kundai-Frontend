import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Dialog, DialogContent, DialogTitle } from '../ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Loader2, ChevronRight, ChevronLeft, X,
  BookOpen, Sparkles, CheckCircle, Search, ChevronDown, GraduationCap, Trash2,
} from 'lucide-react';
import { toast } from 'sonner';
import { Question, Assessment, CourseAttribute, AssessmentType, Course } from '@/types';
import { courseService, aiService, assessmentService } from '@/services/api';
import { GenerateStep } from './AIAssessmentSteps/GenerateStep';
import { ReviewStep } from './AIAssessmentSteps/ReviewStep';
import { BasicInfoStep } from './AIAssessmentSteps/BasicInfoStep';
import { ConfigStep, QuestionTypeDistribution } from './AIAssessmentSteps/ConfigStep';
import { LearningObjectivesStep } from './AIAssessmentSteps/DetailsStep';

type Difficulty = 'easy' | 'medium' | 'hard';
type Step = 'course-selection' | 'basic-info' | 'config' | 'objectives' | 'generate' | 'review';

interface AIAssessmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  courseId: string;
  onAssessmentCreated: (assessment: Assessment) => void;
  assessmentToEdit?: Assessment | null;
}

export function AIAssessmentModal({
  isOpen,
  onClose,
  courseId,
  onAssessmentCreated,
  assessmentToEdit,
}: AIAssessmentModalProps) {
  // ── UI state ──────────────────────────────────────────────────────────────────
  const [isLoading, setIsLoading]       = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [step, setStep]                 = useState<Step>('course-selection');

  // ── Data state ────────────────────────────────────────────────────────────────
  const [attributes, setAttributes]         = useState<CourseAttribute[]>([]);
  const [questions, setQuestions]           = useState<Question[]>([]);
  const [uploadedFile, setUploadedFile]     = useState<File | null>(null);
  const [resourceId, setResourceId]         = useState<string | null>(null);
  const [fullAssessment, setFullAssessment] = useState<Assessment | null>(null);

  // ── Course picker ─────────────────────────────────────────────────────────────
  const [courses, setCourses]                   = useState<Course[]>([]);
  const [selectedCourse, setSelectedCourse]     = useState<Course | null>(null);
  const [courseSearch, setCourseSearch]         = useState('');
  const [dropdownOpen, setDropdownOpen]         = useState(false);
  const dropdownRef                             = useRef<HTMLDivElement>(null);

  // ── Form data ─────────────────────────────────────────────────────────────────
const defaultFormData = {
  name: '',
  // Removed description
  maxScore: 100, // Now used as the primary point boundary
  dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
  dueTime: '23:59', // Precise deadline context
  type: 'Exercise' as AssessmentType,
  questionCount: 5,
  difficulty: 'medium' as Difficulty,
  questionTypeDistribution: {
    multiple_choice: 10,
    true_false: 10,
    short_answer: 80,
    essay: 0,
  } as QuestionTypeDistribution,
  selectedAttributes: [] as string[],
  weight: 100,
  mathPaperType: null as 'paper1' | 'paper2' | 'both' | null,
};
  const [formData, setFormData] = useState(defaultFormData);

  // ── Step metadata ─────────────────────────────────────────────────────────────
  const steps: { key: Step; title: string }[] = [
    { key: 'course-selection', title: 'Course & Details'    },
    { key: 'basic-info',       title: 'Type & Questions'    },
    { key: 'config',           title: 'Difficulty & Mix'    },
    { key: 'objectives',       title: 'Learning Objectives' },
    { key: 'generate',         title: 'Generating…'         },
    { key: 'review',           title: 'Review & Edit'       },
  ];
  const currentStepIndex  = steps.findIndex((s) => s.key === step);
  const currentStepConfig = steps[currentStepIndex];

  // ── Filtered courses (memoised) ───────────────────────────────────────────────
  const filteredCourses = useMemo(() =>
    courses.filter(
      (c) =>
        c.name.toLowerCase().includes(courseSearch.toLowerCase()) ||
        (c.code || '').toLowerCase().includes(courseSearch.toLowerCase())
    ),
    [courses, courseSearch]
  );

  // ── Outside-click closes dropdown ─────────────────────────────────────────────
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
        setCourseSearch('');
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // ── Bootstrap on open ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (isOpen) loadInitialData();
  }, [isOpen, assessmentToEdit]);

  const loadInitialData = async () => {
    try {
      setIsLoading(true);
      const data = await courseService.getTeachingCourses();
      const mapped = data.map((c) => ({ ...c, _id: c._id || (c as any).id }));
      setCourses(mapped);

      if (assessmentToEdit) {
        // TODO: populate formData from assessmentToEdit
      } else if (courseId) {
        const cur = mapped.find((c) => c._id === courseId);
        if (cur) setSelectedCourse(cur);
      }
    } catch {
      toast.error('Failed to load courses');
    } finally {
      setIsLoading(false);
    }
  };

  // ── Fetch attributes whenever course changes ───────────────────────────────────
  useEffect(() => {
    if (!isOpen || !selectedCourse) return;
    (async () => {
      try {
        setIsLoading(true);
        const data = await courseService.getCourseAttributes(selectedCourse._id);
        setAttributes(data);
      } catch {
        toast.error('Failed to load course attributes');
      } finally {
        setIsLoading(false);
      }
    })();
  }, [isOpen, selectedCourse]);

  // ── Reset ─────────────────────────────────────────────────────────────────────
  const resetModal = () => {
    setStep('course-selection');
    setQuestions([]);
    setFullAssessment(null);
    setUploadedFile(null);
    setResourceId(null);
    setFormData(defaultFormData);
  };

  // Deletes the saved draft then closes — called by Discard button and X during review
  const handleDiscard = async () => {
    if (fullAssessment?._id) {
      try {
        await assessmentService.deleteAssessment(fullAssessment._id);
        toast.success('Draft assessment discarded.');
      } catch {
        toast.error('Could not delete draft — you may need to remove it manually.');
      }
    }
    resetModal();
    onClose();
  };

  const handleClose = () => {
    // If a draft was saved to the DB, delete it on close
    if (fullAssessment?._id) {
      handleDiscard();
      return;
    }
    resetModal();
    onClose();
  };

  // ── Form helpers ──────────────────────────────────────────────────────────────
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: ['questionCount', 'maxScore', 'weight'].includes(name)
        ? parseInt(value, 10) || 0
        : value,
    }));
  };

  const handleSelectChange = (name: string, value: string) =>
    setFormData((prev) => ({ ...prev, [name]: value }));

  const handleDistributionChange = (dist: QuestionTypeDistribution) =>
    setFormData((prev) => ({ ...prev, questionTypeDistribution: dist }));

  const handleMathPaperTypeChange = (type: 'paper1' | 'paper2' | 'both') =>
    setFormData((prev) => ({ ...prev, mathPaperType: type }));

  const handleCourseSelect = (course: Course) => {
    setSelectedCourse(course);
    setDropdownOpen(false);
    setCourseSearch('');
  };

  // ── Build question types array from % distribution ────────────────────────────
  const buildQuestionTypes = (): string[] => {
    const { questionTypeDistribution: d, questionCount } = formData;
    const types: string[] = [];
    (Object.entries(d) as [keyof QuestionTypeDistribution, number][]).forEach(([key, pct]) => {
      const count = Math.round((pct / 100) * questionCount);
      for (let i = 0; i < count; i++) types.push(key);
    });
    while (types.length < questionCount) types.push('multiple_choice');
    return types.slice(0, questionCount);
  };

  // ── Generate ──────────────────────────────────────────────────────────────────
  const generateQuestions = async () => {
    try {
setIsGenerating(true);
    setStep('generate');

    // 1. Enrich attributes with their Level for context
    const selectedAttrObjects = attributes
      .filter((a) => formData.selectedAttributes.includes(a._id))
      .map(({ _id, name, description, level }) => ({ 
        _id, 
        name, 
        description,
        level
      }));

    // 2. Extract the primary level for the whole assessment context
    const primaryLevel = selectedAttrObjects.length > 0 ? selectedAttrObjects[0].level : 'Form 1';

    const generatedAssessment = await aiService.generateQuestions({
      courseId: selectedCourse?._id || courseId,
      name: formData.name,               // User's custom assessment name
      maxScore: formData.maxScore,     // SENT TO AI: Point Boundary
      dueDate: formData.dueDate,       // SENT TO AI: Context
      dueTime: formData.dueTime,
      level: primaryLevel,               // The target Form Level
      attributes: selectedAttrObjects,   // Full syllabus details
      questionCount: formData.questionCount,
      difficulty: formData.difficulty,
      type: formData.type,
      questionTypeDistribution: formData.questionTypeDistribution,
      mathPaperType: formData.mathPaperType,
      uploadedFile: uploadedFile,        // The visual/PDF reference context
    });
      if (generatedAssessment?.questions) {
        setFullAssessment(generatedAssessment);
        let rawQuestions = generatedAssessment.questions;

        if (typeof rawQuestions === 'string') {
          try { rawQuestions = JSON.parse(rawQuestions); }
          catch { throw new Error('Failed to parse questions from server'); }
        }

        if (Array.isArray(rawQuestions)) {
          setQuestions(rawQuestions as Question[]);
          setStep('review');
          toast.success('AI successfully generated your assessment');
        } else {
          throw new Error('Questions format is invalid');
        }
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to generate questions');
      setStep('objectives');
    } finally {
      setIsGenerating(false);
    }
  };

  // ── Regenerate all ────────────────────────────────────────────────────────────
  const regenerateQuestions = async (feedback: string) => {
    try {
      setIsGenerating(true);
      const selectedAttrObjects = attributes
        .filter((a) => formData.selectedAttributes.includes(a._id))
        .map(({ _id, name, description }) => ({ _id, name, description }));

      const newQuestions = await aiService.regenerateQuestions({
        prompt: {
          courseId:                 selectedCourse?._id || courseId,
          attributes:               selectedAttrObjects,
          questionTypes:            buildQuestionTypes(),
          questionTypeDistribution: formData.questionTypeDistribution,
        },
        feedback,
        questionCount: formData.questionCount,
        difficulty:    formData.difficulty,
        questionsToKeep: [],
      });

      setQuestions(newQuestions);
      setStep('review');
      toast.success('Questions regenerated');
    } catch {
      toast.error('Failed to regenerate questions');
    } finally {
      setIsGenerating(false);
    }
  };

  // ── Regenerate single ─────────────────────────────────────────────────────────
  const regenerateSingle = async (idToReplace: string) => {
    try {
      setIsGenerating(true);
      const selectedAttrObjects = attributes
        .filter((a) => formData.selectedAttributes.includes(a._id))
        .map(({ _id, name, description }) => ({ _id, name, description }));

      const newQuestions = await aiService.regenerateQuestions({
        prompt: {
          courseId:                 selectedCourse?._id || courseId,
          attributes:               selectedAttrObjects,
          questionTypes:            buildQuestionTypes(),
          questionTypeDistribution: formData.questionTypeDistribution,
        },
        feedback:        '',
        questionCount:   1,
        difficulty:      formData.difficulty,
        questionsToKeep: questions.filter((q) => q._id !== idToReplace),
      });

      if (newQuestions?.length > 0) {
        setQuestions((prev) => prev.map((q) => (q._id === idToReplace ? newQuestions[0] : q)));
        toast.success('Question regenerated');
      }
    } catch {
      toast.error('Failed to regenerate question');
    } finally {
      setIsGenerating(false);
    }
  };

  // ── Finalize / publish ────────────────────────────────────────────────────────
  // ✅ AFTER — clear fullAssessment first so handleClose() just resets cleanly
  const finalizeAssessment = async () => {
    if (!fullAssessment) return;
    try {
      setIsSubmitting(true);
      const updated = await assessmentService.updateAssessment(fullAssessment._id, {
        questions,
        status: 'published',
      });
      onAssessmentCreated(updated);
      toast.success('Assessment finalized and published!');
      setFullAssessment(null); // ← clear BEFORE closing so handleClose doesn't discard
      resetModal();
      onClose();
    } catch {
      toast.error('Failed to save assessment.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── Validation ────────────────────────────────────────────────────────────────
  const isStepValid = (): boolean => {
    switch (step) {
      case 'course-selection': return !!selectedCourse && formData.name.trim() !== '';
      case 'objectives':       return formData.selectedAttributes.length > 0;
      case 'config': {
        const isMaths = selectedCourse
          ? `${selectedCourse.name} ${selectedCourse.code}`.toLowerCase().includes('math')
          : false;
        if (isMaths) return !!formData.mathPaperType;
        const total = Object.values(formData.questionTypeDistribution).reduce((a, b) => a + b, 0);
        return total === 100;
      }
      default: return true;
    }
  };

  // ── Navigation ────────────────────────────────────────────────────────────────
  const handleNext = () => {
    switch (step) {
      case 'course-selection': setStep('basic-info');  break;
      case 'basic-info':       setStep('config');      break;
      case 'config':           setStep('objectives');  break;
      case 'objectives':       generateQuestions();    break;
      case 'review':           finalizeAssessment();   break;
    }
  };

  const handleBack = () => {
    switch (step) {
      case 'review':     setStep('objectives');       break;
      case 'objectives': setStep('config');           break;
      case 'config':     setStep('basic-info');       break;
      case 'basic-info': setStep('course-selection'); break;
    }
  };

  // ── Step 1: Course selection — two-panel layout ───────────────────────────────
  const renderCourseSelectionStep = () => (
    <div className="flex flex-col space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">

        {/* LEFT — Course picker */}
        <div className="space-y-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center shrink-0">
              <GraduationCap className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <Label className="text-base font-bold text-gray-800 block">Target Course</Label>
              <p className="text-xs text-gray-500 mt-0.5">AI will pull ZIMSEC objectives from this course</p>
            </div>
          </div>

          {/* Dropdown trigger */}
          <div className="relative" ref={dropdownRef}>
            <button
              type="button"
              onClick={() => setDropdownOpen((v) => !v)}
              className={`
                w-full flex items-center justify-between gap-3 px-4 py-3.5
                bg-white border-2 rounded-xl text-left transition-all focus:outline-none
                ${dropdownOpen
                  ? 'border-blue-500 ring-4 ring-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
                }
              `}
            >
              {isLoading ? (
                <span className="flex items-center gap-2 text-gray-400 text-sm">
                  <Loader2 className="w-4 h-4 animate-spin" /> Fetching courses…
                </span>
              ) : selectedCourse ? (
                <div className="flex items-center gap-3 min-w-0">
                  <span className="h-6 px-2 rounded bg-blue-600 text-white text-[10px] font-black flex items-center uppercase shrink-0">
                    {selectedCourse.code}
                  </span>
                  <span className="truncate text-sm font-semibold text-gray-900">{selectedCourse.name}</span>
                </div>
              ) : (
                <span className="text-sm text-gray-400">Select a course…</span>
              )}
              <ChevronDown className={`w-4 h-4 text-gray-400 shrink-0 transition-transform duration-200 ${dropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            {dropdownOpen && (
              <div className="absolute z-50 top-full left-0 right-0 mt-2 bg-white border rounded-xl shadow-2xl overflow-hidden ring-1 ring-black/5">
                <div className="p-3 bg-gray-50/50 border-b">
                  <div className="flex items-center gap-2 px-3 py-2 bg-white rounded-lg border border-gray-200 focus-within:border-blue-400 focus-within:ring-2 focus-within:ring-blue-100 transition-all">
                    <Search className="w-4 h-4 text-gray-400 shrink-0" />
                    <input
                      autoFocus
                      type="text"
                      value={courseSearch}
                      onChange={(e) => setCourseSearch(e.target.value)}
                      placeholder="Search by name or code…"
                      className="flex-1 bg-transparent text-sm text-gray-700 placeholder-gray-400 outline-none"
                    />
                    {courseSearch && (
                      <button onClick={() => setCourseSearch('')} className="text-gray-400 hover:text-gray-600">
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
                <ul className="max-h-56 overflow-y-auto py-1">
                  {filteredCourses.length === 0 ? (
                    <li className="px-4 py-6 text-center text-sm text-gray-400">No courses found.</li>
                  ) : filteredCourses.map((c) => {
                    const sel = selectedCourse?._id === c._id;
                    return (
                      <li key={c._id}>
                        <button
                          type="button"
                          onClick={() => handleCourseSelect(c)}
                          className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-blue-50 transition-colors ${sel ? 'bg-blue-50/60' : ''}`}
                        >
                          <span className={`h-6 px-2 rounded text-[10px] font-bold flex items-center shrink-0 ${sel ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600'}`}>
                            {c.code || '—'}
                          </span>
                          <span className={`text-sm flex-1 truncate ${sel ? 'font-semibold text-blue-700' : 'text-gray-700'}`}>{c.name}</span>
                          {sel && <CheckCircle className="w-4 h-4 text-blue-600 shrink-0" />}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}
          </div>

          {/* Selection confirmation card */}
          {selectedCourse && !dropdownOpen && (
            <div className="p-4 rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100 flex items-start gap-3 animate-in zoom-in-95 duration-200">
              <BookOpen className="w-5 h-5 text-blue-600 mt-0.5 shrink-0" />
              <div className="min-w-0">
                <p className="text-[10px] font-black text-blue-500 uppercase tracking-widest mb-0.5">Focusing On</p>
                <h4 className="text-sm font-bold text-blue-900 leading-tight truncate">{selectedCourse.name}</h4>
                <p className="text-xs text-blue-400 mt-0.5">ZIMSEC objectives from {selectedCourse.code}</p>
              </div>
            </div>
          )}
        </div>

{/* RIGHT — Assignment Identity & Constraints */}
<div className="space-y-5 bg-gray-50/60 p-2 rounded-2xl border border-gray-100">
  <div className="flex items-center gap-2">
    <Label className="text-base font-bold text-gray-800">Assessment Details</Label>
  </div>

  <div className="space-y-4">
    {/* Name Input */}
    <div className="space-y-1.5">
      <Label htmlFor="name" className="text-xs font-bold text-gray-500 uppercase tracking-wider">
        Assessment Name <span className="text-red-500">*</span>
      </Label>
      <Input
        id="name"
        name="name"
        value={formData.name}
        onChange={handleInputChange}
        placeholder="e.g., Form 2 Statistics Test"
        className="h-11 bg-white border-gray-200 text-sm"
        required
      />
    </div>

            {/* Max Points Input */}
            <div className="space-y-1.5">
              <Label htmlFor="maxScore" className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                Maximum Points (Total Marks)
              </Label>
              <Input
                id="maxScore"
                name="maxScore"
                type="number"
                value={formData.maxScore}
                onChange={handleInputChange}
                className="h-11 bg-white border-gray-200 text-sm"
              />
            </div>

            {/* Date & Time Row */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="dueDate" className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                  Due Date
                </Label>
                <Input
                  id="dueDate"
                  name="dueDate"
                  type="date"
                  value={formData.dueDate}
                  onChange={handleInputChange}
                  className="h-11 bg-white border-gray-200 text-sm"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="dueTime" className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                  Due Time
                </Label>
                <Input
                  id="dueTime"
                  name="dueTime"
                  type="time"
                  value={formData.dueTime}
                  onChange={handleInputChange}
                  className="h-11 bg-white border-gray-200 text-sm"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  // ── Step content router ───────────────────────────────────────────────────────
  const renderStepContent = () => {
    switch (step) {
      case 'course-selection':
        return renderCourseSelectionStep();

      case 'basic-info':
        return (
          <BasicInfoStep
            formData={formData}
            uploadedFile={uploadedFile}
            setUploadedFile={setUploadedFile}
            onChange={handleInputChange}
            onTypeChange={(v) => handleSelectChange('type', v)}
          />
        );

      case 'config':
        return (
          <ConfigStep
            formData={formData}
            selectedCourse={selectedCourse}
            onSelectChange={handleSelectChange}
            onDistributionChange={handleDistributionChange}
            onMathPaperTypeChange={handleMathPaperTypeChange}
          />
        );

      case 'objectives':
        return (
          <LearningObjectivesStep
            formData={formData}
            attributes={attributes}
            onToggleAttribute={(id) =>
              setFormData((prev) => ({
                ...prev,
                selectedAttributes: prev.selectedAttributes.includes(id)
                  ? prev.selectedAttributes.filter((a) => a !== id)
                  : [...prev.selectedAttributes, id],
              }))
            }
          />
        );

      case 'generate':
        return (
          <GenerateStep
            formData={{ ...formData, questionTypes: buildQuestionTypes() }}
            attributes={attributes}
            uploadedFile={uploadedFile}
          />
        );

      case 'review':
        return (
          <ReviewStep
            questions={questions}
            onUpdateQuestion={(q) =>
              setQuestions((prev) => prev.map((item) => (item._id === q._id ? q : item)))
            }
            onRegenerate={regenerateQuestions}
            onRegenerateSingle={regenerateSingle}
            isGenerating={isGenerating}
            mathPaperType={formData.mathPaperType}
          />
        );

      default:
        return null;
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────────
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="max-w-5xl max-h-[95vh] p-0 overflow-hidden flex flex-col">

        {/* Header */}
        <div className="bg-white border-b px-6 pb-2 shrink-0">
          <div className="flex items-center justify-between mb-3">
            <DialogTitle className="text-xl font-bold">
              {assessmentToEdit ? 'Edit Assessment' : 'Create AI Assessment'}
            </DialogTitle>
            <button
              onClick={handleClose}
              disabled={isGenerating || isSubmitting}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="font-semibold text-gray-800">{currentStepConfig.title}</span>
              <span className="text-gray-400 text-xs">Step {currentStepIndex + 1} of {steps.length}</span>
            </div>
            <div className="flex gap-1.5">
              {steps.map((_, i) => (
                <div
                  key={i}
                  className={`flex-1 h-1.5 rounded-full transition-all duration-500 ${i <= currentStepIndex ? 'bg-blue-600' : 'bg-gray-100'}`}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto pt-2 pb-8 px-6">
          {renderStepContent()}
        </div>

        {/* Footer */}
        {step !== 'generate' && (
          <div className="bg-gray-50 border-t px-6 py-1 flex items-center justify-between shrink-0">
            <Button
              variant="outline"
              onClick={handleBack}
              disabled={step === 'course-selection' || isGenerating || step === 'review'}
            >
              <ChevronLeft className="w-4 h-4 mr-1" /> Back
            </Button>

            {/* Config step: show live hint */}
            {step === 'config' && (() => {
              const isMaths = selectedCourse
                ? `${selectedCourse.name} ${selectedCourse.code}`.toLowerCase().includes('math')
                : false;
              if (isMaths) {
                return formData.mathPaperType ? (
                  <span className="text-xs text-emerald-600 font-medium">✓ Paper type selected</span>
                ) : (
                  <span className="text-xs text-amber-500 font-medium">Select a paper type to continue</span>
                );
              }
              const total = Object.values(formData.questionTypeDistribution).reduce((a, b) => a + b, 0);
              return total !== 100 ? (
                <span className="text-xs text-red-500 font-medium">
                  Mix must total 100% — currently {total}%
                </span>
              ) : (
                <span className="text-xs text-emerald-600 font-medium">✓ Mix looks good</span>
              );
            })()}

            {/* Discard button — only shown on review step where a draft already exists in the DB */}
            {step === 'review' && (
              <Button
                variant="outline"
                onClick={handleDiscard}
                disabled={isSubmitting}
                className="border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300"
              >
                <Trash2 className="w-4 h-4 mr-1" /> Discard Draft
              </Button>
            )}

            <Button
              onClick={handleNext}
              disabled={!isStepValid() || isGenerating || isSubmitting}
            >
              {isSubmitting ? (
                <><Loader2 className="w-2 h-2 animate-spin mr-2" />Saving…</>
              ) : step === 'review' ? (
                <><CheckCircle className="w-2 h-2 mr-2" />Finish & Publish</>
              ) : step === 'objectives' ? (
                <><Sparkles className="w-2 h-2 mr-2" />Generate Questions</>
              ) : (
                <>Continue <ChevronRight className="w-2 h-2 ml-1" /></>
              )}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}