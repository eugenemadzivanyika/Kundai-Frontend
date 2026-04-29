import React, { useState, useEffect, useRef } from 'react';
import { AlertCircle, Calendar, CheckCircle, Clock, FileText, Loader2, X, Eye, PenLine } from 'lucide-react';
import { Assessment, Question, Result, Submission } from '../../types';
import { Dialog } from '@headlessui/react';
import { assessmentService, studentService, submissionService } from '../../services/api';
import { submissionService as submissionServiceDirect } from '../../services/submissionService';
import { externalAssessmentService } from '../../services/externalAssessmentService';
import OcrReviewComponent, { CompiledSubmission } from '../ocr/OcrReviewComponent';

interface StudentAssignmentsProps {
  studentId: string;
  selectedCourseId?: string; // Add this prop to filter by course
}

interface SubmissionWithResult extends Submission {
  result?: Result & {
    externalAssessmentData?: any; // Adjust this type based on your actual external assessment data structure
  };
}

interface AssignmentWithResult extends Assessment {
  result?: Result;
  submission?: SubmissionWithResult;
  isSubmitted: boolean;
  isOverdue: boolean;
}

const StudentAssignments: React.FC<StudentAssignmentsProps> = ({ studentId, selectedCourseId }) => {
  const [assignments,       setAssignments]       = useState<AssignmentWithResult[]>([]);
  const [loading,           setLoading]           = useState(true);
  const [submitting,        setSubmitting]         = useState<string | null>(null);
  const [isDetailsOpen,     setIsDetailsOpen]     = useState(false);
  const [selectedFeedback,  setSelectedFeedback]  = useState<any>(null);
  // Handwritten submission flow
  const [ocrAssignmentId,   setOcrAssignmentId]   = useState<string | null>(null);
  const [ocrInitialFiles,   setOcrInitialFiles]   = useState<File[]>([]);
  const handwrittenInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    console.log('--- Fetching Student Assignments ---');
    console.log('Student ID:', studentId);
    console.log('Selected Course ID:', selectedCourseId);

    const fetchStudentAssignments = async () => {
      if (!studentId) {
        console.log('DEBUG: No student ID provided. Skipping fetch.');
        setAssignments([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      console.log('DEBUG: Starting to fetch assignments for student ID:', studentId);
      
      try {
        // Fetch all required data in parallel
        const [student, submissions] = await Promise.all([
          studentService.getStudent(studentId).catch(error => {
            console.error('Error fetching student:', error);
            return { courses: [] };
          }),
          submissionService.getStudentSubmissions(studentId).catch(error => {
            console.error('Error fetching submissions:', error);
            return [];
          })
        ]);

        // Process course IDs to fetch
        const courseIdsToFetch = (() => {
          if (selectedCourseId && selectedCourseId !== 'all') {
            return [selectedCourseId];
          }
          return (student.courses || [])
            .map(course => typeof course === 'string' ? course : course?._id)
            .filter(Boolean) as string[];
        })();

        if (courseIdsToFetch.length === 0) {
          console.log('DEBUG: No valid course IDs found to fetch assignments for.');
          setAssignments([]);
          setLoading(false);
          return;
        }

        // Fetch assessments for all courses in parallel
        const assessmentsByCourse = await Promise.all(
          courseIdsToFetch.map(courseId => 
            assessmentService.getAssessmentsByCourseId(courseId).catch(error => {
              console.error(`ERROR fetching assessments for course ${courseId}:`, error);
              return [];
            })
          )
        );

        const allAssessments = assessmentsByCourse.flat();
        console.log(`DEBUG: Found ${allAssessments.length} assessments across ${courseIdsToFetch.length} courses`);

        // *** IMPROVED RESULT CHECKING ***
        // Fetch results for each assessment specifically for this student
        const resultsPromises = allAssessments.map(assessment => 
          assessment?._id 
            ? assessmentService.getResults(assessment._id, studentId) // Pass studentId as query param
                .then(results => ({ 
                  assessmentId: assessment._id, 
                  result: results && results.length > 0 ? results[0] : null 
                }))
                .catch(error => {
                  console.error(`ERROR fetching result for assessment ${assessment._id}:`, error);
                  return { assessmentId: assessment._id, result: null };
                })
            : Promise.resolve({ assessmentId: '', result: null })
        );

        const results = await Promise.all(resultsPromises);
        const resultsMap = new Map(
          results
            .filter(r => r.assessmentId) // Include even null results for proper checking
            .map(({ assessmentId, result }) => [assessmentId, result])
        );

        // Create a map of submission by assessment ID
        const submissionMap = new Map(
          submissions
            .filter((s: any) => s.assessment || s.assessmentId)
            .map((submission: any) => [
              (submission.assessment || submission.assessmentId) as string, 
              submission
            ])
        );

        // Merge all data together with proper result existence checking
        const now = new Date();
        const processedAssignments = allAssessments.map(assessment => {
          const submission = submissionMap.get(assessment._id);
          const result = resultsMap.get(assessment._id); // This will be null if no result exists
          const dueDate = new Date(assessment.dueDate);
          
          // *** IMPROVED STATUS LOGIC ***
          const hasResult = result !== null && result !== undefined;
          const hasSubmission = !!submission;
          const isSubmitted = hasSubmission || hasResult; // Either submission OR result indicates submission
          const isOverdue = dueDate < now && !isSubmitted;

          console.log(`Assessment ${assessment.name}:`, {
            hasSubmission,
            hasResult,
            isSubmitted,
            resultExists: hasResult
          });

          return {
            ...assessment,
            dueDate,
            isSubmitted,
            isOverdue,
            result: result, // This will be null if no result exists
            submission: submission 
              ? {
                  ...submission,
                  result: result // Attach result to submission if it exists
                }
              : undefined
          } as AssignmentWithResult;
        });

        console.log('DEBUG: Processed assignments with results and submissions:', processedAssignments);
        setAssignments(processedAssignments);
      } catch (error) {
        console.error('ERROR: Failed to fetch student assignments:', error);
        setAssignments([]);
      } finally {
        setLoading(false);
        console.log('DEBUG: Assignment fetching process complete.');
      }
    };

    if (studentId) {
      fetchStudentAssignments();
    } else {
      setLoading(false);
      setAssignments([]);
      console.log('DEBUG: No student ID provided. Skipping fetch.');
    }
  }, [studentId, selectedCourseId]);

  const openHandwrittenPicker = (assignmentId: string) => {
    setOcrAssignmentId(assignmentId);
    handwrittenInputRef.current?.click();
  };

  const handleHandwrittenFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    e.target.value = '';
    if (files.length && ocrAssignmentId) {
      setOcrInitialFiles(files);
    }
  };

  const handleOcrSubmit = async (compiled: CompiledSubmission) => {
    if (!ocrAssignmentId) return;
    await handleSubmitAssignment(ocrAssignmentId, compiled.fullText);
    setOcrAssignmentId(null);
    setOcrInitialFiles([]);
  };

  const handleSubmitAssignment = async (assignmentId: string, extractedText: string) => {
    console.log(`DEBUG: Attempting to submit assignment ${assignmentId} (handwritten)`);
    setSubmitting(assignmentId);

    try {
      const assignment = assignments.find(a => a._id === assignmentId);
      if (!assignment) {
        throw new Error('Assignment not found');
      }

      const moduleName = 'Operating Systems';

      // Step 1: Assess the OCR-extracted text
      let assessmentResult;
      if (extractedText.trim()) {
        console.log('DEBUG: Assessing handwritten submission text');
        assessmentResult = await externalAssessmentService.assessText(extractedText.trim(), moduleName);
      } else {
        throw new Error('No extracted text found');
      }
  
      // Check for success and data before proceeding
      if (!assessmentResult.success || !assessmentResult.data) {
        throw new Error(assessmentResult.error || 'Assessment failed to return data');
      }
  
      const { assessment } = assessmentResult.data;
      const totalPossibleMarks = assessment?.total_possible_marks || assignment.maxScore;
      const marksAchieved = assessment?.marks_achieved || 0;
      const percentage = assessment?.marks_percentage || 0;
  
      const calculateGrade = (percentage: number) => {
        if (percentage >= 90) return 'A';
        if (percentage >= 80) return 'B';
        if (percentage >= 70) return 'C';
        if (percentage >= 60) return 'D';
        return 'F';
      };
  
      // Step 2: Create the result data object
      const resultData = {
        student: studentId,
        assessment: assignmentId,
        expectedMark: Math.round(totalPossibleMarks * 0.7),
        actualMark: marksAchieved,
        grade: calculateGrade(percentage),
        feedback: assessment?.overall_feedback || 'No feedback provided',
        submittedDate: new Date(),
        externalAssessmentData: assessmentResult.data
      };
  
      // Step 3: Save the result using the API service
      const resultResponse = await assessmentService.addResult(assignmentId, resultData);
      console.log('DEBUG: Result created:', resultResponse);
  
      // Step 4: Build answers from the assessment's questions so the controller
      // can store them and run BKT updates. Each question gets the full OCR text
      // as studentAnswer. No isCorrect → controller marks as 'Pending AI Grading'.
      const questions = Array.isArray(assignment.questions)
        ? (assignment.questions as Question[])
        : [];

      const answers = questions
        .filter((q): q is Question & { _id: string } => Boolean(q._id))
        .map(q => ({ questionId: q._id, studentAnswer: extractedText }));

      if (answers.length === 0) throw new Error('Assessment has no questions');

      // Step 5: Submit via JSON (not FormData) so questionId is preserved
      const submissionResponse = await submissionServiceDirect.submitAnswers({
        assessmentId: assignmentId,
        studentId: studentId,
        submissionType: 'text',
        answers,
      });
      console.log('DEBUG: Submission created:', submissionResponse);

      // Step 6: Update local state
      setAssignments(prev => prev.map(a =>
        a._id === assignmentId
          ? { ...a, isSubmitted: true, result: { ...resultResponse, assessment: assignmentId } }
          : a
      ));

      
      alert(`Assignment submitted and graded successfully!\nScore: ${resultData.actualMark}/${assignment.maxScore}\nGrade: ${resultData.grade}`);
  
    } catch (error) {
      console.error('ERROR: Failed to submit assignment:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      alert(`Failed to submit assignment: ${errorMessage}`);
    } finally {
      setSubmitting(null);
    }
  };

  // Function to handle viewing detailed feedback
  const handleViewDetailedFeedback = (assignment: AssignmentWithResult) => {
    const feedbackData = assignment.submission?.result?.externalAssessmentData || assignment.result?.externalAssessmentData;
    console.log('Opening detailed feedback modal with data:', feedbackData);
    setSelectedFeedback(feedbackData);
    setIsDetailsOpen(true);
  };

  // Updated status functions - now synchronous since we have all data
  const getStatusColor = (assignment: AssignmentWithResult) => {
    if (assignment.isSubmitted && assignment.result) return 'text-green-600 bg-green-100';
    if (assignment.isSubmitted) return 'text-blue-600 bg-blue-100';
    if (assignment.isOverdue) return 'text-red-600 bg-red-100';
    return 'text-yellow-600 bg-yellow-100';
  };

  const getStatusText = (assignment: AssignmentWithResult) => {
    if (assignment.isSubmitted && assignment.result) {
      return 'Graded';
    }
    if (assignment.isSubmitted) {
      return 'Submitted (awaiting review)';
    }
    if (assignment.isOverdue) return 'Overdue';
    return 'Pending';
  };

  const getStatusIcon = (assignment: AssignmentWithResult) => {
    if (assignment.isSubmitted && assignment.result) return <CheckCircle className="w-4 h-4" />;
    if (assignment.isSubmitted) return <Clock className="w-4 h-4" />;
    if (assignment.isOverdue) return <AlertCircle className="w-4 h-4" />;
    return <Calendar className="w-4 h-4" />;
  };

  const getSubmissionDetails = (assignment: AssignmentWithResult) => {
    console.log('--- Getting Submission Details ---');
    console.log('Assignment:', assignment.name);
    console.log('Submission exists:', !!assignment.submission);
    
    if (!assignment.isSubmitted) {
      console.log('No submission found for this assignment');
      return null;
    }
    
    const submission = assignment.submission;
    const result = assignment.result;
    const submittedDate = submission?.submittedAt 
      ? new Date(submission.submittedAt).toLocaleString() 
      : 'Unknown';
    
    // Check if detailed feedback is available
    const hasDetailedFeedback = submission?.result?.externalAssessmentData || result?.externalAssessmentData;
    
    return (
      <div className="mt-4 p-4 bg-gray-50 rounded-lg">
        <h4 className="font-medium text-gray-800 mb-2">Submission Details</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-600">Submitted on:</p>
            <p className="font-medium">{submittedDate}</p>
          </div>
          {submission?.submissionType === 'file' && submission.originalFilename && (
            <div>
              <p className="text-sm text-gray-600">Submitted file:</p>
              <p className="font-medium">{submission.originalFilename}</p>
            </div>
          )}
          {result && (
            <>
              <div>
                <p className="text-sm text-gray-600">Score:</p>
                <p className="font-medium">
                  {result.actualMark} / {assignment.maxScore} 
                  <span className="ml-2 text-sm text-gray-500">
                    ({Math.round((result.actualMark / assignment.maxScore) * 100)}%)
                  </span>
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Grade:</p>
                <p className="font-medium">{result.grade}</p>
              </div>
            </>
          )}
        </div>
        
        {result?.feedback && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="flex justify-between items-start mb-2">
              <h5 className="text-sm font-medium text-gray-700">Feedback</h5>
              {hasDetailedFeedback && (
                <button
                  onClick={() => handleViewDetailedFeedback(assignment)}
                  className="flex items-center gap-1 px-3 py-1 text-xs bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 transition-colors"
                >
                  <Eye className="w-3 h-3" />
                  View Details
                </button>
              )}
            </div>
            <div className="prose prose-sm max-w-none text-gray-600">
              <p>{result.feedback}</p>
              
              {submission?.result?.externalAssessmentData?.assessment?.overall_feedback && (
                <div className="mt-3 p-3 bg-blue-50 border-l-4 border-blue-400">
                  <p className="text-blue-700">
                    {submission.result.externalAssessmentData.assessment.overall_feedback}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="text-center">Loading assignments...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-2xl font-semibold text-gray-800 mb-2">My Assignments</h2>
        <p className="text-gray-600">Submit your assignments and track your progress</p>
      </div>

      <div className="space-y-4">
        {assignments.map((assignment) => (
          <div key={assignment._id} className="bg-white rounded-lg shadow p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="text-lg font-semibold text-gray-800">{assignment.name}</h3>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${getStatusColor(assignment)}`}>
                    {getStatusIcon(assignment)}
                    {getStatusText(assignment)}
                  </span>
                </div>
                <p className="text-gray-600 mb-3">{assignment.description}</p>
                
                <div className="flex items-center gap-6 text-sm text-gray-500">
                  <div className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    <span>Due: {assignment.dueDate.toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <FileText className="w-4 h-4" />
                    <span>Max Score: {assignment.maxScore}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span>Weight: {assignment.weight}%</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Display submission and result details */}
            {getSubmissionDetails(assignment)}

            {!assignment.isSubmitted && (
              <div className="border-t pt-4">
                <button
                  type="button"
                  onClick={() => openHandwrittenPicker(assignment._id)}
                  disabled={submitting === assignment._id}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {submitting === assignment._id ? (
                    <><Loader2 className="w-4 h-4 animate-spin" /> Submitting & Grading…</>
                  ) : (
                    <><PenLine className="w-4 h-4" /> Handwritten Submission</>
                  )}
                </button>
                <p className="text-xs text-gray-400 mt-2">
                  Upload photos or scans of your handwritten work — we'll extract the text and grade it automatically.
                </p>
              </div>
            )}

            {assignment.isSubmitted && !assignment.result && (
              <div className="border-t pt-4">
                <div className="flex items-center gap-2 text-blue-600">
                  <CheckCircle className="w-5 h-5" />
                  <span>Assignment submitted and automatically graded. Awaiting teacher review.</span>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {assignments.length === 0 && !loading && (
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-700 mb-2">No Assignments</h3>
          <p className="text-gray-500">You don't have any assignments at the moment.</p>
        </div>
      )}

      {/* Feedback Details Modal */}
      <Dialog
        open={isDetailsOpen}
        onClose={() => setIsDetailsOpen(false)}
        className="relative z-50"
      >
        <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <Dialog.Panel className="w-full max-w-3xl rounded-lg bg-white p-6 shadow-xl">
            <div className="flex justify-between items-center mb-4">
              <Dialog.Title className="text-lg font-medium text-gray-900">
                Detailed Feedback
              </Dialog.Title>
              <button
                onClick={() => setIsDetailsOpen(false)}
                className="text-gray-400 hover:text-gray-500"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            {selectedFeedback?.assessment ? (
              <div className="space-y-4 max-h-[70vh] overflow-y-auto">
                {/* Assessment Summary */}
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-lg border border-blue-200">
                  <h4 className="font-medium text-blue-800 mb-3">Assessment Summary</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div className="text-center p-3 bg-white rounded-md shadow-sm">
                      <p className="text-gray-600">Total Score</p>
                      <p className="text-2xl font-bold text-blue-600">
                        {selectedFeedback.assessment.marks_achieved || 'N/A'} {selectedFeedback.assessment.total_possible_marks || 'N/A'}
                      </p>
                    </div>
                    <div className="text-center p-3 bg-white rounded-md shadow-sm">
                      <p className="text-gray-600">Percentage</p>
                      <p className="text-2xl font-bold text-green-600">
                        {selectedFeedback.assessment.marks_percentage || 'N/A'}%
                      </p>
                    </div>
                    <div className="text-center p-3 bg-white rounded-md shadow-sm">
                      <p className="text-gray-600">Confidence Score</p>
                      <p className="text-2xl font-bold text-purple-600">
                        {selectedFeedback.assessment.confidence_assessment_score || 'N/A'}%
                      </p>
                    </div>
                  </div>
                </div>

                {/* Overall Feedback */}
                {selectedFeedback.assessment.overall_feedback && (
                  <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                    <h4 className="font-medium text-blue-800 mb-2">Overall Feedback</h4>
                    <p className="text-blue-900 leading-relaxed">{selectedFeedback.assessment.overall_feedback}</p>
                  </div>
                )}

                {/* Strengths */}
                {selectedFeedback.assessment.strengths && (
                  <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                    <h4 className="font-medium text-green-800 mb-2 flex items-center gap-2">
                      <CheckCircle className="w-4 h-4" />
                      Strengths
                    </h4>
                    <ul className="list-disc pl-5 space-y-1 text-green-800">
                      {Array.isArray(selectedFeedback.assessment.strengths) ? (
                        selectedFeedback.assessment.strengths.map((item: string, idx: number) => (
                          <li key={idx} className="leading-relaxed">{item}</li>
                        ))
                      ) : (
                        <li className="leading-relaxed">{selectedFeedback.assessment.strengths}</li>
                      )}
                    </ul>
                  </div>
                )}

                {/* Areas for Improvement */}
                {selectedFeedback.assessment.improvements && (
                  <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                    <h4 className="font-medium text-yellow-800 mb-2 flex items-center gap-2">
                      <AlertCircle className="w-4 h-4" />
                      Areas for Improvement
                    </h4>
                    <ul className="list-disc pl-5 space-y-1 text-yellow-800">
                      {Array.isArray(selectedFeedback.assessment.improvements) ? (
                        selectedFeedback.assessment.improvements.map((item: string, idx: number) => (
                          <li key={idx} className="leading-relaxed">{item}</li>
                        ))
                      ) : (
                        <li className="leading-relaxed">{selectedFeedback.assessment.improvements}</li>
                      )}
                    </ul>
                  </div>
                )}

                {/* Assessment Criteria Breakdown */}
                {selectedFeedback.assessment.criteria && (
                  <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                    <h4 className="font-medium text-gray-800 mb-3">Detailed Assessment Criteria</h4>
                    <div className="space-y-3">
                      {selectedFeedback.assessment.criteria.map((criterion: any, idx: number) => (
                        <div key={idx} className="bg-white p-3 rounded-md border border-gray-100">
                          <div className="flex justify-between items-center mb-2">
                            <span className="font-medium text-gray-800">{criterion.criterion}</span>
                            <span className="text-sm font-semibold text-gray-700 bg-gray-100 px-2 py-1 rounded">
                              {criterion.score} / {criterion.max_marks || '30'}
                            </span>
                          </div>
                          {criterion.feedback && (
                            <p className="text-sm text-gray-700 leading-relaxed">{criterion.feedback}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Question-by-Question Breakdown */}
                {selectedFeedback.assessment.assessment_details && (
                  <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                    <h4 className="font-medium text-slate-800 mb-3">Question-by-Question Feedback</h4>
                    <div className="space-y-3">
                      {Object.entries(selectedFeedback.assessment.assessment_details).map(([questionKey, details]: [string, any]) => (
                        <div key={questionKey} className="bg-white p-3 rounded-md border border-slate-100">
                          <div className="flex justify-between items-center mb-2">
                            <span className="font-medium text-slate-800 capitalize">
                              {questionKey.replace('_', ' ')}
                            </span>
                            <span className="text-sm font-semibold text-slate-700 bg-slate-100 px-2 py-1 rounded">
                              {details.awarded_marks} / {details.max_marks}
                            </span>
                          </div>
                          {details.feedback && (
                            <p className="text-sm text-slate-700 mb-2 leading-relaxed">{details.feedback}</p>
                          )}
                          {details.improvement && (
                            <div className="bg-blue-50 p-2 rounded text-xs text-blue-800 border-l-2 border-blue-400">
                              <strong>Improvement tip:</strong> {details.improvement}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Document Information */}
                {(selectedFeedback.filename || selectedFeedback.module) && (
                  <div className="bg-indigo-50 p-4 rounded-lg border border-indigo-200">
                    <h4 className="font-medium text-indigo-800 mb-2">Submission Information</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                      {selectedFeedback.filename && (
                        <div>
                          <span className="text-indigo-600 font-medium">File:</span>
                          <p className="text-indigo-800">{selectedFeedback.filename}</p>
                        </div>
                      )}
                      {selectedFeedback.module && (
                        <div>
                          <span className="text-indigo-600 font-medium">Module:</span>
                          <p className="text-indigo-800">{selectedFeedback.module}</p>
                        </div>
                      )}
                      {selectedFeedback.content_type && (
                        <div>
                          <span className="text-indigo-600 font-medium">File Type:</span>
                          <p className="text-indigo-800">{selectedFeedback.content_type}</p>
                        </div>
                      )}
                      {selectedFeedback.pages && (
                        <div>
                          <span className="text-indigo-600 font-medium">Pages:</span>
                          <p className="text-indigo-800">{selectedFeedback.pages}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-gray-500">No detailed feedback available.</p>
            )}

            <div className="mt-6 flex justify-end">
              <button
                type="button"
                onClick={() => setIsDetailsOpen(false)}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                Close
              </button>
            </div>
          </Dialog.Panel>
        </div>
      </Dialog>

      {/* Hidden file input for handwritten image selection */}
      <input
        ref={handwrittenInputRef}
        type="file"
        accept="image/*,application/pdf"
        multiple
        className="hidden"
        onChange={handleHandwrittenFileSelect}
      />

      {/* OCR Review overlay — shown after files are selected */}
      {ocrInitialFiles.length > 0 && ocrAssignmentId && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 flex items-stretch p-4">
          <div className="flex-1 bg-white rounded-2xl overflow-hidden flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-3 border-b border-slate-100 bg-white flex-shrink-0">
              <div>
                <h2 className="text-sm font-extrabold text-slate-800">Handwritten Submission</h2>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Review the extracted text, correct any errors, then submit.
                </p>
              </div>
              <button
                onClick={() => { setOcrInitialFiles([]); setOcrAssignmentId(null); }}
                className="text-slate-400 hover:text-slate-600 transition-colors p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* OCR component fills remaining space */}
            <div className="flex-1 overflow-hidden">
              <OcrReviewComponent
                mode="student-submit"
                initialFiles={ocrInitialFiles}
                onSubmit={handleOcrSubmit}
                onCancel={() => { setOcrInitialFiles([]); setOcrAssignmentId(null); }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentAssignments;