import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { studentService, developmentService } from '../../services/api';
import { Student, DevelopmentPlan } from '../../types';
import StudentChat from './StudentChat';
import DevelopmentAttributesView from './DevelopmentAttributesView';
import ResultsView from './ResultsView';
import { useAuth } from '../../context/AuthContext'; // Import this to get course context

type StudentWithPlan = Student & { 
  activePlan?: DevelopmentPlan;
  planStatus?: string;
};

const ClassroomView: React.FC = () => {
  const [activeTab, setActiveTab] = useState('status');
  const [students, setStudents] = useState<StudentWithPlan[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<StudentWithPlan | null>(null);
  const [showChat, setShowChat] = useState(false);
  const [selectedForResults, setSelectedForResults] = useState(false);
  const [selectedForDevelopment, setSelectedForDevelopment] = useState(false);
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { selectedCourse } = useAuth(); // Access the current course context

  const fetchStudents = useCallback(async () => {
    try {
      setLoading(true);
      
      // BUG FIX: Pass the course ID to the service so the backend filters correctly
      const courseId = selectedCourse?.id || selectedCourse?.code;
      
      const data = await studentService.getStudents(courseId);
      console.log("📡 [ClassroomView] Raw students from API:", data);

      const studentsWithPlans = await Promise.all(
        data.map(async (student: any) => {
          try {
            const plans = await developmentService.getAllPlansForStudent(student._id);
            const activePlan = plans.find(p => p.status === 'Active') || plans[0];
            
            // Check nesting here
            if (!student.user && !student.firstName) {
              console.warn(`⚠️ [ClassroomView] Student ${student.id} missing name data!`, student);
            }

            return {
              ...student,
              activePlan: activePlan,
              planStatus: activePlan?.status || 'No Plan'
            };
          } catch {
            return { ...student, planStatus: 'No Plan' };
          }
        })
      );
      console.log("🛠️ [ClassroomView] Enriched development students:", studentsWithPlans);
      setStudents(studentsWithPlans);
      if (studentsWithPlans.length > 0 && !selectedStudent) {
        setSelectedStudent(studentsWithPlans[0]);
      }

      setError(null);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, [selectedCourse]);

  useEffect(() => {
    fetchStudents();
  }, [selectedCourse, activeTab]); 

  // Helper to extract name safely from nested user object
  const getStudentName = (student: any) => {
    if (student?.user?.firstName) {
      return `${student.user.firstName} ${student.user.lastName}`;
    }
    if (student?.firstName) {
      return `${student.firstName} ${student.lastName}`;
    }
    return "Unknown Student";
  };

  const handleStudentClick = (student: StudentWithPlan) => {
    setSelectedStudent(student);
    setShowChat(true);
  };

  const handleViewStudent = (student: StudentWithPlan) => {
    setSelectedStudent(student);
    setShowChat(false);
    if (activeTab === 'results') {
      setSelectedForResults(true);
    } else if (activeTab === 'development') {
      setSelectedForDevelopment(true);
    }
  };

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    setSelectedForResults(false);
    setSelectedForDevelopment(false);
    setShowChat(false);
  };

  const handleClosePane = () => {
    setSelectedForResults(false);
    setSelectedForDevelopment(false);
  };

  const handlePlanClick = (e: React.MouseEvent, studentId: string) => {
    e.stopPropagation();
    navigate(`/development/${studentId}`);
  };

  if (loading) {
    return <div className="p-4 flex justify-center items-center h-64 font-bold">
      <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-blue-500 mr-2"></div>
      Loading Class Data...
    </div>;
  }

  if (error) {
    return <div className="p-4 text-red-500 font-bold border border-red-200 rounded">Error: {error}</div>;
  }

  return (
    <div className="space-y-2 relative px-4 transition-all duration-500 ease-in-out">
      {showChat && selectedStudent ? (
        <div className="relative bg-white rounded-lg shadow p-4">
          <button
            onClick={() => setShowChat(false)}
            className="absolute top-2 left-2 text-sm text-gray-500 hover:text-blue-500 z-10"
          >
            ← Back to Classroom
          </button>
          <StudentChat
            studentId={selectedStudent.id}
            studentName={getStudentName(selectedStudent)}
          />
        </div>
      ) : (
        <>
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="flex">
              {['status', 'results', 'development'].map((tab) => (
                <button
                  key={tab}
                  className={`flex-1 py-2 font-bold text-center transition-colors duration-300 border-b-2 ${
                    activeTab === tab 
                      ? 'bg-blue-50 text-blue-600 border-blue-600' 
                      : 'text-gray-500 border-transparent hover:bg-gray-50'
                  }`}
                  onClick={() => handleTabChange(tab)}
                >
                  {tab.toUpperCase()}
                </button>
              ))}
            </div>
          </div>

          {(activeTab === 'results' || activeTab === 'development') ? (
            <div className="flex gap-4 transition-all duration-500 ease-in-out">
              <div
                className={`transition-all duration-500 ${
                  (activeTab === 'results' && selectedForResults) || (activeTab === 'development' && selectedForDevelopment)
                    ? 'w-1/2'
                    : 'w-full'
                } bg-white rounded-lg shadow p-2`}
              >
                <div className="overflow-y-auto max-h-[500px]">
                  <table className="w-full">
                    <thead className="sticky top-0 bg-gray-100 z-10">
                      <tr>
                        <th className="px-4 py-2 border-b text-left text-xs font-black uppercase text-gray-600">Reg Number</th>
                        <th className="px-4 py-2 border-b text-left text-xs font-black uppercase text-gray-600">Full Name</th>
                        {activeTab === 'results' ? (
                          <>
                            <th className="px-4 py-2 border-b text-left text-xs font-black uppercase text-gray-600">OVR</th>
                            <th className="px-4 py-2 border-b text-left text-xs font-black uppercase text-gray-600">Engagement</th>
                          </>
                        ) : (
                          <>
                            <th className="px-4 py-2 border-b text-left text-xs font-black uppercase text-gray-600">Overall</th>
                            <th className="px-4 py-2 border-b text-left text-xs font-black uppercase text-gray-600">Plan</th>
                          </>
                        )}
                        <th className="px-4 py-2 border-b text-left text-xs font-black uppercase text-gray-600">Performance</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {students.map((student) => (
                        <tr
                          key={student._id}
                          className={`transition-colors duration-200 ${
                            selectedStudent?._id === student._id
                              ? 'bg-blue-100 border-l-4 border-blue-600'
                              : 'bg-white hover:bg-gray-50'
                          } cursor-pointer`}
                          onClick={() => handleViewStudent(student)}
                        >
                          <td className="px-4 py-3 text-sm font-mono">{student.id}</td>
                          <td className="px-4 py-3 text-sm font-semibold">
                            {getStudentName(student)}
                          </td>
                          {activeTab === 'results' ? (
                            <>
                              <td className="px-4 py-3 text-sm font-bold text-blue-600">{student.overall}%</td>
                              <td className="px-4 py-3 text-sm">{student.engagement}</td>
                            </>
                          ) : (
                            <>
                              <td className="px-4 py-3 text-sm font-bold text-blue-600">{student.overall}%</td>
                              <td className="px-4 py-3 text-sm">
                                <span 
                                  className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase ${
                                    student.planStatus === 'Active' ? 'bg-green-100 text-green-700' :
                                    student.planStatus === 'Under Review' ? 'bg-amber-100 text-amber-700' :
                                    'bg-gray-100 text-gray-500'
                                  }`}
                                  onClick={(e) => handlePlanClick(e, student._id)}
                                >
                                  {student.planStatus}
                                </span>
                              </td>
                            </>
                          )}
                          <td className="px-4 py-3 text-sm">
                            <span className={`font-bold ${
                              student.performance === 'Excellent' ? 'text-green-600' :
                              student.performance === 'Good' ? 'text-blue-600' :
                              'text-amber-600'
                            }`}>
                              {student.performance || 'N/A'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Side panes for detailed viewing */}
              {activeTab === 'results' && selectedForResults && selectedStudent && (
                <div className="w-1/2 bg-white rounded-lg shadow-xl p-4 relative animate-in slide-in-from-right duration-300">
                  <button
                    onClick={handleClosePane}
                    className="absolute top-4 right-4 p-1 rounded-full hover:bg-gray-100 text-gray-400 hover:text-red-500 transition-colors z-10"
                  >
                    ✕
                  </button>
                  <ResultsView student={selectedStudent} />
                </div>
              )}

              {activeTab === 'development' && selectedForDevelopment && selectedStudent && (
                <div className="w-1/2 bg-white rounded-lg shadow-xl p-4 relative animate-in slide-in-from-right duration-300">
                  <button
                    onClick={handleClosePane}
                    className="absolute top-4 right-4 p-1 rounded-full hover:bg-gray-100 text-gray-400 hover:text-red-500 transition-colors z-10"
                  >
                    ✕
                  </button>
                  <DevelopmentAttributesView student={selectedStudent} />
                </div>
              )}
            </div>
          ) : (
            /* Main Status Tab View */
            <div className="bg-white rounded-lg shadow p-2">
              <div className="overflow-y-auto max-h-[500px]">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="px-4 py-2 border-b text-left text-xs font-black uppercase text-gray-600">Reg Number</th>
                      <th className="px-4 py-2 border-b text-left text-xs font-black uppercase text-gray-600">Full Name</th>
                      <th className="px-4 py-2 border-b text-left text-xs font-black uppercase text-gray-600">Overall</th>
                      <th className="px-4 py-2 border-b text-left text-xs font-black uppercase text-gray-600">Strength</th>
                      <th className="px-4 py-2 border-b text-left text-xs font-black uppercase text-gray-600">Performance</th>
                      <th className="px-4 py-2 border-b text-left text-xs font-black uppercase text-gray-600">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {students.map((student) => (
                      <tr
                        key={student._id || student.id}
                        className="hover:bg-blue-50 transition-colors duration-200"
                      >
                        <td className="px-4 py-3 text-sm font-mono">{student.id}</td>
                        <td className="px-4 py-3 text-sm font-semibold">
                          {getStudentName(student)}
                        </td>
                        <td className="px-4 py-3 text-sm font-bold text-blue-600">{student.overall}%</td>
                        <td className="px-4 py-3 text-sm">
                          <span className="bg-blue-50 text-blue-700 px-2 py-1 rounded text-xs font-medium border border-blue-100">
                            {student.strength || 'N/A'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm font-bold text-green-600">{student.performance || 'N/A'}</td>
                        <td className="px-4 py-3 text-sm">
                          <button
                            className="bg-slate-900 text-white px-4 py-1 rounded-full text-xs font-bold hover:bg-slate-700 transition-colors"
                            onClick={() => handleStudentClick(student)}
                          >
                            Chat
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default ClassroomView;