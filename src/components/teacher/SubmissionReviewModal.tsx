import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Badge } from '../ui/badge';
import { Progress } from '../ui/progress';
import {
  FileText,
  Edit3,
  Save,
  CheckCircle,
  User,
  Award,
  TrendingUp,
  AlertTriangle,
  X,
  Clock,
  BookOpen,
  BrainCircuit,
  MessageSquare
} from 'lucide-react';
import { submissionService, assessmentService } from '../../services/api';
import { toast } from 'sonner';

interface SubmissionReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  submissionId: string; // This is actually the Result ID from our Dashboard
  onReviewComplete: () => void;
};

const SubmissionReviewModal: React.FC<SubmissionReviewModalProps> = ({
  isOpen,
  onClose,
  submissionId,
  onReviewComplete,
}) => {
  const [result, setResult] = useState<any>(null);
  const [submission, setSubmission] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  
  // Scoring state
  const [editedScore, setEditedScore] = useState<number>(0);
  const [teacherFeedback, setTeacherFeedback] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'overview' | 'analysis' | 'content'>('overview');

  useEffect(() => {
    if (isOpen && submissionId) {
      fetchData();
    }
  }, [isOpen, submissionId]);

const fetchData = async () => {
  try {
    setLoading(true);

    // 1. Fetch the specific Result using the ID passed from the dashboard
    // This contains student info, assessment info, and AI suggestions
    const currentResult = await assessmentService.getResultById(submissionId);
    
    setResult(currentResult);
    setEditedScore(currentResult.actualMark || currentResult.aiGradingSuggestion?.totalScore || 0);
    setTeacherFeedback(currentResult.teacherFeedback || '');

    // 2. Use the submission ID found inside the Result to fetch the raw answers
    if (currentResult.submission) {
      const submissionData = await submissionService.getSubmissionReviewDetail(currentResult.submission);
      setSubmission(submissionData);
    }

  } catch (error) {
    console.error('Surgical Fetch Error:', error);
    toast.error('Failed to load grading details');
  } finally {
    setLoading(false);
  }
};

  const handleConfirmGrade = async () => {
    try {
      setSaving(true);
      
      // Construct final scores object (assuming 1 big subjective question or mapping multiple)
      const finalScores: Record<string, number> = {};
      submission.answers.forEach((ans: any) => {
        // Distribute the total edited score across questions or handle per-question input
        finalScores[ans.questionId._id] = editedScore / submission.answers.length;
      });

      await assessmentService.confirmResult(result._id, {
        finalScores,
        teacherFeedback
      });

      toast.success('Grade released to student and BKT updated');
      onReviewComplete();
      onClose();
    } catch (error) {
      toast.error('Failed to release grade');
    } finally {
      setSaving(false);
    }
  };

  const getConfidenceColor = (confidence: number) => {
    const val = confidence * 100;
    if (val >= 85) return 'text-emerald-600 bg-emerald-50 border-emerald-200';
    if (val >= 60) return 'text-amber-600 bg-amber-50 border-amber-200';
    return 'text-rose-600 bg-rose-50 border-rose-200';
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[90vh] p-0 overflow-hidden flex flex-col">
        {/* Surgical Header */}
        <DialogHeader className="bg-slate-900 text-white p-6 shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
                <BrainCircuit className="w-6 h-6" />
              </div>
              <div>
                <DialogTitle className="text-xl font-bold">AI Grading Review</DialogTitle>
                {result && (
                  <p className="text-slate-400 text-sm">
                    {result.student.firstName} {result.student.lastName} • {result.assessment.name}
                  </p>
                )}
              </div>
            </div>
            <Badge variant="outline" className="text-white border-white/20">
              {result?.status}
            </Badge>
          </div>
        </DialogHeader>

        {loading || !result ? ( // Added !result check
        <div className="h-64 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          <p className="ml-3 text-slate-500">Synchronizing AI Analysis...</p>
        </div>
        ) : (
          <>
            {/* Tab Bar */}
            <div className="flex border-b bg-slate-50 px-6 shrink-0">
              <button 
                onClick={() => setActiveTab('overview')}
                className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'overview' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500'}`}
              >
                Overview & Grade
              </button>
              <button 
                onClick={() => setActiveTab('analysis')}
                className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'analysis' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500'}`}
              >
                AI Analysis (CoT)
              </button>
              <button 
                onClick={() => setActiveTab('content')}
                className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'content' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500'}`}
              >
                Raw Submission
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {activeTab === 'overview' && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Left: Score Input */}
                  <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white border rounded-xl p-6 shadow-sm">
                      <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                        <Award className="w-5 h-5 text-blue-600" />
                        Finalize Marks
                      </h3>
                      <div className="grid grid-cols-2 gap-4 mb-6">
                        <div className="space-y-2">
                          <label className="text-xs font-bold text-slate-500 uppercase">Suggested Score</label>
                        <div className="text-2xl font-bold text-slate-400">
                          {Math.round((result?.aiGradingSuggestion?.totalScore ?? 0) * 10) / 10} / {result?.assessment?.totalPoints ?? 100}
                        </div>
                        </div>
                        <div className="space-y-2">
                          <label className="text-xs font-bold text-blue-600 uppercase">Awarded Score</label>
                          <Input 
                            type="number"
                            value={editedScore}
                            onChange={(e) => setEditedScore(Number(e.target.value))}
                            className="text-2xl font-bold border-blue-200 focus:ring-blue-500"
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-500 uppercase">Teacher Feedback</label>
                        <Textarea 
                          value={teacherFeedback}
                          onChange={(e) => setTeacherFeedback(e.target.value)}
                          placeholder="Provide guidance to the student..."
                          rows={4}
                        />
                      </div>
                      <Button 
                        onClick={handleConfirmGrade}
                        disabled={saving || result.status === 'Released'}
                        className="w-full mt-6 bg-blue-600 hover:bg-blue-700 h-12"
                      >
                        {saving ? "Releasing..." : result.status === 'Released' ? "Grade Released" : "Confirm & Release Grade"}
                      </Button>
                    </div>
                  </div>

                  {/* Right: Summary */}
                  <div className="space-y-4">
                    <div className={`border rounded-xl p-4 ${getConfidenceColor(result.aiGradingSuggestion?.confidenceScore)}`}>
                      <div className="flex items-center gap-2 mb-1">
                        <TrendingUp className="w-4 h-4" />
                        <span className="text-xs font-bold uppercase">AI Confidence</span>
                      </div>
                      <div className="text-2xl font-bold">
                        {Math.round(result.aiGradingSuggestion?.confidenceScore * 100)}%
                      </div>
                    </div>
                    
                    <div className="bg-slate-50 border rounded-xl p-4">
                      <h4 className="text-xs font-bold text-slate-500 uppercase mb-3">Misconceptions Found</h4>
                      <div className="flex flex-wrap gap-2">
                        {result.aiGradingSuggestion?.misconceptionsFound?.map((m: string, i: number) => (
                          <Badge key={i} variant="secondary" className="bg-rose-100 text-rose-700 border-rose-200">
                            {m}
                          </Badge>
                        ))}
                        {(!result.aiGradingSuggestion?.misconceptionsFound || result.aiGradingSuggestion.misconceptionsFound.length === 0) && (
                          <p className="text-sm text-slate-400 italic">No major gaps detected</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

{activeTab === 'analysis' && (
  <div className="space-y-4">
    <div className="bg-slate-900 text-white px-4 py-2 rounded-t-xl text-xs font-bold uppercase flex items-center gap-2">
      <MessageSquare className="w-3 h-3" />
      Surgical Chain of Thought Reasoning
    </div>
    
    {Array.isArray(result?.aiGradingSuggestion?.chainOfThought) ? (
      <div className="space-y-4">
        {result.aiGradingSuggestion.chainOfThought.map((step: any, index: number) => (
          <div key={index} className="bg-white border rounded-xl p-5 shadow-sm space-y-3">
            <div className="flex items-center justify-between border-b pb-2">
              <span className="text-sm font-black text-blue-600 uppercase">Question {step.question || index + 1}</span>
              <Badge variant="secondary" className="bg-blue-50 text-blue-700">Score: {step.score}</Badge>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase">Analysis</p>
                <p className="text-slate-700 italic">"{step.analysis}"</p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase">Comparison</p>
                <p className="text-slate-700">{step.comparison}</p>
              </div>
            </div>

            <div className="bg-slate-50 p-3 rounded-lg border-l-4 border-amber-400 text-sm">
              <p className="text-[10px] font-bold text-amber-600 uppercase">Evaluation & Gaps</p>
              <p className="text-slate-800">{step.evaluation}</p>
              {step.gaps && step.gaps !== "None" && (
                <p className="mt-2 text-rose-600 font-medium">Gap: {step.gaps}</p>
              )}
            </div>
          </div>
        ))}
      </div>
    ) : (
      <div className="bg-white border rounded-xl p-6">
        <div className="whitespace-pre-wrap text-slate-700 leading-relaxed font-serif text-lg">
          {result?.aiGradingSuggestion?.chainOfThought || "No AI analysis available for this submission."}
        </div>
      </div>
    )}
  </div>
)}

              {activeTab === 'content' && (
                <div className="space-y-4">
                  {submission?.answers.map((ans: any, i: number) => (
                    <div key={i} className="border rounded-xl p-6 bg-white shadow-sm">
                      <div className="flex justify-between items-start mb-4">
                        <h4 className="font-bold text-slate-900">Question {i + 1}</h4>
                        <Badge variant="outline">Max: {ans.questionId.maxPoints} pts</Badge>
                      </div>
                      <p className="text-slate-600 mb-4 bg-slate-50 p-3 rounded-lg border-l-4 border-blue-500">
                        {ans.questionId.text}
                      </p>
                      <div className="bg-slate-900 text-emerald-400 p-4 rounded-lg font-mono text-sm overflow-x-auto">
                        <span className="text-slate-500 block mb-1 font-sans text-xs uppercase">Student Answer:</span>
                        {ans.studentAnswer}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default SubmissionReviewModal;