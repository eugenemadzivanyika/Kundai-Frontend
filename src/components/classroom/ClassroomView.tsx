import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { studentService, developmentService } from '../../services/api';
import { Student, DevelopmentPlan } from '../../types';
import StudentChat from './StudentChat';
import DevelopmentAttributesView from './DevelopmentAttributesView';
import ResultsView from './ResultsView';
import { useAuth } from '../../context/AuthContext';

type StudentWithPlan = Student & {
  activePlan?: DevelopmentPlan;
  planStatus?: string;
};

type ActivePanel = 'results' | 'development-attributes' | null;

const ClassroomView: React.FC = () => {
  const [students, setStudents] = useState<StudentWithPlan[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<StudentWithPlan | null>(null);
  const [activePanel, setActivePanel] = useState<ActivePanel>(null);
  const [showChat, setShowChat] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const { selectedCourse } = useAuth();

  const fetchStudents = useCallback(async () => {
    try {
      setLoading(true);
      const courseId = selectedCourse?.id || selectedCourse?.code;
      const data = await studentService.getStudents(courseId);

      const studentsWithPlans = await Promise.all(
        data.map(async (student: any) => {
          try {
            const plans = await developmentService.getAllPlansForStudent(student._id);
            const activePlan = plans.find((p: any) => p.status === 'Active') || plans[0];
            return { ...student, activePlan, planStatus: activePlan?.status || 'No Plan' };
          } catch {
            return { ...student, planStatus: 'No Plan' };
          }
        })
      );

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
  }, [selectedCourse]);

  const getStudentName = (student: any) => {
    if (student?.user?.firstName) return `${student.user.firstName} ${student.user.lastName}`;
    if (student?.firstName) return `${student.firstName} ${student.lastName}`;
    return 'Unknown Student';
  };

  const isPanelOpen = activePanel !== null;

  const handlePanelOpen = (panel: ActivePanel, student: StudentWithPlan) => {
    // Toggle off if same student + same panel button clicked again
    if (selectedStudent?._id === student._id && activePanel === panel) {
      setActivePanel(null);
      return;
    }
    setSelectedStudent(student);
    setActivePanel(panel);
    setShowChat(false);
  };

  const handleRowClick = (student: StudentWithPlan) => {
    // Only swaps student when a panel is already open — keeps the current panel type
    if (!isPanelOpen) return;
    setSelectedStudent(student);
  };

  const handleChatClick = (e: React.MouseEvent, student: StudentWithPlan) => {
    e.stopPropagation();
    setSelectedStudent(student);
    setShowChat(true);
    setActivePanel(null);
  };

  const handlePlanClick = (e: React.MouseEvent, student: StudentWithPlan) => {
    e.stopPropagation();
    navigate(`/development/${student._id}`);
  };

  if (loading) {
    return (
      <div className="p-4 flex justify-center items-center h-64 font-bold">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-blue-500 mr-2" />
        Loading Class Data...
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 text-red-500 font-bold border border-red-200 rounded">
        Error: {error}
      </div>
    );
  }

  if (showChat && selectedStudent) {
    return (
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
    );
  }

  return (
    <div className="flex gap-4 h-[calc(100vh-180px)] px-4 min-h-0">

      {/* ── MAIN TABLE ── */}
      <div className={`transition-all duration-500 ${isPanelOpen ? 'w-1/2' : 'w-full'} bg-white rounded-lg shadow p-2 flex flex-col min-h-0`}>
        <div className="overflow-y-auto flex-1 min-h-0">
          <table className="w-full">
            <thead className="sticky top-0 bg-gray-100 z-10">
              <tr>
                <th className="px-3 py-2 border-b text-left text-xs font-black uppercase text-gray-600">Reg No.</th>
                <th className="px-3 py-2 border-b text-left text-xs font-black uppercase text-gray-600">Full Name</th>
                <th className="px-3 py-2 border-b text-left text-xs font-black uppercase text-gray-600">OVR</th>
                <th className="px-3 py-2 border-b text-left text-xs font-black uppercase text-gray-600">Performance</th>
                <th className="px-3 py-2 border-b text-left text-xs font-black uppercase text-gray-600">Plan</th>
                <th className="px-3 py-2 border-b text-left text-xs font-black uppercase text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {students.map((student) => {
                const isActive = selectedStudent?._id === student._id && isPanelOpen;
                return (
                  <tr
                    key={student._id || student.id}
                    className={`transition-colors duration-200 ${
                      isActive ? 'bg-blue-50 border-l-4 border-blue-500' : 'bg-white hover:bg-gray-50'
                    } ${isPanelOpen ? 'cursor-pointer' : ''}`}
                    onClick={() => handleRowClick(student)}
                  >
                    <td className="px-3 py-3 text-sm font-mono text-gray-600">{student.id}</td>
                    <td className="px-3 py-3 text-sm font-semibold text-gray-800">{getStudentName(student)}</td>
                    <td className="px-3 py-3 text-sm font-black text-blue-600">{student.overall ?? 0}%</td>
                    <td className="px-3 py-3 text-sm font-bold">
                      <span className={
                        student.performance === 'Excellent' ? 'text-green-600' :
                        student.performance === 'Good' ? 'text-blue-600' :
                        'text-amber-600'
                      }>
                        {student.performance || 'N/A'}
                      </span>
                    </td>
                    <td className="px-3 py-3">
                      <button
                        onClick={(e) => handlePlanClick(e, student)}
                        className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase transition-colors ${
                          student.planStatus === 'Active'
                            ? 'bg-green-100 text-green-700 hover:bg-green-200' :
                          student.planStatus === 'Under Review'
                            ? 'bg-amber-100 text-amber-700 hover:bg-amber-200' :
                            'bg-gray-100 text-gray-500 hover:bg-gray-200'
                        }`}
                      >
                        {student.planStatus}
                      </button>
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={(e) => { e.stopPropagation(); handlePanelOpen('results', student); }}
                          className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase transition-colors ${
                            isActive && activePanel === 'results'
                              ? 'bg-blue-600 text-white'
                              : 'bg-blue-50 text-blue-600 hover:bg-blue-100'
                          }`}
                        >
                          Results
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); handlePanelOpen('development-attributes', student); }}
                          className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase transition-colors ${
                            isActive && activePanel === 'development-attributes'
                              ? 'bg-green-600 text-white'
                              : 'bg-green-50 text-green-700 hover:bg-green-100'
                          }`}
                        >
                          Dev
                        </button>
                        <button
                          onClick={(e) => handleChatClick(e, student)}
                          className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase bg-slate-900 text-white hover:bg-slate-700 transition-colors"
                        >
                          Chat
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── SIDE PANEL: ResultsView ── */}
      {activePanel === 'results' && selectedStudent && (
        <div className="w-1/2 min-h-0 bg-white rounded-lg shadow-xl relative flex flex-col animate-in slide-in-from-right duration-300">
          <button
            onClick={() => setActivePanel(null)}
            className="absolute top-3 right-3 p-1 rounded-full hover:bg-gray-100 text-gray-400 hover:text-red-500 transition-colors z-10"
          >
            ✕
          </button>
          <ResultsView student={selectedStudent} />
        </div>
      )}

      {/* ── SIDE PANEL: DevelopmentAttributesView ── */}
      {activePanel === 'development-attributes' && selectedStudent && (
        <div className="w-1/2 min-h-0 bg-white rounded-lg shadow-xl relative flex flex-col animate-in slide-in-from-right duration-300">
          <button
            onClick={() => setActivePanel(null)}
            className="absolute top-3 right-3 p-1 rounded-full hover:bg-gray-100 text-gray-400 hover:text-red-500 transition-colors z-10"
          >
            ✕
          </button>
          <DevelopmentAttributesView student={selectedStudent} />
        </div>
      )}

    </div>
  );
};

export default ClassroomView;