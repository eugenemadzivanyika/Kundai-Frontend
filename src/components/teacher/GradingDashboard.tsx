import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  FileText, 
  Clock, 
  CheckCircle, 
  TrendingUp, 
  Users,
  BarChart3,
  Search,
  ArrowLeft
} from 'lucide-react';
import { submissionService, assessmentService } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import SubmissionReviewModal from './SubmissionReviewModal';
import { toast } from 'sonner';

interface GradingStats {
  totalSubmissions: number;
  autoGradedCount: number;
  teacherReviewedCount: number;
  averageScore: number;
  averageConfidence: number;
}

interface PendingResult {
  _id: string; 
  student: {
    _id: string;
    id: string; 
    firstName: string;
    lastName: string;
  };
  assessment: {
    _id: string;
    name: string;
    totalPoints: number;
    type: string;
  };
  submission: any; // The populated submission object
  status: 'Submitted' | 'Pending AI Grading' | 'Pending Teacher Review' | 'Released';
  gradeType: 'MCQ Graded' | 'AI Suggested' | 'Manual' | 'Teacher Reviewed' | 'AI + MCQ Graded';
  aiGradingSuggestion: {
    totalScore: number;
    confidenceScore: number;
    overallFeedback: string;
  };
  actualMark?: number;
  submittedAt: string;
}

const GradingDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState<GradingStats | null>(null);
  const [pendingSubmissions, setPendingSubmissions] = useState<PendingResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSubmission, setSelectedSubmission] = useState<string | null>(null);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const { selectedCourse } = useAuth();

  useEffect(() => {
    fetchData();
  }, [selectedCourse, filterStatus]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const courseId = selectedCourse?.id || 'all';

      const [statsData, assessments] = await Promise.all([
        submissionService.getGradingStats(courseId),
        assessmentService.getAssessmentsByCourseId(courseId)
      ]);

      setStats(statsData);
      
      // LOG 1: Check the assessments list
      console.log("🚀 [Dashboard] Assessments list for course:", assessments);

      const assessmentIds = assessments.map(a => a._id);

      if (assessmentIds.length > 0) {
        const resultsArrays = await Promise.all(
          assessmentIds.map(id => 
            assessmentService.getResults(id, { 
              status: filterStatus === 'all' ? undefined : filterStatus 
            })
          )
        );

        const flattenedResults = resultsArrays.flat();

        // LOG 2: Check raw results data before de-duplication
        console.log("🚀 [Dashboard] Raw Flattened Results:", flattenedResults);

        const uniqueResults = Array.from(
          new Map(flattenedResults.map(item => [item._id, item])).values()
        );

        // LOG 3: Specifically check the assessment object inside the first result
        if (uniqueResults.length > 0) {
          console.log("🚀 [Dashboard] Sample Result Assessment Details:", {
            name: uniqueResults[0].assessment?.name,
            totalPoints: uniqueResults[0].assessment?.totalPoints,
            rawAssessmentObj: uniqueResults[0].assessment
          });
        }

        const sortedResults = uniqueResults.sort((a, b) => 
          new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime()
        );

        setPendingSubmissions(sortedResults as PendingResult[]);
      } else {
        setPendingSubmissions([]);
      }

    } catch (error) {
      console.error('Error fetching grading data:', error);
      toast.error('Failed to load grading queue');
    } finally {
      setLoading(false);
    }
  };

  const handleReviewSubmission = (resultId: string) => {
    // LOG 4: Check what ID we are passing to the modal
    console.log("🚀 [Dashboard] Opening Modal for Result ID:", resultId);
    setSelectedSubmission(resultId);
    setShowReviewModal(true);
  };

  const filteredSubmissions = pendingSubmissions.filter(submission => {
    const studentName = `${submission.student?.firstName || ''} ${submission.student?.lastName || ''}`.toLowerCase();
    const assessmentName = (submission.assessment?.name || '').toLowerCase();
    const query = searchQuery.toLowerCase();
    
    return searchQuery === '' || studentName.includes(query) || assessmentName.includes(query);
  });

  const getStatusColor = (status: string) => {
    const s = status.toLowerCase();
    if (s.includes('released')) return 'text-green-600 bg-green-100';
    if (s.includes('review')) return 'text-yellow-600 bg-yellow-100';
    if (s.includes('pending')) return 'text-blue-600 bg-blue-100';
    return 'text-gray-600 bg-gray-100';
  };

  const getConfidenceColor = (confidence: number) => {
    const val = confidence * 100;
    if (val >= 90) return 'text-green-600';
    if (val >= 70) return 'text-blue-600';
    if (val >= 50) return 'text-yellow-600';
    return 'text-red-600';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-4">
        {/* Header */}
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center gap-4 mb-2">
            <button 
              onClick={() => navigate('/dashboard')}
              className="p-2 rounded-full hover:bg-gray-100 transition-colors duration-200"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <h2 className="text-xl font-semibold text-gray-800">Grading Dashboard</h2>
          </div>
          <p className="text-sm text-gray-600 ml-14">Review AI-assisted grading suggestions and release results to students</p>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
            <div className="bg-white rounded-lg shadow p-3">
              <div className="flex items-center">
                <FileText className="w-6 h-6 text-blue-500 mr-2" />
                <div>
                  <div className="text-xl font-bold text-gray-800">{stats.totalSubmissions}</div>
                  <div className="text-xs text-gray-500">Submissions</div>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-lg shadow p-3">
              <div className="flex items-center">
                <CheckCircle className="w-6 h-6 text-green-500 mr-2" />
                <div>
                  <div className="text-xl font-bold text-gray-800">{stats.autoGradedCount}</div>
                  <div className="text-xs text-gray-500">MCQ Graded</div>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-lg shadow p-3">
              <div className="flex items-center">
                <Users className="w-6 h-6 text-purple-500 mr-2" />
                <div>
                  <div className="text-xl font-bold text-gray-800">{stats.teacherReviewedCount}</div>
                  <div className="text-xs text-gray-500">Released</div>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-lg shadow p-3">
              <div className="flex items-center">
                <BarChart3 className="w-6 h-6 text-orange-500 mr-2" />
                <div>
                  <div className="text-xl font-bold text-gray-800">{Math.round(stats.averageScore)}%</div>
                  <div className="text-xs text-gray-500">Avg %</div>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-lg shadow p-3">
              <div className="flex items-center">
                <TrendingUp className="w-6 h-6 text-cyan-500 mr-2" />
                <div>
                  <div className="text-xl font-bold text-gray-800">{stats.averageConfidence}%</div>
                  <div className="text-xs text-gray-500">AI Trust</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="bg-white rounded-lg shadow p-3 flex flex-col md:flex-row gap-3 items-center justify-between">
          <div className="flex gap-2">
            {['all', 'Pending Teacher Review', 'Released', 'Submitted'].map((status) => (
              <button
                key={status}
                onClick={() => setFilterStatus(status)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  filterStatus === status ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {status === 'all' ? 'Full Queue' : status}
              </button>
            ))}
          </div>
          <div className="relative">
            <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search student or assessment..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 pr-3 py-1.5 text-sm border rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                <th className="px-6 py-3">Student</th>
                <th className="px-6 py-3">Assessment</th>
                <th className="px-6 py-3">Score (AI)</th>
                <th className="px-6 py-3">Confidence</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3">Submitted</th>
                <th className="px-6 py-3">Actions</th>
              </tr>
            </thead>
<tbody className="bg-white divide-y divide-gray-200">
  {filteredSubmissions.map((result, index) => (
    <tr key={`${result._id}-${index}`} className="hover:bg-gray-50 transition-colors">
      <td className="px-6 py-4">
        <div className="text-sm font-medium text-gray-900">
          {result.student?.firstName} {result.student?.lastName}
        </div>
        <div className="text-xs text-slate-500 font-mono">{result.student?.id}</div>
      </td>
      
      <td className="px-6 py-4">
        <div className="text-sm text-gray-900 font-medium">{result.assessment?.name}</div>
        {/* NEW: Grading Type Badge */}
        <div className="flex gap-1 mt-1">
          <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wider ${
            result.gradeType?.includes('AI') 
              ? 'bg-purple-100 text-purple-700 border border-purple-200' 
              : 'bg-blue-100 text-blue-700 border border-blue-200'
          }`}>
            {result.gradeType || 'Standard'}
          </span>
        </div>
      </td>

      <td className="px-6 py-4">
        <div className="text-sm font-bold text-slate-900">
          {result.status === 'Released' 
            ? `${Math.round(result.actualMark || 0)} / ${result.assessment?.totalPoints || 0}`
            : `${Math.round(result.aiGradingSuggestion?.totalScore || 0)} / ${result.assessment?.totalPoints || 0}`}
        </div>
        {result.status !== 'Released' && (
          <div className="text-[10px] text-amber-600 font-bold uppercase tracking-tighter">AI Suggestion</div>
        )}
      </td>

      <td className="px-6 py-4">
        <div className="flex flex-col">
          <span className={`text-sm font-bold ${getConfidenceColor(result.aiGradingSuggestion?.confidenceScore || 0)}`}>
            {Math.round((result.aiGradingSuggestion?.confidenceScore || 0) * 100)}%
          </span>
          <div className="w-16 h-1 bg-gray-100 rounded-full mt-1 overflow-hidden">
            <div 
              className={`h-full ${result.aiGradingSuggestion?.confidenceScore > 0.8 ? 'bg-green-500' : 'bg-amber-500'}`}
              style={{ width: `${(result.aiGradingSuggestion?.confidenceScore || 0) * 100}%` }}
            />
          </div>
        </div>
      </td>

      <td className="px-6 py-4">
        <span className={`px-2.5 py-1 text-[10px] font-black rounded-full uppercase border ${getStatusColor(result.status)}`}>
          {result.status}
        </span>
      </td>

      <td className="px-6 py-4 text-xs text-slate-500 font-medium">
        {new Date(result.submittedAt).toLocaleDateString()}
        <div className="text-[10px] text-slate-400">{new Date(result.submittedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
      </td>

      <td className="px-6 py-4">
        <button
          onClick={() => handleReviewSubmission(result._id)}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-bold transition-all ${
            result.status === 'Released'
              ? 'text-slate-600 hover:bg-slate-100'
              : 'bg-blue-600 text-white hover:bg-blue-700 shadow-sm'
          }`}
        >
          {result.status === 'Released' ? (
            <><Search className="w-4 h-4" /> View</>
          ) : (
            <><CheckCircle className="w-4 h-4" /> Grade</>
          )}
        </button>
      </td>
    </tr>
  ))}
</tbody>
          </table>
          {filteredSubmissions.length === 0 && (
            <div className="text-center py-10 text-gray-500">No submissions found in this queue.</div>
          )}
        </div>

        {showReviewModal && selectedSubmission && (
          <SubmissionReviewModal
            isOpen={showReviewModal}
            onClose={() => {
              setShowReviewModal(false);
              setSelectedSubmission(null);
            }}
            submissionId={selectedSubmission}
            onReviewComplete={fetchData}
          />
        )}
      </div>
    </div>
  );
};

export default GradingDashboard;