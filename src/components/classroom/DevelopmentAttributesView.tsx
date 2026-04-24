import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Student, Plan, DevelopmentPlan } from '../../types';
import { studentService, developmentService } from '../../services/api';

interface UnitMastery {
  unit: string;
  mastery: number;
}

interface DevelopmentAttributesViewProps {
  student: Student;
}

const DevelopmentAttributesView: React.FC<DevelopmentAttributesViewProps> = ({ student }) => {
  const [unitMasteries, setUnitMasteries] = useState<UnitMastery[]>([]);
  const [plan, setPlan] = useState<Plan | null>(null);
  const [allPlans, setAllPlans] = useState<DevelopmentPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await studentService.getStudentDevelopment(student._id);
        setUnitMasteries(response.unitMasteries || []);

        const plans: DevelopmentPlan[] = await developmentService.getAllPlansForStudent(student._id);
        setAllPlans(plans);
        const activePlan = plans.find(p => p.status === 'Active' || p.status === 'Under Review');
        setPlan(activePlan ?? null);
      } catch (err: any) {
        console.error('❌ [DevAttributes] Fetch Error:', err);
        setError('Failed to load unit mastery data.');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [student]);

  if (loading) {
    return (
      <div className="p-4 flex items-center justify-center h-64 text-sm text-gray-500 italic">
        <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-blue-500 mr-2" />
        Syncing Unit Masteries...
      </div>
    );
  }

  if (error) {
    return <div className="p-4 text-sm text-red-500 font-bold bg-red-50 rounded-lg border border-red-100">{error}</div>;
  }

  return (
    <div className="bg-white rounded-lg shadow-xl p-0 flex flex-col h-full overflow-hidden border border-slate-200">

      <div className="p-4 overflow-y-auto flex-1 min-h-0 space-y-4 custom-scrollbar">

        {/* Plan Section */}
        <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
          {plan ? (
            <div className="flex justify-between items-start">
              <div className="space-y-0.5">
                <p className="text-sm font-black text-slate-800 leading-tight">{plan.title}</p>
                {plan.skillCategory && (
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                    {plan.skillCategory}
                  </p>
                )}
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

        {/* Unit Masteries */}
        <div className="space-y-3">
          <h3 className="text-[10px] font-black uppercase text-slate-400 tracking-widest flex items-center">
            Syllabus Unit Analysis
            <div className="ml-2 flex-1 h-[1px] bg-slate-100" />
          </h3>
          <div className="space-y-3">
            {unitMasteries.length > 0 ? (
              unitMasteries.map((unitData, index) => (
                <div key={index} className="space-y-1.5">
                  <div className="flex justify-between items-end">
                    <span className="text-xs font-bold text-slate-700 uppercase tracking-tight">
                      {unitData.unit}
                    </span>
                    <span className="text-xs font-black text-slate-900">
                      {unitData.mastery}%
                    </span>
                  </div>
                  <div className="relative h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className={`absolute h-full transition-all duration-700 ${
                        unitData.mastery > 75 ? 'bg-emerald-500' :
                        unitData.mastery > 40 ? 'bg-blue-500' : 'bg-rose-500'
                      }`}
                      style={{ width: `${unitData.mastery}%` }}
                    />
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-10 text-slate-400 text-xs italic">
                No syllabus units mapped for this course yet.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Legend Footer */}
      <div className="p-3 bg-slate-50 border-t border-slate-100 flex justify-center gap-6">
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-rose-500" />
          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Critical</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-blue-500" />
          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Growth</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-emerald-500" />
          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Mastery</span>
        </div>
      </div>
    </div>
  );
};

export default DevelopmentAttributesView;