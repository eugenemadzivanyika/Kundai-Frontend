import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { 
  courseService, 
  studentService, 
  assessmentService,
  developmentService
} from '../../services/api';
import CalendarWidget from '../calendar/CalendarWidget';
import EventModal from '../calendar/EventModal';
import DigitalTwinCard from './DigitalTwinCard';
import PerformancePanel from './PerformancePanel';
import StaffRoom from './StaffRoom';

interface Assessment {
  _id: string;
  name: string;
  dueDate: string | Date;
}

interface StudentPerformance {
  studentId: string;
  name: string;
  score: number;
}

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { selectedCourse } = useAuth();

  // State
  const [loading, setLoading] = useState(true);
  const [latestAssessment, setLatestAssessment] = useState<Assessment | null>(null);
  const [performance, setPerformance] = useState<StudentPerformance[]>([]);
  const [studentsDevelopment, setStudentsDevelopment] = useState<any[]>([]); // Keep any for devProfiles if specific types aren't ready
  
  // Calendar State
  const [showEventModal, setShowEventModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [courses, setCourses] = useState<any[]>([]);
  const [calendarEvents] = useState<any[]>([]); // Removed setter as it was unused

  useEffect(() => {
    const fetchDashboardData = async () => {
        // 1. Create a safe identifier (prioritize code over the database _id)
        if (!selectedCourse) return;
        const courseIdentifier = selectedCourse.code || selectedCourse.id;

        try {
          setLoading(true);

          // 2. UPDATE THESE THREE CALLS to use courseIdentifier
          const [rawStudents, assessments, allCourses] = await Promise.all([
            studentService.getStudents(courseIdentifier),
            assessmentService.getAssessmentsByCourseId(courseIdentifier),
            courseService.getCourses()
          ]);
          
          setCourses(allCourses);

        // Performance Logic
        if (assessments.length > 0) {
          const sorted = [...assessments].sort((a: Assessment, b: Assessment) => 
            new Date(b.dueDate).getTime() - new Date(a.dueDate).getTime()
          );
          const latest = sorted[0];
          setLatestAssessment(latest);
          
          const results = await assessmentService.getResults(latest._id);
          setPerformance(results.map((r: any) => ({
            studentId: r.student?._id || '',
            name: `${r.student?.user?.firstName || ''} ${r.student?.user?.lastName || ''}`,
            score: r.actualMark
          })));
        }

        // Digital Twin Logic
const devProfiles = await Promise.all(
  rawStudents.map(async (student: any) => {
    try {
      // 1. Fetch Enriched Development Data (includes unitMasteries) and Plans in parallel
      const [devData, plans] = await Promise.all([
        studentService.getStudentDevelopment(student._id), // student._id is the MongoDB ID
        developmentService.getAllPlansForStudent(student.id) // student.id is the Reg Number
      ]);

      const activePlanObj = plans.find((p: any) => p.status === 'Active');

      return {
        studentId: student.id,
        firstName: student.user?.firstName || "Student",
        lastName: student.user?.lastName || student.id,
        form: student.form || 1,
        overall: devData.overallMastery || student.overall || 0, // Use freshly calculated overall
        potentialOverall: 90, 
        plans: plans, 
        activePlan: activePlanObj ? activePlanObj.title : 'None',
        // SURGICAL FIX: Map the aggregated unitMasteries instead of flat attributes
        attributes: devData.unitMasteries && devData.unitMasteries.length > 0
          ? devData.unitMasteries.map((um: any) => ({
              name: um.unit,
              value: um.mastery,
            }))
          : [
              { name: "Syllabus Check", value: 0 },
              { name: "Introduction", value: 0 }
            ]
      };
    } catch (err) {
      console.error(`Error processing Digital Twin for ${student.id}:`, err);
      // Fallback object so one failure doesn't break the whole dashboard
      return {
        studentId: student.id,
        firstName: student.user?.firstName || "Student",
        lastName: student.user?.lastName || student.id,
        form: student.form || 1,
        overall: student.overall || 0,
        attributes: [{ name: "Sync Error", value: 0 }]
      };
    }
  })
);

        setStudentsDevelopment(devProfiles);
      } catch (err) {
        console.error("Dashboard Fetch Error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [selectedCourse]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 h-[calc(100vh-180px)] p-0 relative overflow-hidden">
      
      {/* LEFT COLUMN */}
      <div className="flex flex-col h-full min-h-0">
        <div className="flex-1 basis-2/5 min-h-0">
          <CalendarWidget 
            events={calendarEvents} 
            onDateSelect={(d) => { setSelectedDate(d); setShowEventModal(true); }} 
            className="h-full" 
          />
        </div>
        <div className="flex-1 basis-3/5 flex gap-4 mt-4 min-h-0">
          <StaffRoom />
          <PerformancePanel loading={loading} assessment={latestAssessment} data={performance} />
        </div>
      </div>

      {/* RIGHT COLUMN */}
      <div className="flex flex-col h-full min-h-0">
        <div className="flex-1 basis-1/2 min-h-0">
          <DigitalTwinCard loading={loading} students={studentsDevelopment} />
        </div>
        
        <div className="flex-1 basis-1/2 flex gap-4 mt-4 min-h-0">
          <button 
            onClick={() => navigate('/resources')} 
            className="w-1/2 bg-gray-50 p-3 rounded-lg shadow hover:bg-white hover:border-blue-200 border border-transparent transition-all flex flex-col justify-center items-center"
          >
            <h2 className="font-bold text-sm text-gray-800">RESOURCES</h2>
            <p className="text-[10px] text-gray-400">Syllabus & Materials</p>
          </button>
          <button 
            onClick={() => navigate('/grading')} 
            className="w-1/2 bg-gray-50 p-3 rounded-lg shadow hover:bg-white hover:border-blue-200 border border-transparent transition-all flex flex-col justify-center items-center"
          >
            <h2 className="font-bold text-sm text-gray-800">GRADING</h2>
            <p className="text-[10px] text-gray-400">Review Submissions</p>
          </button>
        </div>
      </div>

      <EventModal 
        isOpen={showEventModal} 
        onClose={() => setShowEventModal(false)} 
        courses={courses} 
        selectedDate={selectedDate} 
        // Fixed the Type 'void' vs 'Promise<void>' error by making this async
        onSave={async () => {
          setShowEventModal(false);
        }} 
      />
    </div>
  );
};

export default Dashboard;