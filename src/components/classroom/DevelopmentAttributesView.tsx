import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Student, DevelopmentPlan } from '../../types';
import { studentService, developmentService } from '../../services/api';

interface UnitMastery {
  unit: string;
  mastery: number;
}

interface DevelopmentAttributesViewProps {
  student: Student;
  courseId?: string;
  courseName?: string;
}

const DevelopmentAttributesView: React.FC<DevelopmentAttributesViewProps> = ({ student, courseId, courseName }) => {
  const [unitMasteries, setUnitMasteries] = useState<UnitMastery[]>([]);
  const [plan, setPlan] = useState<DevelopmentPlan | null>(null);
  const [allPlans, setAllPlans] = useState<DevelopmentPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const studentId = student._id || (student as any).id;
        const [response, plans] = await Promise.all([
          studentService.getStudentDevelopment(studentId, courseId ? { courseId } : undefined),
          developmentService.getAllPlansForStudent(studentId),
        ]);
        setUnitMasteries(response.unitMasteries || []);
        setAllPlans(plans);
        const activePlan = plans.find((p: DevelopmentPlan) => p.status === 'Active' || p.status === 'Pending Audit');
        setPlan(activePlan ?? null);
      } catch (err: any) {
        console.error('❌ [DevAttributes] Fetch Error:', err);
        setError('Failed to load development data.');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [student._id, courseId]);

  if (loading) {
    return (
      <div className="p-4 flex items-center justify-center h-64 text-sm text-gray-500 italic">
        <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-blue-500 mr-2" />
        Loading attributes...
      </div>
    );
  }

  if (error) {
    return <div className="p-4 text-sm text-red-500 font-bold bg-red-50 rounded-lg border border-red-100">{error}</div>;
  }

  return (
    <div className="bg-white rounded-lg shadow-xl p-0 flex flex-col h-full overflow-hidden border border-slate-200">
      <div className="p-4 overflow-y-auto flex-1 min-h-0 space-y-4 custom-scrollbar">

        {courseName && (
          <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest bg-slate-50 border border-slate-200 rounded-lg px-3 py-2">
            Showing attributes for: <span className="text-blue-600">{courseName}</span>
          </div>
        )}

        {/* Aggregated attribute grid — same style as digital twin card */}
        <div className="space-y-2">
          <h3 className="text-[10px] font-black uppercase text-slate-400 tracking-widest flex items-center">
            Development Attributes
            <div className="ml-2 flex-1 h-[1px] bg-slate-100" />
          </h3>
          {unitMasteries.length > 0 ? (
            <div className="grid grid-cols-3 gap-2">
              {unitMasteries.map((item, i) => (
                <div
                  key={i}
                  className="flex flex-col items-center bg-slate-50 rounded-xl p-3 border border-slate-100"
                >
                  <span
                    className="text-[9px] font-bold text-slate-500 uppercase tracking-tighter text-center w-full truncate"
                    title={item.unit}
                  >
                    {item.unit}
                  </span>
                  <span
                    className={`text-xl font-black mt-1 leading-none ${
                      item.mastery > 75 ? 'text-emerald-500' :
                      item.mastery > 40 ? 'text-blue-500' : 'text-rose-500'
                    }`}
                  >
                    {item.mastery}%
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-10 text-slate-400 text-xs italic">
              No attributes mapped for this course yet.
            </div>
          )}
        </div>

        {/* Plan section */}
        <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
          {plan ? (
            <div className="flex justify-between items-start">
              <div className="space-y-0.5">
                <p className="text-sm font-black text-slate-800 leading-tight">{plan.plan?.name ?? 'Development Plan'}</p>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                  {Math.round(plan.currentProgress ?? 0)}% complete
                </p>
              </div>
              <span className="text-[10px] font-bold bg-blue-600 text-white px-2 py-0.5 rounded-full uppercase shrink-0 ml-3">
                {plan.status}
              </span>
            </div>
          ) : (
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm font-black text-slate-500">No Active Plan</p>
                {allPlans.length > 0 && (
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    {allPlans.length} plan{allPlans.length !== 1 ? 's' : ''} available
                  </p>
                )}
              </div>
              <button
                onClick={() => navigate(`/development/${student._id}`)}
                className="text-[10px] font-bold bg-slate-200 text-slate-600 hover:bg-blue-600 hover:text-white px-3 py-1 rounded-full uppercase transition-colors"
              >
                {allPlans.length > 0 ? 'Activate' : 'Create Plan'}
              </button>
            </div>
          )}
        </div>

      </div>

      {/* Color legend */}
      <div className="p-3 bg-slate-50 border-t border-slate-100 flex justify-center gap-6">
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-rose-500" />
          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Critical ≤40%</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-blue-500" />
          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Growth 41–75%</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-emerald-500" />
          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Mastery &gt;75%</span>
        </div>
      </div>
    </div>
  );
};

export default DevelopmentAttributesView;
