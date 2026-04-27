import { useState } from 'react';
import { QuestionText, MathText } from '@/components/ui/DiagramRenderer';
import { getQuestionTypeLabel, type MathPaperType } from '@/utils/questionTypeLabel';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import type { Question, QuestionOption, QuestionPart } from '@/types';
import { 
  RefreshCw, 
  Trash2, 
  Plus, 
  Loader2, 
  Edit3, 
  Save, 
  X,
  CheckCircle,
  AlertCircle,
  Eye,
  MessageSquare,
  ChevronDown
} from 'lucide-react';

interface ReviewStepProps {
  questions: Question[];
  onUpdateQuestion: (question: Question) => void;
  onRegenerate: (feedback: string) => Promise<void>;
  onRegenerateSingle: (questionId: string) => Promise<void>;
  isGenerating: boolean;
  mathPaperType?: MathPaperType;
}

export function ReviewStep({ questions, onUpdateQuestion, onRegenerate, onRegenerateSingle, isGenerating, mathPaperType }: ReviewStepProps) {
  const [editingQuestionId, setEditingQuestionId] = useState<string | null>(null);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const [regeneratingQuestionId, setRegeneratingQuestionId] = useState<string | null>(null);
  
  const handleRegenerateSingle = async (questionId?: string | null) => {
    if (!questionId) return;
    try {
      setRegeneratingQuestionId(questionId);
      await onRegenerateSingle(questionId);
    } finally {
      setRegeneratingQuestionId(null);
    }
  };
  const [feedback, setFeedback] = useState('');
  const [isSubmittingFeedback, setIsSubmittingFeedback] = useState(false);
  const [showFeedbackForm, setShowFeedbackForm] = useState(false);
  const [expandedQuestionId, setExpandedQuestionId] = useState<string | null>(null);

// Inside ReviewStep.tsx

const handleSaveEdit = () => {
  if (!editingQuestion) return;
  
  // 1. Identify which option was marked as 'isCorrect'
  const correctOptionIndex = editingQuestion.options?.findIndex(opt => opt.isCorrect);
  
  // 2. Extract just the strings for the options array (to match Mongoose [String])
  const optionStrings = editingQuestion.options?.map(opt => opt.text) || [];

  const updatedQuestion: Question = {
    ...editingQuestion,
    // We keep options as strings here to match the DB schema
    options: optionStrings as any, 
    // We set correctAnswer to the actual TEXT of the correct option
    correctAnswer: correctOptionIndex !== -1 && optionStrings[correctOptionIndex] 
      ? optionStrings[correctOptionIndex] 
      : editingQuestion.correctAnswer
  };
  
  onUpdateQuestion(updatedQuestion);
  setEditingQuestion(null);
  setEditingQuestionId(null);
};

// Update handleEditClick to "inflate" string options into objects for the UI
const handleEditClick = (question: Question) => {
  const formattedOptions = (question.options || []).map((opt, idx) => {
    const isString = typeof opt === 'string';
    const text = isString ? opt : (opt as any).text;
    
    // Check if this option text matches the correctAnswer text
    const isCorrect = text === question.correctAnswer;
    
    return {
      id: `opt-${idx}`,
      text: text,
      isCorrect: isCorrect,
      explanation: ''
    };
  });

  setEditingQuestion({ 
    ...question, 
    options: formattedOptions as any 
  });
  setEditingQuestionId(question._id || null);
};

  const handleCancelEdit = () => {
    setEditingQuestion(null);
    setEditingQuestionId(null);
  };

  const handleChange = (field: keyof Question, value: any) => {
    if (!editingQuestion) return;
    setEditingQuestion({ ...editingQuestion, [field]: value });
  };

  const handleOptionChange = (index: number, field: keyof QuestionOption, value: any) => {
    if (!editingQuestion) return;
    const newOptions = [...(editingQuestion.options || [])];
    newOptions[index] = { ...newOptions[index], [field]: value };
    setEditingQuestion({ ...editingQuestion, options: newOptions });
  };

  const handleAddOption = () => {
    if (!editingQuestion) return;
    const newOption: QuestionOption = {
      id: `opt-${Date.now()}`,
      text: '',
      isCorrect: false,
      explanation: ''
    };
    const newOptions = [...(editingQuestion.options || []), newOption];
    setEditingQuestion({ ...editingQuestion, options: newOptions });
  };

  const handleRemoveOption = (index: number) => {
    if (!editingQuestion?.options) return;
    const newOptions = [...editingQuestion.options];
    newOptions.splice(index, 1);
    handleChange('options', newOptions);
  };

  const handleSubmitFeedback = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!feedback.trim()) return;
    
    setIsSubmittingFeedback(true);
    try {
      await onRegenerate(feedback);
      setFeedback('');
      setShowFeedbackForm(false);
    } finally {
      setIsSubmittingFeedback(false);
    }
  };

  const getQuestionTypeColor = (type: string) => {
    switch (type) {
      case 'multiple_choice': return 'bg-blue-100 text-blue-800';
      case 'true_false': return 'bg-green-100 text-green-800';
      case 'short_answer': return 'bg-purple-100 text-purple-800';
      case 'essay': return 'bg-orange-100 text-orange-800';
      case 'code': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'bg-green-100 text-green-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'hard': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

const renderQuestionContent = (question: Question) => {
    const isEditing = editingQuestionId === question._id && editingQuestion;
    const isExpanded = expandedQuestionId === question._id;

    if (isEditing) {
      return (
        <div className="space-y-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="space-y-3">
            <Label className="text-sm font-semibold text-gray-700 mb-1.5">Question Text</Label>
            <Textarea
              value={editingQuestion.text}
              onChange={(e) => handleChange('text', e.target.value)}
              placeholder="Enter question text"
              rows={3}
              className="resize-none"
            />
          </div>

          {editingQuestion.options && (
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <Label className="text-sm font-semibold text-gray-700 mb-1.5">Answer Options</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleAddOption}
                  disabled={(editingQuestion.options?.length ?? 0) >= 5}
                  className="h-8"
                >
                  <Plus className="w-3 h-3 mr-1" /> Add Option
                </Button>
              </div>
              
              <div className="space-y-2">
                {editingQuestion.options?.map((option, idx) => (
                  <div key={idx} className="flex gap-2 items-center">
                    <div className="flex-1 flex gap-2">
                      <Input
                        value={option.text}
                        onChange={(e) => handleOptionChange(idx, 'text', e.target.value)}
                        placeholder={`Option ${idx + 1}`}
                        className="flex-1"
                      />
                      <button
                        type="button"
                        onClick={() => handleOptionChange(idx, 'isCorrect', !option.isCorrect)}
                        className={`px-3 py-2 rounded-md text-xs font-medium transition-colors ${
                          option.isCorrect 
                            ? 'bg-green-100 text-green-800 border border-green-300' 
                            : 'bg-gray-100 text-gray-600 border border-gray-300'
                        }`}
                      >
                        {option.isCorrect ? 'Correct' : 'Incorrect'}
                      </button>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRemoveOption(idx)}
                      className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50"
                      disabled={!editingQuestion.options || editingQuestion.options.length <= 2}
                    >
                      <Trash2 className="h-3 h-3" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-4 border-t border-blue-200">
            <Button
              type="button"
              variant="outline"
              onClick={handleCancelEdit}
              disabled={isGenerating}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleSaveEdit}
              disabled={isGenerating}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Save className="w-4 h-4 mr-2" />
              Save Changes
            </Button>
          </div>
        </div>
      );
    }

    // --- UPDATED VIEW MODE ---
    const hasParts = Array.isArray(question.parts) && question.parts.length > 0;

    return (
      <div className="space-y-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <QuestionText
          text={question.text}
          manifest={question.diagram_manifest}
          textClassName="font-medium text-gray-900 leading-relaxed"
        />
          </div>
          <button
            onClick={() => setExpandedQuestionId(isExpanded ? null : question._id || null)}
            className="ml-4 p-1 text-gray-400 hover:text-gray-600"
          >
            <Eye className="w-4 h-4" />
          </button>
        </div>

        {/* Multipart: render each sub-part */}
        {hasParts && (
          <div className="space-y-2 pl-3 border-l-2 border-blue-200">
            {(question.parts as QuestionPart[]).map((part, pi) => (
              <div key={pi} className="rounded-lg border border-slate-200 bg-slate-50 p-3 space-y-1.5">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-black text-blue-700 uppercase">
                    ({String.fromCharCode(97 + pi)})
                  </span>
                  <Badge className={`text-[10px] h-4 px-1.5 ${getQuestionTypeColor(part.type || 'short_answer')}`}>
                    {getQuestionTypeLabel(part.type || 'short_answer', mathPaperType)}
                  </Badge>
                  <Badge variant="outline" className="text-[10px] h-4 px-1.5 bg-white ml-auto">
                    {part.maxPoints} {part.maxPoints === 1 ? 'mark' : 'marks'}
                  </Badge>
                </div>
                <MathText text={part.text} />
                {part.correctAnswer && isExpanded && (
                  <div className="mt-1 text-xs text-green-800 bg-green-50 border border-green-200 rounded px-2 py-1">
                    <span className="font-semibold">Answer: </span>{part.correctAnswer}
                  </div>
                )}
                {part.options && part.options.length > 0 && (
                  <div className="space-y-1 mt-1">
                    {part.options.map((opt, oi) => (
                      <div key={oi} className={`flex items-center gap-2 rounded px-2 py-1 text-xs ${opt === part.correctAnswer ? 'bg-green-50 border border-green-200 text-green-800 font-semibold' : 'text-gray-700'}`}>
                        <span className="font-bold text-gray-400">{String.fromCharCode(65 + oi)}.</span>
                        <MathText text={opt} />
                        {opt === part.correctAnswer && <Badge className="ml-auto bg-green-600 text-white text-[10px] h-4 px-1 uppercase font-black">Answer</Badge>}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Single question: show options (MCQ/T-F) */}
        {!hasParts && question.options && (
          <div className="space-y-2">
            {question.options.slice(0, isExpanded ? undefined : 2).map((option, idx) => {
              // Handle both String (DB) and Object (UI State) formats
              const optionText = typeof option === 'string' ? option : (option as any).text;

              // If the option is missing data, don't break the UI
              if (!optionText) return null;

              // Check if this option matches the correct answer
              const isCorrect = optionText === question.correctAnswer;

              return (
                <div key={idx} className={`p-3 rounded-lg border transition-all ${
                  isCorrect
                    ? 'border-green-200 bg-green-50 shadow-sm'
                    : 'border-gray-200 bg-gray-50'
                }`}>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-gray-400">
                      {String.fromCharCode(65 + idx)}.
                    </span>
                    <span className={`text-sm ${isCorrect ? 'font-bold text-green-800' : 'text-gray-700'}`}>
                      <MathText text={optionText} />
                    </span>
                    {isCorrect && (
                      <Badge className="ml-auto bg-green-600 text-white text-[10px] h-5 px-1.5 uppercase font-black">
                        Answer
                      </Badge>
                    )}
                  </div>
                </div>
              );
              })}

              {!isExpanded && question.options.length > 2 && (
                <button
                  onClick={() => setExpandedQuestionId(question._id || null)}
                  className="text-xs text-blue-600 hover:text-blue-800 font-bold flex items-center gap-1 mt-2"
                >
                  <ChevronDown className="w-3 h-3" />
                  Show {question.options.length - 2} more options...
                </button>
              )}
            </div>
          )}

          {question.explanation && isExpanded && (
            <div className="mt-3 p-3 bg-blue-50 border border-blue-100 rounded-xl">
              <div className="flex items-center gap-2 mb-1">
                <AlertCircle className="w-3 h-3 text-blue-600" />
                <p className="text-[11px] font-black text-blue-600 uppercase tracking-tighter">AI Reasoning</p>
              </div>
              <p className="text-xs text-blue-800 leading-relaxed italic">{question.explanation}</p>
            </div>
          )}
        </div>
      );
    };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <h3 className="text-xl font-semibold text-gray-900">Review Generated Questions</h3>
        <p className="text-gray-600">
          Review and customize the AI-generated questions. You can edit individual questions or regenerate them with feedback.
        </p>
        <div className="flex items-center justify-center gap-4 text-sm">
          <div className="flex items-center gap-1">
            <CheckCircle className="w-4 h-4 text-green-500" />
            <span className="text-gray-600">{questions.length} questions generated</span>
          </div>
          <div className="flex items-center gap-1">
            <MessageSquare className="w-4 h-4 text-blue-500" />
            <span className="text-gray-600">Ready for review</span>
          </div>
        </div>
      </div>

      {/* Global Regenerate */}
      {!showFeedbackForm && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <RefreshCw className="w-5 h-5 text-yellow-600" />
              <span className="font-medium text-yellow-900">Want to regenerate all questions?</span>
            </div>
            <Button
              variant="outline"
              onClick={() => setShowFeedbackForm(true)}
              disabled={isGenerating}
              className="border-yellow-300 text-yellow-700 hover:bg-yellow-100"
            >
              Provide Feedback
            </Button>
          </div>
        </div>
      )}

      {/* Global Feedback Form */}
      {showFeedbackForm && (
        <form onSubmit={handleSubmitFeedback} className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-4">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-blue-600" />
            <h4 className="font-semibold text-blue-900">Regenerate All Questions</h4>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="global-feedback" className="text-sm font-medium text-blue-800">
              What would you like to change about these questions?
            </Label>
            <Textarea
              id="global-feedback"
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              placeholder="E.g., Make questions more challenging, focus on practical applications, include more code examples..."
              rows={3}
              className="resize-none"
            />
          </div>
          
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setShowFeedbackForm(false);
                setFeedback('');
              }}
              disabled={isSubmittingFeedback}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={!feedback.trim() || isSubmittingFeedback}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isSubmittingFeedback ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Regenerating...
                </>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Regenerate All
                </>
              )}
            </Button>
          </div>
        </form>
      )}

      {/* Questions List */}
      <div className="space-y-4">
        {questions.map((question, index) => (
          <div key={question._id} className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            {/* Question Header */}
            <div className="bg-gray-50 border-b border-gray-200 p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                    <span className="text-sm font-bold text-white">{index + 1}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {Array.isArray(question.parts) && question.parts.length > 0 ? (
                      <Badge className="text-xs bg-blue-100 text-blue-800">
                        MP·{question.parts.length}
                      </Badge>
                    ) : (
                      <Badge className={`text-xs ${getQuestionTypeColor(question.type)}`}>
                        {getQuestionTypeLabel(question.type, mathPaperType)}
                      </Badge>
                    )}
                    <Badge className={`text-xs ${getDifficultyColor(question.difficulty || 'medium')}`}>
                      {question.difficulty || 'Medium'}
                    </Badge>
                    <Badge variant="outline" className="text-xs font-bold bg-white">
                      {question.maxPoints || question.points || 1}
                      {' '}
                      {(question.maxPoints || question.points || 1) === 1 ? 'mark' : 'marks'}
                    </Badge>
                  </div>
                </div>
                
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleEditClick(question)}
                    disabled={isGenerating || editingQuestionId === question._id}
                    className="h-8"
                  >
                    <Edit3 className="w-3 h-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={async () => {
                      // Regenerate only this question
                      await handleRegenerateSingle(question._id || null);
                    }}
                    disabled={isGenerating || regeneratingQuestionId === question._id}
                    className="h-8"
                  >
                    {regeneratingQuestionId === question._id ? (
                      <Loader2 className="w-3 h-3 animate-spin text-gray-500" />
                    ) : (
                      <RefreshCw className="w-3 h-3" />
                    )}
                  </Button>
                </div>
              </div>
            </div>

            {/* Question Content */}
            <div className="p-4">
              {renderQuestionContent(question)}
            </div>
          </div>
        ))}
      </div>

      {/* Summary */}
      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-green-600" />
            <span className="font-medium text-green-900">
              {questions.length} question{questions.length !== 1 ? 's' : ''} ready for assessment
            </span>
          </div>
          <div className="text-sm text-green-700">
            Total Points: {questions.reduce((sum, q) => sum + (q.points || 1), 0)}
          </div>
        </div>
      </div>
    </div>
  );
}