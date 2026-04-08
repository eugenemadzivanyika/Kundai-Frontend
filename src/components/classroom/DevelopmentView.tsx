import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Student } from '../../types';
import { studentService, developmentService } from '../../services/api';
import { useToast } from "@/components/ui/use-toast";
import { 
  User, 
  CheckCircle2, 
  Clock, 
  Target, 
  ChevronRight, 
  Rocket, 
  Layout, 
  FileText 
} from 'lucide-react';

interface DevelopmentViewProps {
  studentId?: string;
}

const DevelopmentView: React.FC<DevelopmentViewProps> = ({ studentId: propStudentId }) => {
  const { studentId: paramStudentId } = useParams<{ studentId: string }>();
  const initialStudentId = propStudentId || paramStudentId || '';
  const navigate = useNavigate();
  const { toast } = useToast();

  const [selectedStudent, setSelectedStudent] = useState<any | null>(null);
  const [allStudents, setAllStudents] = useState<any[]>([]);
  const [allStudentDevelopmentPlans, setAllStudentDevelopmentPlans] = useState<any[]>([]);
  const [currentDisplayPlan, setCurrentDisplayPlan] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Surgical Helper for nested user names
  const getNames = (s: any) => {
    return {
      first: s?.user?.firstName || s?.firstName || 'Student',
      last: s?.user?.lastName || s?.lastName || '',
      full: s?.user 
        ? `${s.user.firstName} ${s.user.lastName}` 
        : (s?.firstName ? `${s.firstName} ${s.lastName}` : 'Unknown Student')
    };
  };

  useEffect(() => {
    const fetchAllStudents = async () => {
      try {
        const studentsData = await studentService.getStudents();
        setAllStudents(studentsData);
      } catch (err: any) {
        console.error('Failed to fetch students list:', err);
      }
    };
    fetchAllStudents();
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      if (!initialStudentId) return;
      setLoading(true);
      setError(null);
      try {
        const [studentData, plansData] = await Promise.all([
          studentService.getStudent(initialStudentId),
          developmentService.getAllPlansForStudent(initialStudentId)
        ]);

        setSelectedStudent(studentData);
        setAllStudentDevelopmentPlans(plansData);

        // Prioritize Active plan, otherwise show the latest generated one
        const activePlan = plansData.find((p: any) => p.status === 'Active');
        setCurrentDisplayPlan(activePlan || plansData[0] || null);
      } catch (err: any) {
        console.error('Surgical Sync Error:', err);
        setError('Failed to synchronize student digital twin.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [initialStudentId]);

  const handleActivatePlan = async (e: React.MouseEvent, planId: string) => {
    e.stopPropagation();
    try {
      await developmentService.activatePlan(planId);
      
      // Local state update for instant UI feedback
      setAllStudentDevelopmentPlans(prev => 
        prev.map(p => p._id === planId ? { ...p, status: 'Active' } : p)
      );
      
      if (currentDisplayPlan?._id === planId) {
        setCurrentDisplayPlan({ ...currentDisplayPlan, status: 'Active' });
      }

      toast({
        title: "Remediation Deployed",
        description: "The plan is now active. Missions are visible to the student.",
      });
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Deployment Failed",
        description: "Could not activate the surgical intervention.",
      });
    }
  };

  const handlePlanSelect = (plan: any) => {
    setCurrentDisplayPlan(plan);
  };

  const handleStudentSelect = (id: string) => {
    navigate(`/development/${id}`);
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center h-[80vh] gap-4">
      <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
      <p className="font-black uppercase tracking-widest text-slate-400 text-xs">Synchronizing Digital Twin</p>
    </div>
  );

  if (error) return <div className="p-10 text-red-500 font-bold text-center">{error}</div>;
  if (!selectedStudent) return <div className="p-10 text-center text-slate-400 font-bold uppercase">Student not found</div>;

  const names = getNames(selectedStudent);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-[88vh] p-6 bg-slate-50 overflow-hidden">
      
      {/* SIDEBAR: Student Context & Growth Areas */}
      <div className="lg:col-span-3 flex flex-col gap-6 overflow-hidden h-full">
        
        {/* Profile Card */}
        <div className="bg-slate-900 text-white rounded-[2rem] p-6 shadow-2xl shrink-0 border border-white/5">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-14 h-14 bg-gradient-to-br from-blue-400 to-blue-600 rounded-2xl flex items-center justify-center font-black text-2xl shadow-lg border border-white/20">
              {names.first[0]}
            </div>
            <div className="min-w-0">
              <h2 className="font-black uppercase tracking-tight text-xs truncate leading-tight">{names.full}</h2>
              <p className="text-[10px] text-slate-500 font-mono mt-1">{selectedStudent.id}</p>
            </div>
          </div>
          <div className="flex justify-between items-end border-t border-white/10 pt-4">
            <div>
              <p className="text-[9px] text-slate-500 font-black uppercase tracking-widest mb-1">Mastery Score</p>
              <p className="text-4xl font-black text-blue-400 leading-none">{selectedStudent.overall || 0}%</p>
            </div>
            <div className="text-right">
              <p className="text-[9px] text-slate-500 font-black uppercase tracking-widest mb-1">Level</p>
              <p className="text-xl font-bold leading-none">Form {selectedStudent.form}</p>
            </div>
          </div>
        </div>

        {/* Plan Selection List */}
        <div className="bg-white rounded-[2rem] p-5 shadow-sm border border-slate-200 flex-1 flex flex-col overflow-hidden">
          <h3 className="text-[10px] font-black uppercase text-slate-400 mb-4 tracking-widest px-1">Detected Deficiencies</h3>
          <div className="space-y-3 overflow-y-auto pr-1 custom-scrollbar">
            {allStudentDevelopmentPlans.map((plan) => (
              <div key={plan._id} className="space-y-2">
                <button
                  onClick={() => handlePlanSelect(plan)}
                  className={`w-full text-left p-4 rounded-2xl transition-all border ${
                    currentDisplayPlan?._id === plan._id
                      ? 'bg-blue-600 border-blue-700 text-white shadow-xl shadow-blue-200 scale-[1.02]'
                      : 'bg-white border-slate-100 text-slate-600 hover:border-blue-300'
                  }`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-[10px] font-black uppercase truncate pr-2">{plan.title}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className={`text-[8px] font-bold uppercase ${currentDisplayPlan?._id === plan._id ? 'text-blue-100' : 'text-slate-400'}`}>
                      {plan.status}
                    </span>
                    <span className="text-[10px] font-black">{plan.progress}%</span>
                  </div>
                  <div className="w-full h-1 bg-black/10 rounded-full overflow-hidden mt-2">
                    <div className="h-full bg-current" style={{ width: `${plan.progress}%` }} />
                  </div>
                </button>

                {plan.status !== 'Active' && plan.status !== 'Mastered' && currentDisplayPlan?._id === plan._id && (
                  <button
                    onClick={(e) => handleActivatePlan(e, plan._id)}
                    className="w-full flex items-center justify-center gap-2 py-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all shadow-md active:scale-95"
                  >
                    <Rocket className="w-3 h-3" /> Deploy Remediation
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* MAIN CONTENT: The Mission Board */}
      <div className="lg:col-span-9 flex flex-col gap-6 overflow-hidden h-full">
        {!currentDisplayPlan ? (
          <div className="bg-white rounded-[2.5rem] border-4 border-dashed border-slate-200 h-full flex flex-col justify-center items-center p-20 text-center">
            <Layout className="w-20 h-20 text-slate-200 mb-6" />
            <h2 className="text-xl font-black text-slate-400 uppercase tracking-tighter">Ready for Selection</h2>
            <p className="text-slate-400 text-sm max-w-xs mt-2 font-medium">Select a deficiencies area from the sidebar to initialize the AI-generated remediation path.</p>
          </div>
        ) : (
          <>
            {/* Header / Meta */}
            <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-slate-200 shrink-0">
              <div className="flex justify-between items-start mb-8">
                <div className="max-w-2xl">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="bg-blue-100 text-blue-600 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border border-blue-200">
                      Surgical Intervention
                    </span>
                    <span className="text-slate-300 text-xs">|</span>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                      <Target className="w-3 h-3" /> {currentDisplayPlan.skillCategory}
                    </span>
                  </div>
                  <h1 className="text-3xl font-black text-slate-900 tracking-tight leading-none mb-4 uppercase">{currentDisplayPlan.title}</h1>
                  <div className="flex items-center gap-4 text-slate-500 bg-slate-50 w-fit px-4 py-2 rounded-xl border border-slate-100">
                    <Clock className="w-4 h-4 text-amber-500" />
                    <span className="text-xs font-bold uppercase tracking-tighter">Generated {new Date(currentDisplayPlan.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-black uppercase text-slate-400 mb-2 tracking-widest">Surgical Progress</p>
                  <div className="flex items-center justify-end gap-4">
                    <div className="w-48 h-4 bg-slate-100 rounded-full overflow-hidden border border-slate-200 p-1 shadow-inner">
                      <div className="h-full bg-blue-600 rounded-full transition-all duration-1000" style={{ width: `${currentDisplayPlan.progress}%` }} />
                    </div>
                    <span className="text-3xl font-black text-slate-900 leading-none">{currentDisplayPlan.progress}%</span>
                  </div>
                </div>
              </div>
              <div className="bg-blue-50/50 rounded-2xl p-4 border-l-4 border-blue-500 flex gap-4 items-start">
                 <div className="bg-white p-2 rounded-lg shadow-sm border border-blue-100"><FileText className="text-blue-500 w-4 h-4" /></div>
                 <div>
                    <p className="text-[10px] font-black text-blue-400 uppercase mb-1 tracking-widest">Teacher Diagnostic</p>
                    <p className="text-sm text-slate-700 font-medium leading-relaxed italic">"{currentDisplayPlan.teacherNotes}"</p>
                 </div>
              </div>
            </div>

            {/* Path Missions */}
            <div className="flex-1 overflow-y-auto pr-4 custom-scrollbar pb-10">
              <div className="grid grid-cols-1 gap-4">
                <div className="flex items-center gap-4 mb-4">
                  <h3 className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] whitespace-nowrap">Learning Path Path</h3>
                  <div className="h-[2px] w-full bg-slate-100 rounded-full" />
                </div>
                
                {currentDisplayPlan.missions?.map((mission: any, idx: number) => {
                  const isCompleted = mission.status === 'Completed';
                  return (
                    <div 
                      key={mission._id} 
                      className={`bg-white rounded-3xl p-6 border transition-all cursor-pointer group flex items-center gap-6 ${
                        isCompleted 
                          ? 'border-emerald-100 bg-emerald-50/30' 
                          : 'border-slate-200 hover:border-blue-400 hover:shadow-xl hover:shadow-blue-900/5'
                      }`}
                      onClick={() => {
                        if (mission.resourceLink) {
                          const id = mission.resourceLink.split('/').pop();
                          navigate(`/ai-content/${id}`);
                        }
                      }}
                    >
                      <div className={`w-16 h-16 rounded-2xl flex items-center justify-center font-black text-xl shrink-0 shadow-sm transition-colors ${
                        isCompleted 
                          ? 'bg-emerald-500 text-white' 
                          : 'bg-slate-100 text-slate-400 group-hover:bg-blue-600 group-hover:text-white'
                      }`}>
                        {isCompleted ? <CheckCircle2 className="w-8 h-8" /> : idx + 1}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                           <h4 className={`font-black uppercase text-xs tracking-tight ${isCompleted ? 'text-emerald-700' : 'text-slate-800'}`}>
                              {mission.task}
                           </h4>
                           {isCompleted && <span className="text-[8px] bg-emerald-200 text-emerald-700 font-bold px-1.5 py-0.5 rounded uppercase">Mastered</span>}
                        </div>
                        <p className={`text-xs font-medium line-clamp-1 ${isCompleted ? 'text-emerald-600/70' : 'text-slate-500'}`}>
                          {mission.objective}
                        </p>
                      </div>

                      <div className="flex items-center gap-4 shrink-0">
                        <span className={`text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-xl ${
                          isCompleted ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-400'
                        }`}>
                          {mission.status}
                        </span>
                        <ChevronRight className={`w-6 h-6 transition-all ${isCompleted ? 'text-emerald-400' : 'text-slate-300 group-hover:text-blue-500 group-hover:translate-x-1'}`} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default DevelopmentView;