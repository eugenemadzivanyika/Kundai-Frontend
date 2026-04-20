import React, { useEffect, useState } from 'react';
import { Student, Plan, DevelopmentPlan } from '../../types';
import { User, Activity } from 'lucide-react';
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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [overall, setOverall] = useState<number>(0);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        // Fetch the enriched development data (contains unitMasteries and overallMastery)
        const response = await studentService.getStudentDevelopment(student._id);
        
        console.log("🚀 [DevAttributes] Received Unit Masteries:", response.unitMasteries);
        
        setUnitMasteries(response.unitMasteries || []);
        setOverall(response.overallMastery || 0);

        // Fetch current active plan for progress bar
        const plans: DevelopmentPlan[] = await developmentService.getAllPlansForStudent(student._id);
        const activePlan = plans.find(p => p.status === 'Active' || p.status === 'Under Review');
        setPlan(activePlan ? activePlan : null);

      } catch (err: any) {
        console.error("❌ [DevAttributes] Fetch Error:", err);
        setError('Failed to load unit mastery data.');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [student]);

  if (loading) {
    return <div className="p-4 flex items-center justify-center h-64 text-sm text-gray-500 italic">
      <Activity className="animate-spin mr-2 h-4 w-4" />
      Syncing Unit Masteries...
    </div>;
  }

  if (error) {
    return <div className="p-4 text-sm text-red-500 font-bold bg-red-50 rounded-lg border border-red-100">{error}</div>;
  }

  return (
    <div className="bg-white rounded-lg shadow-xl p-0 max-h-[500px] flex flex-col overflow-hidden border border-slate-200">
      {/* Sticky Header */}
      <div className="flex items-center p-4 sticky top-0 bg-slate-900 text-white z-10 shadow-md">
        <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center mr-3 shadow-inner">
          <User className="w-6 h-6 text-white" />
        </div>
        <div>
          <h2 className="text-sm font-black uppercase tracking-tight leading-none">{student.firstName}</h2>
          <p className="text-xs text-slate-400 mt-1 uppercase font-bold">{student.id}</p>
        </div>
        <div className="ml-auto text-right">
          <div className="text-2xl font-black leading-none text-blue-400">{overall}%</div>
          <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Mastery</div>
        </div>
      </div>

      <div className="p-4 overflow-y-auto space-y-6 custom-scrollbar">
        {/* Active Surgical Plan Section */}
        <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-[10px] font-black uppercase text-blue-600 tracking-widest">Active Remediation</h3>
            <span className="text-[10px] font-bold bg-blue-600 text-white px-2 py-0.5 rounded-full uppercase">
              {plan ? plan.status : 'Standby'}
            </span>
          </div>
          <div className="space-y-2">
            <p className="text-sm font-bold text-slate-800">{plan ? plan.title : 'No Active Plan'}</p>
            {plan && (
              <div className="flex items-center gap-3">
                <div className="flex-1 h-2 bg-slate-200 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-blue-600 transition-all duration-1000" 
                    style={{ width: `${plan.progress}%` }}
                  />
                </div>
                <span className="text-xs font-black text-slate-600">{plan.progress}%</span>
              </div>
            )}
          </div>
        </div>

        {/* Unit Masteries Section */}
        <div className="space-y-4">
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